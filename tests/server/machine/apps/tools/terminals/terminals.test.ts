// Layer 2, server test. The terminals an app's host makes (lib/server/machine/apps/tools/run/
// terminals.ts and stream-terminals.ts) over the real hub and manager, with the host's end of the
// connection scripted in this process: a terminal the host opens as a stream is a row of the app
// that keeps its output for a page that attaches, writes what a page types to the host and follows
// the smallest size a page reports; the host ending it, the host stopping and the stream carrying
// bad data each end it with the exit line; and a host that writes faster than the page reads is
// held to the window of the stream. These are the terminal rows of G35 and G77 and the stream rows
// of G75.
//
// Every folder is synthetic, under the system temporary directory. What this does NOT cover: the
// runner's own end of a stream terminal (the host objects of a `Pseudoterminal`), which
// terminals-tmux.test.ts runs through the real runner, and the page that draws the grid.

import { createHash } from 'node:crypto';
import { describe, expect } from 'vitest';
import type { MessageConnection } from 'vscode-jsonrpc/node';
import { it } from '../../../../../fixtures/scratch.ts';
import { creditSender } from '../../world/credit-sender.ts';
import { terminalsDouble } from '../../world/terminals-double.ts';
import { world } from '../../world/hosts-world.ts';

const NOTES = 'app:notes';
const b64 = (text: string | Buffer): string => Buffer.from(text).toString('base64');

/** The window the host grants oculus for a terminal's bytes, which the protocol fixes. */
const BYTE_WINDOW = 1024 * 1024;

/**
 * Resolves the first time `done` is true after a listener `register`ed on the stream terminals is
 * called, or at once when it is true already.
 */
function reached(register: (listener: () => void) => void, done: () => boolean): Promise<void> {
    if (done()) return Promise.resolve();
    return new Promise((resolve) => {
        register(() => {
            if (done()) resolve();
        });
    });
}

/** A world with one scripted host started, and what it was sent on the stream channels. */
async function started() {
    const double = terminalsDouble();
    const w = world({ notes: {} }, {}, { terminals: double });
    await w.hosts.tab(NOTES);
    const host: MessageConnection = w.spawned[0].connection;
    const data: { id: string; bytes?: string }[] = [];
    const control: Record<string, unknown>[] = [];
    const heard: (() => void)[] = [];
    const told = (): void => {
        for (const listener of [...heard]) listener();
    };
    host.onNotification('oculus/stream/data', (params: { id: string; bytes?: string }) => {
        data.push(params);
        told();
    });
    host.onNotification('oculus/stream/control', (params: Record<string, unknown>) => {
        control.push(params);
        told();
    });
    /** Resolves when the host has been told `count` messages of the list. */
    const toldBy = (list: unknown[], count: number): Promise<void> =>
        reached(
            (listener) => heard.push(listener),
            () => list.length >= count
        );
    const open = (id: string, name = 'Echo'): Promise<unknown> =>
        host.sendRequest('oculus/stream/open', { id, kind: 'terminal', purpose: { name } });
    return { w, double, host, data, control, open, toldBy };
}

const textOf = (bytes: Buffer): string => bytes.toString('utf8');

describe('a terminal a host opens as a stream', () => {
    it('is a row of the app with the output the host wrote, and what a page types reaches the host', async () => {
        const { w, double, host, data, open, toldBy } = await started();
        await open('e1');
        const [row] = double.streams.list();
        const written = reached(
            (listener) => double.streams.onOutput(() => listener()),
            () => double.streams.replay(row.id).length > 0
        );
        void host.sendNotification('oculus/stream/data', { id: 'e1', bytes: b64('ready\r\n') });
        await written;
        double.streams.input(row.id, Buffer.from('ls\r'));
        await toldBy(data, 1);
        const seen = [
            row.kind,
            row.app,
            row.name,
            double.streams.record(row.id)?.exit,
            textOf(double.streams.replay(row.id)),
            data.map((one) => Buffer.from(one.bytes ?? '', 'base64').toString('utf8'))
        ];
        await w.hosts.close();
        expect(seen).toEqual(['app', NOTES, 'Echo', null, 'ready\r\n', ['ls\r']]);
    });

    it('is told the smallest size of the pages that show it, and the next smallest when that page leaves', async () => {
        const { w, double, control, open, toldBy } = await started();
        await open('e1');
        const [row] = double.streams.list();
        const wide = {};
        const narrow = {};
        double.streams.size(row.id, wide, 120, 30);
        double.streams.size(row.id, narrow, 80, 40);
        await toldBy(control, 2);
        double.streams.release(row.id, narrow);
        await toldBy(control, 3);
        await w.hosts.close();
        expect(control).toEqual([
            { id: 'e1', columns: 120, rows: 30 },
            { id: 'e1', columns: 80, rows: 30 },
            { id: 'e1', columns: 120, rows: 30 }
        ]);
    });

    it('ends with its exit code and a line in its output when the host ends it, and stays listed', async () => {
        const { w, double, host, open } = await started();
        await open('e1');
        const [row] = double.streams.list();
        const ended = reached(
            (listener) => double.streams.onChange(listener),
            () => double.streams.record(row.id)?.exit === 3
        );
        void host.sendNotification('oculus/stream/control', { id: 'e1', end: true, code: 3 });
        await ended;
        await w.hosts.close();
        expect([
            double.streams.record(row.id)?.exit,
            textOf(double.streams.replay(row.id))
        ]).toEqual([3, expect.stringContaining('3')]);
    });

    it('ends when the host stops while a terminal of tmux the host made stays listed', async () => {
        const { w, double, open } = await started();
        await open('e1');
        const [row] = double.streams.list();
        const made = await double.start({ app: NOTES, name: 'App shell', cwd: '/', argv: ['sh'] });
        await w.hosts.stop(NOTES);
        const after = double.streams.record(row.id);
        await w.hosts.close();
        expect([after?.exit !== null, double.rows.map((one) => one.id)]).toEqual([true, [made.id]]);
    });

    it('is closed with the host by a crash, and every stream the host held is closed', async () => {
        const { w, double, open } = await started();
        await open('e1');
        await open('e2', 'Second');
        const records = double.streams.list();
        w.spawned[0].end(1);
        await w.ended(NOTES);
        await w.hosts.close();
        expect(records.map((one) => double.streams.record(one.id)?.exit !== null)).toEqual([
            true,
            true
        ]);
    });
});

