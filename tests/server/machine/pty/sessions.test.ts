// The terminal records against a real tmux, on a private server.
//
// Every command here carries `-S <socket>` into a directory made by mkdtemp, so the user's own tmux
// server is never listed, never started and never killed; the one this file starts is killed in
// afterAll whether or not an assertion failed, and the directory goes with it. Nothing under
// ~/.claude, ~/.codex, ~/.oculus or the hub is read or written. The pane runs `cat`, so what is
// typed comes back without a shell interpreting anything.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    isSessionId,
    listTerminals,
    parseTerminal,
    resizeArgs,
    resizeTerminal,
    resumeArgs,
    resumeOption,
    screenAt,
    scrollback,
    sendBytesArgs,
    sessionName,
    steerArgs,
    steerTerminal,
    interruptTerminal,
    cursorArgs,
    startArgs,
    startTerminal,
    stopTerminal
} from '../../../../src/lib/server/machine/pty/sessions.ts';
import {
    control,
    inputChunks,
    INPUT_MOST,
    run
} from '../../../../src/lib/server/machine/pty/tmux.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it, scratchDir, test } from '../../../fixtures/scratch.ts';

vi.setConfig({ testTimeout: 30000 });

/** Whether tmux answers at all; without it the whole file is skipped with the reason printed. */
const TMUX = (() => {
    try {
        return spawnSync('tmux', ['-V'], { encoding: 'utf8' }).status === 0;
    } catch {
        return false;
    }
})();

if (!TMUX)
    console.error('tests/server/machine/pty/sessions.test.ts: skipped, tmux is not on the PATH');

// The directory of the socket is made before the file's first case, so a run that skips every case
// makes none.
let dir = '';
const options = { socket: '' };

test.beforeAll(() => {
    dir = scratchDir('oculus-tmux-');
    options.socket = join(dir, 'server.sock');
});

// A line with a dash at its start, a dollar, a double quote and a backslash: everything the quoting
// and the `--` of send-keys have to survive. tmux expands $name inside double quotes, so HOME here
// is the case that says the escaping works.
const TYPED = '-x "$HOME" a\\b';
const STEERED = '-y "$HOME" steered';

