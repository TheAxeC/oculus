// What a collection entry write does over a hub of its own: one entry written, the write checked
// against the schema of its own file, a file whose entries share an identity value, and reordering
// and deleting entries.
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
import {
    createEntry,
    fieldTypes,
    removeEntry,
    reorderCollection,
    writeEntry
} from '../../../src/lib/server/edit/writes.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { parse } from 'yaml';
import { it } from '../../fixtures/scratch.ts';
import {
    configFor,
    record,
    tasksPath,
    TASKS,
    wider,
    tasksOf,
    TYPED,
    typed
} from './writes-fixture.ts';

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

    it(
        'says the id the entry has after the write, which a write of the identity field moves',
        { tags: ['slow'] },
        () => {
            const root = wider();
            const out = writeEntry(root, configFor(), 'tasks', 'Review the draft', {
                title: 'Review the draft again'
            });
            expect(out.id).toBe('Review the draft again');
            // A file whose entries carry an `id` is addressed by that id, whatever its identity
            // field says, so a write of the identity field leaves the id where it was.
            const venue = writeEntry(root, configFor(), 'venues', 'existing', {
                name: 'Existing renamed'
            });
            expect(venue.id).toBe('existing');
        }
    );

    it('refuses a write that moves an entry onto another entry of the same file', () => {
        const root = wider();
        writeFileSync(tasksPath(root), `${TASKS}  - title: Another task\n    status: open\n`);
        const out = writeEntry(root, configFor(), 'tasks', 'Review the draft', {
            title: 'Another task'
        });
        expect(out).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'title', reason: 'another entry is already called Another task' }]
        });
        expect(tasksOf(root)).toContain('  - title: "Review the draft"');
        // The entry's own value is not another entry's, so a write that leaves it alone is
        // written.
        expect(
            writeEntry(root, configFor(), 'tasks', 'Review the draft', {
                title: 'Review the draft'
            }).refused
        ).toEqual([]);
    });

    it('says not found for a collection and for an entry the hub does not hold', () => {
        const root = wider();
        expect(writeEntry(root, configFor(), 'nonesuch', 'x', { status: 'done' })).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(writeEntry(root, configFor(), 'tasks', 'Nobody', { status: 'done' })).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(tasksOf(root)).toBe(TASKS);
    });

    it('clears a schema metalist whose current value is an empty list', () => {
        const root = wider();
        writeFileSync(
            join(root, 'tasks', 'tasks.yml'),
            TASKS.replace('    status: open\n', '    status: open\n    meta: []\n')
        );
        const out = writeEntry(root, configFor(), 'tasks', 'Review the draft', { meta: [] });
        // The empty list is written as the field's removal, which is what the record says was put
        // there: an empty metalist and an absent one are one thing in the file.
        expect(out).toEqual({
            found: true,
            id: 'Review the draft',
            changed: ['meta'],
            refused: [],
            records: [record(tasksPath(root), 'Review the draft', 'meta', [], null)]
        });
        expect(tasksOf(root)).toBe(TASKS);
    });
});

