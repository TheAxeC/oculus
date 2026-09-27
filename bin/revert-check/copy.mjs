// Layer 4, test. The copy path of bin/revert-check/revert-check.mjs: one directive proven on a copy
// of the tree made for it, with the edit written there and the case run in a process of its own,
// where every way a case reaches its target sees the revert; with the refusals every directive
// earns before either path, and the lines of report both paths print.

import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import os, { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { applied, inside } from './directives.mjs';

/** The signals that stop a run, on each of which the copy in hand is removed. */
export const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'];

/**
 * Remove one case's copy. The case's own temporary directory is inside it, so a child of the case
 * that outlives it writes there while the removal walks the copy, which makes one pass fail on a
 * directory that has just gained a file, or puts the path back right after it went. The removal
 * retries inside one pass and then takes the copy again while it keeps coming back, and a copy it
 * still cannot take away is said in a line rather than stopping the run.
 */
export function removeCopy(dir) {
    for (let pass = 0; pass < 5; pass += 1) {
        try {
            rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
        } catch (trouble) {
            process.stdout.write(`kept      ${dir}: ${String(trouble)}\n`);
            return;
        }
        if (!existsSync(dir)) return;
        // A child still on its way out put the path back; give it the moment it needs to go.
        spawnSync(process.execPath, ['-e', 'setTimeout(() => {}, 200)']);
    }
    // A child that outlives every pass writes its cache once more as it exits, so the last word is
    // the run's own exit, by when nothing of the case is left to write.
    process.once('exit', () => {
        try {
            rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
        } catch {
            process.stdout.write(`kept      ${dir}\n`);
        }
    });
}

/** What a copy of the tree leaves behind: generated output, dependencies and the plan's folder. */
export const SKIPPED = ['node_modules', '.svelte-kit', 'build', '.git', '.scratch', 'test-results'];

/** A new folder for a copy of the tree. */
function copyFolder() {
    return mkdtempSync(join(tmpdir(), 'oculus-revert-'));
}

/**
 * A copy of the tree in that folder, with the dependencies linked rather than copied, so a run
 * costs seconds.
 */
export function copyTree(root, dir) {
    cpSync(root, dir, {
        recursive: true,
        filter: (from) => !SKIPPED.includes(relative(root, from).split('/')[0])
    });
    const modules = join(root, 'node_modules');
    if (existsSync(modules)) symlinkSync(modules, join(dir, 'node_modules'), 'dir');
}

/** Whether the built application has to be rebuilt for this case: the browser layer serves it. */
export function isBrowserCase(file) {
    return file.startsWith('tests/browser/') && file.endsWith('.spec.ts');
}

/** How many times a browser case is run again, on a new port, after its server found it taken. */
const PORT_TRIES = 5;

/** A port nothing listens on, as the system hands one to a server that asks for port 0. */
export function freePort() {
    const probe = `const one = require('node:net').createServer();
one.listen(0, '127.0.0.1', () => { process.stdout.write(String(one.address().port)); one.close(); });`;
    return Number(spawnSync(process.execPath, ['-e', probe], { encoding: 'utf8' }).stdout);
}

/** The environment of one browser case run: its report file and the port it serves on. */
export function browserEnv(env, report, port) {
    return { ...env, PLAYWRIGHT_JSON_OUTPUT_NAME: report, OCULUS_BROWSER_PORT: String(port) };
}

/** Whether a Playwright report says its server could not start because the port was taken. */
export function portTaken(report) {
    return (report?.errors ?? []).some((one) =>
        /is already used|EADDRINUSE/.test(one.message ?? '')
    );
}

/**
 * The name as a pattern that matches it and nothing else: metacharacters escaped, the end anchored.
 */
export function exactly(caseName) {
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
 * case the runner never reached; two are a name the file uses twice, where a red sibling would
 * prove a green case; a skipped one, whether its own `.skip` or another case's `.only`, ran
 * nothing.
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
    /** @type {import('node:child_process').SpawnSyncOptionsWithStringEncoding} */
    const shared = { cwd: dir, encoding: 'utf8', env: caseEnv(dir), stdio: 'pipe' };
    if (isBrowserCase(file)) {
        const built = spawnSync('npm', ['run', 'build'], shared);
        if (built.status !== 0) return { ran: false, why: 'the build refused the revert' };
        const args = ['playwright', 'test', file, '-g', exactly(caseName), '--reporter=json'];
        for (let attempt = 0; attempt < PORT_TRIES; attempt += 1) {
            rmSync(report, { force: true });
            spawnSync('npx', args, { ...shared, env: browserEnv(shared.env, report, freePort()) });
            const read = jsonOf(report);
            if (!portTaken(read)) return verdict(playwrightResults(read, caseName));
        }
        return { ran: false, why: `the server found its port taken ${PORT_TRIES} times` };
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

/**
 * The environment a nested run needs: the parent runner's own variables are not inherited, and the
 * temporary directory is a folder of the copy, so whatever the run makes there, a scratch folder a
 * reverted sweep no longer removes among it, goes when the copy does.
 */
export function caseEnv(dir) {
    const temp = join(dir, '.case-tmp');
    mkdirSync(temp, { recursive: true });
    // Node writes its compile cache into the temporary directory as a process exits, and a child of
    // the case that exits after the copy is removed would put the copy's path back; with the cache
    // off, nothing of the case writes there once it has run.
    const env = { ...process.env, CI: '1', TMPDIR: temp, NODE_DISABLE_COMPILE_CACHE: '1' };
    for (const name of Object.keys(env)) {
        if (name.startsWith('VITEST') || name === 'TEST_NAME_PATTERN') delete env[name];
    }
    return env;
}

/** Where a line names a case: its file, its name and the target line its revert names. */
export function whereOf(directive) {
    return `${directive.file} :: ${directive.caseName} (revert ${directive.target}:${directive.first})`;
}

/** A line of report that counts against the run. */
export const failed = (line) => ({ ok: false, line });

/** Where a directive is written: its file and its line. */
const at = (directive) => `${directive.file}:${directive.line}`;

/** An unproven line naming the directive's target, followed by what is said of it. */
export const unproven = (directive, said) =>
    failed(`unproven  ${at(directive)} names ${directive.target}${said}`);

/**
 * The line a directive earns before anything is copied or run, or null where it may be run: a
 * directive that could not be read, one in no case, a target outside the tree, missing from it or
 * in a folder a copy leaves behind.
 */
export function refusal(root, directive) {
    if (directive.problem !== '') return failed(`unproven  ${at(directive)} ${directive.problem}`);
    if (directive.caseName === null) return failed(`no case   ${at(directive)}`);
    const target = join(root, directive.target);
    if (!inside(root, target)) {
        return unproven(directive, ', which is outside the tree');
    }
    if (!existsSync(target)) return failed(`no file   ${at(directive)} names ${directive.target}`);
    if (SKIPPED.includes(directive.target.split('/')[0])) {
        return unproven(directive, ', which a copy of the tree leaves behind');
    }
    return null;
}

/** The line an edit earns where it changes nothing or names no line, or null where it applies. */
export function editRefusal(directive, edit) {
    if (edit.idle !== undefined) {
        return unproven(directive, `:${directive.first}, where ${edit.idle}`);
    }
    if (edit.text === null)
        return failed(`no line   ${at(directive)} names ${directive.target}:${edit.why}`);
    return null;
}

/**
 * The line a revert earns where it leaves a script unparsable, or null where it does not.
 *
 * A script a case runs as a process of its own fails to start once the revert breaks its syntax,
 * which would read as red; node parses plain JavaScript without running it, so such a revert is
 * named here instead. A module the case imports is covered by the run itself, which does not reach
 * the case.
 */
export function unparsable(directive, written) {
    if (/\.(mjs|cjs|js)$/.test(directive.target)) {
        const parsed = spawnSync('node', ['--check', written], { encoding: 'utf8' });
        if (parsed.status !== 0) {
            return unproven(directive, `:${directive.first}, which the revert leaves unparsable`);
        }
    }
    return null;
}

/**
 * One directive, proven or not on a copy of the tree, with the line of report it earns. A caller
 * that already found the reverted script parses says so, and the parse is not repeated.
 */
export function checkOne(root, directive, parsed = false) {
    const early = refusal(root, directive);
    if (early !== null) return early;
    const target = join(root, directive.target);
    // A run stopped by a signal removes the copy on its way out rather than leaving it behind. The
    // handlers are in place before the folder exists: a signal that lands while the synchronous
    // copy runs then waits for it to end and is handled, where with no handler it would end the
    // process at once and leave the folder.
    let dir = '';
    const stopped = (signal) => {
        if (dir !== '') removeCopy(dir);
        process.exit(128 + (os.constants.signals[signal] ?? 0));
    };
    for (const signal of SIGNALS) process.once(signal, stopped);
    dir = copyFolder();
    try {
        copyTree(root, dir);
        const { first, last, replacement } = directive;
        const edit = applied(readFileSync(target, 'utf8'), first, last, replacement);
        const refused = editRefusal(directive, edit);
        if (refused !== null) return refused;
        const write = join(dir, directive.target);
        if (!inside(dir, write)) return unproven(directive, ', which is outside the copy');
        writeFileSync(write, edit.text, 'utf8');
        const broken = parsed ? null : unparsable(directive, write);
        if (broken !== null) return broken;
        const run = runCase(dir, directive.file, directive.caseName);
        const where = whereOf(directive);
        if (!run.ran) return failed(`unproven  ${where} [${run.why}]`);
        if (run.green) return failed(`GREEN     ${where}`);
        return { ok: true, line: `red       ${where}` };
    } catch (trouble) {
        return unproven(directive, `: ${String(trouble)}`);
    } finally {
        for (const signal of SIGNALS) process.off(signal, stopped);
        removeCopy(dir);
    }
}
