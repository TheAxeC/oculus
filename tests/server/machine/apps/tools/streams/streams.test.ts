// Layer 2, server test. The streams of one app host (lib/server/machine/apps/tools/streams.ts), the
// `oculus/stream/*` rows of DESIGN.md: the host opens every stream under an id it chooses, flow is
// by credit, an id oculus does not hold is dropped with a line in the host's output, and a host
// that stops closes every stream. These are the stream rows of G75 and G77.
//
// The hub is driven through its own handlers and notifications with the notifications it sends
// recorded; no process runs. What this does NOT cover: the runner's end of a stream
// (runner/streams.mjs), which the language, debug and terminal suites run through a real host.

import { describe, expect } from 'vitest';
import {
    StreamHub,
    type AppStream
} from '../../../../../../src/lib/server/machine/apps/tools/streams.ts';
import { Refused } from '../../../../../../src/lib/server/machine/apps/host/connection.ts';
import {
    engineDir,
    loadConfig,
    textCatalog
} from '../../../../../../src/lib/data/sources/config.ts';
import { it } from '../../../../../fixtures/scratch.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

/** The windows the hubs of this file are made with, set through the stream options. */
const BYTE_WINDOW = 1024;
const MESSAGE_WINDOW = 16;

/** A hub over a recorder of what it tells the host and what it writes to the host's output. */
function hub() {
    const sent: { method: string; params: Record<string, unknown> }[] = [];
    const notes: string[] = [];
    const waiting: { method: string; resolve: () => void }[] = [];
    const made = new StreamHub({
        note: (line) => notes.push(line),
        catalog: () => catalog,
        byteWindow: BYTE_WINDOW,
        messageWindow: MESSAGE_WINDOW,
        notify: (method, params) => {
            sent.push({ method, params: params as Record<string, unknown> });
            for (const one of waiting.filter((wait) => wait.method === method)) one.resolve();
        }
    });
    /** Resolves when the hub next tells the host `method`. */
    const next = (method: string): Promise<void> =>
        new Promise((resolve) => waiting.push({ method, resolve }));
    const handlers = made.handlers();
    const notices = made.notices();
    const open = (params: Record<string, unknown>): void => {
        void handlers['oculus/stream/open'](params, { id: 0 } as never);
    };
    const notice = (method: string, params: Record<string, unknown>): void => {
        notices[`oculus/stream/${method}`](params);
    };
    /** Open a terminal stream and return it. */
    const terminal = (id = 't1'): AppStream => {
        let held: AppStream | undefined;
        made.onTerminal((stream) => (held = stream));
        open({ id, kind: 'terminal', purpose: {} });
        if (held === undefined) throw new Error('no stream');
        return held;
    };
    /** Open a language server stream under an expected token and return it. */
    const server = async (id = 's1'): Promise<AppStream> => {
        const wait = made.expect(1000);
        open({ id, kind: 'languageServer', purpose: { token: wait.token } });
        return wait.stream;
    };
    return { made, sent, notes, open, notice, terminal, server, handlers, next };
}

