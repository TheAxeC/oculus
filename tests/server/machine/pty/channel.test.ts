// The pty channels on a real Hub with a recording sink and a recording driver. No tmux runs here:
// the driver records the argument list every channel operation built, which is what makes "the
// input reached send-keys" an assertion rather than a process.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import type { Sink } from '../../../../src/lib/server/core/channels.ts';
import {
    IDLE_POLL_MS,
    POLL_MS,
    Terminals,
    channelTerminal,
    ptyChannel,
    terminalMessage,
    type TerminalDriver
} from '../../../../src/lib/server/machine/pty/channel.ts';
import type { Message } from '../../../../src/lib/data/model/index.ts';
import { run } from '../../../../src/lib/server/machine/pty/tmux.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it, scratchDir, test } from '../../../fixtures/scratch.ts';

const ID = 'a1b2c3-shell';
const CHANNEL = ptyChannel(ID);
const SESSION = `oculus-${ID}`;
const TOKEN = 'a token minted for this test';
const SCREEN = 'the pane as it stands\n';
/** The one-line screen as a page is handed it: no final newline, then the cursor at its start. */
const PLACED = 'the pane as it stands\u001b[1;1H';
const LIST = `${SESSION}\t1757500000\t0\tcat\t4242\t/tmp\ta name\n`;

/** A sink that keeps every message it was sent, in order. */
function recorder(): { sink: Sink; messages: Message[] } {
    const messages: Message[] = [];
    return {
        messages,
        sink: {
            send: (text: string) => {
                messages.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: noop
        }
    };
}

/** A driver that answers the two reads and records every command. */
function driver(): {
    driver: TerminalDriver;
    calls: string[][];
    emit(id: string, bytes: Buffer): void;
    attached(): string[];
    screen(text: string): void;
    cursor(answer: string | Error): void;
    list(answer: string | Error): void;
} {
    const calls: string[][] = [];
    let output: (id: string, bytes: Buffer) => void = noop;
    let ids: string[] = [];
    let screen = SCREEN;
    // The pane the one-line screen above is: one row high, the cursor at its start.
    let cursor: string | Error = '0 0 1\n';
    let list: string | Error = LIST;
    return {
        calls,
        emit: (id, bytes) => output(id, bytes),
        attached: () => ids,
        screen: (text) => (screen = text),
        cursor: (answer) => (cursor = answer),
        list: (answer) => (list = answer),
        driver: {
            run(args: string[]): Promise<string> {
                calls.push(args);
                if (args[0] === 'capture-pane') return Promise.resolve(screen);
                if (args[0] === 'list-sessions') {
                    return list instanceof Error ? Promise.reject(list) : Promise.resolve(list);
                }
                if (args[0] === 'display-message') {
                    return cursor instanceof Error
                        ? Promise.reject(cursor)
                        : Promise.resolve(cursor);
                }
                return Promise.resolve('');
            },
            onOutput(listener): void {
                output = listener;
            },
            onChange: noop,
            attached(next: string[]): void {
                ids = [...next];
            },
            live: () => false,
            close: noop
        }
    };
}

/** Let every promise already queued run; the attach and the input are both asynchronous. */
async function settle(): Promise<void> {
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
}

const open: Terminals[] = [];

afterEach(() => {
    while (open.length > 0) open.pop()?.close();
});

function terminals(record = driver()): { held: Terminals; hub: Hub; driver: typeof record } {
    const hub = new Hub();
    const held = new Terminals(hub, { driver: record.driver, poll: 0 });
    open.push(held);
    return { held, hub, driver: record };
}

function encode(text: string): string {
    return Buffer.from(text, 'utf8').toString('base64');
}

/** One byte as the two lowercase hex digits send-keys -H reads. */
function hex(byte: number): string {
    return byte.toString(16).padStart(2, '0');
}

function decode(message: Message): string {
    const payload = message.payload as { bytes: string };
    return Buffer.from(payload.bytes, 'base64').toString('utf8');
}

describe('the channel name', () => {
    it('answers with the terminal of its own channel and refuses anything else', () => {
        expect(channelTerminal(CHANNEL)).toBe(ID);
        expect(channelTerminal('sessions')).toBeNull();
        expect(channelTerminal('pty:../../etc')).toBeNull();
    });
});

describe('an inbound message', () => {
    it('reads the two shapes the page sends and nothing else', () => {
        expect(
            terminalMessage(JSON.stringify({ type: 'input', channel: CHANNEL, bytes: 'aGk=' }))
        ).toEqual({ type: 'input', channel: CHANNEL, bytes: 'aGk=' });
        expect(
            terminalMessage(
                JSON.stringify({ type: 'resize', channel: CHANNEL, cols: 100, rows: 40 })
            )
        ).toEqual({ type: 'resize', channel: CHANNEL, cols: 100, rows: 40 });
        expect(
            terminalMessage(JSON.stringify({ type: 'subscribe', channels: [CHANNEL] }))
        ).toBeNull();
        expect(
            terminalMessage(JSON.stringify({ type: 'input', channel: 'sessions', bytes: 'x' }))
        ).toBeNull();
        expect(terminalMessage('not json')).toBeNull();
    });
});

describe('a page attached to a terminal', () => {
    it('is sent the scrollback first, then one message per chunk', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        expect(page.messages).toHaveLength(1);
        expect(page.messages[0].channel).toBe(CHANNEL);
        expect(decode(page.messages[0])).toBe(PLACED);
        expect(record.calls.find((args) => args[0] === 'capture-pane')).toEqual([
            'capture-pane',
            '-p',
            '-e',
            '-S',
            '-2000',
            '-t',
            SESSION
        ]);
        expect(record.attached()).toEqual([ID]);

        record.emit(ID, Buffer.from('one'));
        record.emit(ID, Buffer.from('two'));
        await settle();
        expect(page.messages.map((message) => message.version)).toEqual([0, 1, 2]);
        expect(page.messages.slice(1).map(decode)).toEqual(['one', 'two']);
    });

    it('resends scrollback on the same sink without duplicating later chunks', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        record.screen('the pane after the view switch\n');
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();

        expect(page.messages.map((message) => message.version)).toEqual([0, 0]);
        expect(page.messages.map(decode)).toEqual([
            PLACED,
            'the pane after the view switch\u001b[1;1H'
        ]);
        expect(record.calls.filter(([command]) => command === 'capture-pane')).toHaveLength(2);

        record.emit(ID, Buffer.from('after'));
        await settle();
        expect(page.messages.map((message) => message.version)).toEqual([0, 0, 1]);
        expect(decode(page.messages[2])).toBe('after');
    });

    it('sends no chunk to a page that never attached to that terminal', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, ['pty:ffffff-claude'], TOKEN, TOKEN);
        await settle();
        record.emit(ID, Buffer.from('one'));
        await settle();
        expect(page.messages.map((message) => message.channel)).toEqual(['pty:ffffff-claude']);
    });
});

