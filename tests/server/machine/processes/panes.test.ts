// The panes of oculus's tmux sessions as the Processes view reads them: the one list-panes call and
// the lines it answers parsed into the pane process of every terminal and of every hidden usage
// session. The tmux call is injected, so no tmux server is started or read.

import { describe, expect, it } from 'vitest';
import { listPanes } from '../../../../src/lib/server/machine/pty/sessions.ts';

/** The panes of the lines tmux would answer for the list-panes call. */
function panesOf(text: string): Promise<Awaited<ReturnType<typeof listPanes>>> {
    return listPanes({ run: () => Promise.resolve(text) });
}

describe('the lines of the pane list', () => {
    it('reads the pane of a terminal session with its terminal id', async () => {
        expect(await panesOf('oculus-a1b2c3-shell 100\n')).toEqual([
            { session: 'oculus-a1b2c3-shell', terminal: 'a1b2c3-shell', usage: false, pid: 100 }
        ]);
    });

    it('reads every pane of one session, each with the terminal id', async () => {
        const text = 'oculus-a1b2c3-shell 100\noculus-a1b2c3-shell 110\noculus-d4e5f6-claude 200\n';
        expect((await panesOf(text)).map((pane) => [pane.terminal, pane.pid])).toEqual([
            ['a1b2c3-shell', 100],
            ['a1b2c3-shell', 110],
            ['d4e5f6-claude', 200]
        ]);
    });

    it('marks a hidden usage session as usage and gives it no terminal', async () => {
        expect(await panesOf('oculus-usage-x 400\n')).toEqual([
            { session: 'oculus-usage-x', terminal: null, usage: true, pid: 400 }
        ]);
    });

    it('leaves out a session that carries the prefix but no terminal id, and a session that is not oculus', async () => {
        expect(await panesOf('oculus-hand 500\nwork 600\noculus- 700\n')).toEqual([]);
    });

    it.each([
        ['no pid', 'oculus-a1b2c3-shell'],
        ['a pid that is not a number', 'oculus-a1b2c3-shell abc'],
        ['a pid of zero', 'oculus-a1b2c3-shell 0'],
        ['a negative pid', 'oculus-a1b2c3-shell -4'],
        ['a fractional pid', 'oculus-a1b2c3-shell 1.5']
    ])('leaves out a line with %s', async (_name, line) => {
        const panes = await panesOf(`${line}\noculus-d4e5f6-codex 9\n`);
        expect(panes.map((pane) => pane.pid)).toEqual([9]);
    });

    it('reads nothing from an empty answer', async () => {
        expect(await panesOf('')).toEqual([]);
    });
});

describe('listPanes', () => {
    it('lists the panes of every session with the session name and the pane pid, and parses the answer', async () => {
        const calls: string[][] = [];
        const panes = await listPanes({
            run: (args) => {
                calls.push(args);
                return Promise.resolve('oculus-a1b2c3-shell 100\n');
            }
        });
        expect(calls).toEqual([['list-panes', '-a', '-F', '#{session_name} #{pane_pid}']]);
        expect(panes.map((pane) => pane.pid)).toEqual([100]);
    });

    it('answers no panes when tmux fails, as listTerminals answers no terminals', async () => {
        const panes = await listPanes({ run: () => Promise.reject(new Error('no server')) });
        expect(panes).toEqual([]);
    });
});
