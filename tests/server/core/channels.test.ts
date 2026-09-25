// The channel protocol, with sinks the test drives by hand and no socket anywhere.

import { describe, expect, it } from 'vitest';
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
