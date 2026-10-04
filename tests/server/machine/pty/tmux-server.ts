// Layer 4, test helper. A private tmux server for a suite that runs against the real tmux.
//
// Every tmux call such a suite makes carries `-S <socket>` into a scratch directory made before
// the describe's first case, so the machine's own tmux server is never listed, started or killed.
// The server the suite starts is killed after the describe's last case, whether or not an
// assertion failed, and the directory goes with it. The probes run in a `beforeAll`, so a run that
// leaves the describe out (the tagged-out run of `npm test`) starts no process and makes nothing.

import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { scratchDir, test } from '../../../fixtures/scratch.ts';

/** Whether `program` runs with `args` and exits 0. */
function programRuns(program: string, args: string[]): boolean {
    try {
        return spawnSync(program, args, { encoding: 'utf8' }).status === 0;
    } catch {
        return false;
    }
}

/** The scratch directory of a private server, its socket, and whether tmux answers at all. */
type PrivateTmux = { dir: string; socket: string; available: boolean };

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
