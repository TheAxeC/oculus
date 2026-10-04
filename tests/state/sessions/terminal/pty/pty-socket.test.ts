// Layer 2, client-state tests. The pty channel of a terminal on the socket
// (state/sessions/terminals.svelte.ts and terminal/pty/pty-subscribe.ts): the two messages a page
// writes, what subscribing resizes and waits for before it asks for the channel, the input held
// meanwhile, the frames a pty channel reads, and the frame check every channel passes.
//
// `WebSocket` is a stub that records what was written and hands back whatever the case wants to
// deliver; `fetch` answers from the case. Nothing here opens a socket or a connection.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scalar } from '../../../../../src/lib/data/helpers/guards.ts';
import {
    RESIZE_WAIT,
    encodeBytes
} from '../../../../../src/lib/state/sessions/terminals.svelte.ts';
import { createClientState, settle, type ClientState } from '../../../../fixtures/client.ts';
import { arrival } from '../../../shared/arrival.ts';
import { CHANNEL, ID, connected, forgetSockets, serving } from './pty-fixture.ts';

let client: ClientState;
let message: ClientState['entities']['message'];
let sendInput: ClientState['terminals']['sendInput'];
let sendResize: ClientState['terminals']['sendResize'];
let subscribePty: ClientState['terminals']['subscribePty'];
let unsubscribePty: ClientState['terminals']['unsubscribePty'];

beforeEach(() => {
    client = createClientState();
    ({ message } = client.entities);
    ({ sendInput, sendResize, subscribePty, unsubscribePty } = client.terminals);
});

