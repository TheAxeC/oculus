// Layer 2, server tests. foldFrom reads a transcript in pieces and readTurns asks it from a byte
// offset. A piece size far below the file's makes every line, and every multi-byte character, cross
// a piece boundary, which is what a file above Node's longest string does at 8 MiB. A sparse file
// of zero lines past that string length is read whole, which one buffer of the file cannot decode,
// and a limit far below it is how a line too long to decode is skipped.

import { constants } from 'node:buffer';
import {
    appendFileSync,
    closeSync,
    ftruncateSync,
    mkdirSync,
    openSync,
    readFileSync,
    writeFileSync,
    writeSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { foldFrom, scan } from '../../../src/lib/server/sessions/stores/transcripts.ts';
import { readerDigest } from '../../../src/lib/server/sessions/cache.ts';
import { readTurns } from '../../../src/lib/server/sessions/stores/turns.ts';

let DIR = '';

test.beforeAll(() => {
    DIR = scratchDir('oculus-transcripts-');
});

/** One Claude record: a human question or an assistant answer holding `text`. */
function line(index: number, text: string): string {
    const at = new Date(1760000000000 + index * 1000).toISOString();
    return index % 2 === 0
        ? JSON.stringify({
              type: 'user',
              timestamp: at,
              origin: { kind: 'human' },
              message: { role: 'user', content: text }
          })
        : JSON.stringify({
              type: 'assistant',
              timestamp: at,
              message: { role: 'assistant', content: [{ type: 'text', text }] }
          });
}

/** Six records whose text holds a 3-byte and a 4-byte character, then an unfinished line. */
const TEXTS = [
    'one \u{20AC} euro',
    'two \u{1F600} face',
    'three',
    'four \u{20AC}\u{20AC}',
    'five',
    'six'
];
const WHOLE = TEXTS.map((text, index) => line(index, text)).join('\n') + '\n';
const UNFINISHED = '{"type":"user","timest';

/** The `text` of every record `foldFrom` applied, in order. */
function textsOf(records: Record<string, unknown>[]): string[] {
    return records.map((record) => {
        const message = record.message as { content: string | { text: string }[] };
        return typeof message.content === 'string' ? message.content : message.content[0].text;
    });
}

describe('foldFrom', () => {
    it.each([1, 2, 3, 5, 7, 16, 64, 100000])(
        'applies every record whole and answers the bytes of the complete lines at a piece of %i bytes',
        (piece) => {
            const path = join(DIR, `pieces-${piece}.jsonl`);
            writeFileSync(path, WHOLE + UNFINISHED);
            const records: Record<string, unknown>[] = [];
            const consumed = foldFrom(path, 0, (record) => records.push(record), piece);
            expect(textsOf(records)).toEqual(TEXTS);
            expect(consumed).toBe(Buffer.byteLength(WHOLE));
        }
    );

    it('starts the next read where the last stopped, and takes a line finished since', () => {
        const path = join(DIR, 'follow.jsonl');
        writeFileSync(path, WHOLE + UNFINISHED);
        const first = foldFrom(path, 0, () => undefined, 7);
        appendFileSync(path, line(6, 'seven').slice(UNFINISHED.length) + '\n');
        const records: Record<string, unknown>[] = [];
        const second = foldFrom(path, first, (record) => records.push(record), 7);
        expect(textsOf(records)).toEqual(['seven']);
        expect(first + second).toBe(Buffer.byteLength(WHOLE + line(6, 'seven') + '\n'));
    });

    it('skips a line longer than the limit and folds the lines on either side of it', () => {
        const path = join(DIR, 'long-line.jsonl');
        const long = line(1, 'x'.repeat(600));
        writeFileSync(path, [line(0, 'before'), long, line(2, 'after')].join('\n') + '\n');
        const records: Record<string, unknown>[] = [];
        const consumed = foldFrom(path, 0, (record) => records.push(record), 7, 300);
        expect(textsOf(records)).toEqual(['before', 'after']);
        expect(consumed).toBe(
            Buffer.byteLength([line(0, 'before'), long, line(2, 'after')].join('\n') + '\n')
        );
    });

    it(
        "reads a transcript longer than Node's longest string whole",
        { tags: ['slow'], timeout: 60000 },
        () => {
            const path = join(DIR, 'past-the-limit.jsonl');
            const first = line(0, 'first') + '\n';
            const last = line(1, 'last') + '\n';
            const hole = 1024 * 1024;
            const lines = Math.ceil(constants.MAX_STRING_LENGTH / hole) + 1;
            const handle = openSync(path, 'w');
            try {
                writeSync(handle, first);
                ftruncateSync(handle, first.length + lines * hole);
                for (let at = 1; at <= lines; at++) {
                    writeSync(handle, '\n', first.length + at * hole - 1);
                }
                writeSync(handle, last, first.length + lines * hole);
            } finally {
                closeSync(handle);
            }
            const records: Record<string, unknown>[] = [];
            const consumed = foldFrom(path, 0, (record) => records.push(record));
            expect(textsOf(records)).toEqual(['first', 'last']);
            expect(consumed).toBe(first.length + lines * hole + last.length);
        }
    );
});

describe('readTurns', () => {
    it('answers every turn and the offset of the last complete line, and the next read starts there', () => {
        const path = join(DIR, 'turns.jsonl');
        writeFileSync(path, WHOLE + UNFINISHED);
        const first = readTurns(path, 'claude', 0);
        expect(first.turns.map((turn) => turn.text)).toEqual(TEXTS);
        expect(first.offset).toBe(Buffer.byteLength(WHOLE));
        appendFileSync(path, line(6, 'seven').slice(UNFINISHED.length) + '\n');
        const second = readTurns(path, 'claude', first.offset);
        expect(second.turns.map((turn) => turn.text)).toEqual(['seven']);
        expect(second.offset).toBe(Buffer.byteLength(WHOLE + line(6, 'seven') + '\n'));
    });
});

/** Transcript lines, one record to a line. */
function lines(records: Record<string, unknown>[]): string {
    return records.map((record) => JSON.stringify(record)).join('\n') + '\n';
}

/**
 * A headless session (`claude -p`), whose records carry the entrypoint `sdk-cli`: its prompt and
 * its meta record carry no origin.
 */
const HEADLESS = lines([
    {
        type: 'user',
        isMeta: true,
        entrypoint: 'sdk-cli',
        timestamp: new Date(1760000000000).toISOString(),
        cwd: '/ws/project',
        message: {
            role: 'user',
            content: '<local-command-caveat>Caveat</local-command-caveat>'
        }
    },
    {
        type: 'user',
        entrypoint: 'sdk-cli',
        timestamp: new Date(1760000001000).toISOString(),
        cwd: '/ws/project',
        message: { role: 'user', content: 'Summarise the build log' }
    },
    {
        type: 'assistant',
        entrypoint: 'sdk-cli',
        timestamp: new Date(1760000002000).toISOString(),
        message: { role: 'assistant', content: [{ type: 'text', text: 'The build passed.' }] }
    }
]);

/**
 * An interactive session, whose records carry the entrypoint `cli`: a compaction summary and a
 * command's record, neither with an origin, before the prompt a person wrote.
 */
const INTERACTIVE = lines([
    {
        type: 'user',
        isCompactSummary: true,
        entrypoint: 'cli',
        timestamp: new Date(1760000000000).toISOString(),
        cwd: '/ws/project',
        message: { role: 'user', content: 'This session is being continued from a summary.' }
    },
    {
        type: 'user',
        entrypoint: 'cli',
        timestamp: new Date(1760000001000).toISOString(),
        cwd: '/ws/project',
        message: { role: 'user', content: '<command-name>/model</command-name>' }
    },
    {
        type: 'user',
        origin: { kind: 'human' },
        entrypoint: 'cli',
        timestamp: new Date(1760000002000).toISOString(),
        cwd: '/ws/project',
        message: { role: 'user', content: 'Rename the helper' }
    },
    {
        type: 'assistant',
        entrypoint: 'cli',
        timestamp: new Date(1760000003000).toISOString(),
        message: { role: 'assistant', content: [{ type: 'text', text: 'Renamed.' }] }
    }
]);

/** One scan of a store holding `transcript`, with the cache at `cachePath`. */
function scanned(store: string, cachePath: string) {
    return scan({
        stores: [store],
        codexStores: [],
        registries: [],
        cachePath,
        overridesPath: join(DIR, 'overrides.json'),
        probe: { running: () => false, starts: () => new Map() },
        windowDays: 0
    });
}

describe('a headless session', () => {
    it('is listed with its prompt and the title it opens with, and its prompt is a turn', () => {
        const store = join(DIR, 'headless-store');
        const path = join(store, 'project', 'headless.jsonl');
        mkdirSync(join(store, 'project'), { recursive: true });
        writeFileSync(path, HEADLESS);
        const [record] = scanned(store, join(DIR, 'headless-cache.json'));
        const prompts = record.timeline.filter((one) => one.kind === 'prompt');
        expect([record.title, record.prompts, prompts.map((one) => one.text)]).toEqual([
            'Summarise the build log',
            1,
            ['Summarise the build log']
        ]);
        const turns = readTurns(path, 'claude', 0).turns.map((turn) => turn.text);
        expect(turns).toEqual(['Summarise the build log', 'The build passed.']);
    });
});

describe('an interactive session', () => {
    it('takes neither a compaction summary nor a command record for a prompt or a title', () => {
        const store = join(DIR, 'interactive-store');
        const path = join(store, 'project', 'interactive.jsonl');
        mkdirSync(join(store, 'project'), { recursive: true });
        writeFileSync(path, INTERACTIVE);
        const [record] = scanned(store, join(DIR, 'interactive-cache.json'));
        const prompts = record.timeline.filter((one) => one.kind === 'prompt');
        expect([record.title, record.prompts, prompts.map((one) => one.text)]).toEqual([
            'Rename the helper',
            1,
            ['Rename the helper']
        ]);
        const turns = readTurns(path, 'claude', 0).turns.map((turn) => turn.text);
        expect(turns).toEqual(['Rename the helper', 'Renamed.']);
    });
});

describe('the sessions cache', () => {
    it('serves a record from the cache its reader wrote, and folds it again for another reader', () => {
        const store = join(DIR, 'cached-store');
        mkdirSync(join(store, 'project'), { recursive: true });
        writeFileSync(join(store, 'project', 'cached.jsonl'), HEADLESS);
        const cachePath = join(DIR, 'cached-cache.json');
        scanned(store, cachePath);
        // The cache as a reader that read another prompt left it, once under the version this
        // tree's reader wrote, the digest of its code, and once under another reader's.
        const held = JSON.parse(readFileSync(cachePath, 'utf8')) as {
            version: string;
            entries: Record<string, { acc: Record<string, unknown> }>;
        };
        expect(held.version).toBe(readerDigest());
        for (const entry of Object.values(held.entries)) entry.acc.firstPrompt = 'an older reading';
        const listed = (version: string): unknown => {
            writeFileSync(cachePath, JSON.stringify({ ...held, version }));
            return scanned(store, cachePath)[0].title;
        };
        expect([listed(held.version), listed('another reader')]).toEqual([
            'an older reading',
            'Summarise the build log'
        ]);
    });
});
