// The facts tests/browser/layer.ts holds for the browser layer, over a tree made in a temporary
// directory: a build that no longer describes its source is refused, the copy of the config folder
// carries no machine-local file, and what a run made is removed.
//
// This is a vitest file rather than a spec: Playwright's testMatch is `*.spec.ts`, so the browser
// layer never collects it and it never starts a server.

import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    buildState,
    copyConfig,
    newest,
    removeLeftovers,
    removeOnExit,
    removePaths,
    takeLock
} from './layer.ts';
import { LOCAL_NAME } from '../../src/lib/data/sources/config.ts';

let dir = '';

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'oculus-layer-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
});

afterEach(() => {
    removePaths([dir]);
});

/** One file with the moment it was last written, in seconds since the epoch. */
function put(relative: string, at: number): string {
    const path = join(dir, relative);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, 'x\n');
    utimesSync(path, at, at);
    return path;
}

describe('buildState', () => {
    it('says what to do when there is no build at all', () => {
        put('src/lib/thing.ts', 1_000_000);
        const state = buildState(dir);
        expect(state.current).toBe(false);
        expect(state.reason).toContain('npm run build');
    });

    it('is current when the build is newer than every source root', () => {
        put('src/lib/thing.ts', 1_000_000);
        put('config/text/app.yml', 1_000_000);
        put('build/handler.js', 1_000_100);
        expect(buildState(dir)).toEqual({ current: true, reason: '' });
    });

    it('names the source file the build is older than', () => {
        put('src/lib/thing.ts', 1_000_000);
        const late = put('config/text/app.yml', 1_000_200);
        put('build/handler.js', 1_000_100);
        const state = buildState(dir);
        expect(state.current).toBe(false);
        expect(state.reason).toContain(late);
    });

    it('reads nothing inside the folders a build is not made from', () => {
        put('build/handler.js', 1_000_100);
        put('src/node_modules/late/index.js', 1_000_900);
        expect(buildState(dir).current).toBe(true);
        expect(newest(join(dir, 'src')).at).toBe(0);
    });
});

describe('the config copy', () => {
    it('copies the folder whole and leaves the machine own file behind', () => {
        put('config/layout.yml', 1_000_000);
        put('config/text/app.yml', 1_000_000);
        put(`config/${LOCAL_NAME}`, 1_000_000);
        const into = join(dir, 'copy');

        copyConfig(join(dir, 'config'), into);

        expect(existsSync(join(into, 'layout.yml'))).toBe(true);
        expect(existsSync(join(into, 'text', 'app.yml'))).toBe(true);
        expect(existsSync(join(into, LOCAL_NAME))).toBe(false);
    });
});

describe('the lock', () => {
    // The liveness of a pid is asked of the caller here, so no case signals anything: the layer's
    // own answer is server/sessions/registry.ts's, signal 0 and nothing delivered.
    const alive = (pid: number): boolean => pid === process.pid;

    it('is taken when nothing holds it, and holds the pid of the run that took it', () => {
        const lock = takeLock(dir, 'oculus-browser.lock', process.pid, alive);
        expect(lock).toEqual({ taken: true, reason: '', path: join(dir, 'oculus-browser.lock') });
        expect(readFileSync(lock.path, 'utf8').trim()).toBe(String(process.pid));
    });

    it('refuses while the run that holds it is still there', () => {
        takeLock(dir, 'oculus-browser.lock', process.pid, alive);
        const second = takeLock(dir, 'oculus-browser.lock', process.pid + 1, alive);
        expect(second.taken).toBe(false);
        expect(second.reason).toContain(String(process.pid));
        expect(readFileSync(second.path, 'utf8').trim()).toBe(String(process.pid));
    });

    it('is taken over from a run that is gone', () => {
        // A pid no process can have, so the lock on disk answers for nobody.
        writeFileSync(join(dir, 'oculus-browser.lock'), '2147483647\n');
        const lock = takeLock(dir, 'oculus-browser.lock', process.pid, alive);
        expect(lock.taken).toBe(true);
        expect(readFileSync(lock.path, 'utf8').trim()).toBe(String(process.pid));
    });
});

describe('the cleanup', () => {
    it('removes a directory and a file and says nothing about one that is gone', () => {
        const folder = join(dir, 'copy');
        put('copy/demo/README.md', 1_000_000);
        const marker = put('.hub', 1_000_000);
        removePaths([folder, marker, join(dir, 'never-there')]);
        expect(existsSync(folder)).toBe(false);
        expect(existsSync(marker)).toBe(false);
    });

    it('takes away what an earlier run left under the name, and nothing else', () => {
        mkdirSync(join(dir, 'oculus-browser-aaa', 'demo'), { recursive: true });
        mkdirSync(join(dir, 'oculus-browser-bbb'), { recursive: true });
        mkdirSync(join(dir, 'something-else'), { recursive: true });
        put('oculus-browser-aaa/demo/README.md', 1_000_000);

        const gone = removeLeftovers(dir, 'oculus-browser-').sort();
        expect(gone).toEqual([join(dir, 'oculus-browser-aaa'), join(dir, 'oculus-browser-bbb')]);
        expect(existsSync(join(dir, 'oculus-browser-aaa'))).toBe(false);
        expect(existsSync(join(dir, 'something-else'))).toBe(true);
        expect(removeLeftovers(join(dir, 'never-there'), 'oculus-browser-')).toEqual([]);
    });

    it('removes them on the exit event and on a signal, stopping the server first', () => {
        const folder = join(dir, 'copy');
        put('copy/demo/README.md', 1_000_000);
        const listeners = new Map<string, () => void>();
        const codes: number[] = [];
        let stopped = 0;
        removeOnExit(
            [folder],
            {
                on: (event, listener) => listeners.set(event, listener),
                exit: (code) => codes.push(code)
            },
            () => (stopped += 1)
        );
        expect([...listeners.keys()]).toEqual(['exit', 'SIGINT', 'SIGTERM', 'SIGHUP']);

        listeners.get('SIGTERM')?.();
        expect(stopped).toBe(1);
        expect(codes).toEqual([0]);
        expect(existsSync(folder)).toBe(false);

        // The exit event runs the same removal over paths that are already gone.
        listeners.get('exit')?.();
        expect(existsSync(folder)).toBe(false);
    });
});