describe('a collection entry write against the schema of its own file', () => {
    it('refuses a value that is not text for a text or a textarea field', () => {
        const root = typed();
        expect(writeEntry(root, configFor(), 'tasks', 'One', { title: ['a', 'b'] })).toEqual({
            found: true,
            id: 'One',
            changed: [],
            refused: [{ field: 'title', reason: 'title takes text' }],
            records: []
        });
        expect(writeEntry(root, configFor(), 'tasks', 'One', { note: { a: 1 } })).toEqual({
            found: true,
            id: 'One',
            changed: [],
            refused: [{ field: 'note', reason: 'note takes text' }],
            records: []
        });
        expect(tasksOf(root)).toBe(TYPED);
    });

    it(
        'refuses a select value the schema options do not name, and writes one they do',
        { tags: ['slow'] },
        () => {
            const root = typed();
            expect(writeEntry(root, configFor(), 'tasks', 'One', { status: 'nonesuch' })).toEqual({
                found: true,
                id: 'One',
                changed: [],
                refused: [{ field: 'status', reason: 'status takes one of open, done' }],
                records: []
            });
            expect(tasksOf(root)).toBe(TYPED);
            expect(writeEntry(root, configFor(), 'tasks', 'One', { status: 'done' })).toEqual({
                found: true,
                id: 'One',
                changed: ['status'],
                refused: [],
                records: [record(tasksPath(root), 'One', 'status', 'open', 'done')]
            });
            expect(tasksOf(root)).toContain('status: done');
        }
    );

    it('refuses a date that is not one ISO day, and writes one that is', { tags: ['slow'] }, () => {
        const root = typed();
        expect(writeEntry(root, configFor(), 'tasks', 'One', { deadline: '1 Jan' })).toEqual({
            found: true,
            id: 'One',
            changed: [],
            refused: [{ field: 'deadline', reason: 'deadline takes a date written YYYY-MM-DD' }],
            records: []
        });
        expect(tasksOf(root)).toBe(TYPED);
        const out = writeEntry(root, configFor(), 'tasks', 'One', { deadline: '2026-09-14' });
        expect(out).toEqual({
            found: true,
            id: 'One',
            changed: ['deadline'],
            refused: [],
            records: [record(tasksPath(root), 'One', 'deadline', null, '2026-09-14')]
        });
        expect(tasksOf(root)).toContain('deadline: 2026-09-14');
    });

    it(
        'refuses a checkbox that is not a boolean, and writes one that is',
        { tags: ['slow'] },
        () => {
            const root = typed();
            expect(writeEntry(root, configFor(), 'tasks', 'One', { pin: 'yes' })).toEqual({
                found: true,
                id: 'One',
                changed: [],
                refused: [{ field: 'pin', reason: 'pin takes true or false' }],
                records: []
            });
            expect(tasksOf(root)).toBe(TYPED);
            expect(writeEntry(root, configFor(), 'tasks', 'One', { pin: true })).toEqual({
                found: true,
                id: 'One',
                changed: ['pin'],
                refused: [],
                records: [record(tasksPath(root), 'One', 'pin', null, true)]
            });
            expect(tasksOf(root)).toContain('pin: true');
        }
    );

    it('clears a field of any type with an empty value', () => {
        const root = typed();
        const out = writeEntry(root, configFor(), 'tasks', 'One', { status: null });
        expect(out).toEqual({
            found: true,
            id: 'One',
            changed: ['status'],
            refused: [],
            records: [record(tasksPath(root), 'One', 'status', 'open', null)]
        });
        expect(tasksOf(root)).not.toContain('status: open');
    });

    it('writes the fields that fit and refuses the one that does not, in one outcome', () => {
        const root = typed();
        const out = writeEntry(root, configFor(), 'tasks', 'One', {
            note: 'a line worth keeping',
            status: 'nonesuch'
        });
        expect(out).toEqual({
            found: true,
            id: 'One',
            changed: ['note'],
            refused: [{ field: 'status', reason: 'status takes one of open, done' }],
            records: [record(tasksPath(root), 'One', 'note', null, 'a line worth keeping')]
        });
        expect(tasksOf(root)).toContain('note: a line worth keeping');
        expect(tasksOf(root)).toContain('status: open');
    });

    it('writes a new entry without the field that does not fit, and refuses that one', () => {
        const root = typed();
        const out = createEntry(root, configFor(), 'tasks', {
            title: 'Two',
            note: 'kept',
            status: 'nonesuch'
        });
        expect(out.changed).toEqual(['entries']);
        expect(out.refused).toEqual([
            { field: 'status', reason: 'status takes one of open, done' }
        ]);
        expect(tasksOf(root)).toContain('  - title: Two');
        expect(tasksOf(root)).toContain('    note: kept');
        expect(tasksOf(root)).not.toContain('status: nonesuch');
    });
});