describe('what the page may send back', () => {
    it('turns input from a socket that carried the token into send-keys', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        record.calls.length = 0;
        held.inbound(
            page.sink,
            JSON.stringify({ type: 'input', channel: CHANNEL, bytes: encode('echo hi\r') })
        );
        await settle();
        expect(record.calls).toEqual([
            ['send-keys', '-t', SESSION, '-H', ...[...Buffer.from('echo hi\r')].map(hex)]
        ]);
    });

    it('refuses input from a socket that carried no token', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], undefined, TOKEN);
        await settle();
        record.calls.length = 0;
        held.inbound(
            page.sink,
            JSON.stringify({ type: 'input', channel: CHANNEL, bytes: encode('rm -rf .\r') })
        );
        await settle();
        expect(record.calls).toEqual([]);
    });

    it('refuses input when the server context carries no token', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, '');
        await settle();
        record.calls.length = 0;
        held.inbound(
            page.sink,
            JSON.stringify({ type: 'input', channel: CHANNEL, bytes: encode('x') })
        );
        await settle();
        expect(record.calls).toEqual([]);
    });

    it('forwards a resize to the tmux window', async () => {
        const { held, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        record.calls.length = 0;
        held.inbound(
            page.sink,
            JSON.stringify({ type: 'resize', channel: CHANNEL, cols: 100, rows: 40 })
        );
        await settle();
        expect(record.calls).toEqual([['resize-window', '-t', SESSION, '-x', '100', '-y', '40']]);
    });
});

