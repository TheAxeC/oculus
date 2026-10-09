// What writeManifest does over a hub of its own: the subtask, career host, entry and idea writes
// beside it. The collection entry writes are writes-collection.test.ts, beside this.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing, and the schema it checks against is the real config/schemas/manifest-schema.yml,
// so what the form offers and what the write accepts are the same list.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    createEntry,
    createIdea,
    writeHost,
    writeManifest,
    writeSubtask,
    writeSubtaskAdd
} from '../../../src/lib/server/edit/writes.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    MANIFEST,
    configFor,
    record,
    manifestPath,
    sideWorld,
    type SideWorld,
    tasksPath,
    TASKS,
    CAREER,
    wider,
    tasksOf
} from './writes-fixture.ts';
import { SIDE_MANIFEST } from '../../routes/edit/write-fixture.ts';

/** The files a row of the tables below writes in: a research manifest and two side manifests. */
type Subject = 'alpha' | 'side:idea' | 'root:r';

const SUBJECTS: Subject[] = ['alpha', 'side:idea', 'root:r'];

/** The file of each subject in a world. */
function fileOf(world: SideWorld, subject: Subject): string {
    return subject === 'alpha' ? manifestPath(world.root) : world.files[subject];
}

type FieldRow = {
    name: string;
    id: string;
    fields: Record<string, unknown>;
    /** The one file the write changes and the text it then holds; null when nothing is written. */
    changes: { subject: Subject; after: (before: string) => string } | null;
    /** What the write answers, given the file the write lands on. */
    answer: (file: string) => unknown;
};

const SIDE_ROWS = (['side:idea', 'root:r'] as const).flatMap((id): FieldRow[] => [
    {
        name: `${id}: a snooze set`,
        id,
        fields: { snooze: '2026-12-01' },
        changes: { subject: id, after: (text) => text.replace('2026-11-01', '2026-12-01') },
        answer: (file) => ({
            found: true,
            changed: ['snooze'],
            refused: [],
            records: [record(file, id, 'snooze', '2026-11-01', '2026-12-01')]
        })
    },
    {
        name: `${id}: a snooze woken`,
        id,
        fields: { snooze: '' },
        changes: { subject: id, after: (text) => text.replace('snooze: 2026-11-01\n', '') },
        answer: (file) => ({
            found: true,
            changed: ['snooze'],
            refused: [],
            records: [
                {
                    ...(record(file, id, 'snooze', '2026-11-01', null) as object),
                    removed: {
                        offset: SIDE_MANIFEST.indexOf('snooze'),
                        text: 'snooze: 2026-11-01\n',
                        next: 'subtasks:'
                    }
                }
            ]
        })
    },
    {
        name: `${id}: a latest line set`,
        id,
        fields: { latest: 'drafted the first page' },
        changes: { subject: id, after: (text) => `${text}latest: drafted the first page\n` },
        answer: (file) => ({
            found: true,
            changed: ['latest'],
            refused: [],
            records: [record(file, id, 'latest', null, 'drafted the first page')]
        })
    },
    {
        name: `${id}: a field outside side_project_schema`,
        id,
        fields: { venue: 'somewhere' },
        changes: null,
        answer: () => ({
            found: true,
            changed: [],
            refused: [{ field: 'venue', reason: 'the manifest schema does not name the field' }],
            records: []
        })
    }
]);

const FIELD_ROWS: FieldRow[] = [
    {
        name: 'a research project: a status line',
        id: 'alpha',
        fields: { 'status.line': 'a new line' },
        changes: { subject: 'alpha', after: (text) => text.replace('"the line"', '"a new line"') },
        answer: (file) => ({
            found: true,
            changed: ['status.line'],
            refused: [],
            records: [record(file, 'alpha', 'status.line', 'the line', 'a new line')]
        })
    },
    ...SIDE_ROWS,
    ...['side:gone', 'root:gone'].map((id): FieldRow => ({
        name: `${id}: an id the published portfolio does not hold`,
        id,
        fields: { snooze: '2026-12-01' },
        changes: null,
        answer: () => ({ found: false, changed: [], refused: [] })
    }))
];

describe('the file itself', () => {
    it.each(FIELD_ROWS)('writes the changed field and nothing else', (row) => {
        const world = sideWorld();
        const before = Object.fromEntries(
            SUBJECTS.map((one) => [one, readFileSync(fileOf(world, one), 'utf8')])
        );
        const file = row.changes === null ? '' : fileOf(world, row.changes.subject);
        const out = writeManifest(world.root, world.config, world.sides, row.id, row.fields);
        expect(out, row.name).toEqual(row.answer(file));
        for (const one of SUBJECTS) {
            const written = row.changes?.subject === one;
            const expected = written ? row.changes?.after(before[one]) : before[one];
            expect(readFileSync(fileOf(world, one), 'utf8'), `${row.name}: ${one}`).toBe(expected);
        }
    });
});

/** A row of the subtask-line table: `added` is the text the add appends to the file. */
type LineRow = { name: string; subject: Subject; first: number; added: string };

