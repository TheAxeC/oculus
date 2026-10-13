// What a collection entry write does over a hub of its own: one entry written, reordering and
// deleting entries.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    createEntry,
    removeEntry,
    reorderCollection,
    writeEntry
} from '../../../src/lib/server/edit/writes.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it } from '../../fixtures/scratch.ts';
import { configFor, plant, record, tasksPath, TASKS, wider, tasksOf } from './writes-fixture.ts';

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

const EVENTS = [
    'title: Events',
    'schema:',
    '  - { field: key, type: text }',
    '  - { field: meta, type: metalist }',
    'events:',
    '  - key: e1',
    '    meta:',
    '      - { label: Where, value: Leuven }',
    ''
].join('\n');

const DATA = [
    'title: Data',
    'schema:',
    '  - { field: key, type: text }',
    '  - field: retrieval',
    '    type: records',
    '    fields:',
    '      - { field: method, type: select, options: [direct, physionet] }',
    '      - { field: notes, type: textarea }',
    '      - { field: priority_first, type: tags }',
    'datasets:',
    '  - key: mimic',
    '    retrieval:',
    '      method: physionet',
    '      manifest: "SHA256SUMS.txt"      # 33 files',
    '      priority_first:                 # fetch first',
    '        - hosp/patients.csv.gz',
    '        - hosp/omr.csv.gz',
    '      notes: >',
    '        Requires a completed DUA.',
    '        Resumable.',
    '  - key: second',
    '    retrieval:',
    '      method: physionet',
    ''
].join('\n');

const VENUES = [
    'title: Venues',
    'schema:',
    '  - { field: name, type: text }',
    '  - { field: id, type: text }',
    '  - { field: short, type: text }',
    'venues:',
    '  - name: Existing Venue',
    '    id: existing',
    ''
].join('\n');

describe('writing the fields an entry editor posts', () => {
    it('adds one row of a metalist and writes that field alone', () => {
        const root = wider();
        const file = plant(root, 'network/events.yml', EVENTS);
        const out = writeEntry(root, configFor(), 'events', 'e1', {
            meta: [
                { label: 'Where', value: 'Leuven' },
                { label: 'Who', value: 'me' }
            ]
        });
        expect(out.changed).toEqual(['meta']);
        expect(readFileSync(file, 'utf8')).toBe(
            EVENTS.replace(
                '      - { label: Where, value: Leuven }\n',
                '      - { label: Where, value: Leuven }\n      - { label: Who, value: me }\n'
            )
        );
    });

    it('changes one sub-field of a nested map and keeps the folded text, the comments and the rest', () => {
        const root = wider();
        const file = plant(root, 'registries/data.yml', DATA);
        const out = writeEntry(root, configFor(), 'data', 'mimic', {
            retrieval: {
                method: 'direct',
                manifest: 'SHA256SUMS.txt',
                priority_first: ['hosp/patients.csv.gz', 'hosp/omr.csv.gz'],
                notes: 'Requires a completed DUA. Resumable.\n'
            }
        });
        expect(out.changed).toEqual(['retrieval']);
        expect(readFileSync(file, 'utf8')).toBe(
            DATA.replace('method: physionet\n      manifest', 'method: direct\n      manifest')
        );
    });

    it('keeps the lines of a sub-field untouched while another is replaced', () => {
        const root = wider();
        const file = plant(root, 'registries/data.yml', DATA);
        writeEntry(root, configFor(), 'data', 'mimic', {
            retrieval: {
                method: 'physionet',
                manifest: 'SHA256SUMS.txt',
                priority_first: ['hosp/patients.csv.gz', 'hosp/omr.csv.gz'],
                notes: 'New notes.\n'
            }
        });
        const after = readFileSync(file, 'utf8');
        expect(after).toContain('manifest: "SHA256SUMS.txt"      # 33 files');
        expect(after).toContain('priority_first:                 # fetch first');
        expect(after).toContain('        - hosp/omr.csv.gz\n');
        expect(after).not.toContain('Requires a completed DUA');
        expect(after).toContain('New notes.');
    });

    it('addresses a venue by its id and writes the short name alone', () => {
        const root = wider();
        const file = plant(root, 'registries/venues.yml', VENUES);
        const out = writeEntry(root, configFor(), 'venues', 'existing', { short: 'EV' });
        expect(out.changed).toEqual(['short']);
        expect(readFileSync(file, 'utf8')).toBe(`${VENUES}    short: EV\n`);
    });

    it('renames a venue through its name and leaves its id', () => {
        const root = wider();
        const file = plant(root, 'registries/venues.yml', VENUES);
        const out = writeEntry(root, configFor(), 'venues', 'existing', { name: 'Renamed Venue' });
        expect(out.changed).toEqual(['name']);
        expect(out.id).toBe('existing');
        expect(out.records).toMatchObject([
            { key: 'Renamed Venue', was: 'Existing Venue', field: 'name', undo: 'field' }
        ]);
        expect(readFileSync(file, 'utf8')).toBe(VENUES.replace('Existing Venue', 'Renamed Venue'));
    });

    it('refuses a select value that is none of its options and leaves the file', () => {
        const root = wider();
        plant(root, 'registries/data.yml', DATA);
        const before = readFileSync(join(root, 'registries/data.yml'), 'utf8');
        const out = writeEntry(root, configFor(), 'data', 'mimic', {
            retrieval: { method: 'carrier pigeon' }
        });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            {
                field: 'retrieval',
                reason: words(
                    configFor().text,
                    'server.entries.type_options',
                    'method',
                    'direct, physionet'
                )
            }
        ]);
        expect(readFileSync(join(root, 'registries/data.yml'), 'utf8')).toBe(before);
    });
});

describe('a file with two entries of one identity', () => {
    const TWICE =
        'title: Tasks\nschema:\n  - { field: key, type: text }\nentries:\n  - key: a\n  - key: a\n';
    const sentence = words(configFor().text, 'server.entries.shared_identity', 'key', 'a');

    it('refuses a write, an add and a delete with the shared-identity sentence and leaves the file', () => {
        const root = wider();
        const file = plant(root, 'tasks/tasks.yml', TWICE);
        const outs = [
            writeEntry(root, configFor(), 'tasks', 'a', { key: 'a' }),
            createEntry(root, configFor(), 'tasks', { key: 'b' }),
            removeEntry(root, configFor(), 'tasks', 'a')
        ];
        expect(outs.map((one) => one.refused)).toEqual([
            [{ field: 'key', reason: sentence }],
            [{ field: 'key', reason: sentence }],
            [{ field: 'key', reason: sentence }]
        ]);
        expect(readFileSync(file, 'utf8')).toBe(TWICE);
    });
});
