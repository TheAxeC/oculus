// What server/files/fs/notes.ts does to the order file of the notes on a write: a file that is
// missing is written, and a file that is there and does not read, reads as another shape or is a
// link out of the folder is refused and left byte for byte as it was.
//
// Every folder here is under the system temporary directory, asserted to be inside it first.
// Nothing reads or writes ~/.oculus.

import { lstatSync, readFileSync, readlinkSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { writeNoteOrder } from '../../../src/lib/server/files/fs/notes.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** A notes folder holding the notes `one` and `two`, inside the temporary directory. */
function folder(): string {
    const dir = scratchDir('oculus-notes-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    writeFileSync(join(dir, 'one.md'), 'first');
    writeFileSync(join(dir, 'two.md'), 'second');
    return dir;
}

/** The order files that do not read, and what the write is refused with over each. */
const REFUSED: [string, (dir: string) => void, string][] = [
    [
        'is not JSON',
        (dir) => writeFileSync(join(dir, 'order.json'), '{"version": 1, "order": '),
        'notes-order-unreadable'
    ],
    [
        'is JSON of a version it does not know',
        (dir) => writeFileSync(join(dir, 'order.json'), '{"version": 2, "order": ["one"]}'),
        'notes-order-unreadable'
    ],
    [
        'is JSON whose order is not a list of text',
        (dir) => writeFileSync(join(dir, 'order.json'), '{"version": 1, "order": [1, 2]}'),
        'notes-order-unreadable'
    ],
    [
        'is a link to a file outside the folder',
        (dir) => {
            const outside = join(scratchDir('oculus-notes-outside-'), 'elsewhere.json');
            writeFileSync(outside, '{"version": 1, "order": ["one"]}');
            symlinkSync(outside, join(dir, 'order.json'));
        },
        'no-such-note'
    ]
];

describe('a write of the order of the notes', () => {
    it('refuses a write over an order file it cannot read, leaving it', () => {
        const missing = folder();
        expect(writeNoteOrder(missing, ['two', 'one']), 'a missing file').toBeNull();
        expect(JSON.parse(readFileSync(join(missing, 'order.json'), 'utf8'))).toEqual({
            version: 1,
            order: ['two', 'one']
        });

        for (const [row, plant, refusal] of REFUSED) {
            const dir = folder();
            plant(dir);
            const file = join(dir, 'order.json');
            const link = lstatSync(file).isSymbolicLink();
            const held = link ? readlinkSync(file) : readFileSync(file, 'utf8');
            const target = link ? readFileSync(file, 'utf8') : '';
            expect(writeNoteOrder(dir, ['two', 'one']), `a file that ${row}`).toBe(refusal);
            if (link) {
                expect(lstatSync(file).isSymbolicLink(), row).toBe(true);
                expect(readlinkSync(file), row).toBe(held);
                expect(readFileSync(file, 'utf8'), row).toBe(target);
            } else {
                expect(readFileSync(file, 'utf8'), row).toBe(held);
            }
        }
    });
});