afterEach(() => {
    client.socket.disconnect();
    forgetSockets();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('the two messages a page writes on a pty channel', () => {
    it('sends keystrokes as base64 of their UTF-8 bytes', () => {
        const socket = connected(client);
        expect(sendInput(ID, 'echo hi\r')).toBe(true);
        expect(socket.written()).toEqual([
            { type: 'input', channel: CHANNEL, bytes: encodeBytes('echo hi\r') }
        ]);
    });

    it('sends a resize as whole numbers', () => {
        const socket = connected(client);
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
    const GRID = { cols: 54, rows: 23 };
    const grid = () => GRID;

    /** The request bodies fetch was given, in the order made. */
    type Requests = {
        bodies: () => Record<string, unknown>[];
        posted: (count: number) => Promise<void>;
        answer: (at: number, ok?: boolean) => void;
    };

    /**
     * A fetch whose every request waits until the case answers it, the answer of a terminal that
     * is there (`ok`) or of one that is not.
     */
    function gated(): Requests {
        const calls: { init: RequestInit; reply: (response: Response) => void }[] = [];
        let watching: { count: number; wake: () => void }[] = [];
        vi.stubGlobal(
            'fetch',
            (_url: string, init: RequestInit) =>
                new Promise<Response>((reply) => {
                    calls.push({ init, reply });
                    watching = watching.filter((one) => {
                        if (calls.length < one.count) return true;
                        one.wake();
                        return false;
                    });
                })
        );
        return {
            posted: (count) =>
                calls.length >= count
                    ? Promise.resolve()
                    : arrival(
                          `${count} requests posted`,
                          () => `${calls.length} had been posted`,
                          (wake) => {
                              const one = { count, wake };
                              watching.push(one);
                              return () => {
                                  watching = watching.filter((other) => other !== one);
                              };
                          }
                      ),
            bodies: () =>
                calls.map((call) => JSON.parse(scalar(call.init.body)) as Record<string, unknown>),
            answer: (at, ok = true) =>
                calls.at(at)?.reply(
                    new Response(JSON.stringify(ok ? { ok: true, id: ID } : { error: 'gone' }), {
                        status: ok ? 200 : 404,
                        headers: { 'content-type': 'application/json' }
                    })
                )
        };
    }

    const resize = (size: { cols: number; rows: number }) => ({
        action: 'resize',
        id: ID,
        ...size
    });
    const subscribe = { type: 'subscribe', channels: ['sessions', CHANNEL], token: '' };

    it('asks for the channel and hands the scrollback over first', async () => {
        const socket = connected(client);
        serving(200, { ok: true, id: ID });
        const seen: { text: string; scrollback: boolean }[] = [];
        subscribePty(ID, grid, (bytes, scrollback) => {
            seen.push({ text: new TextDecoder().decode(bytes), scrollback });
        });
        await socket.sentCount(1);

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
        const socket = connected(client);
        serving(200, { ok: true, id: ID });
        subscribePty(ID, grid, () => undefined);
        socket.deliver(CHANNEL, 1, { bytes: encodeBytes('one chunk') });
        expect(message(CHANNEL)).toBe(null);
    });

    it('stops handing them over, and stops asking for the channel on a reconnect', async () => {
        const socket = connected(client);
        serving(200, { ok: true, id: ID });
        const seen: string[] = [];
        const off = subscribePty(ID, grid, (bytes) => seen.push(new TextDecoder().decode(bytes)));
        await socket.sentCount(1);
        socket.deliver(CHANNEL, 1, { bytes: encodeBytes('before') });
        off();
        unsubscribePty(ID);
        socket.deliver(CHANNEL, 2, { bytes: encodeBytes('after') });
        expect(seen).toEqual(['before']);

        // The channel is out of the remembered list: subscribe() sends nothing for a channel it
        // already holds, so asking for it again writing a subscribe message is what says it is
        // gone.
        socket.sent = [];
        subscribePty(ID, grid, () => undefined);
        await socket.sentCount(1);
        expect(socket.written()[0].channels).toEqual(['sessions', CHANNEL]);
    });

    it('says a terminal is read while a call of subscribePty holds it, until the last lets go', () => {
        connected(client);
        serving(200, { ok: true, id: ID });
        const { subscribed } = client.terminals;
        expect(subscribed(ID)).toBe(false);
        const one = subscribePty(ID, grid, () => undefined);
        const two = subscribePty(ID, grid, () => undefined);
        expect(subscribed(ID)).toBe(true);
        one();
        one();
        expect(subscribed(ID)).toBe(true);
        two();
        expect(subscribed(ID)).toBe(false);
        expect(subscribed('ffffff-shell')).toBe(false);
    });

    it('resizes the window to the grid before it asks for the channel', async () => {
        const socket = connected(client);
        const requests = gated();
        subscribePty(ID, grid, () => undefined);
        expect(requests.bodies()).toEqual([resize(GRID)]);
        await settle();
        expect(socket.written()).toEqual([]);

        requests.answer(0);
        await socket.sentCount(1);
        expect(socket.written()).toEqual([subscribe]);
    });

    it('asks for the channel when the resize is refused', async () => {
        const socket = connected(client);
        const requests = gated();
        subscribePty(ID, grid, () => undefined);
        requests.answer(0, false);
        await socket.sentCount(1);
        expect(socket.written()).toEqual([subscribe]);
    });

    it('asks for nothing when the listener is taken off before the resize answered', async () => {
        const socket = connected(client);
        const requests = gated();
        const off = subscribePty(ID, grid, () => undefined);
        off();
        requests.answer(0);
        await settle();
        expect(socket.written()).toEqual([]);
        expect(requests.bodies()).toHaveLength(1);
    });

    it('posts the grid size again when it changed while the resize was out, and asks after that', async () => {
        const socket = connected(client);
        const requests = gated();
        let size = GRID;
        subscribePty(
            ID,
            () => size,
            () => undefined
        );
        size = { cols: 90, rows: 12 };
        requests.answer(0);
        await requests.posted(2);
        expect(requests.bodies()[1]).toEqual(resize({ cols: 90, rows: 12 }));
        await settle();
        expect(socket.written()).toEqual([]);

        requests.answer(1);
        await socket.sentCount(1);
        expect(socket.written()).toEqual([subscribe]);
        expect(requests.bodies()).toHaveLength(2);
    });

    it('asks for the channel at RESIZE_WAIT when the resize never answers', async () => {
        const socket = connected(client);
        const requests = gated();
        vi.useFakeTimers();
        subscribePty(ID, grid, () => undefined);
        expect(requests.bodies()).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(RESIZE_WAIT - 1);
        expect(socket.written()).toEqual([]);
        await vi.advanceTimersByTimeAsync(1);
        expect(socket.written()).toEqual([subscribe]);
    });

    it('posts the resize of a second subscribe after the first one answered, ending at the later size', async () => {
        const socket = connected(client);
        const requests = gated();
        const later = { cols: 120, rows: 40 };
        subscribePty(ID, grid, () => undefined);
        subscribePty(
            ID,
            () => later,
            () => undefined
        );
        await settle();
        expect(requests.bodies()).toEqual([resize(GRID)]);

        requests.answer(0);
        await requests.posted(2);
        expect(requests.bodies()).toEqual([resize(GRID), resize(later)]);
        requests.answer(1);
        await socket.sentCount(1);
        expect(socket.written()).toEqual([subscribe]);
        expect(requests.bodies().at(-1)).toEqual(resize(later));
    });

    it('posts the resize of a remount after the one of the grid taken off, and asks for the channel once', async () => {
        const socket = connected(client);
        const requests = gated();
        const later = { cols: 120, rows: 40 };
        const off = subscribePty(ID, grid, () => undefined);
        off();
        subscribePty(
            ID,
            () => later,
            () => undefined
        );
        await settle();
        expect(requests.bodies()).toEqual([resize(GRID)]);

        requests.answer(0);
        await requests.posted(2);
        expect(requests.bodies()).toEqual([resize(GRID), resize(later)]);
        await settle();
        expect(socket.written()).toEqual([]);
        requests.answer(1);
        await socket.sentCount(1);
        expect(socket.written()).toEqual([subscribe]);
    });

    it('holds input typed while the resize is out and writes it right after the subscribe, in order', async () => {
        const socket = connected(client);
        const requests = gated();
        subscribePty(ID, grid, () => undefined);
        expect(sendInput(ID, 'ls')).toBe(true);
        expect(sendInput(ID, '\r')).toBe(true);
        await settle();
        expect(socket.written()).toEqual([]);

        requests.answer(0);
        await socket.sentCount(3);
        expect(socket.written()).toEqual([
            subscribe,
            { type: 'input', channel: CHANNEL, bytes: encodeBytes('ls') },
            { type: 'input', channel: CHANNEL, bytes: encodeBytes('\r') }
        ]);
        expect(sendInput(ID, 'x')).toBe(true);
        expect(socket.written().at(-1)).toEqual({
            type: 'input',
            channel: CHANNEL,
            bytes: encodeBytes('x')
        });
    });

    it('drops the input held for a listener taken off, and the input given after that', async () => {
        const socket = connected(client);
        const requests = gated();
        const off = subscribePty(ID, grid, () => undefined);
        sendInput(ID, 'held');
        off();
        expect(sendInput(ID, 'after the off')).toBe(false);
        requests.answer(0);
        await settle();
        expect(socket.written()).toEqual([]);
    });
});

describe('the frame check', () => {
    it('drops a frame whose payload is not a map, so every channel reads its own payload type', () => {
        const socket = connected(client);
        const held = message('sessions')?.version ?? 0;
        socket.deliver('sessions', held + 1, null);
        expect(message('sessions')?.version ?? 0).toBe(held);
        socket.deliver('sessions', held + 2, 'not a payload');
        expect(message('sessions')?.version ?? 0).toBe(held);
        socket.deliver('sessions', held + 3, { records: [], workspaces: [], terminals: [] });
        expect(message('sessions')?.version).toBe(held + 3);
    });
});

describe('a pty chunk whose frame or payload is of the wrong shape', () => {
    const frame = (version: string, payload: string) =>
        `{"channel":"${CHANNEL}","version":${version},"payload":${payload}}`;
    const bytes = (text: string) => `{"bytes":"${encodeBytes(text)}"}`;
    const NONE = [['', false]];

    it.each([
        ['bytes that are a number', frame('2', '{"bytes":3}'), NONE],
        ['bytes that are null', frame('2', '{"bytes":null}'), NONE],
        ['bytes that are a list', frame('2', '{"bytes":["a"]}'), NONE],
        ['bytes that are not base64', frame('2', '{"bytes":"!!!"}'), NONE],
        ['no bytes', frame('2', '{}'), NONE],
        [
            'more keys than the bytes',
            frame('2', `{"more":1,"bytes":"${encodeBytes('ex')}"}`),
            [['ex', false]]
        ],
        [
            'an own __proto__ key holding the bytes',
            frame('3', `{"__proto__":${bytes('pp')}}`),
            NONE
        ],
        ['a version of minus zero', frame('-0', bytes('zero')), [['zero', true]]],
        ['an infinite version', frame('1e999', bytes('inf')), [['inf', false]]],
        ['a version that is a string', frame('"0"', bytes('x')), []],
        ['a payload that is a list', frame('1', '[]'), []],
        ['a payload that is null', frame('1', 'null'), []]
    ])('hands %s to the listener as the chunk it reads', (_name, data, expected) => {
        const socket = connected(client);
        serving(200, { ok: true, id: ID });
        const seen: [string, boolean][] = [];
        subscribePty(
            ID,
            () => ({ cols: 54, rows: 23 }),
            (chunk, scrollback) => seen.push([new TextDecoder().decode(chunk), scrollback])
        );
        socket.fire('message', { data });
        expect(seen).toStrictEqual(expected);
    });
});
