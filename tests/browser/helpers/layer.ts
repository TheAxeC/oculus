// What the browser layer knows about the machine before it serves, and how it puts the machine back
// afterwards. Both live here rather than in serve.ts because serve.ts is a process Playwright starts:
// importing it starts a server, so nothing in it can be held by a unit test.

import {
    cpSync,
    existsSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { LOCAL_NAME } from '../../../src/lib/data/sources/config.ts';

/** Folders whose contents are not what a build is made from, and are skipped when it is dated. */
export const SKIPPED = ['node_modules', '.svelte-kit', 'build', '.hub'];

/** The newest file under one directory, with the moment it was written. Nothing there is zero. */
export function newest(dir: string): { at: number; path: string } {
    let found = { at: 0, path: dir };
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return found;
    }
    for (const entry of entries) {
        if (SKIPPED.includes(entry.name)) continue;
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            const deeper = newest(path);
            if (deeper.at > found.at) found = deeper;
            continue;
        }
        try {
            const at = statSync(path).mtimeMs;
            if (at > found.at) found = { at, path };
        } catch {
            continue;
        }
    }
    return found;
}

/**
 * Copy the engine's config folder for one run, leaving the machine's own local.yml behind. The run
 * writes its own in the copy: without the filter the owner's hub and port would be copied in with
 * the tracked YAML, and the copy is the config folder of the engine the run is started over, so
 * every run would read them. The name is the loader's own, so the filter cannot drift from the file
 * the server reads.
 */
export function copyConfig(from: string, into: string): void {
    const own = join(from, LOCAL_NAME);
    cpSync(from, into, { recursive: true, filter: (path) => path !== own });
}

/** Whether `build/` still describes the tree, and what to do about it when it does not. */
export function buildState(
    engine: string,
    roots = ['src', 'config']
): {
    current: boolean;
    reason: string;
} {
    const build = join(engine, 'build');
    if (!existsSync(join(build, 'handler.js'))) {
        return { current: false, reason: 'build/handler.js is not there; run npm run build' };
    }
    const built = newest(build).at;
    for (const root of roots) {
        const source = newest(join(engine, root));
        if (source.at > built) {
            return {
                current: false,
                reason: `build/ is older than ${source.path}; run npm run build`
            };
        }
    }
    return { current: true, reason: '' };
}

/** Whether a process is there, asked of the kernel with signal 0, which delivers nothing. */
export function running(pid: number): boolean {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        // EPERM is a live process this one does not own.
        return (error as NodeJS.ErrnoException).code === 'EPERM';
    }
}

/**
 * Take the layer's lock, or refuse. One file under the temporary directory holds the pid of the run
 * that owns the copies. A second run started while the first is serving must sweep nothing and start
 * nothing: the sweep below would otherwise take the serving run's hub out from under it. A lock left
 * by a run that is gone is taken over, since its pid answers for nobody.
 */
export function takeLock(
    root: string,
    name: string,
    pid: number,
    alive: (pid: number) => boolean = running
): { taken: boolean; reason: string; path: string } {
    const path = join(root, name);
    const mine = { taken: true, reason: '', path };
    try {
        writeFileSync(path, `${pid}\n`, { flag: 'wx' });
        return mine;
    } catch {
        const held = Number.parseInt(readFileSync(path, 'utf8').trim(), 10);
        if (alive(held)) {
            return {
                taken: false,
                reason: `${path} is held by the run with pid ${held}, which is still serving`,
                path
            };
        }
        writeFileSync(path, `${pid}\n`);
        return mine;
    }
}

/**
 * Remove the directories earlier runs made. Playwright ends its web server by killing the process
 * tree, and a killed process removes nothing, so the sweep at the start of a run is what keeps one
 * copy of the demo hub per machine rather than one per run.
 */
export function removeLeftovers(root: string, prefix: string): string[] {
    const gone: string[] = [];
    let entries;
    try {
        entries = readdirSync(root, { withFileTypes: true });
    } catch {
        return gone;
    }
    for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.startsWith(prefix)) continue;
        const path = join(root, entry.name);
        try {
            rmSync(path, { recursive: true, force: true });
            gone.push(path);
        } catch {
            continue;
        }
    }
    return gone;
}

/** Remove what one run made: its temporary directory, and the file the specs read its hub from. */
export function removePaths(paths: string[]): void {
    for (const path of paths) {
        try {
            rmSync(path, { recursive: true, force: true });
        } catch {
            continue;
        }
    }
}

/** What a process offers this module: the events it hears, and the way it stops. */
export type Exits = {
    on(event: string, listener: () => void): unknown;
    exit(code: number): void;
};

/**
 * Take the run's paths away when the server process ends, however it ends. Playwright stops the web
 * server with a signal, and a signal handler is what turns that into an ordinary exit; without one
 * the default action ends the process with no exit event and the copy stays behind.
 */
export function removeOnExit(paths: string[], owner: Exits, stop: () => void): void {
    owner.on('exit', () => removePaths(paths));
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
        owner.on(signal, () => {
            stop();
            removePaths(paths);
            owner.exit(0);
        });
    }
}
