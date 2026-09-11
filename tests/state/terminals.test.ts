// The page's end of a terminal: the three posts to /api/terminal, the two messages it writes on the
// socket, and what a `pty:` channel does that no other channel does.
//
// Nothing here opens a socket or a connection: `WebSocket` is a stub that records what was written
// and hands back whatever the case wants to deliver, and `fetch` is the same stub shape the other
// state tests use. Nothing reads ~/.claude, ~/.codex or ~/.oculus, and nothing writes anywhere.
//
// What this does NOT cover: xterm.js, which needs a DOM the suite does not have, and the server's
// own handling of the two messages, which is tests/server/pty/channel.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { connect, disconnect } from '../../src/lib/state/socket.svelte.ts';
import { message, receive } from '../../src/lib/state/entities.svelte.ts';
import { setToken } from '../../src/lib/state/writes.svelte.ts';
import {
    decodeBytes,
    encodeBytes,
    isTerminalId,
    ptyChannel,
    resizeTerminal,
    sendInput,
    sendResize,
    startTerminal,
    stopTerminal,
    subscribePty,
    terminalById,
    terminals,
    titleStripper,
    unsubscribePty
} from '../../src/lib/state/terminals.svelte.ts';
import type { Terminal } from '../../src/lib/data/model.ts';

const ID = 'a1b2c3-shell';
const CHANNEL = ptyChannel(ID);

type Handler = (event: { data?: string }) => void;

/** The socket the page opened, as a recorder: what it was asked to send, and what it delivers. */
class FakeSocket {
    static OPEN = 1;
    static CLOSED = 3;

    readyState = FakeSocket.OPEN;
    sent: string[] = [];
    handlers: Record<string, Handler[]> = {};

    addEventListener(name: string, fn: Handler): void {
        (this.handlers[name] ??= []).push(fn);
    }

    send(data: string): void {
        this.sent.push(data);
    }

    close(): void {
        this.readyState = FakeSocket.CLOSED;
    }

    fire(name: string, event: { data?: string } = {}): void {
        for (const fn of this.handlers[name] ?? []) fn(event);
    }

    /** Deliver one message the way the server would. */
    deliver(channel: string, version: number, payload: unknown): void {
        this.fire('message', { data: JSON.stringify({ channel, version, payload }) });
    }

    /** Every message written, parsed. */
    written(): Record<string, unknown>[] {
        return this.sent.map((one) => JSON.parse(one) as Record<string, unknown>);
    }
}

let opened: FakeSocket | null = null;

/** A connected page: the stub socket in place of the browser's, already open. */
function connected(channels: string[] = ['sessions']): FakeSocket {
    vi.stubGlobal('location', { host: '127.0.0.1:8790' });
    vi.stubGlobal(
        'WebSocket',
        class extends FakeSocket {
            constructor() {
                super();
                opened = this;
            }
        }
    );
    connect(channels);
    const socket = opened;
    if (socket === null) throw new Error('the stub socket was not constructed');
    socket.fire('open');
    socket.sent = [];
    return socket;
}

/** The URLs and requests fetch was given, newest last. */
let asked: { url: string; init: RequestInit }[] = [];