const LINE_ROWS: LineRow[] = [
    {
        name: 'a research project',
        subject: 'alpha',
        first: 0,
        added: 'subtasks:\n  - { do: write it }\n'
    },
    { name: 'side:idea', subject: 'side:idea', first: 1, added: '  - { do: write it }\n' },
    { name: 'root:r', subject: 'root:r', first: 1, added: '  - { do: write it }\n' }
];

describe('writing one subtask line', () => {
    it.each(LINE_ROWS)('ticks and reopens a line of a manifest', { tags: ['slow'] }, (row) => {
        const world = sideWorld();
        const file = fileOf(world, row.subject);
        const original = readFileSync(file, 'utf8');
        const into = [world.root, world.config, world.sides] as const;
        const host = { id: row.subject };
        const key = String(row.first);
        expect(writeManifest(...into, row.subject, {}).changed, row.name).toEqual([]);
        const added = writeSubtaskAdd(...into, host, { do: 'write it' });
        expect(added.changed, row.name).toEqual(['subtasks']);
        expect(readFileSync(file, 'utf8'), row.name).toBe(original + row.added);
        const done = writeSubtask(...into, host, key, 'done');
        expect(done.changed, row.name).toEqual(['done']);
        expect(readFileSync(file, 'utf8'), row.name).toContain('- { do: write it, done: true }');
        const open = writeSubtask(...into, host, key, 'reopen');
        expect(open.changed, row.name).toEqual(['done']);
        expect(readFileSync(file, 'utf8'), row.name).toContain('- { do: write it }');
        const removed = writeSubtask(...into, host, key, 'delete');
        expect(removed.changed, row.name).toEqual(['subtasks']);
        expect(readFileSync(file, 'utf8'), row.name).not.toContain('write it');
        for (const one of SUBJECTS.filter((other) => other !== row.subject))
            expect(readFileSync(fileOf(world, one), 'utf8'), `${row.name}: ${one}`).toBe(
                one === 'alpha' ? MANIFEST : SIDE_MANIFEST
            );
        if (row.subject !== 'alpha') expect(readFileSync(file, 'utf8'), row.name).toBe(original);
    });
});

describe('writing one career host', () => {
    it('sets a status of the vocabulary and refuses one outside it', () => {
        const root = wider();
        const out = writeHost(
            root,
            'Naesens',
            'candidate',
            careerRules(loadConfig(engineDir()).config)
        );
        expect(out).toEqual({
            found: true,
            changed: ['status'],
            refused: [],
            records: [
                record(
                    join(root, 'registries/career.yml'),
                    'Naesens',
                    'status',
                    'warm',
                    'candidate'
                )
            ]
        });
        expect(readFileSync(join(root, 'registries/career.yml'), 'utf8')).toBe(
            CAREER.replace('status: "warm"', 'status: "candidate"')
        );
        const bad = writeHost(
            root,
            'Naesens',
            'promoted',
            careerRules(loadConfig(engineDir()).config)
        );
        expect(bad.changed).toEqual([]);
        expect(bad.refused).toEqual([
            { field: 'status', reason: 'promoted is not a career host status' }
        ]);
    });
});

describe('adding an entry and an idea', () => {
    it('appends a new entry rendered from the file schema', () => {
        const root = wider();
        const out = createEntry(root, configFor(), 'tasks', {
            title: 'A new task',
            status: 'open'
        });
        expect(out).toEqual({
            found: true,
            id: 'A new task',
            changed: ['entries'],
            refused: [],
            records: [
                record(
                    tasksPath(root),
                    'A new task',
                    'entries',
                    null,
                    {
                        title: 'A new task',
                        status: 'open'
                    },
                    'create'
                )
            ]
        });
        expect(tasksOf(root)).toBe(`${TASKS}\n  - title: A new task\n    status: open\n`);
    });

    it('scaffolds an idea folder with a manifest and a README', () => {
        const root = wider();
        const out = createIdea(root, configFor().text, {
            id: 'new-idea',
            title: 'A new idea',
            eli5: 'what it is'
        });
        expect(out.changed).toEqual([
            'projects/ideas/new-idea/project.yml',
            'projects/ideas/new-idea/README.md'
        ]);
        const folder = join(root, 'projects', 'ideas', 'new-idea');
        expect(readFileSync(join(folder, 'project.yml'), 'utf8')).toBe(
            [
                'id: new-idea',
                'type: idea',
                'title: A new idea',
                'focus: holding',
                'status:',
                '  chips: [nascent]',
                '  line: New idea - scope + novelty check open.',
                'eli5: what it is',
                'next: Scope the idea; cited-novelty lit check; decide go/no-go.',
                ''
            ].join('\n')
        );
        expect(readFileSync(join(folder, 'README.md'), 'utf8')).toBe(
            '# A new idea\n\nwhat it is\n\n## Next\n\nScope the idea; cited-novelty lit check; decide go/no-go.\n'
        );
    });
});
