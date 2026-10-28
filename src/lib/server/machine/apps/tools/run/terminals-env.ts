// Layer 2, server. What the terminals and tasks of the apps' hosts use of the process: the tmux
// terminals the Terminal tab lists (pty/channel.ts), the stream terminals the apps hold
// (stream-terminals.ts), and the starts, stops and re-runs of a tmux terminal of the kind `app`
// (pty/sessions.ts). The list the terminals report is the Terminal tab's own, so a terminal an app
// makes is listed, moved, split, renamed and closed as any terminal.

import type { Terminal } from '../../../../../data/model/index.ts';
import type { GitCredentials } from '../../../../core/git/credentials.ts';
import type { Terminals } from '../../../pty/channel.ts';
import {
    respawnTerminal,
    startTerminal,
    stopTerminal,
    paneOutput,
    type RunOptions
} from '../../../pty/sessions.ts';
import type { StreamTerminalSet } from './stream-terminals.ts';
import type { TerminalsEnv } from './terminals.ts';

/** The byte a terminal reads as an interrupt. */
const ETX = 3;

/** The grid a terminal starts with when nothing asked for one; the page sets its own at attach. */
const COLS = 120;
const ROWS = 30;

/** What the env is made over. */
export type TerminalsEnvOptions = {
    terminals: Terminals;
    streams: StreamTerminalSet;
    /** The tmux options the process runs its terminals with. */
    tmux?: RunOptions;
    /** The user's shell, for a terminal that names none. */
    shell: () => string;
    /** The server context's git credentials, which every terminal started here carries. */
    credentials: GitCredentials;
};

/** The terminals env of a process. */
export function terminalsEnv(options: TerminalsEnvOptions): TerminalsEnv {
    const tmux = options.tmux ?? {};
    const { terminals, streams } = options;
    return {
        streams,
        async start(request) {
            const terminal = await startTerminal(
                {
                    kind: 'app',
                    app: request.app,
                    cwd: request.cwd,
                    cols: request.size?.cols ?? COLS,
                    rows: request.size?.rows ?? ROWS,
                    name: request.name
                },
                {
                    ...tmux,
                    credentials: options.credentials,
                    argv: request.argv,
                    ...(request.job === undefined ? {} : { task: request.job })
                }
            );
            terminals.refresh();
            return terminal;
        },
        list: (): Terminal[] => terminals.list() ?? [],
        onChange: (listener) => terminals.onChange(listener),
        send: (id, bytes) => terminals.type(id, bytes),
        async stop(id) {
            await stopTerminal(id, tmux);
            terminals.refresh();
        },
        interrupt: (id) => terminals.type(id, Buffer.from([ETX])),
        async respawn(id, command, job) {
            await respawnTerminal(id, tmux, command, job);
            terminals.refresh();
        },
        output: (id) => paneOutput(id, tmux),
        shell: options.shell
    };
}
