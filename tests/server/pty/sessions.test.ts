// The terminal records against a real tmux, on a private server.
//
// Every command here carries `-S <socket>` into a directory made by mkdtemp, so the user's own tmux
// server is never listed, never started and never killed; the one this file starts is killed in
// afterAll whether or not an assertion failed, and the directory goes with it. Nothing under
// ~/.claude, ~/.codex, ~/.oculus or the hub is read or written. The pane runs `cat`, so what is
// typed comes back without a shell interpreting anything.

import { spawnSync } from 'node:child_process';
import { realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, expect, it, vi } from 'vitest';
import {
    isSessionId,
    listTerminals,
    parseTerminal,
    resizeArgs,
    resizeTerminal,
    resumeArgs,
    resumeOption,
    scrollback,
    sendKeysArgs,
    sessionName,
    startArgs,
    startTerminal,
    stopTerminal
} from '../../../src/lib/server/pty/sessions.ts';
import { control, run } from '../../../src/lib/server/pty/tmux.ts';
import { noop } from '../../doubles.ts';
import { scratchDir, sweepScratch } from '../../scratch.ts';

afterAll(sweepScratch);

vi.setConfig({ testTimeout: 30000 });

/** Whether tmux answers at all; without it the whole file is skipped with the reason printed. */
const TMUX = (() => {
    try {
        return spawnSync('tmux', ['-V'], { encoding: 'utf8' }).status === 0;
    } catch {
        return false;
    }
})();

if (!TMUX) console.error('tests/server/pty/sessions.test.ts: skipped, tmux is not on the PATH');

const dir = scratchDir('oculus-tmux-');
expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
const options = { socket: join(dir, 'server.sock') };

// A line with a dash at its start, a dollar, a double quote and a backslash: everything the quoting
// and the `--` of send-keys have to survive. tmux expands $name inside double quotes, so HOME here
// is the case that says the escaping works.
const TYPED = '-x "$HOME" a\\b';

afterAll(() => {
    try {
        spawnSync('tmux', ['-S', options.socket, 'kill-server'], { encoding: 'utf8' });
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

/** Wait until the collected output holds the text, or fail by timing out. */
async function until(has: () => boolean, what: string): Promise<void> {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        if (has()) return;
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`timed out waiting for ${what}`);
}

it.skipIf(!TMUX)('starts, lists, feeds, resizes, captures and stops a terminal', async () => {
    const started = await startTerminal(
        { kind: 'shell', cwd: dir, cols: 80, rows: 24, name: 'a named terminal' },
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
    expect(listed[0].cwd).toBe(realpathSync(dir));
    expect(listed[0].attached).toBe(false);

    // The control client is how the page reads the pane: one client sees every session's output.
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
        await run(sendKeysArgs(started.id, { literal: TYPED }), options);
        await run(sendKeysArgs(started.id, { key: 'Enter' }), options);
        await until(() => text().includes(TYPED), 'the typed line to come back as output');
        // cat writes the line back, so the characters survived the quoting exactly as typed.
        expect(text()).toContain(TYPED);

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

it.skipIf(!TMUX)('refuses a cwd that is not an absolute existing directory', async () => {
    await expect(
        startTerminal({ kind: 'shell', cwd: 'relative', cols: 80, rows: 24 }, options)
    ).rejects.toThrow('cwd must be an absolute path');
    await expect(
        startTerminal({ kind: 'shell', cwd: join(dir, 'nothing'), cols: 80, rows: 24 }, options)
    ).rejects.toThrow('cwd does not exist');
    await expect(
        startTerminal({ kind: 'shell', cwd: dir, cols: 0, rows: 24 }, options)
    ).rejects.toThrow('cols must be a whole number');
    await expect(stopTerminal('../elsewhere', options)).rejects.toThrow('not a terminal id');
});

// The resume commands as pure functions: no tmux and no agent runs here, which is why these are
// not skipped with the rest of the file when tmux is missing. What the two commands are is checked
// against what `claude --help` and `codex resume --help` document, and the option a resumed
// terminal carries is checked by reading a list line back.

it('builds the resume command of each tool, and refuses an id of any other shape', () => {
    const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
    expect(resumeArgs({ tool: 'claude', id })).toEqual(['claude', '--resume', id]);
    expect(resumeArgs({ tool: 'codex', id })).toEqual(['codex', 'resume', id]);
    expect(isSessionId(id)).toBe(true);
    expect(isSessionId('a1b2c3-claude')).toBe(false);
    expect(isSessionId('2026/09/11/rollout-1')).toBe(false);
    expect(isSessionId(null)).toBe(false);
    expect(() => resumeArgs({ tool: 'claude', id: 'not-a-uuid' })).toThrow('not a session id');
    expect(() => resumeArgs({ tool: 'claude', id: `${id}; rm -rf /` })).toThrow('not a session id');
});

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

it('reads @oculus_resumes back out of a list line, and nothing out of a bad one', () => {
    const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
    const fields = [
        'oculus-a1b2c3-claude',
        '1757500000',
        '0',
        'claude',
        '4242',
        '/ws/alpha',
        'A run',
        resumeOption({ tool: 'claude', id })
    ];
    const terminal = parseTerminal(fields.join('\t'));
    expect(terminal?.name).toBe('A run');
    expect(terminal?.resumes).toEqual({ tool: 'claude', id });

    // A terminal that continues nothing has the option unset, which tmux expands to nothing.
    fields[7] = '';
    expect(parseTerminal(fields.join('\t'))?.resumes).toBe(null);
    // Neither a tool that is not an agent nor an id of the wrong shape reads as a resume.
    fields[7] = `shell:${id}`;
    expect(parseTerminal(fields.join('\t'))?.resumes).toBe(null);
    fields[7] = 'claude:not-a-uuid';
    expect(parseTerminal(fields.join('\t'))?.resumes).toBe(null);
});

it('lists a hand-made session under the prefix and flags it as one oculus did not mint', () => {
    const fields = ['oculus-scratch', '1757500000', '0', 'zsh', '4242', '/ws', '', ''];
    const terminal = parseTerminal(fields.join('\t'));
    expect(terminal?.id).toBe('scratch');
    expect(terminal?.foreign).toBe(true);

    fields[0] = 'oculus-a1b2c3-shell';
    expect(parseTerminal(fields.join('\t'))?.foreign).toBe(false);
});

it('leaves hidden usage refresher sessions out of the terminal list', () => {
    const fields = [
        'oculus-usage-.claude-work',
        '1757500000',
        '0',
        'claude',
        '4242',
        '/ws',
        '',
        ''
    ];
    expect(parseTerminal(fields.join('\t'))).toBe(null);
});