// A socket still unset means the hook that makes it failed: no server was started, and tmux is
// never run without this file's own socket.
test.afterAll(() => {
    if (options.socket === '') return;
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
        // The line goes the way a page's typing goes: its bytes, in pieces, through send-keys -H.
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

it.skipIf(!TMUX)('lists what it started from a process whose locale is not UTF-8', async () => {
    for (const name of ['LC_ALL', 'LC_CTYPE', 'LANG']) vi.stubEnv(name, 'C');
    try {
        const started = await startTerminal(
            { kind: 'shell', cwd: dir, cols: 80, rows: 24, name: 'a plain locale' },
            { ...options, command: 'cat' }
        );
        const listed = await listTerminals(options);
        expect(listed.find((one) => one.id === started.id)?.name).toBe('a plain locale');
        await stopTerminal(started.id, options);
    } finally {
        vi.unstubAllEnvs();
    }
});

it.skipIf(!TMUX)('runs a line typed as bytes into a shell', async () => {
    const started = await startTerminal(
        { kind: 'shell', cwd: dir, cols: 80, rows: 24 },
        { ...options, command: 'sh' }
    );
    const seen: Buffer[] = [];
    const client = control(
        sessionName(started.id),
        { output: (_pane, bytes) => seen.push(bytes), event: noop, exit: noop },
        options
    );
    try {
        const pieces = inputChunks(Buffer.from('ls -la\r'));
        expect(pieces).toHaveLength(1);
        for (const piece of pieces) await run(sendBytesArgs(started.id, piece), options);
        // The socket file sits in the directory the shell started in, so a listing that ran
        // names it; a line typed but not run would not.
        await until(
            () => Buffer.concat(seen).toString('utf8').includes('server.sock'),
            'the listing to name the socket'
        );
    } finally {
        client.close();
        await stopTerminal(started.id, options);
    }
});

it.skipIf(!TMUX)(
    'takes a piece of the most bytes in one command, and refuses one more',
    async () => {
        const started = await startTerminal(
            { kind: 'shell', cwd: dir, cols: 80, rows: 24 },
            { ...options, command: 'cat' }
        );
        try {
            const most = Buffer.from('a'.repeat(INPUT_MOST));
            await run(sendBytesArgs(started.id, most), options);
            await expect(
                run(sendBytesArgs(started.id, Buffer.concat([most, Buffer.from('a')])), options)
            ).rejects.toThrow('command too long');
        } finally {
            await stopTerminal(started.id, options);
        }
    }
);

it.skipIf(!TMUX)('types a 20000-character steer into a pane whole, then Enter', async () => {
    // The pane writes every byte it is given to a file: raw mode, so nothing is edited or echoed,
    // and the file is made only once raw mode is in force.
    const file = join(dir, 'steered.bin');
    const started = await startTerminal(
        { kind: 'claude', cwd: dir, cols: 80, rows: 24 },
        { ...options, command: `stty raw -echo; exec cat > ${file}` }
    );
    try {
        await until(() => existsSync(file), 'the pane to open its file');
        const text = `${'a'.repeat(9999)}\n${'b'.repeat(10000)}`;
        await steerTerminal(started.id, text, options);
        await until(() => statSync(file).size >= 20001, 'the steer and its Enter in the file');
        expect(readFileSync(file, 'utf8')).toBe(`${text}\r`);
    } finally {
        await stopTerminal(started.id, options);
    }
});

describe('the input arguments', () => {
    it('sends bytes as two lowercase hex digits each', () => {
        expect(sendBytesArgs('t1', Buffer.from('\u001b[I'))).toEqual([
            'send-keys',
            '-t',
            sessionName('t1'),
            '-H',
            '1b',
            '5b',
            '49'
        ]);
        expect(sendBytesArgs('t1', Buffer.from([0xc3, 0xa9, 0x0a]))).toEqual([
            'send-keys',
            '-t',
            sessionName('t1'),
            '-H',
            'c3',
            'a9',
            '0a'
        ]);
    });

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

    it('types a steer of any length it accepts in commands tmux takes, a line break as its byte', () => {
        const text = `${'a'.repeat(9999)}\n${'b'.repeat(10000)}`;
        expect(text.length).toBe(20000);
        const calls = steerArgs('a1b2c3-claude', text);
        const typed = calls.slice(0, -1);
        expect(typed).toHaveLength(Math.ceil(20000 / INPUT_MOST));
        for (const args of typed) {
            expect(args.slice(0, 4)).toEqual([
                'send-keys',
                '-t',
                sessionName('a1b2c3-claude'),
                '-H'
            ]);
            expect(args.length - 4).toBeLessThanOrEqual(INPUT_MOST);
        }
        const bytes = typed.flatMap((args) => args.slice(4));
        expect(bytes).toHaveLength(20000);
        expect(bytes[9999]).toBe('0a');
        expect(calls.at(-1)).toEqual([
            'send-keys',
            '-t',
            sessionName('a1b2c3-claude'),
            '--',
            'Enter'
        ]);
    });
});

/**
 * The row xterm's cursor is on after writing a screen into an empty grid of this many rows: a line
 * feed moves it down one row until the last, where a line feed scrolls instead, and a cursor
 * position sequence puts it on the row it names.
 */
function rowAfter(screen: string, height: number): number {
    let row = 0;
    // eslint-disable-next-line no-control-regex
    for (const found of screen.matchAll(/\n|\u001b\[(\d+)(?:;\d+)?H/g)) {
        row = found[0] === '\n' ? Math.min(row + 1, height - 1) : Number(found[1]) - 1;
    }
    return row;
}

describe('the screen an attaching page is given', () => {
    const rows = (count: number, written: number): string =>
        Array.from({ length: count }, (_, at) => (at < written ? `row ${at}` : '')).join('\n') +
        '\n';

    it('reads the cursor with display-message', () => {
        expect(cursorArgs('a1b2c3-shell')).toEqual([
            'display-message',
            '-p',
            '-t',
            sessionName('a1b2c3-shell'),
            '#{cursor_x} #{cursor_y} #{pane_height}'
        ]);
    });

    it('keeps a new shell whole and puts the cursor on its row and column', () => {
        const capture = rows(24, 3);
        const screen = screenAt(capture, '2 2 24\n');
        expect(screen).toBe(`${capture.slice(0, -1)}\u001b[3;3H`);
        expect(rowAfter(screen, 24)).toBe(2);
    });

    it('keeps every line of a pane whose cursor is on its last row', () => {
        const capture = rows(30, 30);
        expect(screenAt(capture, '0 23 24\n')).toBe(`${capture.slice(0, -1)}\u001b[24;1H`);
    });

    it('hands the capture back unchanged when the cursor does not parse', () => {
        const capture = rows(24, 3);
        expect(screenAt(capture, 'not a cursor')).toBe(capture);
        expect(screenAt(capture, '')).toBe(capture);
        // A row outside the pane is not a place the cursor can be.
        expect(screenAt(capture, '0 24 24')).toBe(capture);
    });

    // A pane with history and its cursor above its last row: a private server printed `8 20 24 20`
    // for a 44-line capture whose last three rows sit below the cursor, the shape a full-screen
    // prompt with a footer has.
    it('puts the cursor of the page on the row of tmux when the pane has history above it', () => {
        const capture = rows(44, 44);
        const screen = screenAt(capture, '8 20 24\n');
        expect(screen).toBe(`${capture.slice(0, -1)}\u001b[21;9H`);
        expect(rowAfter(screen, 24)).toBe(20);
        // The three rows under the cursor are part of the screen and are kept.
        expect(screen).toContain('row 43');
    });
});
