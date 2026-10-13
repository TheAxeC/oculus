// Layer 2, server test. A stream terminal's output on its way to a page that reads slowly: the real
// stream hub (apps/tools/streams.ts), stream terminals (run/stream-terminals.ts), the pty channels
// (pty/channel.ts) and the real Hub (core/channels.ts), with the host's end scripted in this
// process and the page a sink whose send settles when the test lets it. The Hub keeps a slow
// page's output as one held message per channel and `backlog` settles when none is held, so the
// credit the host is owed goes back only as the page takes the bytes. This is the page side of the
// stream rows of G75.
//
// What this does NOT cover: the websocket in front of the Hub (tests/server/root/) and the host's
// runner (terminals.test.ts runs a 50 MB stream through a held consumer).

import { createHash } from 'node:crypto';
import { describe, expect } from 'vitest';
import { Hub, type Sink } from '../../../../../../src/lib/server/core/channels.ts';
import { ptyChannel, Terminals } from '../../../../../../src/lib/server/machine/pty/channel.ts';
import { StreamTerminalSet } from '../../../../../../src/lib/server/machine/apps/tools/run/stream-terminals.ts';
import { StreamHub } from '../../../../../../src/lib/server/machine/apps/tools/streams.ts';
import {
    engineDir,
    loadConfig,
    textCatalog
} from '../../../../../../src/lib/data/sources/config.ts';
import type { Message } from '../../../../../../src/lib/data/model/index.ts';
import { noop } from '../../../../../fixtures/doubles.ts';
import { it } from '../../../../../fixtures/scratch.ts';
import type { TerminalDriver } from '../../../../../../src/lib/server/machine/pty/channel.ts';
import { creditSender } from '../../world/credit-sender.ts';

/** The window oculus grants the host for the terminal's bytes, and the size of each chunk. */
const WINDOW = 1024;
const CHUNK = 128;
const TOTAL = 100 * 1024;

/** A driver that runs no tmux. */
const idle: TerminalDriver = {
    run: () => Promise.resolve(''),
    onOutput: noop,
    onChange: noop,
    attached: noop,
    live: () => false,
    serverRuns: () => Promise.resolve(false),
    close: noop
};

/** A turn of the event loop, after every promise already queued has run. */
const turn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

/** A stream terminal of a host with the window given, on a real set of terminals and Hub. */
function rig(window: number) {
    const toHost: { method: string; params: unknown }[] = [];
    const streams = new StreamHub({
        note: noop,
        catalog: () => textCatalog(loadConfig(engineDir()).config),
        notify: (method, params) => void toHost.push({ method, params }),
        byteWindow: window
    });
    let stream: Parameters<StreamTerminalSet['add']>[0]['stream'] | undefined;
    streams.onTerminal((opened) => (stream = opened));
    void streams.handlers()['oculus/stream/open']({ id: 'big', kind: 'terminal', purpose: {} }, {
        id: 0
    } as never);
    if (stream === undefined) throw new Error('no stream');
    const set = new StreamTerminalSet();
    const row = set.add({ app: 'app:notes', name: 'Big', cwd: '/', stream, ended: () => '' });
    const pages = new Hub();
    const terminals = new Terminals(pages, { driver: idle, streams: set, poll: 0 });
    return { toHost, streams, set, row, terminals, stream };
}

describe('a page that reads the output of a stream terminal slowly', () => {
    it('holds the host to its window plus the chunk in flight, and receives every byte in order once it reads', async () => {
        const { toHost, streams, row, terminals } = rig(WINDOW);
        // The page: every send settles when the gate opens.
        let open: () => void = noop;
        const gate = new Promise<void>((resolve) => {
            open = resolve;
        });
        const received = createHash('sha256');
        let receivedBytes = 0;
        const sink: Sink = {
            async send(text) {
                await gate;
                const message = JSON.parse(text) as Message;
                const bytes = (message.payload as { bytes?: string }).bytes;
                if (bytes === undefined) return;
                const chunk = Buffer.from(bytes, 'base64');
                received.update(chunk);
                receivedBytes += chunk.length;
            },
            close: noop
        };
        terminals.subscribed(sink, [ptyChannel(row.id)]);
        await turn();

        // The host sends as the credit it was granted allows.
        const notices = streams.notices();
        const sender = creditSender({
            total: TOTAL,
            chunk: CHUNK,
            credit: WINDOW,
            send: (chunk) =>
                notices['oculus/stream/data']({ id: 'big', bytes: chunk.toString('base64') })
        });
        const granted = (): void => {
            for (const one of toHost.splice(0)) {
                const credit = (one.params as { credit?: unknown }).credit;
                if (one.method === 'oculus/stream/control' && typeof credit === 'number') {
                    sender.grant(credit);
                }
            }
            sender.pump();
        };
        sender.pump();
        for (let at = 0; at < 20; at += 1) {
            await turn();
            granted();
        }
        const heldAt = sender.sentBytes();
        open();
        while (receivedBytes < TOTAL) {
            await turn();
            granted();
        }
        console.info(
            `measured: the host could send ${heldAt} bytes before the page read any (window ${WINDOW}, chunk ${CHUNK}); ${receivedBytes} of ${TOTAL} bytes received`
        );
        terminals.close();
        expect([
            heldAt <= WINDOW + CHUNK,
            heldAt > 0,
            receivedBytes,
            received.digest('hex') === sender.digest()
        ]).toEqual([true, true, TOTAL, true]);
    });
});

describe('what a page types into a stream terminal while the host grants no credit', () => {
    it('waits and reaches the host in order once the credit returns', async () => {
        const { toHost, streams, set, row, terminals } = rig(WINDOW);
        const typed = createHash('sha256');
        for (let step = 0; step < 40; step += 1) {
            const chunk = Buffer.alloc(100, step);
            typed.update(chunk);
            set.input(row.id, chunk);
        }
        await turn();
        const arrived = createHash('sha256');
        let arrivedBytes = 0;
        const take = (): number => {
            let credit = 0;
            for (const one of toHost.splice(0)) {
                const body = one.params as { bytes?: string };
                if (one.method !== 'oculus/stream/data' || body.bytes === undefined) continue;
                const chunk = Buffer.from(body.bytes, 'base64');
                arrived.update(chunk);
                arrivedBytes += chunk.length;
                credit += chunk.length;
            }
            return credit;
        };
        const before = take();
        streams.notices()['oculus/stream/control']({ id: 'big', credit: before });
        while (arrivedBytes < 4000) {
            await turn();
            const credit = take();
            if (credit > 0) streams.notices()['oculus/stream/control']({ id: 'big', credit });
        }
        terminals.close();
        expect([
            before <= WINDOW,
            arrivedBytes,
            arrived.digest('hex') === typed.digest('hex')
        ]).toEqual([true, 4000, true]);
    });

    it('ends the terminal when more than 8 MiB waits for the host', async () => {
        const { set, row, terminals, stream } = rig(WINDOW);
        for (let step = 0; step < 10; step += 1) set.input(row.id, Buffer.alloc(1024 * 1024, 1));
        await turn();
        const exit = set.record(row.id)?.exit;
        terminals.close();
        expect([stream.closed, exit !== null]).toEqual([true, true]);
    });
});
