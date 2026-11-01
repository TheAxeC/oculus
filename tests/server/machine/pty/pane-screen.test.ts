// The screen an attaching page is given (src/lib/server/machine/pty/capture.ts, `paneScreen`),
// read from a real tmux on a private server, tagged slow. A line longer than the pane's width,
// which tmux wraps onto two rows, is sent as one line, so the page's grid wraps it and reflows it
// on a resize as tmux does; sent as two lines, a narrower grid wraps the first again and a shell's
// redraw of a prompt holding such a line draws the prompt's first row twice. A pane in its
// alternate screen is read through a control client as well as through `run`, and both reads give
// the same screen, since the channels read a pane through its control client and `run` is their
// fallback.
//
// Every tmux command carries `-S <socket>` into a scratch directory (tmux-server.ts), so the user's
// own tmux server is never listed, started or killed. The wrapped line's pane runs `cat`, and the
// line is typed with no Enter, so the terminal's echo draws it and no shell interprets anything.
// The alternate screen's pane prints its lines from a shell, then `cat` holds it there. Neither
// case covers the page's grid drawing the text, which the look does.

import { describe, expect, vi } from 'vitest';
import { paneScreen } from '../../../../src/lib/server/machine/pty/capture.ts';
import {
    listTerminals,
    sendBytesArgs,
    sessionName,
    startTerminal,
    stopTerminal
} from '../../../../src/lib/server/machine/pty/sessions.ts';
import { control, run } from '../../../../src/lib/server/machine/pty/tmux.ts';
import { noCredentials } from '../../../fixtures/doubles.ts';
import { it } from '../../../fixtures/scratch.ts';
import { privateTmux, tmuxOptions } from './tmux-server.ts';

vi.setConfig({ testTimeout: 30000 });

/** Thirty letters, ten more than the pane is wide. */
const LONG = 'abcdefghijklmnopqrstuvwxyzABCD';

/**
 * Ten lines and a newline in a pane of six rows, which leaves history above the shell's screen and
 * a blank row at its end, then a switch to the alternate screen and one word on it.
 */
const TEN_LINES = Array.from({ length: 10 }, (_, at) => `h${at}\\n`).join('');
const ALTERNATE = `printf '${TEN_LINES}\\033[?1049h\\033[Halt'; exec cat`;

/** What a page's screen holds once the pane has reached its alternate screen. */
const ENTERED = '\u001b[?1049h\u001b[Halt';

describe('a private tmux server', { tags: ['slow'] }, () => {
    const server = privateTmux('oculus-screen-');
    const options = tmuxOptions(server);

    it('sends a line the pane wrapped as one line', async () => {
        const started = await startTerminal(
            { kind: 'shell', cwd: server.dir, cols: 20, rows: 6, name: 'wrapped' },
            { ...options, command: 'cat', credentials: noCredentials() }
        );
        try {
            await vi.waitFor(
                async () =>
                    expect(
                        (await listTerminals(options)).some((one) => one.command === 'cat')
                    ).toBe(true),
                { timeout: 10000 }
            );
            await run(sendBytesArgs(started.id, Buffer.from(LONG)), options);
            const read = (args: string[]): Promise<string> => run(args, options);
            await vi.waitFor(
                async () =>
                    expect(await paneScreen(sessionName(started.id), 50, read)).toContain(LONG),
                { timeout: 10000 }
            );
        } finally {
            await stopTerminal(started.id, options);
        }
    });

    it('gives the same screen through the control client as through tmux', async () => {
        const started = await startTerminal(
            { kind: 'shell', cwd: server.dir, cols: 20, rows: 6, name: 'alternate' },
            { ...options, command: ALTERNATE, credentials: noCredentials() }
        );
        const session = sessionName(started.id);
        const client = control(
            session,
            { output: () => undefined, event: () => undefined, exit: () => undefined },
            options
        );
        try {
            expect(await client.ready()).toBe(true);
            const byRun = (args: string[]): Promise<string> => run(args, options);
            await vi.waitFor(
                async () => expect(await paneScreen(session, 50, byRun)).toContain(ENTERED),
                { timeout: 10000 }
            );
            const screen = await paneScreen(session, 50, byRun);
            const byClient = (args: string[]): Promise<string> => client.command(args);
            expect(await paneScreen(session, 50, byClient)).toBe(screen);
        } finally {
            client.close();
            await stopTerminal(started.id, options);
        }
    });
});
