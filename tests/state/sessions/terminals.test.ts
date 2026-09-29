// The page's end of a terminal: the posts to /api/terminal, the two messages it writes on the
// socket, and what a `pty:` channel does that no other channel does.
//
// Nothing here opens a socket or a connection: `WebSocket` is a stub that records what was written
// and hands back whatever the case wants to deliver, and `fetch` is the same stub shape the other
// state tests use. Nothing reads ~/.claude, ~/.codex or ~/.oculus, and nothing writes anywhere.
//
// What this does NOT cover: xterm.js, which needs a DOM the suite does not have, and the server's
// own handling of the two messages, which is tests/server/machine/pty/channel.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import {
    decodeBytes,
    encodeBytes,
    endedTerminals,
    ptyChannel,
    titleStripper
} from '../../../src/lib/state/sessions/terminals.svelte.ts';
import { isTerminalId } from '../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import type { Terminal } from '../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { fakeStorage } from '../workbench/layout/layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';

// The layout names its default page from the catalog, so the real one is installed.
setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;
let connect: ClientState['socket']['connect'];
let disconnect: ClientState['socket']['disconnect'];
let message: ClientState['entities']['message'];
let receive: ClientState['entities']['receive'];
let setToken: ClientState['writes']['setToken'];
let recoverDataset: ClientState['terminals']['recoverDataset'];
let resizeTerminal: ClientState['terminals']['resizeTerminal'];
let sendInput: ClientState['terminals']['sendInput'];
let sendResize: ClientState['terminals']['sendResize'];
let startChat: ClientState['terminals']['startChat'];
let startTask: ClientState['terminals']['startTask'];
let startTerminal: ClientState['terminals']['startTerminal'];
let stopTerminal: ClientState['terminals']['stopTerminal'];
let subscribePty: ClientState['terminals']['subscribePty'];
let terminalById: ClientState['terminals']['terminalById'];
let terminals: ClientState['terminals']['terminals'];
let unsubscribePty: ClientState['terminals']['unsubscribePty'];

beforeEach(() => {
    client = createClientState();
    ({ connect, disconnect } = client.socket);
    ({ message, receive } = client.entities);
    ({ setToken } = client.writes);
    ({
        recoverDataset,
        resizeTerminal,
        sendInput,
        sendResize,
        startChat,
        startTask,
        startTerminal,
        stopTerminal,
        subscribePty,
        terminalById,
        terminals,
        unsubscribePty
    } = client.terminals);
});

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

const opened: FakeSocket[] = [];

/** A connected page: the stub socket in place of the browser's, already open. */
function connected(channels: string[] = ['sessions']): FakeSocket {
    vi.stubGlobal('location', { host: '127.0.0.1:8790' });
    vi.stubGlobal(
        'WebSocket',
        class extends FakeSocket {
            constructor() {
                super();
                opened.push(this);
            }
        }
    );
    connect(channels);
    const socket = opened.at(-1) ?? null;
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
    return JSON.parse(scalar(init.body)) as Record<string, unknown>;
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
    opened.length = 0;
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

describe('the four actions of /api/terminal', () => {
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

    it('starts a dataset recovery with its key and geometry', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-shell' }) });
        const answer = await recoverDataset('mimic-iv', 96, 28);
        expect(answer).toEqual({ ok: true, id: 'ffee00-shell', error: '' });
        expect(lastBody()).toEqual({
            action: 'recover',
            key: 'mimic-iv',
            cols: 96,
            rows: 28
        });
    });

    it('starts an update task without sending a command or directory from the page', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-claude' }) });
        const answer = await startTask('litwatch', 96, 28);
        expect(answer).toEqual({ ok: true, id: 'ffee00-claude', error: '' });
        expect(lastBody()).toEqual({
            action: 'task',
            kind: 'litwatch',
            cols: 96,
            rows: 28
        });
    });

    it('starts a focused chat without sending a command or directory from the page', async () => {
        serving(200, { ok: true, terminal: terminal({ id: 'ffee00-claude' }) });
        const answer = await startChat('alpha', 96, 28);
        expect(answer).toEqual({ ok: true, id: 'ffee00-claude', error: '' });
        expect(lastBody()).toEqual({
            action: 'chat',
            id: 'alpha',
            cols: 96,
            rows: 28
        });
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
        // already holds, so asking for it again writing a subscribe message is what says it is
        // gone.
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

describe('the frame check', () => {
    it('drops a frame whose payload is not a map, so every channel reads its own payload type', () => {
        const socket = connected();
        const held = message('sessions')?.version ?? 0;
        socket.deliver('sessions', held + 1, null);
        expect(message('sessions')?.version ?? 0).toBe(held);
        socket.deliver('sessions', held + 2, 'not a payload');
        expect(message('sessions')?.version ?? 0).toBe(held);
        socket.deliver('sessions', held + 3, { records: [], workspaces: [], terminals: [] });
        expect(message('sessions')?.version).toBe(held + 3);
    });
});

describe('the terminals that ended', () => {
    it('are the ones an earlier message listed and this one does not', () => {
        expect(endedTerminals(new Set(['a', 'b']), ['b'], false, [])).toEqual(['a']);
    });

    it('include a terminal a tab holds when the first message does not list it', () => {
        expect(endedTerminals(new Set(), [], true, ['c'])).toEqual(['c']);
    });

    it('leave out a terminal started here that no message has listed yet', () => {
        expect(endedTerminals(new Set(), [], false, ['d'])).toEqual([]);
    });

    it('are none when the message carries no terminal list', () => {
        expect(endedTerminals(new Set(['a']), null, false, ['a'])).toEqual([]);
        expect(endedTerminals(new Set(), null, true, ['a'])).toEqual([]);
    });

    it('name each terminal once, whether a tab holds it or an earlier message listed it', () => {
        expect(endedTerminals(new Set(['a']), [], true, ['a', 'a'])).toEqual(['a']);
    });
});

describe('a message with no terminal list', () => {
    it('is not the first message, so the first list that lacks the terminal of a tab it owned alone closes the tab', () => {
        client.layout.loadLayout(fakeStorage());
        const page = client.layout.currentPage().id;
        const tab = client.layout.openView('terminal', { session: 'c3c3c3-shell' }, page);
        receive({ channel: 'sessions', version: 1, payload: { records: [], workspaces: [] } });
        receive({
            channel: 'sessions',
            version: 2,
            payload: { records: [], workspaces: [], terminals: [] }
        });
        const tabs = client.layout
            .pages()
            .some((one) => JSON.stringify(one.workbench.root).includes(`"${tab}"`));
        expect(tabs).toBe(false);
    });
});
