#!/usr/bin/env node
// Layer 4, test. Prove that the revert a test case names turns that case red.
//
// A case carries its revert beside the prose one, in the shape
//
//     // revert: <path>:<line> => <replacement text>
//     // revert: <path>:<line> => delete
//
// and a range `<path>:<first>-<last>` stands for every line of it. The replacement is the content
// of the line; the line's own indentation is kept, so a directive stays one short line that the
// formatter does not wrap. A directive on the line above a case belongs to that case; anywhere else
// it belongs to the case whose body it sits in.
//
// For each directive this copies the tree to a scratch directory, applies the edit there, runs that
// one case, and fails when the case stays green: a case that passes with its named revert applied
// does not hold the rule it is cited for. Where the run cannot say that much, the directive is
// unproven and the line says why, never red: a revert that changes nothing, a case that did not run,
// was skipped or shares its name with another, a target the copy does not hold, and a build that
// refused the edit are all unproven.
//
// A case with no machine-readable revert is unchecked. Unchecked counts in the summary and in the
// exit status, since a case nothing proves is what this exists to find; the argument list is what
// the caller vouches for, so a file whose cases the caller does not own is left off it.
//
// It runs no git command: the files to read are the argument list, which is what
// `git diff --name-only <base>` prints. Usage:
//
//     node bin/revert-check.mjs [--root <dir>] <file> [<file> ...]

