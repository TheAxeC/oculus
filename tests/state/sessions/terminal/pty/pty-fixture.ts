// Layer 2, client-state test helper. What the terminals store's suites share: the stub `WebSocket`
// that records what the page wrote and delivers what a case wants, a page connected through it, and
// the stub `fetch` that records each request to /api/terminal.

import { vi } from 'vitest';
import { scalar } from '../../../../../src/lib/data/helpers/guards.ts';
import { ptyChannel } from '../../../../../src/lib/state/sessions/terminals.svelte.ts';
import type { ClientState } from '../../../../fixtures/client.ts';
import { arrival } from '../../../shared/arrival.ts';
import { asked, serving } from '../../../client/fetch-record.ts';

export const ID = 'a1b2c3-shell';
export const CHANNEL = ptyChannel(ID);

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

    private watching: { count: number; wake: () => void }[] = [];

    send(data: string): void {
        this.sent.push(data);
        this.watching = this.watching.filter((one) => {
            if (this.sent.length < one.count) return true;
            one.wake();
            return false;
        });
    }

    /**
     * Resolves once the socket holds `count` sent messages, woken by the send that makes it so, and
     * rejects after a second naming how many it holds.
     */
    sentCount(count: number): Promise<void> {
        if (this.sent.length >= count) return Promise.resolve();
        return arrival(
            `${count} messages sent on the socket`,
            () => `${this.sent.length} had been sent`,
            (wake) => {
                const one = { count, wake };
                this.watching.push(one);
                return () => {
                    this.watching = this.watching.filter((other) => other !== one);
                };
            }
        );
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

/** Forget the sockets opened, which a case does after it. */
export function forgetSockets(): void {
    opened.length = 0;
}

/** A connected page: the stub socket in place of the browser's, already open. */
export function connected(client: ClientState, channels: string[] = ['sessions']): FakeSocket {
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
    client.socket.connect(channels);
    const socket = opened.at(-1) ?? null;
    if (socket === null) throw new Error('the stub socket was not constructed');
    socket.fire('open');
    socket.sent = [];
    return socket;
}

export { asked, serving };

/** The body of the last request, parsed. */
export function lastBody(): Record<string, unknown> {
    const init = asked[asked.length - 1].init;
    return JSON.parse(scalar(init.body)) as Record<string, unknown>;
}
