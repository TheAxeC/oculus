// Layer 4, test tool. npm run test:quick: the commands a builder or a reviewer runs after a change,
// held to 45 s for the whole list.
//
// What it runs, all at the same time; only svelte-check waits for `svelte-kit sync`, which makes
// the generated types it reads:
//
// - vitest over the tests that guard the most (tests/tiers/essential.txt), the tests that name or
//   import a changed file at most RELATED_DEPTH imports away, and every changed test,
//   with the test files sharing their loaded modules (`--no-isolate`) so each file does not load
//   them again, the config read without bundling it, and the translated modules kept on disk
//   between runs (node_modules/.experimental-vitest-cache, where each file is written under a
//   temporary name and renamed into place, so another test:quick run reads whole files);
// - prettier and eslint over the changed files only, with their caches, so a file that has not
//   changed since a green run costs nothing;
// - svelte-check, incremental: the type check of the whole tree, the one command that reads files
//   the step did not change, since a changed type breaks its readers;
// - the ASCII gate over the tree.
//
// The changed files are the paths given as arguments, or, with none, what git reports as changed
// since HEAD (or since the revision after `--base`) and as new. A builder, who runs no git command,
// gives its paths: `npm run test:quick -- <path> <path>`.
//
// What a green run does not cover is printed with it: the tests outside the selection, the tree
// checks under tests/checks, the slow tests, the build and the lint of files nobody changed. The
// landing list, npm run test:landing, runs them all. A file outside the selection is chosen by
// whether it imports a changed file, read from the import specifiers of src and tests, so a test
// that reaches a changed file through a call by name and no import is not found.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { ASCII_GATE, BIN, ROOT, judgeAscii, runTask, seconds, show } from './run.mjs';

/** How many imports away from a changed file a test may be and still be chosen for it. */
const RELATED_DEPTH = 2;

/** The time the whole list is held to, in ms. */
const LIMIT_MS = 45000;

const ESSENTIAL = join(ROOT, 'tests', 'tiers', 'essential.txt');
const VITEST = join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
const TEST_FILE = /\.test\.ts$/;

/** The files eslint reads: the three globs of eslint.config.js. */
const LINTED = /^(src\/.*\.(ts|svelte)|tests\/.*\.ts)$/;

/** The files prettier has a parser for. */
const FORMATTED = /\.(ts|js|mjs|json|svelte|css|html|yml|yaml)$/;

/** An import, a re-export, a dynamic import: the quoted specifier after `from` or `import`. */
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"\n]+)['"]/g;

/** The endings a specifier may leave off, and the index file of a folder. */
const TAILS = ['', '.ts', '/index.ts', '.svelte', '.js', '/index.js'];

/** The path of a changed file as the ROOT-relative path with forward slashes, or null outside. */
function normalise(path) {
    const options = [
        resolve(process.cwd(), path),
        resolve(ROOT, path),
        resolve(ROOT, '..', '..', path)
    ];
    const full = options.find((one) => existsSync(one)) ?? options[0];
    const rel = relative(ROOT, full).split(sep).join('/');
    return rel.startsWith('..') ? null : rel;
}

/** The names a git command prints, NUL separated, or none when git cannot answer. */
function gitList(args) {
    const out = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    return out.status === 0 ? out.stdout.split('\0').filter((one) => one !== '') : [];
}

/** The changed files: the given paths, or git's list since `base` plus the new files. */
function changedFiles(paths, base) {
    if (paths.length > 0) return paths.map(normalise).filter((one) => one !== null);
    const tracked = gitList(['diff', '--name-only', '--relative', '-z', base]);
    const fresh = gitList(['ls-files', '--others', '--exclude-standard', '-z']);
    return [...new Set([...tracked, ...fresh])];
}

/** Every module under src and tests, as ROOT-relative paths. */
function moduleFiles() {
    const found = [];
    for (const top of ['src', 'tests']) {
        for (const entry of readdirSync(join(ROOT, top), { recursive: true })) {
            const rel = entry.split(sep).join('/');
            if (/\.(ts|svelte|js|mjs)$/.test(rel)) found.push(`${top}/${rel}`);
        }
    }
    return found;
}

