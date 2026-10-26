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
        writeFileSync(tasksPath(root), TWO);
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
        writeFileSync(tasksPath(root), TWO);
        const out = removeEntry(root, configFor(), 'tasks', 'Another task');
        expect(out.changed).toEqual(['entries']);
        expect(tasksOf(root)).toBe(TASKS);
    });
});

const EVENTS = [
    'title: Events',
    'schema:',
    '  - { field: key, type: text, primary_key: true }',
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
    '  - { field: key, type: text, primary_key: true }',
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

/** A venues file whose primary key `id` is not its first field. */
const VENUES = [
    'title: Venues',
    'schema:',
    '  - { field: name, type: text, display: 2 }',
    '  - { field: id, type: text, primary_key: true }',
    '  - { field: short, type: text, display: 1 }',
    'venues:',
    '  - name: Existing Venue',
    '    id: existing',
    ''
].join('\n');

describe('writing the fields an entry editor posts', () => {
    it('adds one row of a metalist and writes that field alone', () => {
        const root = wider();
        const file = plant(root, '.oculus/data/academic/events.yml', EVENTS);
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
        const file = plant(root, '.oculus/data/research/data.yml', DATA);
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
        const file = plant(root, '.oculus/data/research/data.yml', DATA);
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
        const file = plant(root, '.oculus/data/research/venues.yml', VENUES);
        const out = writeEntry(root, configFor(), 'venues', 'existing', { short: 'EV' });
        expect(out.changed).toEqual(['short']);
        expect(readFileSync(file, 'utf8')).toBe(`${VENUES}    short: EV\n`);
    });

    it('renames a venue through its name and leaves its id', () => {
        const root = wider();
        const file = plant(root, '.oculus/data/research/venues.yml', VENUES);
        const out = writeEntry(root, configFor(), 'venues', 'existing', { name: 'Renamed Venue' });
        expect(out.changed).toEqual(['name']);
        expect(out.id).toBe('existing');
        expect(out.records).toEqual([
            expect.objectContaining({ key: 'existing', field: 'name', undo: 'field' })
        ]);
        expect(out.records?.[0]).not.toHaveProperty('was');
        expect(readFileSync(file, 'utf8')).toBe(VENUES.replace('Existing Venue', 'Renamed Venue'));
    });

    it('refuses a select value that is none of its options and leaves the file', () => {
        const root = wider();
        plant(root, '.oculus/data/research/data.yml', DATA);
        const before = readFileSync(join(root, '.oculus/data/research/data.yml'), 'utf8');
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
        expect(readFileSync(join(root, '.oculus/data/research/data.yml'), 'utf8')).toBe(before);
    });
});

describe('a file with two entries of one identity', () => {
    const TWICE = [
        'title: Tasks',
        'schema:',
        '  - { field: key, type: text, primary_key: true }',
        'entries:',
        '  - key: a',
        '  - key: a',
        ''
    ].join('\n');
    const sentence = words(configFor().text, 'server.entries.shared_identity', 'key', 'a');

    it('refuses a write, an add and a delete with the shared-identity sentence and leaves the file', () => {
        const root = wider();
        const file = plant(root, '.oculus/data/academic/tasks.yml', TWICE);
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

describe('the primary key a write addresses an entry by (G8)', () => {
    it('edits a venue by its id when the hub keys the venues collection journals', () => {
        const root = wider();
        const file = plant(root, '.oculus/data/research/venues.yml', VENUES);
        const config = configFor();
        const collections = config.collections.map((one) =>
            one.key === 'venues' ? { ...one, key: 'journals' } : one
        );
        const out = writeEntry(root, { ...config, collections }, 'journals', 'existing', {
            short: 'EV'
        });
        expect(out.changed).toEqual(['short']);
        expect(readFileSync(file, 'utf8')).toBe(`${VENUES}    short: EV\n`);
    });

    it('adds, renames and removes a bookmark by its label, the primary key of its scaffold', () => {
        const root = wider();
        const own = join(root, 'bookmarks.yml');
        const config = configFor();
        const fields = { label: 'Notes', root: 'hub', path: 'notes' };
        const added = createEntry(root, config, 'bookmarks', fields, own);
        const renamed = writeEntry(root, config, 'bookmarks', 'Notes', { label: 'Mine' }, own);
        const after = readFileSync(own, 'utf8');
        const removed = removeEntry(root, config, 'bookmarks', 'Mine', own);
        expect([added, renamed, removed].map((one) => one.refused)).toEqual([[], [], []]);
        expect(renamed.changed).toEqual(['label']);
        expect(after).toContain('  - label: Mine\n    root: hub\n    path: notes\n');
        expect(readFileSync(own, 'utf8')).not.toContain('label: Mine');
    });

    it('removes a venue by its id, the primary key that is not its first field', () => {
        const root = wider();
        const second = '  - name: Second Venue\n    id: second\n';
        const file = plant(root, '.oculus/data/research/venues.yml', `${VENUES}${second}`);
        const out = removeEntry(root, configFor(), 'venues', 'existing');
        expect(out.changed).toEqual(['venues']);
        const first = '  - name: Existing Venue\n    id: existing\n';
        expect(readFileSync(file, 'utf8')).toBe(VENUES.replace(first, second));
    });

    it('refuses a cleared primary key and writes the other fields of the edit', () => {
        const root = wider();
        const file = plant(root, '.oculus/data/research/venues.yml', VENUES);
        const out = writeEntry(root, configFor(), 'venues', 'existing', { id: ' ', short: 'EV' });
        expect(out.changed).toEqual(['short']);
        expect(out.refused).toEqual([
            { field: 'id', reason: words(configFor().text, 'server.entries.key_empty', 'id') }
        ]);
        expect(readFileSync(file, 'utf8')).toBe(`${VENUES}    short: EV\n`);
    });

    const PEOPLE_FILE = '.oculus/data/people/people.yml';
    const PEOPLE = [
        'title: People',
        'schema:',
        '  - { field: name, type: text, display: 1 }',
        '  - { field: key, type: text, primary_key: true }',
        '  - { field: role, type: text }',
        'people:',
        '  - name: Alan Turing',
        '    key: alan',
        '  - name: Ada Lovelace',
        '    key: ada',
        '    role: lead',
        ''
    ].join('\n');

    it('edits and removes a person by key, whose display is the name', () => {
        const root = wider();
        const file = plant(root, '.oculus/data/people/people.yml', PEOPLE);
        const edited = writeEntry(root, configFor(), 'people', 'ada', { role: 'adviser' });
        expect(edited).toMatchObject({ found: true, id: 'ada', changed: ['role'] });
        const removed = removeEntry(root, configFor(), 'people', 'alan');
        expect(removed.changed).toEqual(['people']);
        expect(readFileSync(file, 'utf8')).toBe(
            PEOPLE.replace('role: lead', 'role: adviser').replace(
                '  - name: Alan Turing\n    key: alan\n',
                ''
            )
        );
    });

    it('refuses an edit, a reorder, an Add and a remove of a file with no primary key', () => {
        const root = wider();
        const body = PEOPLE.replace(', primary_key: true', '');
        const file = plant(root, '.oculus/data/people/people.yml', body);
        const config = configFor();
        const sentence = words(config.text, 'server.entries.no_primary_key_none', PEOPLE_FILE);
        const outs = [
            writeEntry(root, config, 'people', 'ada', { role: 'adviser' }),
            reorderCollection(root, config, 'people', ['alan', 'ada']),
            createEntry(root, config, 'people', { key: 'grace', name: 'Grace Hopper' }),
            removeEntry(root, config, 'people', 'alan')
        ];
        expect(outs.map((one) => one.refused)).toEqual(
            outs.map(() => [{ field: 'schema', reason: sentence }])
        );
        expect(readFileSync(file, 'utf8')).toBe(body);
    });

    /** The settings with the people entry of `collections:` naming `key` as its primary key. */
    function namingKey(): ReturnType<typeof configFor> {
        const config = configFor();
        const collections = config.collections.map((one) =>
            one.key === 'people' ? { ...one, primary_key: 'key' } : one
        );
        return { ...config, collections };
    }

    type Catalog = Record<string, string>;
    it.each<[string, string, () => ReturnType<typeof configFor>, (text: Catalog) => string]>([
        [
            'two flagged fields',
            PEOPLE.replace(
                '{ field: name, type: text, display: 1 }',
                '{ field: name, type: text, display: 1, primary_key: true }'
            ),
            configFor,
            (text) => words(text, 'server.entries.no_primary_key_two', PEOPLE_FILE, 'name, key')
        ],
        [
            'a flag on a tags field',
            PEOPLE.replace(', primary_key: true', '').replace(
                '{ field: role, type: text }',
                '{ field: role, type: tags, primary_key: true }'
            ),
            configFor,
            (text) =>
                words(text, 'server.entries.no_primary_key_unkeyed', PEOPLE_FILE, 'role', 'tags')
        ],
        [
            'a primary_key that is not true',
            PEOPLE.replace('primary_key: true', 'primary_key: "yes"'),
            configFor,
            (text) => words(text, 'server.entries.no_primary_key_none', PEOPLE_FILE)
        ],
        [
            "an entry's primary_key beside the schema's flag",
            PEOPLE,
            namingKey,
            (text) => words(text, 'server.entries.no_primary_key_beside', PEOPLE_FILE, 'key', 'key')
        ],
        [
            'a schema that does not read, though it flags key',
            PEOPLE.replace('{ field: role, type: text }', '{ field: role, typ: text }'),
            configFor,
            (text) => words(text, 'server.entries.no_primary_key_unread', PEOPLE_FILE)
        ],
        [
            'no flag in its schema and a primary_key named by its entry',
            PEOPLE.replace(', primary_key: true', ''),
            namingKey,
            (text) => words(text, 'server.entries.no_primary_key_named', PEOPLE_FILE, 'key')
        ],
        [
            'no schema and no primary_key named by its entry',
            PEOPLE.replace(/schema:\n(?: {2}- .*\n)+/, ''),
            configFor,
            (text) => words(text, 'server.entries.no_primary_key_missing', PEOPLE_FILE)
        ]
    ])(
        'refuses every write to a file with %s, naming the cause (G8)',
        (_name, body, settings, reason) => {
            const root = wider();
            const file = plant(root, PEOPLE_FILE, body);
            const config = settings();
            const out = writeEntry(root, config, 'people', 'ada', { role: 'adviser' });
            expect(out.refused).toEqual([{ field: 'schema', reason: reason(config.text) }]);
            expect(readFileSync(file, 'utf8')).toBe(body);
        }
    );
});
