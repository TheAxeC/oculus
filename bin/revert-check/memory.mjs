// Layer 4, test. The in-memory path of bin/revert-check/revert-check.mjs: one Vitest instance over
// one copy of the tree made for the run, whose first plugin serves a directive's target with the
// reverted text, so a unit case is proven without a copy of the tree per directive.

import {
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    realpathSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import os, { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Writable } from 'node:stream';
import { SIGNALS, caseEnv, copyTree, exactly, removeCopy, unparsable } from './copy.mjs';

/** What a run's folder is called under the system temporary directory, beside the copies. */
const RUN_PREFIX = 'oculus-revert-run-';

/** A write that keeps nothing, and still answers the callback a caller passes it. */
function mute(_chunk, encoding, done) {
    (typeof encoding === 'function' ? encoding : done)?.();
    return true;
}

/**
 * Work done under the environment a case runs in, with the run's copy as the working directory, and
 * all of it put back after, so the copy path between two such pieces sees the process as it was.
 * What the tree's plugins print meanwhile is the case's, which the copy path's pipe keeps out of
 * the report too, so the process's own output is muted.
 */
async function within(env, root, work) {
    const saved = { ...process.env };
    const cwd = process.cwd();
    const writes = [process.stdout.write, process.stderr.write];
    const put = (vars) => {
        for (const name of Object.keys(process.env)) if (!(name in vars)) delete process.env[name];
        Object.assign(process.env, vars);
    };
    put(env);
    process.chdir(root);
    process.stdout.write = process.stderr.write = mute;
    try {
        return await work();
    } finally {
        [process.stdout.write, process.stderr.write] = writes;
        put(saved);
        process.chdir(cwd);
    }
}

/**
 * Every path under the run's folder but the ones named to skip, each with its mode and a file with
 * its size and time of change too, so what a case wrote or locked there is a line that differs; a
 * folder the case left unreadable reads as none.
 */
function listing(dir, skipped) {
    const lines = [];
    const walk = (at) => {
        for (const one of readdirSync(at, { withFileTypes: true })) {
            const full = join(at, one.name);
            if (skipped.includes(full)) continue;
            const held = lstatSync(full);
            const file = one.isDirectory() ? '' : ` ${held.size} ${held.mtimeMs}`;
            lines.push(`${full} ${held.mode}${file}`);
            if (one.isDirectory()) walk(full);
        }
    };
    try {
        walk(dir);
    } catch {
        return '';
    }
    return lines.join('\n');
}

/**
 * The in-memory path of one run: a folder of its own under the system temporary directory, holding
 * the cases' temporary directory and the run's copy of the tree, and one Vitest instance over it.
 *
 * The plugin answers the load of the target's own path in the copy, and nothing else, with the
 * reverted text: a module asked for with a query, such as a component's style module, is another
 * module, which the whole text of the target would break for a reason the revert does not name.
 */
export function memoryRun(root) {
    const held = mkdtempSync(join(tmpdir(), RUN_PREFIX));
    const folder = join(held, 'run');
    // Vitest keeps the modules it transformed in the temporary directory it started under and reads
    // them again on a later run, so it starts under one of its own beside the run's folder: a case
    // reaching up from its own temporary directory writes into the folder the listing reads.
    const cache = join(held, 'vitest');
    mkdirSync(folder);
    mkdirSync(cache);
    /** The owner's every permission given back under a path, so what a case locked is removable. */
    const unlock = (path) => spawnSync('chmod', ['-R', 'u+rwx', path]);
    const stop = (signal) => {
        // A signal can land while the output is muted; what the removal says is the run's.
        delete process.stdout.write;
        delete process.stderr.write;
        unlock(held);
        removeCopy(held);
        process.exit(128 + (os.constants.signals[signal] ?? 0));
    };
    for (const signal of SIGNALS) process.on(signal, stop);
    const env = caseEnv(folder);
    const own = { ...env, TMPDIR: cache };
    const tree = join(folder, 'tree');
    /** What the listing leaves out: the cases' temporary directory and the copy's dependencies. */
    const skipped = [env.TMPDIR, join(tree, 'node_modules')];
    /** The cases' temporary directory, emptied: each in-memory run starts with nothing there. */
    const emptyTemp = () => {
        unlock(env.TMPDIR);
        rmSync(env.TMPDIR, { recursive: true, force: true });
        mkdirSync(env.TMPDIR);
    };
    const swap = { target: '', text: '' };
    const plugin = {
        name: 'revert-check:swap',
        enforce: 'pre',
        load: (id) => (swap.target !== '' && id === swap.target ? swap.text : undefined)
    };
    /** The copy and the instance over it, made again after a case wrote into the copy. */
    let started = null;
    const start = () =>
        (started ??= (async () => {
            // Everything in the run's folder goes, what a case wrote beside the copy among it, so
            // the listing of the new copy is the listing of a copy and nothing else.
            unlock(folder);
            for (const one of readdirSync(folder)) rmSync(join(folder, one), { recursive: true });
            emptyTemp();
            copyTree(root, tree);
            const base = realpathSync(tree);
            const vitest = await within(own, base, async () => {
                const { createVitest } = await import('vitest/node');
                const made = await createVitest(
                    'test',
                    { root: base, watch: false, reporters: [] },
                    { plugins: [plugin] },
                    { stdout: new Writable({ write: mute }), stderr: new Writable({ write: mute }) }
                );
                await made.init();
                await made.globTestSpecifications();
                return made;
            });
            // Listed once started, since the tree's plugins write their own output as they start.
            return { vitest, base, listed: listing(folder, skipped) };
        })().catch(() => null));
    /** Close the instance, so the next case that needs one makes the copy and the instance anew. */
    const restart = async () => {
        const run = await started;
        started = null;
        if (run !== null) await within(env, run.base, () => run.vitest.close()).catch(() => {});
    };
    /** Every result of the case of that name, run with the text given for the target, if any. */
    const inMemory = async (file, caseName, rel, text) => {
        const run = await start();
        if (run === null) return null;
        try {
            emptyTemp();
            return await within(env, run.base, async () => {
                try {
                    swap.target = rel === '' ? '' : join(run.base, rel);
                    swap.text = text;
                    if (swap.target !== '') run.vitest.invalidateFile(swap.target);
                    run.vitest.setGlobalTestNamePattern(new RegExp(exactly(caseName)));
                    const specs = run.vitest.getModuleSpecifications(join(run.base, file));
                    if (specs.length === 0) return [];
                    const result = await run.vitest.runTestSpecifications(specs);
                    return result.testModules
                        .flatMap((module) => [...module.children.allTests()])
                        .filter((one) => one.name === caseName)
                        .map((one) => one.result().state);
                } finally {
                    const served = swap.target;
                    swap.target = '';
                    if (served !== '') run.vitest.invalidateFile(served);
                }
            });
        } finally {
            if (listing(folder, skipped) !== run.listed) await restart();
        }
    };
    /** Whether the case passed with no revert, run once per case name per file. */
    const baselines = new Map();
    return {
        /**
         * What unparsable() says of the reverted text, written beside the target in the run's copy,
         * whose package files say how a `.js` file parses, and gone before any case runs; undefined
         * where no copy could be made.
         */
        async unparsable(directive, rel, text) {
            const run = await start();
            if (run === null) return undefined;
            const out = join(dirname(join(run.base, rel)), `.revert-check-${basename(rel)}`);
            writeFileSync(out, text, 'utf8');
            try {
                return unparsable(directive, out);
            } finally {
                rmSync(out, { force: true });
            }
        },
        /** Whether the case failed with the revert and passed with none; false goes to the copy. */
        async red(directive, rel, text) {
            const { file, caseName } = directive;
            const held = await inMemory(file, caseName, rel, text);
            if (held === null || held.length !== 1 || held[0] !== 'failed') return false;
            const key = `${file}::${caseName}`;
            if (!baselines.has(key)) baselines.set(key, await inMemory(file, caseName, '', ''));
            const base = baselines.get(key);
            return base !== null && base.length === 1 && base[0] === 'passed';
        },
        /** Close the instance and remove the run's folder; the signal handlers go last. */
        async close() {
            await restart();
            unlock(held);
            removeCopy(held);
            for (const signal of SIGNALS) process.off(signal, stop);
        }
    };
}
