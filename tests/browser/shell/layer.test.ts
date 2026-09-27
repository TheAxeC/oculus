// The facts tests/browser/helpers/layer.ts holds for the browser layer, over a tree made in a
// temporary directory: a build that no longer describes its source is refused, the copy of the
// config folder carries no machine-local file, what a run made is removed, the port a run serves
// on is the one the Playwright configuration and serve.ts both read, and a spec's read of a
// repository never takes the index lock a write of the server needs.
//
// This is a vitest file rather than a spec: Playwright's testMatch is `*.spec.ts`, so the browser
// layer never collects it and it never starts a server.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    buildState,
    copyConfig,
    endLeftoverTmux,
    layerPort,
    newest,
    removeLeftovers,
    removeOnExit,
    removePaths,
    takeLock
} from '../helpers/layer.ts';
import { gitIn, gitOut } from '../helpers/git.ts';
import { LOCAL_NAME } from '../../../src/lib/data/sources/config.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

let dir = '';

/** The machine's own tmux, or '' where it has none; the tmux case is skipped without it. */
const TMUX = spawnSync('sh', ['-c', 'command -v tmux'], { encoding: 'utf8' }).stdout.trim();
if (TMUX === '') console.error('tests/browser/shell/layer.test.ts: tmux case skipped, no tmux');

beforeEach(() => {
    dir = scratchDir('oculus-layer-');
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

    // revert: tests/browser/helpers/layer.ts "spawnSync(tmux, ['-S', socket, 'kill-server'], { timeout: 10000 });" => delete
    it.skipIf(!TMUX)('ends the tmux server an earlier run left on its socket, and no other', () => {
        const old = join(dir, 'ob-old', 'tmux.sock');
        const other = join(dir, 'other', 'tmux.sock');
        mkdirSync(join(dir, 'ob-old'));
        mkdirSync(join(dir, 'other'));
        mkdirSync(join(dir, 'ob-empty'));
        try {
            for (const socket of [old, other]) {
                const started = spawnSync(TMUX, ['-S', socket, 'new-session', '-d', 'sleep 60']);
                expect(started.status).toBe(0);
            }
            expect(endLeftoverTmux(dir, 'ob-', TMUX, 'tmux.sock')).toEqual([old]);
            expect(spawnSync(TMUX, ['-S', old, 'has-session']).status).not.toBe(0);
            expect(spawnSync(TMUX, ['-S', other, 'has-session']).status).toBe(0);
            expect(endLeftoverTmux(dir, 'ob-', '', 'tmux.sock')).toEqual([]);
        } finally {
            for (const socket of [old, other]) spawnSync(TMUX, ['-S', socket, 'kill-server']);
        }
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

describe('the port', () => {
    // revert: tests/browser/helpers/layer.ts "const named = Number(env.OCULUS_BROWSER_PORT);" => const named = Number(undefined);
    it('is 8792, or the one OCULUS_BROWSER_PORT names when that is a port', () => {
        expect(layerPort({})).toBe(8792);
        expect(layerPort({ OCULUS_BROWSER_PORT: '43121' })).toBe(43121);
        expect(layerPort({ OCULUS_BROWSER_PORT: 'x' })).toBe(8792);
        expect(layerPort({ OCULUS_BROWSER_PORT: '70000' })).toBe(8792);
    });

    // revert: playwright.config.ts "const PORT = layerPort();" => const PORT = 8792;
    it('is the one the Playwright configuration asks the server and the browser for', () => {
        const read =
            "const c = (await import('./playwright.config.ts')).default;" +
            'process.stdout.write(JSON.stringify([c.webServer.url, c.projects[0].use.baseURL]));';
        const done = spawnSync(process.execPath, ['--input-type=module', '-e', read], {
            cwd: process.cwd(),
            encoding: 'utf8',
            env: { ...process.env, OCULUS_BROWSER_PORT: '43121' }
        });
        expect(done.status, done.stderr).toBe(0);
        expect(JSON.parse(done.stdout)).toEqual([
            'http://127.0.0.1:43121/',
            'http://127.0.0.1:43121'
        ]);
    });
});

describe('a git read of a spec', () => {
    // revert: tests/browser/helpers/git.ts "'--no-optional-locks'," => delete
    it('leaves the index as it was, so it never holds the lock a write of the server needs', () => {
        gitIn(dir, 'init', '--quiet');
        writeFileSync(join(dir, 'a.txt'), 'one\n');
        gitIn(dir, 'add', 'a.txt');
        gitIn(dir, 'commit', '--quiet', '-m', 'one');
        // The file keeps its text and gets another time, so a status that refreshed would write
        // the index again.
        utimesSync(join(dir, 'a.txt'), new Date(2020, 0, 1), new Date(2020, 0, 1));
        const index = join(dir, '.git', 'index');
        const before = readFileSync(index);
        expect(gitOut(dir, 'status', '--porcelain')).toBe('');
        expect(readFileSync(index).equals(before)).toBe(true);
    });
});