/** One turn of the event loop, after which every promise already settled has run its handlers. */
const turn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('the credit a stream flows by', () => {
    it('sends a server one window of messages with no credit back, holds the rest, and sends more as credit comes', async () => {
        const h = hub();
        const stream = await h.server();
        for (let at = 0; at < MESSAGE_WINDOW + 10; at += 1) stream.sendMessage({ at });
        const first = h.sent.filter((one) => one.method === 'oculus/stream/data').length;
        const held = stream.held();
        h.notice('control', { id: 's1', credit: 4 });
        const next = h.sent.filter((one) => one.method === 'oculus/stream/data').length;
        expect([first, held, next]).toEqual([MESSAGE_WINDOW, 10, MESSAGE_WINDOW + 4]);
    });

    it('sends a terminal one window of bytes and holds the rest of a larger write', () => {
        const h = hub();
        const stream = h.terminal();
        stream.sendBytes(Buffer.alloc(BYTE_WINDOW + 500, 1));
        const sent = h.sent
            .filter((one) => one.method === 'oculus/stream/data')
            .reduce((sum, one) => sum + Buffer.from(String(one.params.bytes), 'base64').length, 0);
        expect([sent, stream.held()]).toEqual([BYTE_WINDOW, 500]);
    });

    it('pauses the source when it holds data and resumes it when the queue is empty', async () => {
        const h = hub();
        const stream = await h.server();
        const events: string[] = [];
        stream.backpressure(
            () => events.push('pause'),
            () => events.push('resume')
        );
        for (let at = 0; at < MESSAGE_WINDOW + 1; at += 1) stream.sendMessage({ at });
        const paused = events.filter((one) => one === 'pause').length;
        const whileHeld = events.at(-1);
        h.notice('control', { id: 's1', credit: 5 });
        expect([paused, whileHeld, events.at(-1)]).toEqual([1, 'pause', 'resume']);
    });

    it('closes a stream that holds more messages than its bound, with a line in the output', async () => {
        const h = hub();
        const stream = await h.server();
        for (let at = 0; at < MESSAGE_WINDOW + 4097; at += 1) stream.sendMessage({ at });
        expect([stream.closed, h.notes.length, h.made.ids()]).toEqual([true, 1, []]);
    });

    it('closes a terminal stream that holds more chunks than its bound, with a line in the output', () => {
        const h = hub();
        const stream = h.terminal();
        stream.sendBytes(Buffer.alloc(BYTE_WINDOW, 1));
        for (let at = 0; at < 4097; at += 1) stream.sendBytes(Buffer.from([at % 256]));
        expect([stream.closed, h.notes.length, h.made.ids()]).toEqual([true, 1, []]);
    });

    it('grants credit back only when the handler of a message has settled', async () => {
        const h = hub();
        const stream = await h.server();
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        stream.onMessage(() => gate);
        for (let at = 0; at < MESSAGE_WINDOW / 2; at += 1) {
            h.notice('data', { id: 's1', message: { at } });
        }
        await turn();
        const before = h.sent.filter((one) => one.method === 'oculus/stream/control').length;
        const granted = h.next('oculus/stream/control');
        release();
        await granted;
        const after = h.sent.filter((one) => one.method === 'oculus/stream/control');
        expect([before, after.length > 0 ? after[0].params.credit : 0]).toEqual([
            0,
            MESSAGE_WINDOW / 2
        ]);
    });
});

describe('an id the host did not open', () => {
    it('is dropped with a line in the output for data, control and close, and the host goes on', async () => {
        const h = hub();
        await h.server('s1');
        h.notice('data', { id: 'ghost', message: { a: 1 } });
        h.notice('control', { id: 'ghost', end: true });
        h.notice('close', { id: 'ghost' });
        expect([h.notes.length, h.made.ids()]).toEqual([3, ['s1']]);
    });

    it('is dropped for a stream that closed, whose data no listener hears', async () => {
        const h = hub();
        const stream = await h.server('s1');
        const heard: unknown[] = [];
        stream.onMessage((message) => void heard.push(message));
        h.notice('close', { id: 's1' });
        h.notice('data', { id: 's1', message: { late: true } });
        await turn();
        expect([heard, h.notes.length, stream.closed]).toEqual([[], 1, true]);
    });

    it('refuses an id that is open, an id that closed, a bad id and a server stream nobody asked for', async () => {
        const h = hub();
        await h.server('s1');
        const refusal = (params: Record<string, unknown>): string => {
            try {
                h.open(params);
                return 'accepted';
            } catch (error) {
                return error instanceof Refused ? error.word : 'other';
            }
        };
        h.notice('close', { id: 's1' });
        expect([
            refusal({ id: 's1', kind: 'terminal', purpose: {} }),
            refusal({ id: 'x y', kind: 'terminal', purpose: {} }),
            refusal({ id: 's2', kind: 'languageServer', purpose: { token: 'none' } }),
            refusal({ id: 's3', kind: 'unknown', purpose: {} })
        ]).toEqual(['refused:id', 'refused:params', 'refused:purpose', 'refused:params']);
    });

    it('closes a server stream whose data is not one message object, with a line in the output', async () => {
        const h = hub();
        const stream = await h.server();
        h.notice('data', { id: 's1', message: 'text' });
        expect([stream.closed, h.notes.length, h.made.ids()]).toEqual([true, 1, []]);
    });
});

describe('a host that stops', () => {
    it('has every stream closed, each told to the host, and opens no more', async () => {
        const h = hub();
        const a = await h.server('a');
        const b = h.terminal('b');
        h.made.closeAll();
        let word = '';
        try {
            h.open({ id: 'c', kind: 'terminal', purpose: {} });
        } catch (error) {
            word = error instanceof Refused ? error.word : 'other';
        }
        expect([
            a.closed,
            b.closed,
            h.sent.filter((one) => one.method === 'oculus/stream/close').length,
            word
        ]).toEqual([true, true, 2, 'refused:params']);
    });
});