/** The module a specifier written in `from` names, or null for a package or a missing file. */
function resolveSpec(from, spec, known) {
    let base;
    if (spec.startsWith('$lib/')) base = `src/lib/${spec.slice('$lib/'.length)}`;
    else if (spec.startsWith('.')) base = join(dirname(from), spec).split(sep).join('/');
    else return null;
    for (const tail of TAILS) {
        if (known.has(base + tail)) return base + tail;
    }
    const compiled = base.replace(/\.js$/, '.ts');
    return known.has(compiled) ? compiled : null;
}

/** For each module, the modules that import it. */
function importerMap(files) {
    const known = new Set(files);
    const importers = new Map();
    for (const file of files) {
        const text = readFileSync(join(ROOT, file), 'utf8');
        for (const match of text.matchAll(IMPORT)) {
            const target = resolveSpec(file, match[1], known);
            if (target === null) continue;
            if (!importers.has(target)) importers.set(target, new Set());
            importers.get(target).add(file);
        }
    }
    return importers;
}

/** Whether a test file is one the unit run takes: not a tree check, which test:checks runs. */
function isUnitTest(path) {
    return TEST_FILE.test(path) && path.startsWith('tests/') && !path.startsWith('tests/checks/');
}

/**
 * Whether a file is tagged slow as a whole: npm test leaves it out, and test:slow runs it unless it
 * is under tests/checks, where test:checks runs it.
 */
function isSlow(path) {
    return readFileSync(join(ROOT, path), 'utf8').includes('@module-tag slow');
}

/**
 * The test files that import a changed file, directly or through the modules between, with their
 * distance (1 for an import of the changed file itself), and the tests named for a changed file
 * at 0.5. A changed test is at 0. Nearest first, then by name.
 */
function relatedTests(changed, files) {
    const importers = importerMap(files);
    const known = new Set(files);
    const found = new Map();
    let frontier = changed.filter((one) => known.has(one));
    const seen = new Set(frontier);
    for (let distance = 0; frontier.length > 0; distance += 1) {
        const next = [];
        for (const file of frontier) {
            if (TEST_FILE.test(file)) {
                found.set(file, distance);
                continue;
            }
            for (const importer of importers.get(file) ?? []) {
                if (seen.has(importer)) continue;
                seen.add(importer);
                next.push(importer);
            }
        }
        frontier = next;
    }
    for (const file of changed) {
        const stem = basename(file).replace(/\.[^.]+$/, '');
        for (const test of files) {
            if (basename(test) === `${stem}.test.ts` && !found.has(test)) found.set(test, 0.5);
        }
    }
    return [...found].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
}

/** The paths of tests/tiers/essential.txt: one per line, a note after a `#`. */
function essentialTests() {
    return readFileSync(ESSENTIAL, 'utf8')
        .split('\n')
        .map((line) => line.replace(/#.*$/, '').trim())
        .filter((line) => line !== '');
}

/**
 * The test files to run, each with the reason it is there, the essential paths that name no file,
 * and the changed tests this list leaves to another: a tree check, a slow file.
 */
function chooseTests(changed, files) {
    const picks = new Map();
    const missing = [];
    const left = [];
    for (const path of essentialTests()) {
        if (!files.includes(path)) missing.push(path);
        else if (!isSlow(path)) picks.set(path, 'essential');
    }
    const ranked = relatedTests(changed, files);
    for (const [path, distance] of ranked) {
        if (distance !== 0) continue;
        if (!isUnitTest(path) || isSlow(path)) left.push(path);
        else if (!picks.has(path)) picks.set(path, 'changed');
    }
    for (const [path, distance] of ranked) {
        if (distance === 0 || distance > RELATED_DEPTH || picks.has(path)) continue;
        if (!isUnitTest(path) || isSlow(path)) continue;
        const why = distance === 0.5 ? 'named for a changed file' : `imports at depth ${distance}`;
        picks.set(path, why);
    }
    return { picks, missing, left };
}

const args = process.argv.slice(2);
const paths = [];
let base = 'HEAD';
for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--base') {
        base = args[index + 1] ?? 'HEAD';
        index += 1;
    } else {
        paths.push(args[index]);
    }
}
const started = Date.now();
const changed = changedFiles(paths, base);
const existing = changed.filter((one) => existsSync(join(ROOT, one)));
const source = paths.length > 0 ? 'the given paths' : `git since ${base}`;
console.log(`test:quick: ${changed.length} changed file(s), from ${source}`);

