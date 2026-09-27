// Layer 4, server test. A component's style module asked for before the component itself is
// served as compiled CSS, on the client path the page imports it by and on the SSR path SvelteKit
// loads a page's inline styles by, and a stop of the development server leaves no process behind.
//
// Without src/lib/server/root/style-first.ts, vite-plugin-svelte answers a style module whose
// component has not been compiled yet with nothing, vite then serves the component's raw source as
// the stylesheet, and that server keeps serving it until it stops: the page draws unstyled. So each
// case asks for the style module first, before anything has compiled the component.
//
// The server runs in a copy of the engine under the system temporary directory, never in the
// checkout, so the dependency cache vite writes lands in the copy's own node_modules/.vite rather
// than in the one a development server running from the checkout is serving. The copy holds the
// engine's sources and configuration, and a node_modules folder of its own whose entries are links
// to the checkout's packages. Its local.yml names a hub folder of the copy and a free port; HOME is
// a folder of the copy and PATH puts a tmux and an ssh in front that fail, so the server reads
// nothing of the machine's own and starts no terminal, no usage refresh and no cluster poll.
//
// Raw is told from compiled by the text itself: the raw file opens with `<script` and holds a
// `<style>` tag, and compiled CSS does neither. A word of the stylesheet cannot tell them apart,
// since the raw file holds every word of it.

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, describe, expect, it } from 'vitest';
import { engineDir, LOCAL_NAME } from '../../../src/lib/data/sources/config.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const engine = engineDir();

/**
 * The files and folders of the engine a development server reads; the launch note's writer under
 * bin is among them, since the session scan stamps a launch ended through it.
 */
const COPIED = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'HELP.md',
    'src',
    'config',
    'bin/dispatch-note.mjs'
];

/** How long the server is given to start, which includes the rebuild of its dependency cache. */
const START_MS = 90_000;

/** A path is written to only after this says it is inside the scratch directory. */
function inside(path: string, root: string): string {
    const full = resolve(path);
    if (!full.startsWith(resolve(root) + sep)) throw new Error(`${full} is not inside ${root}`);
    return full;
}

/** A port nothing on this machine listens on now. */
async function freePort(): Promise<number> {
    return new Promise((done, fail) => {
        const probe = createServer();
        probe.once('error', fail);
        probe.listen(0, '127.0.0.1', () => {
            const at = probe.address();
            const port = typeof at === 'object' && at !== null ? at.port : 0;
            probe.close(() => done(port));
        });
    });
}

/** The engine copy the server runs in, with its hub, its home and its failing commands. */
function engineCopy(port: number): { dir: string; env: NodeJS.ProcessEnv } {
    const root = scratchDir('oculus-dev-');
    const dir = inside(join(root, 'engine'), root);
    for (const name of COPIED) {
        cpSync(join(engine, name), inside(join(dir, name), root), {
            recursive: true,
            filter: (path) => path !== join(engine, 'config', LOCAL_NAME)
        });
    }
    const modules = inside(join(dir, 'node_modules'), root);
    mkdirSync(modules);
    for (const name of readdirSync(join(engine, 'node_modules'))) {
        if (name === '.vite') continue;
        symlinkSync(join(engine, 'node_modules', name), join(modules, name));
    }
    const hub = inside(join(root, 'hub'), root);
    const home = inside(join(root, 'home'), root);
    const bin = inside(join(root, 'bin'), root);
    for (const one of [hub, home, bin]) mkdirSync(one);
    for (const command of ['tmux', 'ssh']) {
        writeFileSync(join(bin, command), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    }
    writeFileSync(
        inside(join(dir, 'config', LOCAL_NAME), root),
        `hub: ${hub}\nport: ${port}\naccounts: []\n`
    );
    const temporary = process.env.TMPDIR;
    return {
        dir,
        env: {
            HOME: home,
            PATH: `${bin}:${process.env.PATH ?? ''}`,
            ...(temporary === undefined ? {} : { TMPDIR: temporary })
        }
    };
}

/** The body of one request, or null while nothing answers at the address. */
async function body(url: string): Promise<{ status: number; text: string } | null> {
    try {
        const response = await fetch(url);
        return { status: response.status, text: await response.text() };
    } catch {
        return null;
    }
}

/** Wait until the page answers, or fail once the start has taken too long. */
async function started(base: string): Promise<void> {
    const until = Date.now() + START_MS;
    while (Date.now() < until) {
        const page = await body(`${base}/`);
        if (page?.status === 200) return;
        await new Promise((done) => setTimeout(done, 250));
    }
    throw new Error(`the development server did not answer at ${base}`);
}

/** Whether any process of the group the server was started as is still alive. */
function groupAlive(pid: number): boolean {
    try {
        process.kill(-pid, 0);
        return true;
    } catch {
        return false;
    }
}

/** Stop the whole group, the npm process and the vite under it, and wait until none is left. */
async function stop(server: ChildProcess): Promise<void> {
    const pid = server.pid;
    if (pid === undefined) return;
    if (groupAlive(pid)) process.kill(-pid, 'SIGTERM');
    const until = Date.now() + 10_000;
    while (groupAlive(pid) && Date.now() < until) {
        await new Promise((done) => setTimeout(done, 100));
    }
    if (groupAlive(pid)) process.kill(-pid, 'SIGKILL');
}

/** The stylesheet text a style module carries, out of the module vite wraps it in. */
function styleOf(module: string): string {
    const found = /const __vite__css = ("(?:[^"\\]|\\.)*")/.exec(module);
    return found === null ? '' : (JSON.parse(found[1]) as string);
}

