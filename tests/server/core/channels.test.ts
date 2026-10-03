// The channel protocol, with sinks the test drives by hand and no socket anywhere.

import { describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import type { Sink } from '../../../src/lib/server/core/channels.ts';
import type { Message } from '../../../src/lib/data/model/index.ts';
import { noop } from '../../fixtures/doubles.ts';

/** Let every pending microtask and one turn of the event loop run. */
function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

type Recorder = {
    sink: Sink;
    /** Every message the sink was sent, parsed. */
    got: Message[];
};

/** A sink whose sends complete at once. */
function recorder(): Recorder {
    const got: Message[] = [];
    const sink: Sink = {
        send: (text: string) => {
            got.push(JSON.parse(text) as Message);
            return Promise.resolve();
        },
        close: noop
    };
    return { sink, got };
}

type Manual = {
    sink: Sink;
    got: Message[];
    /** Complete the oldest send that has not completed yet. */
    finish(): void;
};

/** A sink whose sends complete only when the test says so, which is what "pending" means. */
function manual(): Manual {
    const got: Message[] = [];
    const waiting: (() => void)[] = [];
    const sink: Sink = {
        send: (text: string) => {
            got.push(JSON.parse(text) as Message);
            return new Promise((resolve) => waiting.push(resolve));
        },
        close: noop
    };
    return {
        sink,
        got,
        finish: () => {
            const next = waiting.shift();
            if (next !== undefined) next();
        }
    };
}

describe('Hub.subscribe', () => {
    it('sends the current message of every named channel that has one', async () => {
        const hub = new Hub();
        hub.publish('portfolio', { projects: 91 });
        hub.publish('config', { text: {} });

        const client = recorder();
        hub.subscribe(client.sink, ['portfolio', 'config', 'sessions']);
        await settle();

        expect(client.got).toEqual([
            { channel: 'portfolio', version: 1, payload: { projects: 91 } },
            { channel: 'config', version: 1, payload: { text: {} } }
        ]);
    });

    it('sends nothing for a channel that has never been published', async () => {
        const hub = new Hub();
        const client = recorder();
        hub.subscribe(client.sink, ['sessions']);
        await settle();
        expect(client.got).toEqual([]);
    });
});

describe('Hub.publish', () => {
    it('counts a version per channel, from one', () => {
        const hub = new Hub();
        expect(hub.version('portfolio')).toBe(0);
        expect(hub.publish('portfolio', 'a')).toBe(1);
        expect(hub.publish('portfolio', 'b')).toBe(2);
        expect(hub.publish('config', 'c')).toBe(1);
        expect(hub.version('portfolio')).toBe(2);
        expect(hub.nextVersion('portfolio')).toBe(3);
    });

    it('reaches every subscriber of the channel and no one else', async () => {
        const hub = new Hub();
        const both = recorder();
        const one = recorder();
        hub.subscribe(both.sink, ['portfolio', 'config']);
        hub.subscribe(one.sink, ['config']);

        hub.publish('portfolio', 'p');
        hub.publish('config', 'c');
        await settle();

        expect(both.got.map((message) => message.channel)).toEqual(['portfolio', 'config']);
        expect(one.got.map((message) => message.channel)).toEqual(['config']);
    });
});

describe('a sink whose send has not completed', () => {
    it('is sent the latest message of the channel and no backlog', async () => {
        const hub = new Hub();
        const client = manual();
        hub.subscribe(client.sink, ['portfolio']);

        hub.publish('portfolio', 'first');
        await settle();
        expect(client.got.map((message) => message.payload)).toEqual(['first']);

        hub.publish('portfolio', 'second');
        hub.publish('portfolio', 'third');
        await settle();
        expect(client.got.map((message) => message.payload)).toEqual(['first']);

        client.finish();
        await settle();
        expect(client.got.map((message) => message.payload)).toEqual(['first', 'third']);
        expect(client.got.map((message) => message.version)).toEqual([1, 3]);
    });

    it('keeps the latest of each channel it fell behind on', async () => {
        const hub = new Hub();
        const client = manual();
        hub.subscribe(client.sink, ['portfolio', 'config']);

        hub.publish('portfolio', 'p1');
        await settle();
        hub.publish('config', 'c1');
        hub.publish('config', 'c2');
        hub.publish('portfolio', 'p2');
        await settle();
        expect(client.got.map((message) => message.payload)).toEqual(['p1']);

        client.finish();
        await settle();
        client.finish();
        await settle();
        expect(client.got.map((message) => message.payload)).toEqual(['p1', 'c2', 'p2']);
    });
});

describe('Hub.remove', () => {
    it('sends a removed sink nothing', async () => {
        const hub = new Hub();
        const client = recorder();
        hub.subscribe(client.sink, ['portfolio']);
        hub.publish('portfolio', 'before');
        await settle();

        hub.remove(client.sink);
        hub.publish('portfolio', 'after');
        await settle();

        expect(client.got.map((message) => message.payload)).toEqual(['before']);
        expect(hub.size).toBe(0);
    });
});

describe('Hub.hasSubscriber', () => {
    it('is false before anyone subscribes, true while a sink holds the channel, false after it is removed', () => {
        const hub = new Hub();
        const client = recorder();
        expect(hub.hasSubscriber('processes')).toBe(false);

        hub.subscribe(client.sink, ['processes', 'config']);
        expect(hub.hasSubscriber('processes')).toBe(true);
        expect(hub.hasSubscriber('config')).toBe(true);
        expect(hub.hasSubscriber('hpc')).toBe(false);

        hub.remove(client.sink);
        expect(hub.hasSubscriber('processes')).toBe(false);
    });

    it('stays true while a second sink holds the channel after the first is removed', () => {
        const hub = new Hub();
        const first = recorder();
        const second = recorder();
        hub.subscribe(first.sink, ['processes']);
        hub.subscribe(second.sink, ['processes']);
        hub.remove(first.sink);
        expect(hub.hasSubscriber('processes')).toBe(true);
        hub.remove(second.sink);
        expect(hub.hasSubscriber('processes')).toBe(false);
    });
});

describe('Hub.onFirstSubscriber', () => {
    it('runs once when a channel gains its first subscriber, and not for a second sink or a repeated subscribe', () => {
        const hub = new Hub();
        const calls: string[] = [];
        hub.onFirstSubscriber('processes', () => calls.push('processes'));
        const first = recorder();
        const second = recorder();

        hub.subscribe(first.sink, ['config']);
        expect(calls).toEqual([]);
        hub.subscribe(first.sink, ['processes']);
        expect(calls).toEqual(['processes']);
        hub.subscribe(first.sink, ['processes', 'config']);
        hub.subscribe(second.sink, ['processes']);
        expect(calls).toEqual(['processes']);
    });

    it('runs again when the channel goes from no subscriber to one a second time', () => {
        const hub = new Hub();
        let calls = 0;
        hub.onFirstSubscriber('processes', () => (calls += 1));
        const client = recorder();
        hub.subscribe(client.sink, ['processes']);
        hub.remove(client.sink);
        hub.subscribe(client.sink, ['processes']);
        expect(calls).toBe(2);
    });

    it('runs when the first of two channels named in one subscribe has no holder, and for no other channel', () => {
        const hub = new Hub();
        const calls: string[] = [];
        hub.onFirstSubscriber('processes', () => calls.push('processes'));
        hub.onFirstSubscriber('hpc', () => calls.push('hpc'));
        hub.subscribe(recorder().sink, ['hpc', 'processes']);
        expect(calls).toEqual(['hpc', 'processes']);
    });

    it('stops calling a listener that was taken off', () => {
        const hub = new Hub();
        let calls = 0;
        const off = hub.onFirstSubscriber('processes', () => (calls += 1));
        off();
        hub.subscribe(recorder().sink, ['processes']);
        expect(calls).toBe(0);
    });

    it('sends the first subscriber the current message of the channel before it calls the listener', async () => {
        const hub = new Hub();
        hub.publish('processes', { rows: [] });
        const client = recorder();
        const sentWhenCalled: number[] = [];
        hub.onFirstSubscriber('processes', () => sentWhenCalled.push(client.got.length));
        hub.subscribe(client.sink, ['processes']);
        await settle();
        expect(sentWhenCalled).toEqual([1]);
        expect(client.got.map((message) => message.channel)).toEqual(['processes']);
    });

    it('keeps subscribing and calls the other listeners when one listener throws, and says so on stderr', () => {
        const hub = new Hub();
        const said = vi.spyOn(console, 'error').mockImplementation(noop);
        try {
            const calls: string[] = [];
            hub.onFirstSubscriber('processes', () => {
                throw new Error('the watcher broke');
            });
            hub.onFirstSubscriber('processes', () => calls.push('second'));
            const client = recorder();
            hub.subscribe(client.sink, ['processes']);
            expect(calls).toEqual(['second']);
            expect(hub.hasSubscriber('processes')).toBe(true);
            expect(said).toHaveBeenCalledExactlyOnceWith(
                'socket: first subscriber of processes failed: the watcher broke'
            );
        } finally {
            said.mockRestore();
        }
    });
});
