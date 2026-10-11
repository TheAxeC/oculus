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

import { mkdirSync, readdirSync, readFileSync, symlinkSync } from 'node:fs';
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
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    MANIFEST,
    configFor,
    record,
    manifestPath,
    personalWorld,
    type PersonalWorld,
    tasksPath,
    TASKS,
    CAREER,
    wider,
    tasksOf
} from './writes-fixture.ts';
import { PERSONAL_MANIFEST } from '../../routes/edit/write-fixture.ts';

/**
 * The files a row of the tables below writes in: a research manifest and two personal manifests.
 */
type Subject = 'alpha' | 'idea' | 'r';

const SUBJECTS: Subject[] = ['alpha', 'idea', 'r'];

/** The file of each subject in a world. */
function fileOf(world: PersonalWorld, subject: Subject): string {
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

const PERSONAL_ROWS = (['idea', 'r'] as const).flatMap((id): FieldRow[] => [
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
                        offset: PERSONAL_MANIFEST.indexOf('snooze'),
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
        name: `${id}: a field outside the manifest schema`,
        id,
        fields: { venue: 'somewhere' },
        changes: null,
        answer: () => ({
            found: true,
            changed: [],
            refused: [{ field: 'venue', reason: 'the manifest schema does not name the field' }],
            records: []
        })
    },
    {
        name: `${id}: the id, which no write sets`,
        id,
        fields: { id: 'renamed' },
        changes: null,
        answer: () => ({
            found: true,
            changed: [],
            refused: [
                {
                    field: 'id',
                    reason: 'the id is the name of the folder, or for a repository the key of its roots: entry; rename that to change it'
                }
            ],
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
    ...PERSONAL_ROWS,
    ...['gone'].map((id): FieldRow => ({
        name: `${id}: an id the published portfolio does not hold`,
        id,
        fields: { snooze: '2026-12-01' },
        changes: null,
        answer: () => ({ found: false, changed: [], refused: [] })
    }))
];

describe('the file itself', () => {
    it.each(FIELD_ROWS)('writes the changed field and nothing else', (row) => {
        const world = personalWorld();
        const before = Object.fromEntries(
            SUBJECTS.map((one) => [one, readFileSync(fileOf(world, one), 'utf8')])
        );
        const file = row.changes === null ? '' : fileOf(world, row.changes.subject);
        const out = writeManifest(world.root, world.config, row.id, row.fields);
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
    { name: 'a hub project', subject: 'idea', first: 1, added: '  - { do: write it }\n' },
    { name: 'a repository project', subject: 'r', first: 1, added: '  - { do: write it }\n' }
];

describe('writing one subtask line', () => {
    it.each(LINE_ROWS)('ticks and reopens a line of a manifest', { tags: ['slow'] }, (row) => {
        const world = personalWorld();
        const file = fileOf(world, row.subject);
        const original = readFileSync(file, 'utf8');
        const into = [world.root, world.config] as const;
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
                one === 'alpha' ? MANIFEST : PERSONAL_MANIFEST
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

describe('adding an entry', () => {
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
});

const RESEARCH_STATUS = 'New idea: scope and novelty check open.';
const RESEARCH_NEXT = 'Scope the idea; cited-novelty lit check; decide go/no-go.';

/** The manifest `createIdea` writes for a project named `new-idea`, from the lines that differ. */
function ideaManifest(tier: string, focus: boolean, line: string, next: string | null): string {
    return [
        'id: new-idea',
        `tier: ${tier}`,
        'type: idea',
        'title: A new idea',
        ...(focus ? ['focus: holding'] : []),
        'status:',
        '  chips: [nascent]',
        `  line: ${line.includes(':') ? `"${line}"` : line}`,
        'eli5: what it is',
        ...(next === null ? [] : [`next: ${next}`]),
        ''
    ].join('\n');
}

const FORM = { id: 'new-idea', title: 'A new idea', eli5: 'what it is' };

const IDEA_ROWS = [
    {
        name: 'the Projects board, in the hub folder of the tier',
        fields: { ...FORM, tier: 'projects' },
        parent: 'projects/ideas',
        manifest: ideaManifest('projects', true, RESEARCH_STATUS, RESEARCH_NEXT),
        readme: `# A new idea\n\nwhat it is\n\n## Next\n\n${RESEARCH_NEXT}\n`
    },
    {
        name: 'the Personal board, in the hub folder of the tier',
        fields: { ...FORM, tier: 'personal' },
        parent: 'side-projects',
        manifest: ideaManifest('personal', true, 'New project.', null),
        readme: '# A new idea\n\nwhat it is\n'
    },
    {
        name: 'the Archive board, in a folder the reader typed',
        fields: { ...FORM, tier: 'archive', folder: 'projects/archive/old' },
        parent: 'projects/archive/old',
        manifest: ideaManifest('archive', false, RESEARCH_STATUS, RESEARCH_NEXT),
        readme: `# A new idea\n\nwhat it is\n\n## Next\n\n${RESEARCH_NEXT}\n`
    },
    {
        name: 'a write that names no tier and no folder, as Lit Watch makes it',
        fields: FORM,
        parent: 'projects/ideas',
        manifest: ideaManifest('projects', true, RESEARCH_STATUS, RESEARCH_NEXT),
        readme: `# A new idea\n\nwhat it is\n\n## Next\n\n${RESEARCH_NEXT}\n`
    }
];

describe('adding an idea', () => {
    it.each(IDEA_ROWS)('scaffolds an idea folder with a manifest and a README on $name', (row) => {
        const root = wider();
        const out = createIdea(root, configFor(), row.fields);
        expect(out.changed).toEqual([
            `${row.parent}/new-idea/project.yml`,
            `${row.parent}/new-idea/README.md`
        ]);
        const folder = join(root, row.parent, 'new-idea');
        expect(readFileSync(join(folder, 'project.yml'), 'utf8')).toBe(row.manifest);
        expect(readFileSync(join(folder, 'README.md'), 'utf8')).toBe(row.readme);
    });

    const NONE = { ...configFor(), newProjectDir: {} };

    const REFUSALS = [
        {
            name: 'an archive project sent with no folder, since the hub names none for the tier',
            fields: { ...FORM, tier: 'archive' },
            field: 'folder',
            reason: 'the hub names no folder for new projects of the tier archive'
        },
        {
            name: 'a write with no tier and no folder over a hub that names none for projects',
            fields: FORM,
            config: NONE,
            field: 'folder',
            reason: 'the hub names no folder for new projects of the tier projects'
        },
        {
            name: 'an empty folder',
            fields: { ...FORM, tier: 'personal', folder: '' },
            field: 'folder',
            reason: 'a new project needs a folder'
        },
        {
            name: 'a folder outside every scan folder',
            fields: { ...FORM, tier: 'projects', folder: 'elsewhere' },
            field: 'folder',
            reason: 'the folder elsewhere is not inside a folder the hub scans for projects'
        },
        {
            name: 'a folder inside an existing project',
            fields: { ...FORM, tier: 'projects', folder: 'projects/manuscripts/alpha/sub' },
            field: 'folder',
            reason: 'the folder projects/manuscripts/alpha/sub lies inside the project in projects/manuscripts/alpha'
        },
        {
            name: 'a folder that is already there',
            fields: { ...FORM, id: 'taken', tier: 'projects', folder: 'projects/ideas' },
            field: 'id',
            reason: 'projects/ideas/taken is already there'
        },
        {
            name: 'a tier that cannot be made',
            fields: { ...FORM, tier: 'software' },
            field: 'tier',
            reason: 'a new project cannot have the tier software'
        }
    ];

    it.each(REFUSALS)('refuses $name with its sentence and writes nothing', (row) => {
        const root = wider();
        mkdirSync(join(root, 'projects', 'ideas', 'taken'), { recursive: true });
        const listing = (): string[] => readdirSync(root, { recursive: true }).map(String).sort();
        const before = listing();
        const out = createIdea(root, row.config ?? configFor(), row.fields);
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([{ field: row.field, reason: row.reason }]);
        expect(listing()).toEqual(before);
    });

    const LINKS = [
        { name: 'a folder outside the hub', target: (outside: string) => outside },
        { name: 'a folder that is not there', target: (outside: string) => join(outside, 'gone') }
    ];

    it.each(LINKS)(
        'refuses a folder typed through a link to $name and writes nothing on either side',
        (row) => {
            const root = wider();
            const outside = scratchDir('oculus-outside-');
            mkdirSync(join(root, 'side-projects'), { recursive: true });
            symlinkSync(row.target(outside), join(root, 'side-projects', 'link'));
            const listing = (dir: string): string[] =>
                readdirSync(dir, { recursive: true }).map(String).sort();
            const before = { hub: listing(root), outside: listing(outside) };
            const folder = 'side-projects/link/inner';
            const out = createIdea(root, configFor(), { ...FORM, tier: 'personal', folder });
            expect(out.changed).toEqual([]);
            expect(out.refused).toEqual([
                {
                    field: 'folder',
                    reason: `the folder ${folder} is not inside a folder the hub scans for projects`
                }
            ]);
            expect({ hub: listing(root), outside: listing(outside) }).toEqual(before);
        }
    );

    it('refuses a folder typed through a link into a subfolder of a project and writes nothing', () => {
        const root = wider();
        const inner = join(root, 'projects', 'manuscripts', 'alpha', 'docs');
        mkdirSync(inner, { recursive: true });
        mkdirSync(join(root, 'side-projects'), { recursive: true });
        symlinkSync(inner, join(root, 'side-projects', 'link'));
        const listing = (): string[] => readdirSync(root, { recursive: true }).map(String).sort();
        const before = listing();
        const folder = 'side-projects/link';
        const out = createIdea(root, configFor(), { ...FORM, tier: 'personal', folder });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            {
                field: 'folder',
                reason: `the folder ${folder} lies inside the project in projects/manuscripts/alpha`
            }
        ]);
        expect(listing()).toEqual(before);
    });
});
