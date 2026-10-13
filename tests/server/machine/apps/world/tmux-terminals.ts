// Layer 4, test helper. The terminals env of the apps' hosts over a private tmux server: the server
// lives on a socket in a scratch directory (pty/tmux-server.ts), so the machine's own tmux is never
// listed, started or killed, and it is ended after each case.

import { spawnSync } from 'node:child_process';
import { afterEach } from 'vitest';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { StreamTerminalSet } from '../../../../../src/lib/server/machine/apps/tools/run/stream-terminals.ts';
import { terminalsEnv } from '../../../../../src/lib/server/machine/apps/tools/run/terminals-env.ts';
import { Terminals } from '../../../../../src/lib/server/machine/pty/channel.ts';
import { privateTmux, tmuxOptions } from '../../pty/tmux-server.ts';

/**
 * A private tmux server named by `prefix`, ended after each case of the suite that calls this at
 * its top. `build` makes the terminals and the apps' terminals env over it; `poll` is the
 * milliseconds between two reads of tmux's list while a task terminal runs (tmux does not announce
 * the end of a task's line), and no list is polled when it is absent. `until` waits for the list
 * of the apps' terminals to change into a state the caller accepts.
 */
export function tmuxTerminals(prefix: string) {
    const server = privateTmux(prefix);
    const options = tmuxOptions(server);
    afterEach(() => {
        if (server.available) {
            spawnSync('tmux', ['-S', server.socket, 'kill-server'], { encoding: 'utf8' });
        }
    });
    return {
        options,
        build: (over: { poll?: number } = {}) => {
            const streams = new StreamTerminalSet();
            const terminals = new Terminals(new Hub(), {
                streams,
                tmux: options,
                poll: over.poll ?? 0
            });
            const env = terminalsEnv({ terminals, streams, tmux: options, shell: () => '/bin/sh' });
            /** Resolves when `done` holds, at once or after the list changes so that it does. */
            const until = (done: () => boolean): Promise<void> =>
                new Promise((resolve) => {
                    const off = env.onChange(() => look());
                    const look = (): void => {
                        if (!done()) return;
                        off();
                        resolve();
                    };
                    look();
                });
            return { streams, terminals, env, until };
        }
    };
}
