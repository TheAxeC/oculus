// The terminal records against a real tmux, on a private server.
//
// Every command here carries `-S <socket>` into a directory made by mkdtemp, so the user's own tmux
// server is never listed, never started and never killed; the one this file starts is killed in
// afterAll whether or not an assertion failed, and the directory goes with it. Nothing under
// ~/.claude, ~/.codex, ~/.oculus or the hub is read or written. The pane runs `cat`, so what is
// typed comes back without a shell interpreting anything.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, expect, it, vi } from 'vitest';
import {
    listTerminals,
    resizeTerminal,
    scrollback,
    sendKeysArgs,
    sessionName,
    startTerminal,
    stopTerminal
} from '../../../src/lib/server/pty/sessions.ts';
import { control, run } from '../../../src/lib/server/pty/tmux.ts';

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

const dir = mkdtempSync(join(tmpdir(), 'oculus-tmux-'));
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
            event: () => {},
            exit: () => {}
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
