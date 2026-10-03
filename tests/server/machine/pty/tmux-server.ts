// Layer 4, test helper. A private tmux server for a suite that runs against the real tmux, and the
// probes a suite makes before it uses tmux or python3.
//
// Every tmux call such a suite makes carries `-S <socket>` into a scratch directory made before
// the describe's first case, so the machine's own tmux server is never listed, started or killed.
// The server the suite starts is killed after the describe's last case, whether or not an
// assertion failed, and the directory goes with it. The probes run in a `beforeAll`, so a run that
// leaves the describe out (the tagged-out run of `npm test`) starts no process and makes nothing.

import { execFile, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { scratchDir, test } from '../../../fixtures/scratch.ts';

/** Whether `program` runs with `args` and exits 0. */
export function programRuns(program: string, args: string[]): boolean {
    try {
        return spawnSync(program, args, { encoding: 'utf8' }).status === 0;
    } catch {
        return false;
    }
}

/**
 * Called inside a describe that uses `program`: probe it before the describe's first case, skip
 * every case when it does not run, and print the reason once under `file`.
 */
export function requireProgram(file: string, program: string, args: string[]): void {
    let runs = false;
    test.beforeAll(() => {
        runs = programRuns(program, args);
        if (!runs) console.error(`${file}: skipped, ${program} is not on the PATH`);
    });
    test.beforeEach(({ skip }) => {
        skip(!runs, `${program} is not on the PATH`);
    });
}

/** The scratch directory of a private server, its socket, and whether tmux answers at all. */
export type PrivateTmux = { dir: string; socket: string; available: boolean };

/**
 * Make the directory and socket path before the describe's first case and clean up after its last.
 * Without tmux on the PATH every case of the describe is skipped and the reason is printed.
 */
export function privateTmux(prefix: string): PrivateTmux {
    const server: PrivateTmux = { dir: '', socket: '', available: false };
    test.beforeAll(() => {
        server.available = programRuns('tmux', ['-V']);
        server.dir = scratchDir(prefix);
        server.socket = join(server.dir, 'server.sock');
    });
    test.beforeEach(({ skip }) => {
        skip(!server.available, 'tmux is not on the PATH');
    });
    // A socket still unset means the hook that makes it failed: no server was started, and tmux is
    // never run without this file's own socket.
    test.afterAll(() => {
        if (server.socket === '') return;
        try {
            if (server.available) {
                spawnSync('tmux', ['-S', server.socket, 'kill-server'], { encoding: 'utf8' });
            }
        } finally {
            rmSync(server.dir, { recursive: true, force: true });
        }
    });
    return server;
}

/**
 * The option object the pty functions take: it reads the socket when it is used, not when it is
 * made, because the socket is set in a hook that runs after the object is.
 */
export function tmuxOptions(server: PrivateTmux): { readonly socket: string } {
    return {
        get socket(): string {
            return server.socket;
        }
    };
}

/**
 * The ends of panes' processes on a private server, as an event. A global `pane-died` hook signals
 * the tmux channel `died`. One `tmux wait-for died` is always outstanding and every signal it
 * returns for is counted. A signal can merge with the next one in the moment between two
 * `wait-for` runs, and the merge loses nothing: the function returned waits until an end has been
 * counted that no earlier call took, and takes every counted end at once. A case waits for tmux
 * to say that a pane ended rather than looking at the list on a timer, and checks the list after
 * each wait. When the outstanding `wait-for` fails, an end counted before it is still returned,
 * and after that every waiting and every later wait rejects with tmux's error. A case that never
 * gets its signal ends at the test timeout, and the outstanding wait ends with the server when the
 * file's last case is done.
 */
export async function watchEnds(server: PrivateTmux): Promise<() => Promise<void>> {
    const run = (...args: string[]) => promisify(execFile)('tmux', ['-S', server.socket, ...args]);
    // The hook needs a running server, and a server with nothing to hold exits; this window does.
    await run('new-session', '-d', '-s', 'holds-the-server', '--', 'sleep', '120');
    await run('set-hook', '-g', 'pane-died', 'wait-for -S died');
    let counted = 0;
    let taken = 0;
    let failure: Error | null = null;
    const waiting: (() => void)[] = [];
    const count = async (): Promise<void> => {
        for (;;) {
            try {
                await run('wait-for', 'died');
            } catch (error) {
                failure = error as Error;
                for (const wake of waiting.splice(0)) wake();
                return;
            }
            counted += 1;
            for (const wake of waiting.splice(0)) wake();
        }
    };
    void count();
    return async () => {
        while (counted === taken) {
            if (failure !== null) throw failure;
            await new Promise<void>((wake) => waiting.push(wake));
        }
        taken = counted;
    };
}