describe('a page that falls behind', () => {
    it('is sent every byte, joined, rather than the newest chunk alone', async () => {
        const { held, driver: record } = terminals();
        // A sink whose sends are resolved by hand, which is what "behind" is: the Hub holds the
        // next message per channel while one send is in flight.
        const messages: Message[] = [];
        const waiting: (() => void)[] = [];
        const sink: Sink = {
            send: (text: string) => {
                messages.push(JSON.parse(text) as Message);
                return new Promise<void>((resolve) => waiting.push(resolve));
            },
            close: noop
        };
        held.subscribed(sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        expect(messages).toHaveLength(1);

        record.emit(ID, Buffer.from('one '));
        record.emit(ID, Buffer.from('two '));
        record.emit(ID, Buffer.from('three'));
        await settle();
        // Only the first chunk went out; the other two are held behind it.
        expect(messages).toHaveLength(2);
        while (waiting.length > 0) {
            waiting.shift()?.();
            await settle();
        }
        expect(messages.slice(1).map(decode).join('')).toBe('one two three');
    });
});

describe('a socket that closed', () => {
    it('stops the delivery and leaves the tmux session alone', async () => {
        const { held, hub, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        const before = page.messages.length;

        held.remove(page.sink);
        hub.remove(page.sink);
        record.emit(ID, Buffer.from('after the close'));
        await settle();
        expect(page.messages).toHaveLength(before);
        expect(record.attached()).toEqual([]);
        // Nothing was killed: the only commands were the list, the capture and no more.
        expect(record.calls.map((args) => args[0])).toEqual([
            'list-sessions',
            'capture-pane',
            'display-message'
        ]);
    });
});

describe('the list poll', () => {
    it('runs once a minute while nothing is attached and at the fast rate while a page is', async () => {
        const lists = (calls: string[][]): number =>
            calls.filter((args) => args[0] === 'list-sessions').length;
        vi.useFakeTimers();
        try {
            const record = driver();
            const hub = new Hub();
            const held = new Terminals(hub, { driver: record.driver });
            open.push(held);
            await vi.advanceTimersByTimeAsync(0);

            // Nothing is attached: the fast rate passes with no call, the slow one brings one.
            const idle = lists(record.calls);
            await vi.advanceTimersByTimeAsync(POLL_MS);
            expect(lists(record.calls)).toBe(idle);
            await vi.advanceTimersByTimeAsync(IDLE_POLL_MS - POLL_MS);
            expect(lists(record.calls)).toBe(idle + 1);

            const client = recorder();
            held.subscribed(client.sink, [CHANNEL], TOKEN, TOKEN);
            await vi.advanceTimersByTimeAsync(0);
            const attached = lists(record.calls);
            await vi.advanceTimersByTimeAsync(POLL_MS);
            expect(lists(record.calls)).toBe(attached + 1);

            // The page closed: the fast rate is gone with it.
            held.remove(client.sink);
            await vi.advanceTimersByTimeAsync(0);
            const after = lists(record.calls);
            await vi.advanceTimersByTimeAsync(POLL_MS);
            expect(lists(record.calls)).toBe(after);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('the terminal list', () => {
    it('is null until tmux answers, and an empty first answer is a list', async () => {
        const record = driver();
        record.list('');
        const { held } = terminals(record);
        expect(held.list()).toBe(null);
        await settle();
        expect(held.list()).toEqual([]);
    });

    it('stays null when the first list fails for a reason other than no server', async () => {
        const record = driver();
        record.list(new Error('command timed out'));
        const { held } = terminals(record);
        await settle();
        expect(held.list()).toBe(null);
    });

    it('keeps the last list when list-sessions fails for any reason but no server', async () => {
        const record = driver();
        const { held } = terminals(record);
        await settle();
        let moved = 0;
        const off = held.onChange(() => {
            moved += 1;
        });
        record.list(new Error('command timed out'));
        held.refresh();
        await settle();
        expect(held.list()?.map((terminal) => terminal.id)).toEqual([ID]);
        expect(moved).toBe(0);
        off();
    });

    it('is empty when tmux says no server runs, in either of its words', async () => {
        for (const said of [
            'no server running on /private/tmp/tmux-501/default',
            'error connecting to /private/tmp/tmux-501/default (No such file or directory)'
        ]) {
            const record = driver();
            const { held } = terminals(record);
            await settle();
            let moved = 0;
            const off = held.onChange(() => {
                moved += 1;
            });
            record.list(new Error(said));
            held.refresh();
            await settle();
            expect(held.list()).toEqual([]);
            expect(moved).toBe(1);
            off();
        }
    });

    it('is read at construction and tells its listeners when it moved', async () => {
        const { held } = terminals();
        await settle();
        expect(held.list()?.map((terminal) => terminal.id)).toEqual([ID]);
        expect(held.list()?.[0].name).toBe('a name');
        expect(held.list()?.[0].kind).toBe('shell');
        let moved = 0;
        const off = held.onChange(() => {
            moved += 1;
        });
        held.refresh();
        await settle();
        // The same list is not a change.
        expect(moved).toBe(0);
        off();
    });

    it('tells its listeners when a title, an icon or a colour was set', async () => {
        const record = driver();
        const { held } = terminals(record);
        await settle();
        let moved = 0;
        const off = held.onChange(() => {
            moved += 1;
        });
        const line = LIST.trimEnd();
        for (const [at, set] of [
            `\t\tlook`,
            `\t\tlook\tlaunch`,
            `\t\tlook\tlaunch\tred`
        ].entries()) {
            record.list(`${line}${set}\n`);
            held.refresh();
            await settle();
            expect(moved).toBe(at + 1);
        }
        expect(held.list()?.[0]).toMatchObject({ title: 'look', icon: 'launch', color: 'red' });
        off();
    });
});

describe('the screen an attaching page is given', () => {
    const pane = Array.from({ length: 24 }, (_, at) => (at < 3 ? `row ${at}` : '')).join('\n');

    it('is the whole capture, CR LF between its rows, with the cursor where tmux has it', async () => {
        const record = driver();
        record.screen(`${pane}\n`);
        record.cursor('2 2 24\n');
        const { held } = terminals(record);
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
        await settle();
        expect(page.messages).toHaveLength(1);
        // capture-pane separates rows with a bare newline; the scrollback goes out with CR LF so
        // the rows do not step across the grid.
        expect(decode(page.messages[0])).toBe(`${pane.replace(/\n/g, '\r\n')}\u001b[3;3H`);
        expect(record.calls.find((args) => args[0] === 'display-message')).toEqual([
            'display-message',
            '-p',
            '-t',
            SESSION,
            '#{cursor_x} #{cursor_y} #{pane_height}'
        ]);
    });

    it('sends the whole capture, and says so, when the cursor does not parse', async () => {
        const said = vi.spyOn(console, 'error').mockImplementation(noop);
        try {
            const record = driver();
            record.screen(`${pane}\n`);
            record.cursor('not a cursor\n');
            const { held } = terminals(record);
            const page = recorder();
            held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
            await settle();
            expect(decode(page.messages[0])).toBe(`${pane}\n`.replace(/\n/g, '\r\n'));
            expect(said).toHaveBeenCalledTimes(1);
        } finally {
            said.mockRestore();
        }
    });

    it('sends the whole capture, and says so, when the cursor cannot be read', async () => {
        const said = vi.spyOn(console, 'error').mockImplementation(noop);
        try {
            const record = driver();
            record.screen(`${pane}\n`);
            record.cursor(new Error('no such session'));
            const { held } = terminals(record);
            const page = recorder();
            held.subscribed(page.sink, [CHANNEL], TOKEN, TOKEN);
            await settle();
            expect(decode(page.messages[0])).toBe(`${pane}\n`.replace(/\n/g, '\r\n'));
            expect(said.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
                'no such session'
            );
        } finally {
            said.mockRestore();
        }
    });
});

/** Whether tmux answers at all; without it the real-tmux cases are skipped, the reason printed. */
const TMUX = (() => {
    try {
        return spawnSync('tmux', ['-V'], { encoding: 'utf8' }).status === 0;
    } catch {
        return false;
    }
})();

/** Whether python3 runs, which the one-read case's pane is written in. */
const PYTHON = (() => {
    try {
        return spawnSync('python3', ['-c', 'pass'], { encoding: 'utf8' }).status === 0;
    } catch {
        return false;
    }
})();

if (!TMUX) console.error('tests/server/machine/pty/channel.test.ts: real tmux cases skipped');
if (TMUX && !PYTHON) {
    console.error('tests/server/machine/pty/channel.test.ts: one-read case skipped, no python3');
}

// A private tmux server under a scratch directory: its socket is this file's own, so the user's
// server is never listed, started or killed, and afterAll kills this one whether or not a case
// failed.
describe('input through a real tmux', () => {
    let dir = '';
    const tmux = { socket: '' };
    const id = 'd4e5f6-shell';
    let file = '';

    // Made before the first case of this block, so a run that skips it makes nothing.
    test.beforeAll(() => {
        dir = scratchDir('oculus-channel-');
        tmux.socket = join(dir, 'server.sock');
        file = join(dir, 'typed.bin');
    });

    // A socket still unset means the hook that makes it failed, and tmux is never run without
    // this block's own socket.
    test.afterAll(() => {
        if (tmux.socket === '') return;
        spawnSync('tmux', ['-S', tmux.socket, 'kill-server'], { encoding: 'utf8' });
    });

    async function until(has: () => boolean, what: string): Promise<void> {
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
            if (has()) return;
            await new Promise((done) => setTimeout(done, 50));
        }
        throw new Error(`timed out waiting for ${what}`);
    }

    it.skipIf(!TMUX)(
        'reaches a raw-mode pane byte for byte and in order',
        async () => {
            // The pane writes every byte it is given to a file: raw mode, so the line discipline
            // neither edits nor echoes, and the file is created only once raw mode is in force.
            await run(
                [
                    'new-session',
                    '-d',
                    '-s',
                    `oculus-${id}`,
                    '-x',
                    '80',
                    '-y',
                    '24',
                    '--',
                    `stty raw -echo; exec cat > ${file}`
                ],
                tmux
            );
            await until(() => existsSync(file), 'the pane to open its file');
            const held = new Terminals(new Hub(), { tmux, poll: 0 });
            open.push(held);
            const page = recorder();
            held.subscribed(page.sink, [ptyChannel(id)], TOKEN, TOKEN);
            await until(() => page.messages.length > 0, 'the scrollback');

            // Ten bytes, one two-byte character among them, a thousand times over.
            const text = Buffer.from('abcdefgh\u00e9'.repeat(1000));
            expect(text.length).toBe(10000);
            const inputs = [
                Buffer.from('\u001b[<0;20;14M'),
                Buffer.from('\u001b[I'),
                Buffer.from('\u001b[200~pasted\u001b[201~'),
                text
            ];
            for (const bytes of inputs) {
                held.inbound(
                    page.sink,
                    JSON.stringify({
                        type: 'input',
                        channel: ptyChannel(id),
                        bytes: bytes.toString('base64')
                    })
                );
            }
            const expected = Buffer.concat(inputs);
            await until(() => statSync(file).size >= expected.length, 'every byte in the file');
            expect(readFileSync(file).equals(expected)).toBe(true);
        },
        30000
    );

    it.skipIf(!TMUX || !PYTHON)(
        'hands a mouse report to the pane in one read, so no lone Escape reaches it',
        async () => {
            // The pane logs the size of every read(2) it is handed. An agent reads an Escape that
            // arrives alone as the Escape key; one that arrives with the rest of its sequence is
            // the sequence.
            const reads = join(dir, 'reads.txt');
            const logger = [
                'import os, sys, tty',
                'tty.setraw(0)',
                `out = open(${JSON.stringify(reads)}, "w", buffering=1)`,
                'while True:',
                '    chunk = os.read(0, 65536)',
                '    out.write(chunk.hex() + "\\n")'
            ].join('\n');
            const other = 'a7b8c9-shell';
            await run(
                [
                    'new-session',
                    '-d',
                    '-s',
                    `oculus-${other}`,
                    '-x',
                    '80',
                    '-y',
                    '24',
                    '--',
                    'python3',
                    '-c',
                    logger
                ],
                tmux
            );
            await until(() => existsSync(reads), 'the pane to open its log');
            const held = new Terminals(new Hub(), { tmux, poll: 0 });
            open.push(held);
            const page = recorder();
            held.subscribed(page.sink, [ptyChannel(other)], TOKEN, TOKEN);
            await until(() => page.messages.length > 0, 'the scrollback');
            const report = Buffer.from('\u001b[<0;20;14M');
            held.inbound(
                page.sink,
                JSON.stringify({
                    type: 'input',
                    channel: ptyChannel(other),
                    bytes: report.toString('base64')
                })
            );
            const logged = (): string[] =>
                readFileSync(reads, 'utf8')
                    .split('\n')
                    .filter((line) => line !== '');
            await until(
                () => logged().join('').length >= report.length * 2,
                'the report in the log'
            );
            expect(logged()).toEqual([report.toString('hex')]);
        },
        30000
    );
});