describe('a stream a host names wrongly', () => {
    it('drops data for an id it did not open with a line in its output, refuses the second open of an id that is open, and the host goes on', async () => {
        const { w, double, host, open } = await started();
        await open('e1');
        void host.sendNotification('oculus/stream/data', { id: 'ghost', bytes: b64('x') });
        // The connection takes its messages in order, so the line for `ghost` is in the output
        // before the answer to this second open arrives.
        let refused = '';
        try {
            await open('e1');
        } catch (error) {
            refused = (error as Error).message;
        }
        const named = w.hosts.output(NOTES).some((line) => line.includes('ghost'));
        const stillRuns = w.hosts.running(NOTES);
        const rows = double.streams.list().length;
        await w.hosts.close();
        expect([refused, named, stillRuns, rows]).toEqual(['refused:id', true, true, 1]);
    });
});

describe('a host that writes faster than the page reads', () => {
    it('is held to the window of the stream while the page holds still, loses no byte once it reads, and the server answers other requests meanwhile', async () => {
        const { w, double, host, open } = await started();
        await open('big');
        const [row] = double.streams.list();
        // The page holds still: its listener settles when the gate opens.
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const read = createHash('sha256');
        let delivered = 0;
        // The line written when the host stops arrives after the digest is read.
        let counting = true;
        let allRead: () => void = () => undefined;
        const everything = new Promise<void>((resolve) => {
            allRead = resolve;
        });
        const TOTAL = 50 * 1024 * 1024;
        double.streams.onOutput(async (_id, bytes) => {
            await gate;
            if (!counting) return;
            read.update(bytes);
            delivered += bytes.length;
            if (delivered === TOTAL) allRead();
        });
        // The host sends as the credit allows, as the runner does.
        let granted = 0;
        let farthest = 0;
        const sender = creditSender({
            total: TOTAL,
            chunk: 64 * 1024,
            credit: BYTE_WINDOW,
            send: (chunk) => {
                farthest = Math.max(farthest, sender.sentBytes() - granted);
                void host.sendNotification('oculus/stream/data', { id: 'big', bytes: b64(chunk) });
            }
        });
        host.onNotification('oculus/stream/control', (params: { credit?: unknown }) => {
            if (typeof params.credit === 'number') {
                sender.grant(params.credit);
                granted += params.credit;
            }
            sender.pump();
        });
        sender.pump();
        // The answer to this request comes after every notification already sent, and a credit
        // oculus granted before it would have arrived first, so the bytes sent by now are what the
        // window allowed while the page held still.
        const answered = await host.sendRequest('oculus/terminals/list', {});
        const heldAt = sender.sentBytes();
        release();
        await everything;
        console.info(
            `measured: the host could send ${heldAt} bytes before the page read any (window ${BYTE_WINDOW}); at most ${farthest} bytes unread at once; ${delivered} of ${TOTAL} bytes delivered`
        );
        counting = false;
        const seen = [
            heldAt,
            farthest <= BYTE_WINDOW,
            delivered,
            read.digest('hex') === sender.digest(),
            Array.isArray(answered),
            double.streams.replay(row.id).length <= 1024 * 1024
        ];
        await w.hosts.close();
        expect(seen).toEqual([BYTE_WINDOW, true, TOTAL, true, true, true]);
    }, 90000);
});
