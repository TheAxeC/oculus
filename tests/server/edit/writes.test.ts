// What writeManifest does over a hub of its own: the career, entry and idea writes beside it. The
// subtask and follow-up line writes are lines.test.ts, and the collection entry writes
// writes-collection.test.ts, beside this.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing, and the schema it checks against is the real config/schemas/manifest-schema.yml,
// so what the form offers and what the write accepts are the same list.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.
// @module-tag slow: its cases write a hub of their own and time out under the load of a full npm
// test, so npm test leaves it out.

import { mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { createEntry, createIdea, writeManifest } from '../../../src/lib/server/edit/writes.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { careerRules, writeCareer } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { DEMO_HUB } from '../../fixtures/hubs/real-hub.ts';
import {
    MANIFEST,
    SUBJECTS,
    configFor,
    fileOf,
    hub,
    record,
    manifestPath,
    personalWorld,
    type Subject,
    tasksPath,
    TASKS,
    KEYED,
    plant,
    VENUES,
    wider,
    tasksOf
} from './writes-fixture.ts';
import { PERSONAL_MANIFEST } from '../../routes/edit/write-fixture.ts';
import type { PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';

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
        fields: { venue_id: 'somewhere' },
        changes: null,
        answer: () => ({
            found: true,
            changed: [],
            refused: [{ field: 'venue_id', reason: 'the manifest schema does not name the field' }],
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
                    reason: 'the id is the name of the folder, or for a repository the name of its workspace folder; rename that to change it'
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

describe('a field a hub adds to the project form', () => {
    it("writes the hub's added field into its manifest and refuses it where no hub adds it", () => {
        const root = hub();
        const added = loadConfig(engineDir(), {
            hub: root,
            instead: {
                layer: 'hub',
                name: '.oculus/config.yml',
                text: 'manifest_fields: [ { field: grant_id, label: Grant, type: text, section: Core, help: "The grant number." } ]\n'
            }
        });
        const config = { ...configFor(), schema: portfolioConfigFrom(added.config).schema };
        const file = manifestPath(root);
        const out = writeManifest(root, config, 'alpha', { grant_id: 'X1' });
        expect(out).toEqual({
            found: true,
            changed: ['grant_id'],
            refused: [],
            records: [record(file, 'alpha', 'grant_id', null, 'X1')]
        });
        expect(readFileSync(file, 'utf8')).toBe(`${MANIFEST}grant_id: X1\n`);
        const other = hub();
        const refused = writeManifest(other, configFor(), 'alpha', { grant_id: 'X1' });
        expect(refused).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'grant_id', reason: 'the manifest schema does not name the field' }],
            records: []
        });
        expect(readFileSync(manifestPath(other), 'utf8')).toBe(MANIFEST);
    });
});

const CAREER_SECTIONS = [
    '# the strategy',
    'title: Career strategy',
    'milestone: Veni 2026',
    'milestone_date: 2026-09-01',
    'schema:',
    '  - { field: title, type: text }',
    '  - { field: milestone, type: text }',
    '  - { field: milestone_date, type: date }',
    '  - { field: situation, type: records, open: true, fields: [] }',
    '  - field: order',
    '    type: records',
    '    fields:',
    '      - { field: task, type: text }',
    '      - { field: when, type: text }',
    'situation:',
    '  PhD: "May 2023"   # the defence',
    '  Now: "Postdoc"',
    'order:',
    '  - { task: "Veni pre-proposal", when: "1 Sep" }',
    '  - { task: "ENW-XS", when: "15 Sep" }',
    ''
].join('\n');

