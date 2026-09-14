// The pty channels on a real Hub with a recording sink and a recording driver. No tmux runs here:
// the driver records the argument list every channel operation built, which is what makes "the input
// reached send-keys" an assertion rather than a process.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../src/lib/server/channels.ts';
import type { Sink } from '../../../src/lib/server/channels.ts';
import {
    IDLE_POLL_MS,
    POLL_MS,
    Terminals,
    channelTerminal,
    ptyChannel,
    terminalMessage,
    type TerminalDriver
} from '../../../src/lib/server/pty/channel.ts';
import type { Message } from '../../../src/lib/data/model.ts';

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
            close: () => {}
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
} {
    const calls: string[][] = [];
    let output: (id: string, bytes: Buffer) => void = () => {};
    let ids: string[] = [];
    let screen = SCREEN;
    return {
        calls,
        emit: (id, bytes) => output(id, bytes),
        attached: () => ids,
        screen: (text) => (screen = text),
        driver: {
            run(args: string[]): Promise<string> {
                calls.push(args);
                if (args[0] === 'capture-pane') return Promise.resolve(screen);
                if (args[0] === 'list-sessions') return Promise.resolve(LIST);
                return Promise.resolve('');
            },
            onOutput(listener): void {
                output = listener;
            },
            onChange(): void {},
            attached(next: string[]): void {
                ids = [...next];
            },
            live: () => false,
            close(): void {}
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
        // capture-pane separates rows with a bare newline; the scrollback goes out with CR LF so
        // the rows do not step across the grid.
        expect(decode(page.messages[0])).toBe(SCREEN.replace('\n', '\r\n'));
        expect(record.calls[record.calls.length - 1]).toEqual([
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
            SCREEN.replace('\n', '\r\n'),
            'the pane after the view switch\r\n'
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
            ['send-keys', '-t', SESSION, '-l', '--', 'echo hi'],
            ['send-keys', '-t', SESSION, '--', 'Enter']
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
        const waiting: Array<() => void> = [];
        const sink: Sink = {
            send: (text: string) => {
                messages.push(JSON.parse(text) as Message);
                return new Promise<void>((resolve) => waiting.push(resolve));
            },
            close: () => {}
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
        expect(record.calls.map((args) => args[0])).toEqual(['list-sessions', 'capture-pane']);
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
    it('is read at construction and tells its listeners when it moved', async () => {
        const { held } = terminals();
        await settle();
        expect(held.list().map((terminal) => terminal.id)).toEqual([ID]);
        expect(held.list()[0].name).toBe('a name');
        expect(held.list()[0].kind).toBe('shell');
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
});