/** Whether a stylesheet is the component's raw source rather than compiled CSS. */
function raw(css: string): boolean {
    return css.trimStart().startsWith('<script') || /<style[\s>]/.test(css);
}

/** The layout's style module, on the address the page imports it by. */
const STYLE = '/src/routes/+layout.svelte?svelte&type=style&lang.css';

/**
 * The script the SSR case runs in the copy: a development server in middleware mode, which starts
 * no oculus server context, loading the layout's style module the way SvelteKit loads a page's
 * inline styles, and printing the CSS it came to.
 */
const SSR_PROBE = [
    "import { createServer } from 'vite';",
    'const server = await createServer({',
    "    configFile: 'vite.config.ts',",
    "    logLevel: 'silent',",
    '    server: { middlewareMode: true }',
    '});',
    "const loaded = await server.ssrLoadModule('/src/routes/+layout.svelte?inline&svelte&type=style&lang.css');",
    'process.stdout.write(JSON.stringify(String(loaded.default)));',
    'await server.close();',
    'process.exit(0);',
    ''
].join('\n');

describe('the development server of the dev script', () => {
    // revert: vite.config.ts "componentBeforeStyle()," => delete
    it(
        'serves a style module asked for before its component as compiled CSS, and again after it, and leaves no process on stop',
        async () => {
            const port = await freePort();
            const copy = engineCopy(port);
            expect(copy.dir.startsWith(resolve(tmpdir()) + sep)).toBe(true);
            const server = spawn('npm', ['run', 'dev'], {
                cwd: copy.dir,
                env: copy.env,
                detached: true,
                stdio: 'ignore'
            });
            const pid = server.pid ?? 0;
            const base = `http://127.0.0.1:${port}`;
            try {
                await started(base);
                const first = await body(`${base}${STYLE}`);
                expect(first?.status).toBe(200);
                const css = styleOf(first?.text ?? '');
                expect(css).not.toBe('');
                expect(raw(css)).toBe(false);
                // the component compiled since, and the server answers the same compiled CSS
                expect((await body(`${base}/src/routes/+layout.svelte`))?.status).toBe(200);
                expect(raw(styleOf((await body(`${base}${STYLE}`))?.text ?? ''))).toBe(false);
            } finally {
                await stop(server);
            }
            expect(pid).toBeGreaterThan(0);
            expect(groupAlive(pid)).toBe(false);
            expect(await body(`${base}/`)).toBeNull();
        },
        START_MS + 30_000
    );

    // revert: vite.config.ts "componentBeforeStyle()," => delete
    it(
        'loads a style module asked for before its component as compiled CSS on the SSR path',
        async () => {
            const copy = engineCopy(await freePort());
            const probe = join(copy.dir, 'ssr-probe.mjs');
            writeFileSync(probe, SSR_PROBE);
            const done = spawnSync(process.execPath, [probe], {
                cwd: copy.dir,
                env: copy.env,
                encoding: 'utf8',
                timeout: START_MS
            });
            expect(done.status, done.stderr).toBe(0);
            const css = JSON.parse(done.stdout) as string;
            expect(css).not.toBe('');
            expect(raw(css)).toBe(false);
        },
        START_MS + 30_000
    );
});
