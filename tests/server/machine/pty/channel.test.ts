// The pty channels on a real Hub with a recording sink and a recording driver. No tmux runs: the
// driver records the argument list every channel operation built, which is what makes "the input
// reached send-keys" an assertion rather than a process.

import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, vi } from 'vitest';
import { WebSocket } from 'ws';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { attachSocket } from '../../../../src/lib/server/root/socket.ts';
import type { Sink } from '../../../../src/lib/server/core/channels.ts';
import {
    Terminals,
    ptyChannel,
    type TerminalDriver
} from '../../../../src/lib/server/machine/pty/channel.ts';
import { StreamHub } from '../../../../src/lib/server/machine/apps/tools/streams.ts';
import { StreamTerminalSet } from '../../../../src/lib/server/machine/apps/tools/run/stream-terminals.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { Message } from '../../../../src/lib/data/model/index.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it } from '../../../fixtures/scratch.ts';

const ID = 'a1b2c3-shell';
const CHANNEL = ptyChannel(ID);
const SESSION = `oculus-${ID}`;
const TOKEN = 'a token minted for this test';
const SCREEN = 'the pane as it stands\n';
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

/** The `display-message` answer of a pane one row high with the cursor at its start. */
const ONE_ROW = '0 0 1\n';

/** The value each flag of the `display-message` format holds in a pane no program has touched. */
const FLAGS_AT_RESET: Record<string, string> = { wrap_flag: '1', cursor_flag: '1' };

/**
 * The answer tmux gives to a `display-message` format: each `#{name}` of it replaced by its value
 * in `values`, else by the reset value of a flag, so the answer fits the format whatever fields it
 * holds.
 */