function serving(status: number, body: unknown): void {
    asked = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
        asked.push({ url, init });
        return Promise.resolve(
            new Response(JSON.stringify(body), {
                status,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
}

/** The body of the last request, parsed. */
function lastBody(): Record<string, unknown> {
    const init = asked[asked.length - 1].init;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
}

function terminal(over: Partial<Terminal> = {}): Terminal {
    return {
        id: ID,
        name: ID,
        kind: 'shell',
        cwd: '/hub/tools/oculus',
        command: 'zsh',
        pid: 321,
        created: '2026-09-11T08:00:00.000Z',
        attached: true,
        resumes: null,
        ...over
    };
}

afterEach(() => {
    disconnect();
    opened = null;
    vi.unstubAllGlobals();
});

describe('a terminal id', () => {
    it('is six hex digits and a kind, and nothing a session id could be', () => {
        expect(isTerminalId(ID)).toBe(true);
        expect(isTerminalId('a1b2c3-claude')).toBe(true);
        expect(isTerminalId('0f5c62-codex')).toBe(true);
        // A Claude session id is a UUID and a Codex slug is a day path; neither is this shape.
        expect(isTerminalId('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(false);
        expect(isTerminalId('2026/09/11/rollout-1')).toBe(false);
        expect(isTerminalId('A1B2C3-shell')).toBe(false);
        expect(isTerminalId(null)).toBe(false);
    });

    it('names its channel', () => {
        expect(CHANNEL).toBe('pty:a1b2c3-shell');
    });
});

describe('the terminals the payload carries', () => {
    it('reads them out of the sessions payload and finds one by id', () => {
        receive({
            channel: 'sessions',
            version: 1,
            payload: { records: [], workspaces: [], terminals: [terminal()] }
        });
        expect(terminals().map((one) => one.id)).toEqual([ID]);
        expect(terminalById(ID)?.cwd).toBe('/hub/tools/oculus');
        expect(terminalById('nothing-shell')).toBe(null);
    });
});

describe('base64 on the wire', () => {
    it('carries bytes a string could not', () => {
        expect(decodeBytes(encodeBytes('ls -l\r'))).toEqual(new TextEncoder().encode('ls -l\r'));
        // A lone byte above 0x7f is not valid UTF-8 and still survives, which is the reason the
        // wire carries base64 rather than a string.
        expect(decodeBytes('/w==')).toEqual(new Uint8Array([0xff]));
    });

    it('reads anything that is not base64 as no bytes', () => {
        expect(decodeBytes('not base64 at all!')).toEqual(new Uint8Array(0));
    });
});

describe('the three actions of /api/terminal', () => {
    it('starts one with its kind, its directory and a geometry', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-claude' }) });
        setToken('the-token');
        const answer = await startTerminal('claude', '/hub', 120, 40);
        expect(answer).toEqual({ ok: true, id: 'ffee00-claude', error: '' });
        expect(asked[0].url).toBe('/api/terminal');
        expect(asked[0].init.method).toBe('POST');
        expect((asked[0].init.headers as Record<string, string>)['x-oculus-token']).toBe(
            'the-token'
        );
        expect(lastBody()).toEqual({
            action: 'start',
            kind: 'claude',
            cwd: '/hub',
            cols: 120,
            rows: 40
        });
    });

    it('starts one at a default geometry when the pane has not been measured', async () => {
        serving(200, { ok: true, terminal: terminal() });
        await startTerminal('shell', '/hub');
        expect(lastBody()).toEqual({
            action: 'start',
            kind: 'shell',
            cwd: '/hub',
            cols: 80,
            rows: 24
        });
    });

    it('stops one and resizes one by id', async () => {
        serving(200, { ok: true, id: ID });
        await stopTerminal(ID);
        expect(lastBody()).toEqual({ action: 'stop', id: ID });
        await resizeTerminal(ID, 100, 30);
        expect(lastBody()).toEqual({ action: 'resize', id: ID, cols: 100, rows: 30 });
    });

    it('reports what the server refused it with, in the server words', async () => {
        serving(400, { error: 'cwd must be an absolute path' });
        const answer = await startTerminal('shell', 'relative');
        expect(answer).toEqual({ ok: false, id: '', error: 'cwd must be an absolute path' });
    });
});

describe('the two messages a page writes on a pty channel', () => {
    it('sends keystrokes as base64 of their UTF-8 bytes', () => {
        const socket = connected();
        expect(sendInput(ID, 'echo hi\r')).toBe(true);
        expect(socket.written()).toEqual([
            { type: 'input', channel: CHANNEL, bytes: encodeBytes('echo hi\r') }
        ]);
    });

    it('sends a resize as whole numbers', () => {
        const socket = connected();
        expect(sendResize(ID, 100.4, 30.6)).toBe(true);
        expect(socket.written()).toEqual([
            { type: 'resize', channel: CHANNEL, cols: 100, rows: 31 }
        ]);
    });

    it('writes nothing when no socket is open, and says so', () => {
        expect(sendInput(ID, 'x')).toBe(false);
    });
});

describe('subscribing to a terminal', () => {
    it('asks for the channel and hands the scrollback over first', () => {
        const socket = connected();
        const seen: { text: string; scrollback: boolean }[] = [];
        subscribePty(ID, (bytes, scrollback) => {
            seen.push({ text: new TextDecoder().decode(bytes), scrollback });
        });

        const subscribed = socket.written()[0];
        expect(subscribed.type).toBe('subscribe');
        expect(subscribed.channels).toEqual(['sessions', CHANNEL]);

        socket.deliver(CHANNEL, 0, { bytes: encodeBytes('the scrollback\r\n') });
        socket.deliver(CHANNEL, 1, { bytes: encodeBytes('one chunk') });
        socket.deliver(CHANNEL, 2, { bytes: encodeBytes('another') });
        expect(seen).toEqual([
            { text: 'the scrollback\r\n', scrollback: true },
            { text: 'one chunk', scrollback: false },
            { text: 'another', scrollback: false }
        ]);
    });

    it('keeps the chunks out of entities, where only the latest would survive', () => {
        const socket = connected();
        subscribePty(ID, () => undefined);
        socket.deliver(CHANNEL, 1, { bytes: encodeBytes('one chunk') });
        expect(message(CHANNEL)).toBe(null);
    });

    it('stops handing them over, and stops asking for the channel on a reconnect', () => {
        const socket = connected();
        const seen: string[] = [];
        const off = subscribePty(ID, (bytes) => seen.push(new TextDecoder().decode(bytes)));
        socket.deliver(CHANNEL, 1, { bytes: encodeBytes('before') });
        off();
        unsubscribePty(ID);
        socket.deliver(CHANNEL, 2, { bytes: encodeBytes('after') });
        expect(seen).toEqual(['before']);

        // The channel is out of the remembered list: subscribe() sends nothing for a channel it
        // already holds, so asking for it again writing a subscribe message is what says it is gone.
        socket.sent = [];
        subscribePty(ID, () => undefined);
        expect(socket.written()[0].channels).toEqual(['sessions', CHANNEL]);
    });
});

describe('the title stripper', () => {
    const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);
    const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

    it('drops a window title a shell wrote and keeps everything round it', () => {
        const strip = titleStripper();
        expect(text(strip(bytes('\x1bkecho\x1b\\raw-check\r\n')))).toBe('raw-check\r\n');
        expect(text(strip(bytes('plain \x1b[36mcolour\x1b[0m')))).toBe(
            'plain \x1b[36mcolour\x1b[0m'
        );
    });

    it('carries a title cut across two chunks, and a lone escape at the end', () => {
        const strip = titleStripper();
        expect(text(strip(bytes('before\x1bkec')))).toBe('before');
        expect(text(strip(bytes('ho\x1b\\after')))).toBe('after');
        expect(text(strip(bytes('tail\x1b')))).toBe('tail');
        expect(text(strip(bytes('[0mrest')))).toBe('\x1b[0mrest');
    });
});
