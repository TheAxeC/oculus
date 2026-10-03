// Layer 4, test helper. A private tmux server for a suite that runs against the real tmux.
//
// Every tmux call such a suite makes carries `-S <socket>` into a scratch directory made before
// the file's first case, so the machine's own tmux server is never listed, started or killed. The
// server the suite starts is killed after the file's last case, whether or not an assertion
// failed, and the directory goes with it. A run that skips every case makes none.

import { execFile, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { scratchDir, test } from '../../../fixtures/scratch.ts';

/** Whether tmux answers at all; without it the suite skips its cases and says why. */
export const TMUX = (() => {
    try {
        return spawnSync('tmux', ['-V'], { encoding: 'utf8' }).status === 0;
    } catch {
        return false;
    }
})();

/** The scratch directory of a private server and its socket; both are empty until they are made. */
export type PrivateTmux = { dir: string; socket: string };

/** Make the directory and socket path before the file's first case and clean up after its last. */
export function privateTmux(prefix: string): PrivateTmux {
    const server: PrivateTmux = { dir: '', socket: '' };
    test.beforeAll(() => {
        server.dir = scratchDir(prefix);
        server.socket = join(server.dir, 'server.sock');
    });
    // A socket still unset means the hook that makes it failed: no server was started, and tmux is
    // never run without this file's own socket.
    test.afterAll(() => {
        if (server.socket === '') return;
        try {
            spawnSync('tmux', ['-S', server.socket, 'kill-server'], { encoding: 'utf8' });
        } finally {
            rmSync(server.dir, { recursive: true, force: true });
        }
    });
    return server;
}

/**
 * The ends of panes' processes on a private server, as an event. A global `pane-died` hook signals
 * the tmux channel `died`, and the function returned waits for the next signal by running
 * `tmux wait-for died`, so a case waits for tmux to say that a pane ended rather than looking at
 * the list on a timer. Signals that arrive while nobody waits are held as one, so a case that
 * checks the list after each wait cannot miss the last end. A case that never gets its signal ends
 * at the test timeout, and the wait ends with the server when the file's last case is done.
 */
export async function watchEnds(server: PrivateTmux): Promise<() => Promise<void>> {
    const run = (...args: string[]) => promisify(execFile)('tmux', ['-S', server.socket, ...args]);
    // The hook needs a running server, and a server with nothing to hold exits; this window does.
    await run('new-session', '-d', '-s', 'holds-the-server', '--', 'sleep', '120');
    await run('set-hook', '-g', 'pane-died', 'wait-for -S died');
    return async () => {
        await run('wait-for', 'died');
    };
}