describe('writing career sections', () => {
    const rules = careerRules(loadConfig(engineDir(), { hub: DEMO_HUB }).config);
    const catalog = configFor().text;

    function careerHub(): { root: string; file: string } {
        const root = wider();
        const file = join(root, '.oculus/data/academic/career.yml');
        writeFileSync(file, CAREER_SECTIONS);
        return { root, file };
    }

    it('writes the changed section alone and records its before and after', () => {
        const { root, file } = careerHub();
        const out = writeCareer(root, { milestone: 'Veni 2027' }, rules, catalog);
        expect(out.changed).toEqual(['milestone']);
        expect(out.records).toEqual([
            record(file, 'career', 'milestone', 'Veni 2026', 'Veni 2027')
        ]);
        expect(readFileSync(file, 'utf8')).toBe(
            CAREER_SECTIONS.replace('milestone: Veni 2026', 'milestone: Veni 2027')
        );
    });

    it('writes a renamed label and a changed sentence of the situation as one map', () => {
        const { root, file } = careerHub();
        const out = writeCareer(
            root,
            { situation: { PhD: 'May 2023', 'Postdoc since': 'Sep 2024' } },
            rules,
            catalog
        );
        expect(out.changed).toEqual(['situation']);
        const text = readFileSync(file, 'utf8');
        expect(text).toContain('# the strategy');
        expect(text).toContain('PhD: "May 2023"   # the defence');
        expect(text).toContain('Postdoc since: "Sep 2024"');
        expect(text).not.toContain('Now:');
        expect(text).toContain('order:\n  - { task: "Veni pre-proposal"');
    });

    it('changes the day of one task of the order of work and keeps the other tasks', () => {
        const { root, file } = careerHub();
        const out = writeCareer(
            root,
            {
                order: [
                    { task: 'Veni pre-proposal', when: '1 Oct' },
                    { task: 'ENW-XS', when: '15 Sep' }
                ]
            },
            rules,
            catalog
        );
        expect(out.changed).toEqual(['order']);
        expect(readFileSync(file, 'utf8')).toBe(
            CAREER_SECTIONS.replace('when: "1 Sep"', 'when: "1 Oct"')
        );
    });

    it('changes one fact of the situation and keeps the other with its comment', () => {
        const { root, file } = careerHub();
        writeCareer(
            root,
            { situation: { PhD: 'May 2023', Now: 'Assistant professor' } },
            rules,
            catalog
        );
        expect(readFileSync(file, 'utf8')).toBe(
            CAREER_SECTIONS.replace('Now: "Postdoc"', 'Now: "Assistant professor"')
        );
    });

    it('refuses a value of the wrong type for a section and writes nothing', () => {
        const { root, file } = careerHub();
        const out = writeCareer(root, { milestone_date: 'soon' }, rules, catalog);
        expect(out.changed).toEqual([]);
        expect(out.refused).toHaveLength(1);
        expect(readFileSync(file, 'utf8')).toBe(CAREER_SECTIONS);
    });

    const NO_SCHEMA = 'title: Career strategy\nmilestone: Veni 2026\n';

    it.each([
        { name: 'the key schema', fields: { schema: 'x' }, key: 'schema_key' },
        { name: 'an empty key', fields: { '': 'x' }, key: 'blank_key' },
        { name: 'a blank key', fields: { '  ': 'x' }, key: 'blank_key' },
        { name: 'a key the schema does not name', fields: { notes: 'x' }, key: 'not_field' }
    ])('refuses $name and writes nothing for it', ({ fields, key }) => {
        const { root, file } = careerHub();
        const [name] = Object.keys(fields);
        const out = writeCareer(root, { milestone: 'Veni 2027', ...fields }, rules, catalog);
        expect(out.changed).toEqual(['milestone']);
        expect(out.refused).toEqual([
            { field: name, reason: words(catalog, `server.career.${key}`, name) }
        ]);
        expect(readFileSync(file, 'utf8')).toBe(
            CAREER_SECTIONS.replace('milestone: Veni 2026', 'milestone: Veni 2027')
        );
    });

    it('refuses every key of a file with no schema with the one sentence', () => {
        const { root, file } = careerHub();
        writeFileSync(file, NO_SCHEMA);
        const out = writeCareer(root, { milestone: 'x', notes: 'y' }, rules, catalog);
        const reason = words(catalog, 'server.career.no_schema');
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            { field: 'milestone', reason },
            { field: 'notes', reason }
        ]);
        expect(readFileSync(file, 'utf8')).toBe(NO_SCHEMA);
    });

    it('answers not found for a hub with no career file', () => {
        const root = hub();
        expect(writeCareer(root, { milestone: 'x' }, rules, catalog)).toEqual({
            found: false,
            changed: [],
            refused: []
        });
    });
});