const results = [];

/** Print a command's result when it ends and keep it for the verdict. */
function track(promise, display = show) {
    return promise.then((result) => {
        display(result);
        results.push(result);
        return result;
    });
}

const pending = [];
// A checkout with no generated types yet lets vitest's start write them, so vitest then waits for
// the sync instead of writing them beside it (vite.config.ts, `syncTypesOnce`).
const noTypesYet = !existsSync(join(ROOT, '.svelte-kit', 'non-ambient.d.ts'));
const synced = track(runTask('svelte-kit sync', join(BIN, 'svelte-kit'), ['sync']));
pending.push(synced);
const formatted = existing.filter((one) => FORMATTED.test(one));
if (formatted.length > 0) {
    const flags = ['--check', '--cache', '--no-error-on-unmatched-pattern'];
    pending.push(track(runTask('prettier', join(BIN, 'prettier'), [...flags, ...formatted])));
}
pending.push(track(runTask('ASCII gate', 'sh', ['-c', ASCII_GATE]).then(judgeAscii)));

const files = moduleFiles();
const { picks, missing, left } = chooseTests(existing, files);
if (missing.length > 0) {
    const output = `tests/tiers/essential.txt names no file: ${missing.join(', ')}`;
    pending.push(track(Promise.resolve({ name: 'essential list', ok: false, ms: 0, output })));
}
const essential = [...picks.values()].filter((why) => why === 'essential').length;
console.log(`test:quick: ${picks.size} test file(s), ${essential} essential`);
for (const [path, why] of picks) {
    if (why !== 'essential') console.log(`        ${path}: ${why}`);
}
for (const path of left) {
    const command = isUnitTest(path) ? 'test:slow' : 'test:checks';
    console.log(`        ${path}: changed, run by npm run ${command}`);
}

const select = [...picks.keys()];
const flags = [
    '--tagsFilter',
    '!slow',
    '--no-isolate',
    '--reporter=dot',
    '--configLoader',
    'runner',
    '--experimental.fsModuleCache'
];
if (noTypesYet) await synced;
pending.push(track(runTask('vitest', process.execPath, [VITEST, 'run', ...select, ...flags])));
const linted = existing.filter((one) => LINTED.test(one));
if (linted.length > 0) {
    const cache = ['--cache', '--cache-location', 'node_modules/.cache/eslint/'];
    const eslint = ['--no-warn-ignored', ...cache, ...linted];
    pending.push(track(runTask('eslint', join(BIN, 'eslint'), eslint)));
}
if ((await synced).ok) {
    const check = ['--incremental', '--tsconfig', './tsconfig.json'];
    pending.push(track(runTask('svelte-check', join(BIN, 'svelte-check'), check)));
}
await Promise.all(pending);

const total = Date.now() - started;
const red = results.filter((one) => !one.ok).map((one) => one.name);
const verdict = red.length === 0 ? 'every command passed' : `failed: ${red.join(', ')}`;
console.log(`test:quick: ${seconds(total)} s (limit ${seconds(LIMIT_MS)} s); ${verdict}`);
if (total > LIMIT_MS + 1000) console.log('test:quick: over the time limit');
console.log('test:quick: not covered: tests outside the selection, tests/checks, slow tests,');
console.log('            build, lint of unchanged files; npm run test:landing runs them');
process.exitCode = red.length === 0 ? 0 : 1;
