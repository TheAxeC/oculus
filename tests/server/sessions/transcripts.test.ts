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
    openSync,
    writeFileSync,
    writeSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { foldFrom } from '../../../src/lib/server/sessions/stores/transcripts.ts';
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