/** An entry-adding row: the file, the call, and what the call answers and leaves in the file. */
const ADD_ROWS = [
    {
        name: 'writes the key and nothing else',
        path: '.oculus/data/academic/tasks.yml',
        file: KEYED,
        collection: 'tasks',
        fields: { key: 'review-x' },
        id: 'review-x',
        changed: ['entries'],
        refused: [],
        after: `${KEYED}\n  - key: review-x\n`
    },
    {
        name: 'writes under an `entries:` that holds only comments and keeps them',
        path: '.oculus/data/academic/tasks.yml',
        file: KEYED.replace('  - key: held\n    title: Held\n', '  # a comment\n  # another\n'),
        collection: 'tasks',
        fields: { key: 'review-x' },
        changed: ['entries'],
        refused: [],
        after: KEYED.replace(
            '  - key: held\n    title: Held\n',
            '  - key: review-x\n  # a comment\n  # another\n'
        )
    },
    {
        name: 'refuses a held key',
        path: '.oculus/data/academic/tasks.yml',
        file: KEYED,
        collection: 'tasks',
        fields: { key: 'held' },
        changed: [],
        refused: [{ field: 'key', reason: ['server.entries.key_taken', 'key'] }],
        after: KEYED
    },
    {
        name: 'refuses an empty key',
        path: '.oculus/data/academic/tasks.yml',
        file: KEYED,
        collection: 'tasks',
        fields: { key: '  ' },
        changed: [],
        refused: [{ field: 'key', reason: ['server.entries.new_ident_missing', 'key'] }],
        after: KEYED
    },
    {
        name: 'writes a key that begins with the name of a hub and a colon as any other key',
        path: '.oculus/data/academic/tasks.yml',
        file: KEYED,
        collection: 'tasks',
        fields: { key: 'second:thing' },
        id: 'second:thing',
        changed: ['entries'],
        refused: [],
        after: `${KEYED}\n  - key: second:thing\n`
    },
    {
        name: 'refuses a venue with an empty id',
        path: '.oculus/data/research/venues.yml',
        file: VENUES,
        collection: 'venues',
        fields: { name: 'New V', id: '' },
        changed: [],
        refused: [{ field: 'id', reason: ['server.entries.new_ident_missing', 'id'] }],
        after: VENUES
    },
    {
        name: 'refuses an Add to a file whose schema flags no primary key (G8)',
        path: '.oculus/data/academic/tasks.yml',
        file: KEYED.replace(', primary_key: true', ''),
        collection: 'tasks',
        fields: { key: 'review-x' },
        changed: [],
        refused: [
            {
                field: 'schema',
                reason: ['server.entries.no_primary_key_none', '.oculus/data/academic/tasks.yml']
            }
        ],
        after: KEYED.replace(', primary_key: true', '')
    },
    {
        name: 'writes a venue from its name and its id, in the order its schema lists them',
        path: '.oculus/data/research/venues.yml',
        file: VENUES,
        collection: 'venues',
        fields: { name: 'New V', id: 'newv' },
        changed: ['venues'],
        refused: [],
        after: `${VENUES}\n  - name: New V\n    id: newv\n`
    }
];

describe('adding an entry', () => {
    it.each(ADD_ROWS)('$name', (row) => {
        const root = wider();
        const file = plant(root, row.path, row.file);
        const out = createEntry(root, configFor(), row.collection, row.fields, undefined);
        if ('id' in row) expect(out).toMatchObject({ found: true, id: row.id });
        expect(out.changed).toEqual(row.changed);
        expect(out.refused).toEqual(
            row.refused.map(({ field, reason }) => ({
                field,
                reason:
                    typeof reason === 'string'
                        ? reason
                        : words(configFor().text, reason[0], ...reason.slice(1))
            }))
        );
        expect(readFileSync(file, 'utf8')).toBe(row.after);
    });

    it('appends a new entry rendered from the file schema', () => {
        const root = wider();
        const out = createEntry(root, configFor(), 'tasks', {
            title: 'A new task',
            status: 'open'
        });
        // The record keeps the text the add replaced, the file's last line, for its undo.
        const last = '      - { do: read it }\n';
        expect(out).toEqual({
            found: true,
            id: 'A new task',
            changed: ['entries'],
            refused: [],
            records: [
                {
                    ...(record(
                        tasksPath(root),
                        'A new task',
                        'entries',
                        null,
                        {
                            title: 'A new task',
                            status: 'open'
                        },
                        'create'
                    ) as Record<string, unknown>),
                    replaced: {
                        offset: TASKS.length - last.length,
                        before: last,
                        after: `${last}\n  - title: A new task\n    status: open\n`
                    }
                }
            ]
        });
        expect(tasksOf(root)).toBe(`${TASKS}\n  - title: A new task\n    status: open\n`);
    });
});

const RESEARCH_STATUS = 'New idea: scope and novelty check open.';
const RESEARCH_NEXT = 'Scope the idea; cited-novelty lit check; decide go/no-go.';

/**
 * The manifest `createIdea` writes for a project named `new-idea`, from the lines that differ: its
 * `stage` is the one stage carrying `new_idea`, and with none or two the manifest names no stage.
 */