function answerWith(format: string, values: Record<string, string>): string {
    const known = { ...FLAGS_AT_RESET, ...values };
    return format.replace(/#\{(\w+)\}/g, (_, name: string) => known[name] ?? '0') + '\n';
}

/** The text of every `capture-pane` a driver is asked for; the one arguments' list tells which. */
type Captures = (args: string[]) => string;

/** A driver that answers the reads and records every command. */
function driver(
    options: { values?: Record<string, string>; captures?: Captures; alternateAfter?: string } = {}
): {
    driver: TerminalDriver;
    calls: string[][];
    emit(id: string, bytes: Buffer): void;
    attached(): string[];
} {
    const calls: string[][] = [];
    let output: (id: string, bytes: Buffer) => void = noop;
    let ids: string[] = [];
    const captures = options.captures ?? (() => SCREEN);
    // The pane a case gives answers the format it is asked; else the one-row pane of the screen
    // above answers.
    const cursor = (format: string): string =>
        options.values === undefined ? ONE_ROW : answerWith(format, options.values);
    const list = LIST;
    const controlled = false;
    return {
        calls,
        emit: (id, bytes) => output(id, bytes),
        attached: () => ids,
        driver: {
            // A read of the pane is answered as a tmux process would answer it, and its reply's
            // place in the output is the moment the answer is given.
            read(_id: string, args: string[], replied: () => void): Promise<string> {
                return this.run(args).then((text) => {
                    replied();
                    return text;
                });
            },
            run(args: string[]): Promise<string> {
                calls.push(args);
                if (args[0] === 'capture-pane') return Promise.resolve(captures(args));
                if (args[0] === 'list-sessions') {
                    return Promise.resolve(list);
                }
                if (args[0] === 'display-message') {
                    // The read of `#{alternate_on}` alone is the one made after the alternate
                    // screen.
                    const asked = args.at(-1) === '#{alternate_on}';
                    return Promise.resolve(
                        asked ? (options.alternateAfter ?? '1\n') : cursor(args.at(-1) ?? '')
                    );
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
            live: () => controlled,
            serverRuns: () => Promise.resolve(false),
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

/** A real socket server over `held`, which records whether each message was let write. */
async function socketOver(
    held: Terminals,
    hub: Hub
): Promise<{ port: number; writable: boolean[] }> {
    const server: Server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const writable: boolean[] = [];
    let canWrite: (sink: Sink) => boolean = () => false;
    const attached = attachSocket(server, hub, {
        path: '/ws',
        token: TOKEN,
        terminals: {
            gate: (given) => {
                canWrite = given;
                held.gate(given);
            },
            subscribed: (sink, channels) => held.subscribed(sink, channels),
            inbound: (sink, data) => {
                if (data.includes('"input"')) writable.push(canWrite(sink));
                return held.inbound(sink, data);
            },
            remove: (sink) => held.remove(sink)
        }
    });
    closers.push(() => {
        attached.close();
        server.close();
    });
    return { port: (server.address() as AddressInfo).port, writable };
}

const closers: (() => void)[] = [];
const clients: WebSocket[] = [];

afterEach(() => {
    while (clients.length > 0) clients.pop()?.close();
    while (closers.length > 0) closers.pop()?.();
});

/** A page's socket: its subscribe message, sent once the socket is open. */
async function pageOn(port: number, subscribe: object): Promise<WebSocket> {
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
        headers: { origin: `http://127.0.0.1:${port}` }
    });
    clients.push(client);
    await new Promise((resolve) => client.once('open', resolve));
    client.send(JSON.stringify(subscribe));
    return client;
}

describe('what the page may send back', () => {
    it('refuses input from a socket that carried no token', async () => {
        const { held, hub, driver: record } = terminals();
        const { port, writable } = await socketOver(held, hub);
        const client = await pageOn(port, { type: 'subscribe', channels: [CHANNEL] });
        await vi.waitFor(() => expect(record.attached()).toEqual([ID]));
        await settle();
        record.calls.length = 0;
        client.send(
            JSON.stringify({ type: 'input', channel: CHANNEL, bytes: encode('rm -rf .\r') })
        );
        await vi.waitFor(() => expect(writable).toEqual([false]));
        await settle();
        expect(record.calls).toEqual([]);
    });
});

describe('a page that resizes before it attaches', () => {
    it('resizes the terminal and reads its pane after the resize', async () => {
        const { held, hub, driver: record } = terminals();
        const { port } = await socketOver(held, hub);
        const client = await pageOn(port, { type: 'subscribe', channels: [], token: TOKEN });
        await settle();
        record.calls.length = 0;
        client.send(JSON.stringify({ type: 'resize', channel: CHANNEL, cols: 120, rows: 40 }));
        client.send(JSON.stringify({ type: 'subscribe', channels: [CHANNEL], token: TOKEN }));
        await vi.waitFor(() => expect(record.calls).toHaveLength(3));
        expect(record.calls.map((args) => args[0])).toEqual([
            'resize-window',
            'capture-pane',
            'display-message'
        ]);
    });

    it('sizes nothing when it resizes a terminal and leaves before it attaches', async () => {
        const { held, hub, driver: record } = terminals();
        const { port } = await socketOver(held, hub);
        const client = await pageOn(port, { type: 'subscribe', channels: [], token: TOKEN });
        await settle();
        record.calls.length = 0;
        client.send(JSON.stringify({ type: 'resize', channel: CHANNEL, cols: 120, rows: 40 }));
        // A socket's messages are taken in order, so once the attach to another terminal reads its
        // pane, the resize before it has been taken.
        const other = ptyChannel('d4e5f6-shell');
        client.send(JSON.stringify({ type: 'subscribe', channels: [other], token: TOKEN }));
        await vi.waitFor(() =>
            expect(record.calls.map((args) => args[0])).toContain('capture-pane')
        );
        client.close();
        await settle();
        expect(record.calls.map((args) => args[0])).not.toContain('resize-window');
    });
});

describe('what the page may send to a terminal an app opened as a stream', () => {
    it('refuses input from a socket that carried no token, and sends nothing to the host', async () => {
        const toHost: string[] = [];
        const hub = new StreamHub({
            note: noop,
            catalog: () => textCatalog(loadConfig(engineDir()).config),
            notify: (method) => void toHost.push(method)
        });
        let stream: Parameters<StreamTerminalSet['add']>[0]['stream'] | undefined;
        hub.onTerminal((opened) => (stream = opened));
        void hub.handlers()['oculus/stream/open']({ id: 't1', kind: 'terminal', purpose: {} }, {
            id: 0
        } as never);
        if (stream === undefined) throw new Error('no stream');
        const streams = new StreamTerminalSet();
        const row = streams.add({
            app: 'app:notes',
            name: 'Echo',
            cwd: '/',
            stream,
            ended: () => ''
        });
        const record = driver();
        const pages = new Hub();
        const held = new Terminals(pages, { driver: record.driver, streams, poll: 0 });
        open.push(held);
        const { port, writable } = await socketOver(held, pages);
        const client = await pageOn(port, { type: 'subscribe', channels: [ptyChannel(row.id)] });
        await settle();
        toHost.length = 0;
        client.send(
            JSON.stringify({
                type: 'input',
                channel: ptyChannel(row.id),
                bytes: encode('rm -rf .\r')
            })
        );
        await vi.waitFor(() => expect(writable).toEqual([false]));
        await settle();
        expect([
            toHost.filter((one) => one === 'oculus/stream/data'),
            record.calls.filter((args) => args[0] === 'send-keys')
        ]).toEqual([[], []]);
    });
});

describe('a socket that closed', () => {
    it('stops the delivery and leaves the tmux session alone', async () => {
        const { held, hub, driver: record } = terminals();
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL]);
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

describe('the first screen of a page that attaches', () => {
    it('sends the output written after the pane was read behind the screen, and none before it', async () => {
        const record = driver();
        const plain = record.driver.run.bind(record.driver);
        const LATE = Buffer.from('written after the read');
        // Read by a tmux process each, the program's output lands after the cursor's answer.
        record.driver.run = (args: string[]): Promise<string> => {
            const answer = plain(args);
            if (args[0] === 'display-message') void answer.then(() => record.emit(ID, LATE));
            return answer;
        };
        // Read through the control client, it lands after the reply, in the same read of tmux.
        record.driver.read = (_id, args, replied) =>
            plain(args).then((text) => {
                replied();
                if (args[0] === 'display-message') record.emit(ID, LATE);
                return text;
            });
        const { held } = terminals(record);
        const page = recorder();
        held.subscribed(page.sink, [CHANNEL]);
        await vi.waitFor(() => expect(page.messages.some((one) => one.version === 0)).toBe(true));
        record.emit(ID, Buffer.from('and then'));
        await settle();
        const decoded = page.messages.map((one) => [
            one.version,
            Buffer.from((one.payload as { bytes: string }).bytes, 'base64').toString('utf8')
        ]);
        expect(decoded).toEqual([
            [0, 'the pane as it stands\u001b[1;1Hwritten after the read'],
            [expect.any(Number), 'and then']
        ]);
    });
});

describe('the list the pages are told of', () => {
    it("keeps tmux's words while the list cannot be read, and drops them once it is read", async () => {
        const record = driver();
        const tooLong = 'error connecting to /a/long/tmux/folder/default (File name too long)';
        let fails = true;
        record.driver.run = (args: string[]): Promise<string> => {
            if (args[0] !== 'list-sessions') return Promise.resolve('');
            return fails ? Promise.reject(new Error(tooLong)) : Promise.resolve(LIST);
        };
        const { held } = terminals(record);
        let told = 0;
        held.onChange(() => (told += 1));
        held.refresh();
        await settle();
        expect([held.unreadable(), held.list(), told]).toEqual([tooLong, null, 1]);
        fails = false;
        held.refresh();
        await settle();
        expect([held.unreadable(), held.list()?.length, told]).toEqual([null, 1, 2]);
    });

    /** One row of tmux's list for a task terminal whose line ended with status 0. */
    const endedRow = (pid: number): string =>
        [
            SESSION,
            '1757500000',
            '0',
            'latexmk',
            String(pid),
            '/tmp',
            'a build',
            '',
            '',
            '',
            '',
            '{"repo":"/tmp","name":"build"}',
            '1',
            '0',
            '777'
        ].join('\t') + '\n';

    it('changes when a task terminal ends with the status it had, in a process run again', async () => {
        const record = driver();
        let rows = endedRow(4242);
        record.driver.run = (args: string[]): Promise<string> =>
            Promise.resolve(args[0] === 'list-sessions' ? rows : '');
        const { held } = terminals(record);
        let told = 0;
        held.onChange(() => (told += 1));
        held.refresh();
        await settle();
        expect(told).toBe(1);
        // The build ran again and ended with the same status before the next read.
        rows = endedRow(4243);
        held.refresh();
        await settle();
        expect(told).toBe(2);
    });
});

/** What an attaching page is sent first, as the grid receives it: the message of version 0. */
async function attachedWith(record: ReturnType<typeof driver>): Promise<string> {
    const { held } = terminals(record);
    let deliver: (message: Message) => void = noop;
    const first = new Promise<Message>((resolve) => (deliver = resolve));
    const sink: Sink = {
        send: (text: string) => {
            deliver(JSON.parse(text) as Message);
            return Promise.resolve();
        },
        close: noop
    };
    held.subscribed(sink, [CHANNEL]);
    const message = await first;
    expect(message.version).toBe(0);
    return Buffer.from((message.payload as { bytes: string }).bytes, 'base64').toString('utf8');
}

/** A capture's lines as tmux prints them: `name 1` to `name <count>`, one per row. */
function rows(name: string, count: number): string {
    return Array.from({ length: count }, (_, at) => `${name} ${at + 1}\n`).join('');
}

/** The grid is written lines that end in CR LF, and the last line has no final newline. */
function crlf(capture: string): string {
    return capture.replace(/\n$/, '').replace(/\n/g, '\r\n');
}

describe('a page that attaches', () => {
    const PLACED = 'the pane as it stands\u001b[1;1H';

    it.each<{ row: string; flags: Record<string, string>; modes: string }>([
        {
            row: 'bracketed paste, application cursor keys and mouse reporting set',
            flags: { bracket_paste_flag: '1', keypad_cursor_flag: '1', mouse_standard_flag: '1' },
            // The mouse reports come after the cursor keys, in the order of the flags.
            modes: '\u001b[?2004h\u001b[?1h\u001b[?1000h'
        },
        { row: 'no mode set', flags: {}, modes: '' }
    ])(
        "gives an attaching page the modes the pane's program set, after the screen: $row",
        async ({ flags, modes }) => {
            const values = {
                cursor_x: '0',
                cursor_y: '0',
                pane_height: '1',
                alternate_on: '0',
                ...flags
            };
            expect(await attachedWith(driver({ values }))).toBe(PLACED + modes);
        }
    );

    // A 40x6 pane with an editor in its alternate screen, 13 lines of history and the shell's
    // cursor saved at column 1, row 5, as tmux 3.7c answered for such a pane.
    const EDITOR = {
        alternate_on: '1',
        alternate_saved_x: '1',
        alternate_saved_y: '5',
        history_size: '13',
        cursor_x: '9',
        cursor_y: '1',
        pane_height: '6',
        keypad_cursor_flag: '1',
        mouse_standard_flag: '1',
        mouse_sgr_flag: '1'
    };
    const MODES = '\u001b[?1h\u001b[?1000h\u001b[?1006h';
    const HISTORY = rows('history', 13);
    const SHELL = rows('shell', 6);
    const EDITOR_SCREEN = rows('editor', 6);
    const PLACED_EDITOR = crlf(EDITOR_SCREEN) + '\u001b[2;10H';
    const TODAYS = crlf(SCREEN) + '\u001b[2;10H' + MODES;

    /**
     * What tmux gives for each capture: the history range (`-E -1`) is the history, or with no
     * history the alternate screen's top row; `-a` is the saved normal screen, or nothing once the
     * editor left; the range of the first capture (`-S` alone) is whatever the pane holds, which
     * is not what an attach to an editor uses, and each one made takes the next of `holds`, the
     * last one again once they run out.
     */
    function panes(history: string, saved: string, holds: string[] = [SCREEN]): Captures {
        const next = [...holds];
        return (args) => {
            if (args.includes('-a')) return saved;
            if (args.includes('-E')) return history === '' ? rows('editor', 1) : history;
            if (args.includes('-S')) return (next.length > 1 ? next.shift() : next[0]) ?? SCREEN;
            return EDITOR_SCREEN;
        };
    }

    // What the pane holds once the editor has left: the shell's text, not the editor's screen.
    const AFTER = 'the shell after the editor\n';
    // tmux answers one blank line to the saved-screen capture once the program has left.
    const BLANK_LINE = '\n';

    it.each([
        {
            row: 'alternate on, with history',
            values: EDITOR,
            captures: panes(HISTORY, SHELL),
            expected:
                crlf(HISTORY + SHELL) + '\u001b[6;2H\u001b[?1049h\u001b[H' + PLACED_EDITOR + MODES
        },
        {
            row: 'alternate on, no history',
            values: { ...EDITOR, history_size: '0' },
            captures: panes('', SHELL),
            expected: crlf(SHELL) + '\u001b[6;2H\u001b[?1049h\u001b[H' + PLACED_EDITOR + MODES
        },
        {
            row: 'alternate on, no saved cursor',
            values: { ...EDITOR, alternate_saved_x: '4294967295', alternate_saved_y: '4294967295' },
            captures: panes(HISTORY, SHELL),
            expected: crlf(HISTORY + SHELL) + '\u001b[?1049h\u001b[H' + PLACED_EDITOR + MODES
        },
        {
            row: 'alternate off',
            values: { ...EDITOR, alternate_on: '0' },
            captures: panes(HISTORY, SHELL),
            expected: TODAYS
        },
        {
            row: 'alternate_on unreadable',
            values: { ...EDITOR, alternate_on: 'yes' },
            captures: panes(HISTORY, SHELL),
            expected: TODAYS
        },
        {
            row: 'the editor gone before the saved screen was read',
            values: EDITOR,
            captures: panes(HISTORY, BLANK_LINE),
            expected: TODAYS
        },
        {
            row: 'the editor gone after the alternate screen was read',
            values: EDITOR,
            captures: panes(HISTORY, SHELL, [SCREEN, AFTER]),
            alternateAfter: '0\n',
            expected: crlf(AFTER) + '\u001b[2;10H' + MODES
        }
    ])(
        "gives an attaching page a pane's shell text, then the alternate buffer with the editor's screen: $row",
        async ({ values, captures, alternateAfter, expected }) => {
            expect(await attachedWith(driver({ values, captures, alternateAfter }))).toBe(expected);
        }
    );
});
