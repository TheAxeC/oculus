// The screen an attaching page is given (src/lib/server/machine/pty/capture.ts, `paneScreen`),
// read from a real tmux on a private server, tagged slow. A line longer than the pane's width,
// which tmux wraps onto two rows, is sent as one line, so the page's grid wraps it and reflows it
// on a resize as tmux does; sent as two lines, a narrower grid wraps the first again and a shell's
// redraw of a prompt holding such a line draws the prompt's first row twice.
//
// Every tmux command carries `-S <socket>` into a scratch directory (tmux-server.ts), so the user's
// own tmux server is never listed, started or killed. The pane runs `cat`, and the line is typed
// with no Enter, so the terminal's echo draws it and no shell interprets anything. It does not
// cover the page's grid drawing the line, which the look does.

import { describe, expect, vi } from 'vitest';
import { paneScreen } from '../../../../src/lib/server/machine/pty/capture.ts';
import {
    listTerminals,
    sendBytesArgs,
    sessionName,
    startTerminal,
    stopTerminal
} from '../../../../src/lib/server/machine/pty/sessions.ts';
import { run } from '../../../../src/lib/server/machine/pty/tmux.ts';
import { it } from '../../../fixtures/scratch.ts';
import { privateTmux, tmuxOptions } from './tmux-server.ts';

vi.setConfig({ testTimeout: 30000 });

/** Thirty letters, ten more than the pane is wide. */
const LONG = 'abcdefghijklmnopqrstuvwxyzABCD';

describe('a private tmux server', { tags: ['slow'] }, () => {
    const server = privateTmux('oculus-screen-');
    const options = tmuxOptions(server);

    it('sends a line the pane wrapped as one line', async () => {
        const started = await startTerminal(
            { kind: 'shell', cwd: server.dir, cols: 20, rows: 6, name: 'wrapped' },
            { ...options, command: 'cat' }
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
});