function ideaManifest(
    tier: string,
    line: string,
    next: string | null,
    stage: string | null = 'nascent'
): string {
    return [
        'id: new-idea',
        `tier: ${tier}`,
        ...(stage === null ? [] : [`stage: ${stage}`]),
        'title: A new idea',
        'status:',
        '  chips: []',
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
        fields: { ...FORM, tier: 'research' },
        parent: 'projects/ideas',
        manifest: ideaManifest('research', RESEARCH_STATUS, RESEARCH_NEXT),
        readme: `# A new idea\n\nwhat it is\n\n## Next\n\n${RESEARCH_NEXT}\n`
    },
    {
        name: 'the Personal board, in the hub folder of the tier',
        fields: { ...FORM, tier: 'personal' },
        parent: 'side-projects',
        manifest: ideaManifest('personal', 'New project.', null),
        readme: '# A new idea\n\nwhat it is\n'
    },
    {
        name: 'the Archive board, in a folder the reader typed',
        fields: { ...FORM, tier: 'research', folder: 'projects/archive/old' },
        parent: 'projects/archive/old',
        manifest: ideaManifest('research', RESEARCH_STATUS, RESEARCH_NEXT),
        readme: `# A new idea\n\nwhat it is\n\n## Next\n\n${RESEARCH_NEXT}\n`
    },
    {
        name: 'a write that names no tier and no folder, as Lit Watch makes it',
        fields: FORM,
        parent: 'projects/ideas',
        manifest: ideaManifest('research', RESEARCH_STATUS, RESEARCH_NEXT),
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

    /** The shipped configuration with the `new_idea` flag of `stages:` on the stages `on` alone. */
    function newIdeaOn(on: readonly string[]): PortfolioConfig {
        const config = configFor();
        const shipped = (config.merged.stages ?? {}) as Record<string, Record<string, unknown>>;
        const stages = Object.fromEntries(
            Object.entries(shipped).map(([word, row]) => [
                word,
                { ...row, new_idea: on.includes(word) }
            ])
        );
        return { ...config, merged: { ...config.merged, stages } };
    }

    const NEW_IDEA_ROWS = [
        { name: 'the stage scoping', on: ['scoping'], stage: 'scoping' },
        { name: 'no stage', on: [], stage: null },
        { name: 'no stage when two stages carry it', on: ['nascent', 'scoping'], stage: null }
    ];

    it.each(NEW_IDEA_ROWS)(
        'writes as the stage of a new idea the one stages: flags new_idea, here $name',
        (row) => {
            const root = wider();
            const out = createIdea(root, newIdeaOn(row.on), { ...FORM, tier: 'research' });
            expect(out.refused).toEqual([]);
            const file = join(root, 'projects/ideas/new-idea/project.yml');
            expect(readFileSync(file, 'utf8')).toBe(
                ideaManifest('research', RESEARCH_STATUS, RESEARCH_NEXT, row.stage)
            );
        }
    );

    const NONE = { ...configFor(), newProjectDir: {} };

    /** The shipped configuration with `default: true` on the tiers research and personal. */
    function twoDefaultTiers(): PortfolioConfig {
        const config = configFor();
        const shipped = (config.merged.tiers ?? {}) as Record<string, Record<string, unknown>>;
        const tiers = { ...shipped, personal: { ...shipped.personal, default: true } };
        return { ...config, merged: { ...config.merged, tiers } };
    }

    const REFUSALS = [
        {
            name: 'a software project sent with no folder, since the hub names none for the tier',
            fields: { ...FORM, tier: 'software' },
            field: 'folder',
            reason: 'the hub names no folder for new projects of the tier software'
        },
        {
            name: 'a write with no tier and no folder over a hub that names none for research',
            fields: FORM,
            config: NONE,
            field: 'folder',
            reason: 'the hub names no folder for new projects of the tier research'
        },
        {
            name: 'an empty folder',
            fields: { ...FORM, tier: 'personal', folder: '' },
            field: 'folder',
            reason: 'a new project needs a folder'
        },
        {
            name: 'a folder outside every scan folder',
            fields: { ...FORM, tier: 'research', folder: 'elsewhere' },
            field: 'folder',
            reason: 'the folder elsewhere is not inside a folder the hub scans for projects'
        },
        {
            name: 'a folder inside an existing project',
            fields: { ...FORM, tier: 'research', folder: 'projects/manuscripts/alpha/sub' },
            field: 'folder',
            reason: 'the folder projects/manuscripts/alpha/sub lies inside the project in projects/manuscripts/alpha'
        },
        {
            name: 'a folder that is already there',
            fields: { ...FORM, id: 'taken', tier: 'research', folder: 'projects/ideas' },
            field: 'id',
            reason: 'projects/ideas/taken is already there'
        },
        {
            name: 'a tier that is no word of tiers',
            fields: { ...FORM, tier: 'nonsense' },
            field: 'tier',
            reason: 'a new project cannot have the tier nonsense'
        },
        {
            name: 'case 7: a write naming no tier when two tiers carry default',
            fields: FORM,
            config: twoDefaultTiers(),
            field: 'tier',
            reason: 'a new project names no tier, and no one word of tiers carries default'
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
