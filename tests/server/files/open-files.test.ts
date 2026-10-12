// Layer 2, server tests. The open files (server/files/fs/open-files.ts): which `source:` names are
// polled, what a poll publishes, and when it closes. A name that leaves the roots, names a root
// nothing serves or has no path is never polled and never published; a name inside a root is
// polled on a clock the test runs itself, so each case says exactly when a tick comes. The reads of
// bytes are recorded by the reader the server is given, to show that a name out of the roots is
// never read.

import { createHash } from 'node:crypto';
import {
    appendFileSync,
    chmodSync,
    mkdirSync,
    readFileSync,
    rmSync,
    symlinkSync,
    truncateSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { Hub, type Sink } from '../../../src/lib/server/core/channels.ts';
import { TEXT_LIMIT } from '../../../src/lib/data/file-ops.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { createOpenFiles } from '../../../src/lib/server/files/fs/open-files.ts';
import { manualClock } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** The paths the server read the bytes of, recorded by the reader the test hands it. */
const read = { paths: [] as string[] };

/** The bounds of the poll: names one socket may hold, and files polled over the whole server. */
const PER_SOCKET = 200;
const PER_SERVER = 1000;

const hashOf = (content: string): string => createHash('sha256').update(content).digest('hex');

function sink(): Sink {
    return { send: () => Promise.resolve(), close: () => undefined };
}

function fixture() {
    const dir = scratchDir('oculus-open-files-');
    const rootDir = join(dir, 'root');
    mkdirSync(rootDir);
    writeFileSync(join(rootDir, 'a.md'), 'one\n');
    writeFileSync(join(dir, 'outside.md'), 'outside\n');
    const named: Root[] = [{ key: 'fixture', dir: rootDir }];
    let roots = named;
    const hub = new Hub();
    const clock = manualClock();
    const files = createOpenFiles({
        hub,
        roots: () => roots,
        clock,
        every: 500,
        read: (path) => {
            read.paths.push(path);
            return readFileSync(path);
        }
    });
    /** Serve the roots again, or none, as sources.yml may change under an open tab. */
    const serve = (served: boolean): void => {
        roots = served ? named : [];
        hub.publish('config', {});
    };
    return { dir, rootDir, hub, clock, files, serve };
}

/** One thing done to the open files, or one thing a row checks at that point. */
type Step =
    /** The sink named (a new one when it is not held yet) subscribes; `refused` is the answer. */
    | { subscribe: string[]; as?: string; refused: string[] }
    | { tick: true }
    /** The file a.md of the root is written, removed or replaced by a link to a file outside. */
    | { write: string }
    | { remove: true }
    | { link: true }
    | { serve: boolean }
    | { unsubscribe: string[]; as: string }
    | { closeSocket: string }
    /** The number of polls waiting for a tick. */
    | { due: number }
    /** The newest message of a channel: its payload and, when given, its version. */
    | {
          latest: string;
          payload?: { hash: string | null };
          version?: number;
          /** The hash starts with this, as a `stat:` signature does. */
          starts?: string;
      }
    /** A file of the root over the read limit, which nobody may read. */
    | { big: string }
    /** The big file grows, and nobody may read it again. */
    | { grow: string }
    /** No file at all was read since the row began or since the last read step. */
    | { readNothing: true }
    /** Some byte of a file with this name was read, which shows the record works; the record of
     * reads starts again after it. */
    | { readSomeOf: string };

type Row = { title: string; steps: Step[] };

const A = 'source:fixture/a.md';

/** `count` names under the root, none of them a file. */
const names = (prefix: string, count: number): string[] =>
    Array.from({ length: count }, (_, at) => `source:fixture/${prefix}${String(at)}.md`);

const OUT_OF_ROOTS = [
    'source:fixture/../outside.md',
    'source:fixture/a/../../outside.md',
    'source:nothing/a.md',
    'source:/a.md',
    'source:fixture/',
    'source:fixture',
    'source:'
];

const BIG = 'source:fixture/big.md';

const rows: Row[] = [
    {
        title: 'never polls or publishes a name out of the roots, a root nothing names or an empty path',
        steps: [
            { subscribe: OUT_OF_ROOTS, refused: OUT_OF_ROOTS },
            { due: 0 },
            { tick: true },
            ...OUT_OF_ROOTS.map((name): Step => ({ latest: name, payload: undefined }))
        ]
    },
    {
        title: 'takes no name that does not start with source:',
        steps: [{ subscribe: ['files', 'lsp:x'], refused: [] }, { due: 0 }]
    },
    {
        title: 'publishes null for a file replaced by a link out of every root, and reads no file once the link is there',
        steps: [
            { subscribe: [A], refused: [] },
            { tick: true },
            { readSomeOf: 'a.md' },
            { link: true },
            { tick: true },
            { latest: A, payload: { hash: null } },
            { readNothing: true }
        ]
    },
    {
        title: 'publishes null at the tick its root stops being served, and follows the file when it is served again',
        steps: [
            { subscribe: [A], refused: [] },
            { tick: true },
            { serve: false },
            { tick: true },
            { latest: A, payload: { hash: null } },
            { serve: true },
            { tick: true },
            { latest: A, payload: { hash: hashOf('one\n') } }
        ]
    },
    {
        title: 'publishes a stat signature for a file over the read limit that nobody may read, and a new one when it grows',
        steps: [
            { big: 'big.md' },
            { subscribe: [BIG], refused: [] },
            { tick: true },
            { latest: BIG, starts: 'stat:', version: 1 },
            { grow: 'big.md' },
            { tick: true },
            { latest: BIG, starts: 'stat:', version: 2 },
            { readNothing: true }
        ]
    },
    {
        title: 'polls 200 names for one socket and 1,000 over the server, and no more',
        steps: [
            {
                subscribe: names('n', PER_SOCKET + 1),
                as: 's0',
                refused: [names('n', PER_SOCKET + 1)[PER_SOCKET]]
            },
            ...Array.from({ length: PER_SERVER / PER_SOCKET - 1 }, (_, at): Step => ({
                subscribe: names(`s${String(at + 1)}-`, PER_SOCKET),
                as: `s${String(at + 1)}`,
                refused: []
            })),
            { due: PER_SERVER },
            {
                subscribe: ['source:fixture/one-more.md'],
                as: 'late',
                refused: ['source:fixture/one-more.md']
            }
        ]
    },
    {
        title: 'publishes the hash of the file at the first tick, and again only when the file changes',
        steps: [
            { subscribe: [A], refused: [] },
            { tick: true },
            { latest: A, payload: { hash: hashOf('one\n') }, version: 1 },
            { tick: true },
            { latest: A, version: 1 },
            { write: 'two\n' },
            { tick: true },
            { latest: A, payload: { hash: hashOf('two\n') }, version: 2 },
            { remove: true },
            { tick: true },
            { latest: A, payload: { hash: null }, version: 3 }
        ]
    },
    {
        title: 'closes the poll when the last socket drops the name, and hands the next one a fresh hash',
        steps: [
            { subscribe: [A], as: 'first', refused: [] },
            { subscribe: [A], as: 'second', refused: [] },
            { tick: true },
            { unsubscribe: [A], as: 'first' },
            { due: 1 },
            { closeSocket: 'second' },
            { tick: true },
            { due: 0 },
            { latest: A, payload: undefined },
            { write: 'later\n' },
            { subscribe: [A], as: 'next', refused: [] },
            { tick: true },
            { latest: A, payload: { hash: hashOf('later\n') } }
        ]
    }
];

describe('the open files', () => {
    it.each(rows)('$title', async (row) => {
        const one = fixture();
        const sinks = new Map<string, Sink>();
        const sinkOf = (name: string): Sink => {
            const held = sinks.get(name) ?? sink();
            sinks.set(name, held);
            return held;
        };
        read.paths.length = 0;
        for (const step of row.steps) {
            if ('subscribe' in step) {
                expect(one.files.subscribed(sinkOf(step.as ?? 'socket'), step.subscribe)).toEqual(
                    step.refused
                );
            } else if ('tick' in step) {
                one.clock.tick();
            } else if ('write' in step) {
                writeFileSync(join(one.rootDir, 'a.md'), step.write);
            } else if ('remove' in step) {
                rmSync(join(one.rootDir, 'a.md'));
            } else if ('link' in step) {
                rmSync(join(one.rootDir, 'a.md'));
                symlinkSync(join(one.dir, 'outside.md'), join(one.rootDir, 'a.md'));
            } else if ('serve' in step) {
                one.serve(step.serve);
                await Promise.resolve();
            } else if ('unsubscribe' in step) {
                one.files.unsubscribed(sinkOf(step.as), step.unsubscribe);
            } else if ('closeSocket' in step) {
                one.files.remove(sinkOf(step.closeSocket));
            } else if ('due' in step) {
                expect(one.clock.due()).toBe(step.due);
            } else if ('big' in step) {
                const file = join(one.rootDir, step.big);
                writeFileSync(file, '');
                truncateSync(file, TEXT_LIMIT + 1);
                chmodSync(file, 0o000);
            } else if ('grow' in step) {
                const file = join(one.rootDir, step.grow);
                chmodSync(file, 0o600);
                appendFileSync(file, 'more');
                chmodSync(file, 0o000);
            } else if ('latest' in step) {
                const message = one.hub.latest(step.latest);
                if ('payload' in step) expect(message?.payload).toEqual(step.payload);
                if (step.starts !== undefined) {
                    expect((message?.payload as { hash: string }).hash).toMatch(
                        new RegExp(`^${step.starts}`)
                    );
                }
                if (step.version !== undefined) expect(message?.version).toBe(step.version);
            } else if ('readNothing' in step) {
                expect(read.paths).toEqual([]);
            } else {
                expect(read.paths.some((path) => path.endsWith(step.readSomeOf))).toBe(true);
                read.paths.length = 0;
            }
        }
    });
});
