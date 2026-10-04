// What a collection entry write does over a hub of its own: one entry written, reordering and
// deleting entries.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { removeEntry, reorderCollection, writeEntry } from '../../../src/lib/server/edit/writes.ts';
import { it } from '../../fixtures/scratch.ts';
import { configFor, record, tasksPath, TASKS, wider, tasksOf } from './writes-fixture.ts';

describe('writing one collection entry', () => {
    // The first write of a run loads the modules of the entry writer; loading them here keeps the
    // time of the first case its own.
    it.beforeAll(() => {
        writeEntry(wider(), configFor(), 'tasks', 'Review the draft', { status: 'done' });
    });

    it('sets a field of the entry the id names', () => {
        const root = wider();
        const out = writeEntry(root, configFor(), 'tasks', 'Review the draft', {
            status: 'done'
        });
        expect(out).toEqual({
            found: true,
            id: 'Review the draft',
            changed: ['status'],
            refused: [],
            records: [record(tasksPath(root), 'Review the draft', 'status', 'open', 'done')]
        });
        expect(tasksOf(root)).toBe(TASKS.replace('status: open', 'status: done'));
    });
});

describe('reordering and deleting entries of a collection', () => {
    const TWO = TASKS.replace(
        'entries:\n',
        'entries:\n  - title: "Another task"\n    status: open\n\n'
    );

    it('writes the entries in the order the identity values name', () => {
        const root = wider();
        writeFileSync(join(root, 'tasks', 'tasks.yml'), TWO);
        const out = reorderCollection(root, configFor(), 'tasks', [
            'Review the draft',
            'Another task'
        ]);
        expect(out.changed).toEqual(['entries']);
        const after = tasksOf(root);
        expect(after.indexOf('Review the draft')).toBeLessThan(after.indexOf('Another task'));
        expect(after).toContain('      - { do: read it }');
    });

    it('takes one entry out of its file, by the id the reader gave it', () => {
        const root = wider();
        writeFileSync(join(root, 'tasks', 'tasks.yml'), TWO);
        const out = removeEntry(root, configFor(), 'tasks', 'Another task');
        expect(out.changed).toEqual(['entries']);
        expect(tasksOf(root)).toBe(TASKS);
    });
});