describe('a collection file whose entries share an identity value', () => {
    const TWICE = TYPED.replace(
        '  - title: "One"\n    status: open\n',
        '  - title: "One"\n    status: open\n\n  - title: "One"\n    status: done\n'
    );

    const refusal = {
        found: true,
        changed: [],
        refused: [
            {
                field: 'title',
                reason: 'two entries share the title One, so a write cannot address one of them'
            }
        ]
    };

    it(
        'refuses every write to the file until one of the two is changed',
        { tags: ['slow'] },
        () => {
            const root = typed(TWICE);
            expect(writeEntry(root, configFor(), 'tasks', 'One', { status: 'done' })).toEqual(
                refusal
            );
            expect(removeEntry(root, configFor(), 'tasks', 'One')).toEqual(refusal);
            expect(reorderCollection(root, configFor(), 'tasks', ['One', 'One'])).toEqual(refusal);
            expect(createEntry(root, configFor(), 'tasks', { title: 'Two' })).toEqual(refusal);
            expect(tasksOf(root)).toBe(TWICE);
        }
    );
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

    it('refuses an order that does not name every entry, and an unknown collection', () => {
        const root = wider();
        writeFileSync(join(root, 'tasks', 'tasks.yml'), TWO);
        const out = reorderCollection(root, configFor(), 'tasks', ['Review the draft']);
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            { field: 'entries', reason: 'the order does not name every entry exactly once' }
        ]);
        expect(tasksOf(root)).toBe(TWO);
        expect(reorderCollection(root, configFor(), 'nonesuch', ['x'])).toEqual({
            found: false,
            changed: [],
            refused: []
        });
    });

    it('takes one entry out of its file, by the id the reader gave it', () => {
        const root = wider();
        writeFileSync(join(root, 'tasks', 'tasks.yml'), TWO);
        const out = removeEntry(root, configFor(), 'tasks', 'Another task');
        expect(out.changed).toEqual(['entries']);
        expect(tasksOf(root)).toBe(TASKS);
    });

    it('says not found for an entry and a collection the hub does not hold', () => {
        const root = wider();
        expect(removeEntry(root, configFor(), 'tasks', 'Nobody')).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(removeEntry(root, configFor(), 'nonesuch', 'x')).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(tasksOf(root)).toBe(TASKS);
    });
});

describe('the configuration a write reads at run time', () => {
    it('reads the types of a schema and skips an entry of the wrong shape', () => {
        const schema = { fields: { a: { type: 'text' }, b: 3, c: { type: 4 }, d: {} } };
        expect(fieldTypes(schema)).toStrictEqual({ a: 'text' });
        for (const wrong of [null, [], { fields: [] }]) expect(fieldTypes(wrong)).toStrictEqual({});
    });

    it('reads the metalist fields of a schema and no item that only looks like one', () => {
        const root = wider();
        writeFileSync(
            join(root, 'tasks', 'tasks.yml'),
            [
                'title: Mixed',
                'schema:',
                '  - { field: title, type: text }',
                '  - { field: meta, type: metalist }',
                '  - { field: odd, type: 3 }',
                '  - 3',
                'entries:',
                '  - title: "One"',
                '    meta: []',
                '    odd: []',
                ''
            ].join('\n')
        );
        const out = writeEntry(root, configFor(), 'tasks', 'One', { meta: [], odd: [] });
        expect(out.changed).toStrictEqual(['meta']);
        expect(tasksOf(root)).toContain('    odd: []');
        expect(tasksOf(root)).not.toContain('meta:');
    });

    it('reads the career file and the statuses, in the order the file writes them', () => {
        const none = { file: 'registries/career.yml', statuses: [] };
        expect(careerRules({ career_file: 3, career_host_status: ['x'] })).toStrictEqual(none);
        const two = careerRules({ career_file: 'c.yml', career_host_status: { a: 1, b: 2 } });
        expect(two).toStrictEqual({ file: 'c.yml', statuses: ['a', 'b'] });
        const parsed = parse('career_host_status:\n  __proto__: 1\n  b: 2\n') as Record<
            string,
            unknown
        >;
        expect(careerRules(parsed).statuses).toStrictEqual(['__proto__', 'b']);
    });
});
