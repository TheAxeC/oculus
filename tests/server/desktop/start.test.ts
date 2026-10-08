// Layer 4, server test. The desktop app's start and stop, each row a real start of the worktree's
// Electron binary (or of `node src/server.ts`) on a scratch engine, a scratch HOME, port 8817 and a
// scratch tmux socket named with `-S`: a second start, a port another program holds, a quit, a
// server that cannot listen, and a default port that an oculus already holds. Every process a row
// starts is ended by the row, and its tmux server with it.
//
// Each row waits on a signal of the process it started: a line it printed, read from its output
// stream, or its end, read from its `exit` event. The app runs on `app-harness.ts`, where a
// recorder stands in for every call that would show a window, bring one forward or open a dialog,
// so no row shows a window or takes focus, and a row reads what the app asked for from the
// `[screen]` lines the recorder prints. It does not cover what the screen shows (the drawn window,
// the dialog's buttons) or the build's output, which the look does.
// @module-tag slow: every row starts Electron, which builds the server first.

import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import { basename, join, resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { APP_FOLDERS, APP_MODE } from '../../../src/lib/server/root/process/build-folders.ts';
import { wordsOf } from '../../../src/lib/server/root/process/words.ts';

/**
 * The Electron binary of the worktree: the `electron` package answers its path under plain Node.
 */
const ELECTRON = createRequire(import.meta.url)('electron') as string;
const CHECKOUT = resolve(import.meta.dirname, '..', '..', '..');
const HARNESS = join(import.meta.dirname, 'app-harness.ts');
/** The handler the app's own build writes, which the server rows load. */
const HANDLER = join(CHECKOUT, APP_FOLDERS.adapter, 'handler.js');
const PORT = 8817;
const MINUTES = 10 * 60 * 1000;
/** How long a process may take to end on SIGTERM before it is ended by its pid. */
const GRACE_MS = 10_000;

/** One scratch world: an engine without a local.yml, a hub, a HOME and a tmux folder. */
type Scratch = { root: string; engine: string; hub: string; home: string; tmux: string };

/**
 * A running process, with the lines it printed. `ended` settles on its `exit` event with the exit
 * code, and `closed` on its `close` event, once every line it printed has been read.
 */
type Running = {
    child: ChildProcess;
    lines: string[];
    ended: Promise<number | null>;
    closed: Promise<void>;
};

const cleanups: (() => Promise<void> | void)[] = [];

afterEach(async () => {
    while (cleanups.length > 0) await cleanups.pop()?.();
}, 60_000);

beforeAll(() => {
    if (existsSync(HANDLER)) return;
    execFileSync(
        process.execPath,
        [join(CHECKOUT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--mode', APP_MODE],
        {
            cwd: CHECKOUT,
            stdio: 'ignore'
        }
    );
}, MINUTES);

/** The scratch world of one row, removed when the row ends. */
function scratch(port: number | null): Scratch {
    const root = mkdtempSync(join('/tmp', 'o48-'));
    const engine = join(root, 'engine');
    const hub = join(root, 'hub');
    const home = join(root, 'home');
    const tmux = join(root, 'tmux');
    for (const dir of [hub, home, tmux]) mkdirSync(dir);
    cpSync(join(CHECKOUT, 'config'), join(engine, 'config'), {
        recursive: true,
        filter: (path) => basename(path) !== 'local.yml'
    });
    if (port !== null) {
        writeFileSync(join(engine, 'config', 'local.yml'), `hub: ${hub}\nport: ${port}\n`);
    }
    cleanups.push(() => {
        endTmux(tmux);
        rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    });
    return { root, engine, hub, home, tmux };
}

function socketOf(tmux: string): string {
    return join(tmux, `tmux-${process.getuid?.() ?? 0}`, 'default');
}

/** End the scratch tmux server, whether or not one is running. */
function endTmux(tmux: string): void {
    try {
        execFileSync('tmux', ['-S', socketOf(tmux), 'kill-server'], { stdio: 'ignore' });
    } catch {
        // No tmux server on the socket.
    }
}

/** Start `command` and collect what it prints; it is ended when the row ends. */
function run(
    command: string,
    args: string[],
    world: Scratch,
    extra: NodeJS.ProcessEnv = {}
): Running {
    const lines: string[] = [];
    const child = spawn(command, args, {
        env: {
            HOME: world.home,
            TMUX_TMPDIR: world.tmux,
            USER: process.env.USER ?? '',
            PATH: process.env.PATH ?? '',
            ...extra
        },
        stdio: ['pipe', 'pipe', 'pipe']
    });
    for (const stream of [child.stdout, child.stderr]) {
        stream.on('data', (chunk: Buffer) => lines.push(...chunk.toString().split('\n')));
    }
    const ended = new Promise<number | null>((done) => child.once('exit', (code) => done(code)));
    const closed = new Promise<void>((done) => child.once('close', () => done()));
    cleanups.push(() => stop(child, ended));
    return { child, lines, ended, closed };
}

/**
 * End a process a row started: SIGTERM, then its `exit`; and when no `exit` comes within
 * `GRACE_MS`, the app's server processes and the process itself are ended by their pids.
 */
async function stop(child: ChildProcess, ended: Promise<number | null>): Promise<void> {
    if (child.exitCode !== null || child.signalCode !== null) return;
    child.kill('SIGTERM');
    let timer: NodeJS.Timeout | undefined;
    const late = new Promise<false>((done) => {
        timer = setTimeout(() => done(false), GRACE_MS);
    });
    const exited = await Promise.race([ended.then(() => true as const), late]);
    clearTimeout(timer);
    if (exited) return;
    const pid = child.pid ?? 0;
    for (const row of serversOf(pid)) process.kill(Number(row.trim().split(/\s+/)[0]), 'SIGKILL');
    child.kill('SIGKILL');
    await ended;
}

/**
 * The app: Electron on the test harness, over the scratch engine. What its recorder took the
 * place of (each `[screen]` line) is printed when the row ends.
 */
function app(world: Scratch, defaultPort: number): Running {
    const started: Running[] = [];
    cleanups.push(() => {
        const recorded = started[0].lines.filter((line) => line.startsWith('[screen]'));
        process.stderr.write(`recorded, nothing shown: ${recorded.join(' | ') || 'none'}\n`);
    });
    const running = run(ELECTRON, [HARNESS, '--engine', world.engine], world, {
        OCULUS_TEST_DEFAULT_PORT: String(defaultPort)
    });
    started.push(running);
    return running;
}

/**
 * Settle when the first line holding `text` is printed, read from the process's output streams, and
 * fail at once when a line opening `[screen] dialog` comes before it, at the call and on each
 * chunk: the recorder leaves every dialog unanswered, so the app would wait on it to the row's
 * limit. The app prints a dialog's message before the recorder's line, so a row that waits for the
 * message of the dialog it expects settles on it. Fail when the process has closed without printing
 * `text`.
 */
function printed(running: Running, text: string): Promise<void> {
    const { child, lines } = running;
    return new Promise<void>((done, fail) => {
        const streams = [child.stdout, child.stderr];
        /** Whether the lines read so far decide the wait: the text came first, or a dialog did. */
        const decided = (): boolean => {
            const said = lines.findIndex((line) => line.includes(text));
            const asked = lines.findIndex((line) => line.startsWith('[screen] dialog'));
            if (said !== -1 && (asked === -1 || said < asked)) {
                done();
                return true;
            }
            if (asked === -1) return false;
            fail(new Error(`a dialog before "${text}"; the output was:\n${lines.join('\n')}`));
            return true;
        };
        const heard = (): void => {
            if (decided()) stop();
        };
        const closed = (): void => {
            stop();
            fail(new Error(`no line with "${text}"; the output was:\n${lines.join('\n')}`));
        };
        const stop = (): void => {
            for (const stream of streams) stream?.off('data', heard);
            child.off('close', closed);
        };
        if (decided()) return;
        for (const stream of streams) stream?.on('data', heard);
        child.once('close', closed);
    });
}

/** The server processes the app `main` started: its utility children running the Node service. */
function serversOf(main: number): string[] {
    const table = execFileSync('ps', ['-ax', '-o', 'pid,ppid,args']).toString().split('\n');
    return table.filter((row) => {
        const [, parent] = row.trim().split(/\s+/);
        return Number(parent) === main && row.includes('--utility-sub-type=node.mojom.NodeService');
    });
}

/** A listener standing in for another program (or an oculus) on `port`; it logs each request. */
async function holder(port: number, body: string): Promise<{ asked: string[]; server: Server }> {
    const asked: string[] = [];
    const server = createServer((request, response) => {
        asked.push(`${request.method ?? ''} ${request.url ?? ''}`);
        response.setHeader('content-type', 'application/json');
        response.end(body);
    });
    await new Promise<void>((done) => server.listen(port, '127.0.0.1', done));
    cleanups.push(() => new Promise<void>((done) => server.close(() => done())));
    return { asked, server };
}

async function listening(port: number): Promise<boolean> {
    return fetch(`http://127.0.0.1:${port}/api/health`).then(
        () => true,
        () => false
    );
}

describe('the desktop app starting and stopping', () => {
    it(
        'brings the running app forward on a second start and starts no server',
        async () => {
            const world = scratch(PORT);
            const first = app(world, PORT);
            await printed(first, `oculus on http://127.0.0.1:${PORT}`);
            await printed(first, '[screen] window.show');
            const main = first.child.pid ?? 0;
            expect(serversOf(main)).toHaveLength(1);

            const second = app(world, PORT);
            expect(await second.ended).toBe(0);
            await second.closed;
            expect(second.lines.join('\n')).toContain(
                wordsOf(world.engine)('server.start.already_running')
            );
            await printed(first, '[screen] window.focus');
            expect(serversOf(main)).toHaveLength(1);
        },
        MINUTES
    );

    it(
        'starts no server when another program holds the port, and names the port',
        async () => {
            const world = scratch(PORT);
            await holder(PORT, '{"app":"other"}');
            const running = app(world, PORT);
            await printed(running, wordsOf(world.engine)('desktop.dialog.port_other', PORT));
            expect(serversOf(running.child.pid ?? 0)).toHaveLength(0);
        },
        MINUTES
    );

    it(
        'stops the server process on Quit and leaves every tmux session running',
        async () => {
            const world = scratch(PORT);
            const running = app(world, PORT);
            await printed(running, `oculus on http://127.0.0.1:${PORT}`);
            execFileSync(
                'tmux',
                ['-S', socketOf(world.tmux), 'new-session', '-d', '-s', 'keep', 'sleep 600'],
                {
                    env: { ...process.env, TMUX_TMPDIR: world.tmux }
                }
            );
            const main = running.child.pid ?? 0;
            const servers = serversOf(main);
            expect(servers).toHaveLength(1);
            const server = Number(servers[0].trim().split(/\s+/)[0]);

            running.child.kill('SIGTERM');
            expect(await running.ended).toBe(0);
            expect(await listening(PORT)).toBe(false);
            expect(() => process.kill(server, 0)).toThrow(/ESRCH/);
            const sessions = execFileSync('tmux', [
                '-S',
                socketOf(world.tmux),
                'list-sessions'
            ]).toString();
            expect(sessions).toContain('keep:');
        },
        MINUTES
    );

    it(
        'prints the port in use and exits 1 when the server cannot listen',
        async () => {
            const world = scratch(PORT);
            await holder(PORT, '{"app":"other"}');
            const server = run(
                process.execPath,
                [
                    join(CHECKOUT, 'src', 'server.ts'),
                    '--engine',
                    world.engine,
                    '--handler',
                    HANDLER
                ],
                world
            );
            expect(await server.ended).toBe(1);
            await server.closed;
            expect(server.lines.join('\n')).toContain(
                wordsOf(world.engine)('server.start.port_in_use', PORT)
            );
        },
        MINUTES
    );

    it(
        'asks the default port, passed as a held scratch port, whether an oculus answers there when no local.yml names a port, and starts no second server',
        async () => {
            const world = scratch(null);
            const { asked } = await holder(PORT, '{"app":"oculus"}');
            const running = app(world, PORT);
            await printed(running, wordsOf(world.engine)('desktop.dialog.port_oculus', PORT));
            expect(asked).toContain('GET /api/health');
            expect(serversOf(running.child.pid ?? 0)).toHaveLength(0);
        },
        MINUTES
    );
});
