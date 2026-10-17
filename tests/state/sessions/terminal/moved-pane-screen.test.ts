// Layer 2, client state tests. The screen a Terminal pane is sent when it starts reading
// (state/sessions/terminal/pty/pty-wire.ts over state/client/socket.svelte.ts): the server answers
// a subscribe naming a `pty:` channel with the terminal's screen (server/machine/pty/channel.ts,
// `#attach`), which a page load asks for in the subscribe its open sends. A pane that arrives in a
// page by a move, while another pane of the page still reads the same terminal, asks for the
// channel in a subscribe message of its own too, so it is sent the screen as a load's pane is; the
// channel stays in the page's subscription until its last pane stops reading. The WebSocket is a
// stand-in that records the frames the page writes.
//
// It does not cover the grid drawing the screen, which the look does.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSocket } from '../../../../src/lib/state/client/socket.svelte.ts';
import type { EntitiesStore } from '../../../../src/lib/state/client/entities.svelte.ts';
import type { WritesStore } from '../../../../src/lib/state/client/writes.svelte.ts';
import { createPtyWire } from '../../../../src/lib/state/sessions/terminal/pty/pty-wire.ts';
import { createPtyOrder } from '../../../../src/lib/state/sessions/terminal/pty/pty-subscribe.ts';

/** A WebSocket that records what the page sends and opens or closes when the test says. */
class Recorded {
    static readonly OPEN = 1;
    readyState = 0;
    sent: unknown[] = [];
    readonly #heard = new Map<string, (() => void)[]>();
    addEventListener(name: string, fn: () => void): void {
        this.#heard.set(name, [...(this.#heard.get(name) ?? []), fn]);
    }
    send(text: string): void {
        this.sent.push(JSON.parse(text));
    }
    close(): void {
        this.readyState = 3;
        for (const fn of this.#heard.get('close') ?? []) fn();
    }
    open(): void {
        this.readyState = Recorded.OPEN;
        for (const fn of this.#heard.get('open') ?? []) fn();
    }
}

const TOKEN = 'token-1';
const CHANNEL = 'pty:t1';
const SIZE = () => ({ cols: 80, rows: 24 });

/** The WebSocket class a page builds, which puts every socket it makes into `made`. */
function madeInto(made: Recorded[]) {
    return class extends Recorded {
        constructor() {
            super();
            made.push(this);
        }
    };
}

/** A page's socket, opened, and the pty wire over it; its sockets go into `made`. */
function page(made: Recorded[]) {
    vi.stubGlobal('WebSocket', madeInto(made));
    const entities = { reconnected: () => undefined } as unknown as EntitiesStore;
    const writes = {
        writeToken: () => TOKEN,
        onToken: () => undefined,
        renewToken: () => Promise.resolve()
    } as unknown as WritesStore;
    const socket = createSocket(entities, writes);
    socket.connect([]);
    const ws = made.at(-1);
    if (ws === undefined) throw new Error('no socket');
    ws.open();
    const wire = createPtyWire(
        socket,
        createPtyOrder(() => Promise.resolve())
    );
    return { ws, wire };
}

/** The subscribe frames among what the socket sent that name the terminal's channel. */
function asked(ws: Recorded): unknown[] {
    return ws.sent.filter(
        (one) =>
            typeof one === 'object' &&
            one !== null &&
            (one as { type?: string }).type === 'subscribe' &&
            ((one as { channels?: string[] }).channels ?? []).includes(CHANNEL)
    );
}

/** Let the order's resize answers and subscribes run. */
const settle = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('location', { host: 'page.test', href: 'http://page.test/' });
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('a Terminal pane that arrives in a page by a move', () => {
    it('asks for the screen while another pane of the page reads the terminal', async () => {
        const { ws, wire } = page([]);
        const first = wire.subscribePty('t1', SIZE, () => undefined);
        await settle();
        expect(asked(ws)).toHaveLength(1);
        const moved = wire.subscribePty('t1', SIZE, () => undefined);
        await settle();
        expect(asked(ws)).toHaveLength(2);
        expect(asked(ws)[1]).toEqual({ type: 'subscribe', channels: [CHANNEL], token: TOKEN });
        first();
        moved();
    });

    it('keeps the channel while one pane reads, and lets it go with the last', async () => {
        const made: Recorded[] = [];
        const { ws, wire } = page(made);
        const first = wire.subscribePty('t1', SIZE, () => undefined);
        const moved = wire.subscribePty('t1', SIZE, () => undefined);
        await settle();
        first();
        ws.close();
        await vi.advanceTimersByTimeAsync(1000);
        const again = made.at(-1);
        if (again === undefined || again === ws) throw new Error('no reconnect');
        again.open();
        expect(asked(again)).toHaveLength(1);
        moved();
        again.close();
        await vi.advanceTimersByTimeAsync(1000);
        const last = made.at(-1);
        if (last === undefined || last === again) throw new Error('no second reconnect');
        last.open();
        expect(asked(last)).toHaveLength(0);
    });
});
