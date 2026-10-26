// Layer 4, test tool. npm run test:quick: the commands a builder, a reviewer and a landing run
// after a change, over what the change reaches and nothing else.
//
// What it runs, all at the same time, except that the vitest runs, eslint and svelte-check start
// when `svelte-kit sync` has ended: the sync rewrites the generated types under .svelte-kit with
// truncating writes, and all of them read them, so a reader started beside it can find a file
// empty. The sync runs while the tests are chosen.
//
// - the tests that name or import a changed file at most RELATED_DEPTH imports away, every changed
//   test, and, when a file under src, tests or utils changed, every check under
//   tests/checks/source and tests/checks/tree, which read the text of the whole tree and so reach
//   a changed file whatever imports it; wherever they are: under tests/checks and tagged slow
//   included. Three vitest runs share them out as npm test, npm run test:slow and npm run
//   test:checks would: the chosen tests outside tests/checks with their slow tests left out, the
//   test files sharing their loaded modules (`--no-isolate`) so each file does not load them
//   again, the config read without bundling it, and the translated modules kept on disk between
//   runs (node_modules/.experimental-vitest-cache, where each file is written under a temporary
//   name and renamed into place, so another test:quick run reads whole files); the slow tests of
//   the chosen files outside tests/checks, with the slow tests' time limit; and the chosen files
//   under tests/checks, with no time limit;
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
// What a green run does not cover is printed with it: the tests that reach no changed file within
// RELATED_DEPTH imports, other than the checks under tests/checks/source and tests/checks/tree,
// the build and the lint of files nobody changed. A file is chosen by whether it imports a changed
// file, read from the import specifiers of src and tests, so a test that reaches a changed file
// through a call by name and no import is not found. A change outside src, tests and utils (a
// file under docs or .scratch alone) chooses none of the checks that read the tree's text.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { ASCII_GATE, BIN, ROOT, judgeAscii, runTask, seconds, show } from './run.mjs';

/** How many imports away from a changed file a test may be and still be chosen for it. */
const RELATED_DEPTH = 2;

/** The folders whose checks read the text of the tree, chosen for any change under SCANNED. */
const SCANNERS = ['tests/checks/source/', 'tests/checks/tree/'];

/** The folders a change under which chooses every check under SCANNERS. */
const SCANNED = ['src/', 'tests/', 'utils/'];

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

/**
 * The root of the repository that holds ROOT: the nearest folder at or above it that holds a
 * `.git`, at whatever depth, or ROOT itself when none does.
 */
function repositoryRoot() {
    for (let dir = ROOT; ; dir = dirname(dir)) {
        if (existsSync(join(dir, '.git'))) return dir;
        if (dirname(dir) === dir) return ROOT;
    }
}

/**
 * The path of a changed file as the ROOT-relative path with forward slashes, or null outside. A
 * path is read as relative to the working folder, to ROOT, or to the root of the repository.
 */
function normalise(path) {
    const options = [
        resolve(process.cwd(), path),
        resolve(ROOT, path),
        resolve(repositoryRoot(), path)
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

/** Whether a test file is a tree check, which the checks run takes. */
function isCheck(path) {
    return path.startsWith('tests/checks/');
}

/** Whether a file tags itself or any of its tests slow, so the slow run has something of it. */
function holdsSlow(path) {
    return /@module-tag slow|tags:\s*\[[^\]]*'slow'/.test(readFileSync(join(ROOT, path), 'utf8'));
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

/** Whether a test file is a check that reads the text of the tree rather than importing it. */
function scansSource(path) {
    return SCANNERS.some((folder) => path.startsWith(folder)) && TEST_FILE.test(path);
}

/**
 * The test files to run, each with the reason it is there: the tests related to the existing
 * changed files (`existing`), and, when any changed file (`changed`, deleted ones included) is
 * under one of SCANNED, every check under SCANNERS, which reads the text of the tree and so
 * reaches every file of it whatever imports it.
 */
function chooseTests(existing, changed, files) {
    const picks = new Map();
    for (const [path, distance] of relatedTests(existing, files)) {
        if (distance > RELATED_DEPTH || !path.startsWith('tests/')) continue;
        if (distance === 0) picks.set(path, 'changed');
        else if (distance === 0.5) picks.set(path, 'named for a changed file');
        else picks.set(path, `imports at depth ${distance}`);
    }
    if (changed.some((one) => SCANNED.some((folder) => one.startsWith(folder)))) {
        for (const path of files.filter(scansSource).sort()) {
            if (!picks.has(path)) picks.set(path, 'scans the source text of a changed file');
        }
    }
    return picks;
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
const synced = track(runTask('svelte-kit sync', join(BIN, 'svelte-kit'), ['sync']));
pending.push(synced);
const formatted = existing.filter((one) => FORMATTED.test(one));
if (formatted.length > 0) {
    const flags = ['--check', '--cache', '--no-error-on-unmatched-pattern'];
    pending.push(track(runTask('prettier', join(BIN, 'prettier'), [...flags, ...formatted])));
}
pending.push(track(runTask('ASCII gate', 'sh', ['-c', ASCII_GATE]).then(judgeAscii)));

const files = moduleFiles();
const picks = chooseTests(existing, changed, files);
console.log(`test:quick: ${picks.size} test file(s)`);
for (const [path, why] of picks) console.log(`        ${path}: ${why}`);

const units = [...picks.keys()].filter((path) => !isCheck(path));
const slow = units.filter(holdsSlow);
const checks = [...picks.keys()].filter(isCheck);
const loader = ['--reporter=dot', '--configLoader', 'runner'];
await synced;
if (units.length > 0) {
    const flags = [
        '--tagsFilter',
        '!slow',
        '--no-isolate',
        ...loader,
        '--experimental.fsModuleCache'
    ];
    const run = [VITEST, 'run', ...units, ...flags, '--passWithNoTests'];
    pending.push(track(runTask('vitest', process.execPath, run)));
}
if (slow.length > 0) {
    const flags = ['--tagsFilter', 'slow', '--testTimeout', '20000', ...loader];
    const run = [VITEST, 'run', ...slow, ...flags, '--passWithNoTests'];
    pending.push(track(runTask('vitest slow', process.execPath, run)));
}
if (checks.length > 0) {
    const flags = ['--testTimeout', '0', '--hookTimeout', '0', ...loader];
    pending.push(
        track(runTask('vitest checks', process.execPath, [VITEST, 'run', ...checks, ...flags]))
    );
}
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
console.log(`test:quick: ${seconds(total)} s; ${verdict}`);
console.log('test:quick: not covered: tests that reach no changed file within the import depth,');
console.log('            other than the checks under tests/checks/source and tests/checks/tree,');
console.log('            which run for any change under src, tests or utils; the build, the lint');
console.log('            of unchanged files');
process.exitCode = red.length === 0 ? 0 : 1;
