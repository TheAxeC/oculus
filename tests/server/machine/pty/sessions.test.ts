// The terminal records (src/lib/server/machine/pty/sessions.ts): the arguments and list lines it
// builds and reads, which need no tmux, and the records against a real tmux on a private server in
// the last describe, which is tagged slow.
//
// Every tmux command there carries `-S <socket>` into a directory made by mkdtemp, so the user's
// own tmux server is never listed, never started and never killed; the one this file starts is
// killed in afterAll whether or not an assertion failed, and the directory goes with it. Nothing
// under ~/.claude, ~/.codex, ~/.oculus or the hub is read or written. The pane runs `cat`, so what
// is typed comes back without a shell interpreting anything.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    listTerminals,
    resizeArgs,
    resizeTerminal,
    resumeArgs,
    scrollback,
    sendBytesArgs,
    sessionName,
    steerArgs,
    interruptTerminal,
    startArgs,
    startTerminal,
    stopTerminal
} from '../../../../src/lib/server/machine/pty/sessions.ts';
import { control, inputChunks, run } from '../../../../src/lib/server/machine/pty/tmux.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { privateTmux, tmuxOptions } from './tmux-server.ts';

vi.setConfig({ testTimeout: 30000 });

// A line with a dash at its start, a dollar, a double quote and a backslash: everything the quoting
// and the `--` of send-keys have to survive. tmux expands $name inside double quotes, so HOME here
// is the case that says the escaping works.
const TYPED = '-x "$HOME" a\\b';
const STEERED = '-y "$HOME" steered';

/** Wait until the collected output holds the text, or fail by timing out. */
async function until(has: () => boolean | Promise<boolean>, what: string): Promise<void> {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        if (await has()) return;
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`timed out waiting for ${what}`);
}

it('refuses a cwd that is not an absolute existing directory', async () => {
    // No call reaches tmux: the request is refused before it is built.
    const none = { run: () => Promise.reject(new Error('no tmux call is made')) };
    const dir = scratchDir('oculus-tmux-refuse-');
    await expect(
        startTerminal({ kind: 'shell', cwd: 'relative', cols: 80, rows: 24 }, none)
    ).rejects.toThrow('cwd must be an absolute path');
    await expect(
        startTerminal({ kind: 'shell', cwd: join(dir, 'nothing'), cols: 80, rows: 24 }, none)
    ).rejects.toThrow('cwd does not exist');
    await expect(
        startTerminal({ kind: 'shell', cwd: dir, cols: 0, rows: 24 }, none)
    ).rejects.toThrow('cols must be a whole number');
    await expect(stopTerminal('../elsewhere', none)).rejects.toThrow('not a terminal id');
});

// The resume commands as pure functions: no tmux and no agent runs here, which is why these are
// not skipped with the rest of the file when tmux is missing.

it('starts a resumed terminal in the session directory, with the resume as its command', () => {
    const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
    const request = { kind: 'claude' as const, cwd: '/ws/alpha', cols: 100, rows: 30 };
    const args = startArgs('a1b2c3-claude', request, resumeArgs({ tool: 'claude', id }).join(' '));
    expect(args[args.indexOf('-c') + 1]).toBe('/ws/alpha');
    expect(args[args.length - 1]).toBe(`claude --resume ${id}`);
    // The tmux session name carries the terminal id and nothing more, which is what isTerminalId
    // guards on every stop, resize and channel; what it resumes lives in the user option instead.
    expect(args[args.indexOf('-s') + 1]).toBe('oculus-a1b2c3-claude');
    expect(resizeArgs('a1b2c3-claude', 10, 20)[2]).toBe('oculus-a1b2c3-claude');
});

describe('the input arguments', () => {
    it('steers with the text as bytes, then Enter, and interrupts with Escape', async () => {
        const session = sessionName('a1b2c3-claude');
        expect(steerArgs('a1b2c3-claude', 'go on')).toEqual([
            ['send-keys', '-t', session, '-H', '67', '6f', '20', '6f', '6e'],
            ['send-keys', '-t', session, '--', 'Enter']
        ]);
        const calls: string[][] = [];
        await interruptTerminal('a1b2c3-claude', {
            run: (args: string[]) => {
                calls.push(args);
                return Promise.resolve('');
            }
        });
        expect(calls).toEqual([['send-keys', '-t', session, '--', 'Escape']]);
    });
});

// Every case below starts a tmux server on a private socket of its own, so the hooks that make and
// kill it sit inside this describe and the tagged-out run never starts one.
describe('a private tmux server', { tags: ['slow'] }, () => {
    const server = privateTmux('oculus-tmux-');
    const options = tmuxOptions(server);

    it('starts, lists, feeds, resizes, captures and stops a terminal', async () => {
        const started = await startTerminal(
            { kind: 'shell', cwd: server.dir, cols: 80, rows: 24, name: 'a named terminal' },
            { ...options, command: 'cat' }
        );
        expect(started.kind).toBe('shell');
        expect(started.name).toBe('a named terminal');
        expect(started.id.endsWith('-shell')).toBe(true);
        expect(started.pid).toBeGreaterThan(0);
        expect(new Date(started.created).getTime()).toBeGreaterThan(0);

        const listed = await listTerminals(options);
        expect(listed.map((terminal) => terminal.id)).toEqual([started.id]);
        expect(listed[0].command).toBe('cat');
        // macOS puts the temporary directory behind a symlink, and tmux reports the real one.
        expect(listed[0].cwd).toBe(realpathSync(server.dir));
        expect(listed[0].attached).toBe(false);

        // The control client is how the page reads the pane: one client sees every session's
        // output.
        const seen: Buffer[] = [];
        const client = control(
            sessionName(started.id),
            {
                output: (_pane, bytes) => seen.push(bytes),
                event: noop,
                exit: noop
            },
            options
        );
        const text = (): string => Buffer.concat(seen).toString('utf8');
        try {
            // The line goes the way a page's typing goes: its bytes, in pieces, through send-keys
            // -H.
            for (const piece of inputChunks(Buffer.from(`${TYPED}\r`))) {
                await run(sendBytesArgs(started.id, piece), options);
            }
            await until(() => text().includes(TYPED), 'the typed line to come back as output');
            // cat writes the line back, so the characters survived exactly as typed.
            expect(text()).toContain(TYPED);
            // A steer types its text as bytes, so a line beginning with a dash reaches the pane as
            // text and never as flags.
            for (const args of steerArgs(started.id, STEERED)) await run(args, options);
            await until(() => text().includes(STEERED), 'the steered line');

            const screen = await scrollback(started.id, 50, options);
            expect(screen).toContain(TYPED);
        } finally {
            client.close();
        }

        await resizeTerminal(started.id, 100, 40, options);
        const size = await run(
            [
                'display-message',
                '-p',
                '-t',
                sessionName(started.id),
                '#{window_width}x#{window_height}'
            ],
            options
        );
        expect(size.trim()).toBe('100x40');

        await stopTerminal(started.id, options);
        expect(await listTerminals(options)).toEqual([]);
    });

    // The server of a second private socket of its own, killed at the end of the case.
});