import {
    cpSync,
    existsSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** What a copy of the tree leaves behind: generated output, dependencies and the plan's folder. */
const SKIPPED = ['node_modules', '.svelte-kit', 'build', '.git', '.scratch', 'test-results'];

const DIRECTIVE = /\/\/\s*revert:\s*([^\s:]+):(\d+)(?:-(\d+))?\s*=>\s*(.+?)\s*$/;
const CASE = /^\s*(?:it|test)(?:\.\w+)?\s*\(/;
const NAME = /(['"`])([\s\S]*?)\1/;

/**
 * The name a case opens with, or null where the line does not open one.
 *
 * A case whose arguments are long enough is written with the name on the line under `it(`, so the
 * name is read from the opening line and, where it holds none, from the line after it.
 */
function caseName(lines, at) {
    if (!CASE.test(lines[at])) return null;
    const rest = lines[at].slice(lines[at].indexOf('(') + 1);
    const here = NAME.exec(rest);
    if (here !== null) return here[2];
    const under = at + 1 < lines.length ? NAME.exec(lines[at + 1]) : null;
    return under === null ? null : under[2];
}

/** The arguments: an optional root, then the files whose directives are read. */
export function readArgs(argv) {
    const files = [];
    let root = null;
    for (let at = 0; at < argv.length; at += 1) {
        if (argv[at] === '--root') {
            root = argv[at + 1] ?? null;
            at += 1;
        } else files.push(argv[at]);
    }
    return { root, files };
}

/**
 * Every directive the given files hold, each with the case it sits in.
 *
 * The case is the nearest `it(` or `test(` above the directive line, which is where a revert is
 * written: inside the body it belongs to, or on the line above the case it opens.
 */
export function directives(root, files) {
    const found = [];
    for (const file of files) {
        const full = join(root, file);
        if (!existsSync(full)) continue;
        const lines = readFileSync(full, 'utf8').split('\n');
        for (let at = 0; at < lines.length; at += 1) {
            const match = DIRECTIVE.exec(lines[at]);
            if (match === null) continue;
            found.push({
                file,
                line: at + 1,
                caseName: caseAbove(lines, at),
                target: match[1],
                first: Number(match[2]),
                last: Number(match[3] ?? match[2]),
                replacement: match[4]
            });
        }
    }
    return found;
}

/**
 * The name of the case a directive belongs to, or null where it belongs to none.
 *
 * A directive on the line above a case opens that case, which is why the line under it is read
 * first; anywhere else it belongs to the case whose body it sits in, the nearest one above it.
 */
function caseAbove(lines, at) {
    const under = at + 1 < lines.length ? caseName(lines, at + 1) : null;
    if (under !== null) return under;
    for (let back = at; back >= 0; back -= 1) {
        const name = caseName(lines, back);
        if (name !== null) return name;
    }
    return null;
}

/** Every case name the given files declare, so one without a directive can be named. */
export function caseNames(root, files) {
    const found = [];
    for (const file of files) {
        const full = join(root, file);
        if (!existsSync(full)) continue;
        const lines = readFileSync(full, 'utf8').split('\n');
        for (let at = 0; at < lines.length; at += 1) {
            const name = caseName(lines, at);
            if (name !== null) found.push({ file, caseName: name });
        }
    }
    return found;
}

/** A line no revert of it can change the run: nothing on it, or nothing but a comment. */
function inert(line) {
    const text = line.trim();
    return text === '' || text.startsWith('//') || text.startsWith('*') || text.startsWith('/*');
}

/**
 * Why a directive changes nothing, or the empty string where it does change something.
 *
 * A revert proves a rule by taking the rule out; one that names a blank line or a comment, or whose
 * replacement is the line it replaces, leaves the tree saying the same thing, so a case that goes
 * red under it is red for a reason the directive does not name.
 */
export function changesNothing(lines, first, last, replacement) {
    const named = lines.slice(first - 1, last);
    if (named.every(inert)) {
        return named.length === 1
            ? 'the line it names is blank or a comment'
            : 'every line it names is blank or a comment';
    }
    if (replacement === 'delete') return '';
    const indent = /^\s*/.exec(lines[first - 1])[0];
    const written = indent + replacement;
    if (last === first && written === lines[first - 1])
        return 'the replacement is the line it replaces';
    return '';
}

/** The text of a file with one directive applied, or a failure naming what was out of reach. */
export function applied(text, first, last, replacement) {
    const lines = text.split('\n');
    if (first < 1 || last > lines.length || last < first) {
        return { text: null, why: `lines ${first}-${last} of ${lines.length}` };
    }
    const idle = changesNothing(lines, first, last, replacement);
    if (idle !== '') return { text: null, idle, why: idle };
    const kept = lines.slice(0, first - 1);
    if (replacement !== 'delete') {
        const indent = /^\s*/.exec(lines[first - 1])[0];
        kept.push(indent + replacement);
    }
    return { text: [...kept, ...lines.slice(last)].join('\n'), why: '' };
}

/**
 * Whether a path stays under a root: what a directive may read, and where the edit may be written.
 * The link a path goes through is followed before the comparison, since a symlink inside the tree
 * names a file outside it and a lexical comparison cannot tell.
 */
function inside(root, path) {
    const held = real(path);
    const base = real(root);
    return held === base || held.startsWith(base + sep);
}

/** A path with every link on it followed, as far as the tree holds one. */
function real(path) {
    const held = resolve(path);
    try {
        return realpathSync(held);
    } catch {
        // Nothing is there yet, which is the copy's own target: follow the folder that holds it.
        try {
            return join(realpathSync(dirname(held)), held.slice(dirname(held).length + 1));
        } catch {
            return held;
        }
    }
}

/** A copy of the tree with the dependencies linked rather than copied, so a run costs seconds. */
function copyTree(root) {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-revert-'));
    cpSync(root, dir, {
        recursive: true,
        filter: (from) => !SKIPPED.includes(relative(root, from).split('/')[0])
    });
    const modules = join(root, 'node_modules');
    if (existsSync(modules)) symlinkSync(modules, join(dir, 'node_modules'), 'dir');
    return dir;
}

/** Whether the built application has to be rebuilt for this case: the browser layer serves it. */
function isBrowserCase(file) {
    return file.startsWith('tests/browser/') && file.endsWith('.spec.ts');
}

/** The name as a pattern that matches it and nothing else: metacharacters escaped, the end anchored. */
function exactly(caseName) {
    const escaped = caseName.replace(/[.*+?^${}()|[\]\\]/g, (one) => `\\${one}`);
    return `${escaped}$`;
}

/** The report a runner wrote, or null where it wrote none. */
function jsonOf(path) {
    if (!existsSync(path)) return null;
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return null;
    }
}

/** Every case of a vitest report whose title is exactly the name, as passed, failed or skipped. */
function vitestResults(report, caseName) {
    const found = [];
    for (const file of report?.testResults ?? []) {
        for (const one of file.assertionResults ?? []) {
            if (one.title !== caseName) continue;
            if (one.status === 'passed') found.push('passed');
            else if (one.status === 'failed') found.push('failed');
            else found.push('skipped');
        }
    }
    return found;
}

/** The same for a playwright report, whose specs nest under suites. */
function playwrightResults(report, caseName) {
    const found = [];
    const walk = (suite) => {
        for (const spec of suite.specs ?? []) {
            if (spec.title !== caseName) continue;
            const skipped = (spec.tests ?? []).some((one) => one.status === 'skipped');
            if (skipped) found.push('skipped');
            else found.push(spec.ok === true ? 'passed' : 'failed');
        }
        for (const under of suite.suites ?? []) walk(under);
    };
    for (const suite of report?.suites ?? []) walk(suite);
    return found;
}

/**
 * The verdict a run of one case earns.
 *
 * One case of that name has to have run and reached a verdict of its own. No case of the name is a
 * case the runner never reached; two are a name the file uses twice, where a red sibling would prove
 * a green case; a skipped one, whether its own `.skip` or another case's `.only`, ran nothing.
 */
function verdict(held) {
    if (held.length === 0) return { ran: false, why: 'the case did not run' };
    if (held.length > 1)
        return { ran: false, why: `the file holds ${held.length} cases of that name` };
    if (held[0] === 'skipped') return { ran: false, why: 'the case was skipped' };
    return { ran: true, green: held[0] === 'passed' };
}

/**
 * The one case, run in the copy.
 *
 * The verdict is read from the runner's own report and never from the exit code: a case the runner
 * never ran, because the revert left the file unparsable or because the name matched nothing, is
 * unproven rather than red, since a revert proves nothing when the case it names did not run.
 */
function runCase(dir, file, caseName) {
    const report = join(dir, 'revert-check-report.json');
    const shared = { cwd: dir, encoding: 'utf8', env: caseEnv(), stdio: 'pipe' };
    if (isBrowserCase(file)) {
        const built = spawnSync('npm', ['run', 'build'], shared);
        if (built.status !== 0) return { ran: false, why: 'the build refused the revert' };
        const env = { ...shared.env, PLAYWRIGHT_JSON_OUTPUT_NAME: report };
        spawnSync('npx', ['playwright', 'test', file, '-g', exactly(caseName), '--reporter=json'], {
            ...shared,
            env
        });
        return verdict(playwrightResults(jsonOf(report), caseName));
    }
    spawnSync(
        'npx',
        [
            'vitest',
            'run',
            file,
            '-t',
            exactly(caseName),
            '--reporter=json',
            `--outputFile=${report}`
        ],
        shared
    );
    return verdict(vitestResults(jsonOf(report), caseName));
}

/** The environment a nested run needs: the parent runner's own variables are not inherited. */
function caseEnv() {
    const env = { ...process.env, CI: '1' };
    for (const name of Object.keys(env)) {
        if (name.startsWith('VITEST') || name === 'TEST_NAME_PATTERN') delete env[name];
    }
    return env;
}

/** One directive, proven or not, with the line of report it earns. */
export function checkOne(root, directive) {
    if (directive.caseName === null) {
        return { ok: false, line: `no case   ${directive.file}:${directive.line}` };
    }
    const target = join(root, directive.target);
    if (!inside(root, target)) {
        return {
            ok: false,
            line: `unproven  ${directive.file}:${directive.line} names ${directive.target}, which is outside the tree`
        };
    }
    if (!existsSync(target)) {
        return {
            ok: false,
            line: `no file   ${directive.file}:${directive.line} names ${directive.target}`
        };
    }
    if (SKIPPED.includes(directive.target.split('/')[0])) {
        return {
            ok: false,
            line: `unproven  ${directive.file}:${directive.line} names ${directive.target}, which a copy of the tree leaves behind`
        };
    }
    const dir = copyTree(root);
    try {
        const edit = applied(
            readFileSync(target, 'utf8'),
            directive.first,
            directive.last,
            directive.replacement
        );
        if (edit.idle !== undefined) {
            return {
                ok: false,
                line: `unproven  ${directive.file}:${directive.line} names ${directive.target}:${directive.first}, where ${edit.idle}`
            };
        }
        if (edit.text === null) {
            return {
                ok: false,
                line: `no line   ${directive.file}:${directive.line} names ${directive.target}:${edit.why}`
            };
        }
        const write = join(dir, directive.target);
        if (!inside(dir, write)) {
            return {
                ok: false,
                line: `unproven  ${directive.file}:${directive.line} names ${directive.target}, which is outside the copy`
            };
        }
        writeFileSync(write, edit.text, 'utf8');
        const run = runCase(dir, directive.file, directive.caseName);
        const where = `${directive.file} :: ${directive.caseName} (revert ${directive.target}:${directive.first})`;
        if (!run.ran) return { ok: false, line: `unproven  ${where} [${run.why}]` };
        if (run.green) return { ok: false, line: `GREEN     ${where}` };
        return { ok: true, line: `red       ${where}` };
    } catch (trouble) {
        return {
            ok: false,
            line: `unproven  ${directive.file}:${directive.line} names ${directive.target}: ${String(trouble)}`
        };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

function main() {
    const { root, files } = readArgs(process.argv.slice(2));
    const base = resolve(root ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
    if (files.length === 0) {
        process.stdout.write(
            'usage: node bin/revert-check.mjs [--root <dir>] <file> [<file> ...]\n'
        );
        process.exitCode = 2;
        return;
    }
    const found = directives(base, files);
    const covered = new Set(found.map((one) => `${one.file}::${one.caseName}`));
    let bad = 0;
    for (const directive of found) {
        const result = checkOne(base, directive);
        if (!result.ok) bad += 1;
        process.stdout.write(`${result.line}\n`);
    }
    let unchecked = 0;
    for (const one of caseNames(base, files)) {
        if (covered.has(`${one.file}::${one.caseName}`)) continue;
        unchecked += 1;
        process.stdout.write(`unchecked ${one.file} :: ${one.caseName}\n`);
    }
    process.stdout.write(`${found.length} reverts, ${bad} unproven, ${unchecked} unchecked\n`);
    process.exitCode = bad === 0 && unchecked === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
