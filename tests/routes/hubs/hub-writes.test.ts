// Layer 2, route tests. Which hub a write goes to when two hubs are built (G8, G9): a write that
// names a record of the hub `lab` by its hub and its key (`lab:<key>`) changes that hub's file and
// no byte of the primary hub, the change log names the file of `lab` by its absolute path, and the
// undo from History puts that file back.
//
// Both hubs are made by `target()` under the system temporary directory, so every key of `lab` is
// also a key of the first hub and only the hub part of an id tells the two records apart. Each case
// compares every file of both hubs before and after the write and after the undo.
// @module-tag slow: each case builds two hubs and takes 300 ms or more, so npm test leaves it out.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { APP_HEADER, KIND_HEADER } from '../../../src/lib/data/helpers/files/apps/apps.ts';
import {
    carriedOf,
    handleWrite,
    target as serverTarget,
    type PrimaryTarget,
    type WriteTarget
} from '../../../src/lib/server/edit/writes.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it, test } from '../../fixtures/scratch.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';
import { MANIFEST, notesFiles, routeSetup } from '../apps/apps-fixture.ts';
import { TOKEN, changesOf, request, target, undone, warmConfig } from '../edit/write-fixture.ts';
import { differing, filesOf, heldBy } from './hub-files-fixture.ts';

test.beforeAll(warmConfig);

/** A collection file whose `person` field takes a key of the people registry. */
const PERSON_FIELD_FILE = `title: Statements
schema:
  - { field: key, type: text, primary_key: true }
  - { field: title, type: text, display: 1 }
  - { field: person, type: select, foreign_key: people }
entries:
  - key: rivera-lab
    title: "Streaming systems"
    person: rivera-lab
`;

/** A Literature file with no entry, which a save adds one to. */
const LITERATURE = `title: Literature
schema:
  - { field: key, type: text, primary_key: true, required: true }
  - { field: title, type: text, display: 1 }
  - { field: authors, type: tags }
  - { field: year, type: text }
  - { field: doi, type: text }
  - { field: url, type: text }
  - { field: source, type: select, options: [search, lit-watch, hand] }
  - { field: added, type: date }
entries: []
`;

/**
 * Plant the Literature file in a hub's folder, at oculus's own path unless another is given, the
 * path checked to lie inside it.
 */
function plantLiterature(hub: string, path = '.oculus/data/literature/literature.yml'): void {
    const file = join(hub, path);
    expect(heldBy(hub, file)).toBe(true);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, LITERATURE);
}

/** A paper saved by DOI, as Literature's Add sends it. */
const PAPER = { kind: 'literature-save', source: 'hand', paper: { doi: '10.1000/route.paper' } };

/** The primary hub with `lab` as another hub, both holding the same ids. */
function twoHubs(): { into: PrimaryTarget; first: string; lab: string } {
    const first = target();
    const second = target();
    const feeds = { ...first.config.feeds, linkedin: 'theaxec.github.io/_linkedin' };
    const into: PrimaryTarget = {
        ...first,
        config: { ...first.config, feeds },
        hubs: [{ key: 'lab', hub: second.hub, config: { ...second.config, feeds } }]
    };
    return { into, first: first.hub, lab: second.hub };
}

/**
 * The writes of the first table. `files` are the files of the second hub the write changes, and
 * `unrecoverable` marks a promotion, whose record offers no way back. Every other write's undo puts
 * the files back byte for byte, a deletion's included, since its record keeps the text it replaced.
 */
const ROWS: {
    name: string;
    body: unknown;
    files: string[];
    unrecoverable?: boolean;
}[] = [
    {
        name: 'a manifest field',
        body: { kind: 'manifest', id: 'lab:alpha', fields: { 'status.line': 'a lab line' } },
        files: ['projects/manuscripts/alpha/project.yml']
    },
    {
        name: 'an entry field',
        body: {
            kind: 'entry',
            collection: 'tasks',
            id: 'lab:Review the draft',
            fields: { status: 'done' }
        },
        files: ['.oculus/data/academic/tasks.yml']
    },
    {
        name: 'a subtask ticked',
        body: {
            kind: 'subtask',
            target: { collection: 'tasks', id: 'lab:Review the draft' },
            key: '0',
            action: 'done'
        },
        files: ['.oculus/data/academic/tasks.yml']
    },
    {
        name: 'a subtask added to an entry',
        body: {
            kind: 'subtask-add',
            target: { collection: 'tasks', id: 'lab:Review the draft' },
            fields: { do: 'write it up' }
        },
        files: ['.oculus/data/academic/tasks.yml']
    },
    {
        name: 'a subtask added to a manifest',
        body: { kind: 'subtask-add', target: { id: 'lab:alpha' }, fields: { do: 'write it up' } },
        files: ['projects/manuscripts/alpha/project.yml']
    },
    {
        name: 'a reorder',
        body: {
            kind: 'reorder',
            collection: 'tasks',
            order: ['lab:Another task', 'lab:Review the draft']
        },
        files: ['.oculus/data/academic/tasks.yml']
    },
    {
        name: 'a deletion',
        body: { kind: 'delete-entry', collection: 'tasks', id: 'lab:Another task' },
        files: ['.oculus/data/academic/tasks.yml']
    },
    {
        name: 'a Lit Watch field',
        body: {
            kind: 'feed-field',
            feed: 'radar',
            id: 'lab:Paper',
            field: 'dismissed',
            value: true
        },
        files: ['.oculus/data/literature/radar.yml']
    },
    {
        name: 'a lead field',
        body: {
            kind: 'feed-field',
            feed: 'leads',
            id: 'lab:Lead',
            field: 'status',
            value: 'applied'
        },
        files: ['.oculus/data/academic/leads.yml']
    },
    {
        name: 'a lead field the file schema names beyond its status',
        body: {
            kind: 'feed-field',
            feed: 'leads',
            id: 'lab:Lead',
            field: 'fit',
            value: 'a close fit'
        },
        files: ['.oculus/data/academic/leads.yml']
    },
    {
        name: 'a Lit Watch paper added in the hub its root names',
        body: {
            kind: 'radar-add',
            root: 'lab',
            fields: {
                title: 'A lab paper',
                url: 'https://example.org/lab-paper',
                bucket: 'preemption'
            }
        },
        files: ['.oculus/data/literature/radar.yml']
    },
    {
        name: 'a Lit Watch deletion',
        body: { kind: 'feed-delete', feed: 'radar', id: 'lab:Paper' },
        files: ['.oculus/data/literature/radar.yml']
    },
    {
        name: 'a lead deletion',
        body: { kind: 'feed-delete', feed: 'leads', id: 'lab:Lead' },
        files: ['.oculus/data/academic/leads.yml']
    },
    {
        name: 'a LinkedIn idea posted',
        body: { kind: 'linkedin-post', id: 'lab:xx-route-idea.md' },
        files: [
            'theaxec.github.io/_linkedin/xx-route-idea.md',
            'theaxec.github.io/_linkedin/01-route-idea.md'
        ],
        unrecoverable: true
    }
];

describe('the build a delete-entry answer names', () => {
    it.each([
        { name: 'an entry of the primary hub', id: 'hub:Another task' },
        { name: 'an entry of the second hub', id: 'lab:Another task' }
    ])('is the version of the next portfolio message: $name', async ({ id }) => {
        const context = contextFixture({ engine: engineDir() });
        const { nextBuild } = serverTarget(
            context.engine,
            context.configCache.read().config,
            carriedOf(context),
            context
        );
        context.hub.publish('portfolio', { built: 'before the write' });
        const { into } = twoHubs();
        const response = await handleWrite(
            request({ kind: 'delete-entry', collection: 'tasks', id }),
            TOKEN,
            { ...into, nextBuild }
        );
        expect(response.status).toBe(200);
        const { build } = (await response.json()) as { build?: number };
        expect(build).toBe(2);
        expect(context.hub.publish('portfolio', { built: 'after the write' })).toBe(build);
        context.close();
    });
});

describe('a write to a record of the second hub', () => {
    it.each(ROWS)(
        '$name changes the second hub only, is logged by path and is undone',
        async (row) => {
            const { into, first, lab } = twoHubs();
            const before = { first: filesOf(first), lab: filesOf(lab) };

            const response = await handleWrite(request(row.body), TOKEN, into);
            expect(response.status, row.name).toBe(200);
            const written = { first: filesOf(first), lab: filesOf(lab) };
            expect(differing(before.first, written.first), row.name).toEqual([]);
            expect(differing(before.lab, written.lab), row.name).toEqual([...row.files].sort());

            const [change] = changesOf(into);
            expect(isAbsolute(change.file), row.name).toBe(true);
            expect(heldBy(lab, change.file), row.name).toBe(true);

            if (row.unrecoverable === true) {
                expect(change.undo, row.name).toBe('none');
                return;
            }
            expect((await undone(into, change)).status, row.name).toBe(200);
            expect(differing(before.first, filesOf(first)), row.name).toEqual([]);
            expect(differing(before.lab, filesOf(lab)), row.name).toEqual([]);
        }
    );

    it('goes to the primary hub when it creates an entry, whatever other hubs are built', async () => {
        const { into, first, lab } = twoHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({ kind: 'new-entry', collection: 'tasks', fields: { title: 'A third task' } }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([
            '.oculus/data/academic/tasks.yml'
        ]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        const [change] = changesOf(into);
        expect(change.file).toBe(join(first, '.oculus', 'data', 'academic', 'tasks.yml'));
    });

    it('writes a new entry into the file of the hub its root names, and no byte of the other (G8)', async () => {
        const { into, first, lab } = twoHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({
                kind: 'new-entry',
                collection: 'tasks',
                root: 'lab',
                fields: { title: 'A lab task' }
            }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual(['.oculus/data/academic/tasks.yml']);
        const [change] = changesOf(into);
        expect(change.file).toBe(join(lab, '.oculus', 'data', 'academic', 'tasks.yml'));
    });

    it('refuses a new entry for a hub whose collections list names no such collection, or no hub, and writes nothing (G8)', async () => {
        const { into, first, lab } = twoHubs();
        const held = into.hubs?.[0];
        if (held === undefined) throw new Error('the target names no second hub');
        const collections = held.config.collections.filter((one) => one.key !== 'tasks');
        const narrowed: PrimaryTarget = {
            ...into,
            hubs: [{ ...held, config: { ...held.config, collections } }]
        };
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const body = { kind: 'new-entry', collection: 'tasks', fields: { title: 'A lab task' } };
        const unlisted = await handleWrite(request({ ...body, root: 'lab' }), TOKEN, narrowed);
        expect(unlisted.status).toBe(404);
        expect(await unlisted.json()).toEqual({
            error: words(
                into.config.text,
                'server.write_route.no_collection_in_hub',
                'lab',
                'tasks'
            )
        });
        const unknown = await handleWrite(request({ ...body, root: 'nolab' }), TOKEN, narrowed);
        expect(unknown.status).toBe(404);
        expect(await unknown.json()).toEqual({
            error: words(into.config.text, 'server.workspace.no_hub_named', 'nolab')
        });
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(changesOf(narrowed)).toEqual([]);
    });

    it('saves a paper into the Literature file of the hub its root names, and no byte of the other (G8)', async () => {
        const { into, first, lab } = twoHubs();
        plantLiterature(first);
        plantLiterature(lab);
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(request({ ...PAPER, root: 'lab' }), TOKEN, into);
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([
            '.oculus/data/literature/literature.yml'
        ]);
        const [change] = changesOf(into);
        expect(change.file).toBe(join(lab, '.oculus', 'data', 'literature', 'literature.yml'));
    });

    it('saves a paper that names no hub into the one hub whose collections list names Literature, primary or not (G8)', async () => {
        const { into, first, lab } = twoHubs();
        // The primary hub holds a Literature file at a path its list does not name and that is not
        // oculus's own, so it is no hub whose list names Literature.
        plantLiterature(first, '.oculus/data/research/literature.yml');
        plantLiterature(lab);
        const collections = into.config.collections.filter((one) => one.registry !== 'literature');
        const narrowed: PrimaryTarget = { ...into, config: { ...into.config, collections } };
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(request(PAPER), TOKEN, narrowed);
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([
            '.oculus/data/literature/literature.yml'
        ]);
    });

    it('refuses a paper for a hub whose collections list names no Literature, or no hub, and writes nothing (G8)', async () => {
        const { into, first, lab } = twoHubs();
        plantLiterature(first);
        plantLiterature(lab);
        const held = into.hubs?.[0];
        if (held === undefined) throw new Error('the target names no second hub');
        const collections = held.config.collections.filter((one) => one.registry !== 'literature');
        const narrowed: PrimaryTarget = {
            ...into,
            hubs: [{ ...held, config: { ...held.config, collections } }]
        };
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const unlisted = await handleWrite(request({ ...PAPER, root: 'lab' }), TOKEN, narrowed);
        expect(unlisted.status).toBe(404);
        expect(await unlisted.json()).toEqual({
            error: words(
                into.config.text,
                'server.write_route.no_collection_in_hub',
                'lab',
                'literature'
            )
        });
        const unknown = await handleWrite(request({ ...PAPER, root: 'nolab' }), TOKEN, narrowed);
        expect(unknown.status).toBe(404);
        expect(await unknown.json()).toEqual({
            error: words(into.config.text, 'server.workspace.no_hub_named', 'nolab')
        });
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(changesOf(narrowed)).toEqual([]);
    });

    it('refuses a record of a hub no workspace folder carries, with the sentence naming the hub, and writes nothing', async () => {
        const { into, first, lab } = twoHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({ kind: 'manifest', id: 'nolab:alpha', fields: { 'status.line': 'x' } }),
            TOKEN,
            into
        );
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({
            error: words(into.config.text, 'server.workspace.no_hub_named', 'nolab')
        });
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(changesOf(into)).toEqual([]);
    });

    it('writes a field that names a record of the second hub without the hub key (G8)', async () => {
        const { into, first, lab } = twoHubs();
        for (const hub of [first, lab]) {
            mkdirSync(join(hub, '.oculus', 'data', 'research'), { recursive: true });
            writeFileSync(
                join(hub, '.oculus', 'data', 'research', 'statements.yml'),
                PERSON_FIELD_FILE
            );
        }
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({
                kind: 'entry',
                collection: 'statements',
                id: 'lab:rivera-lab',
                fields: { person: 'lab:chen-graph' }
            }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        const file = '.oculus/data/research/statements.yml';
        expect(differing(before.lab, filesOf(lab))).toEqual([file]);
        const written = filesOf(lab).get(file) ?? '';
        const entries = (parse(written) as { entries: { key: string; person: string }[] }).entries;
        expect(entries.find((one) => one.key === 'rivera-lab')?.person).toBe('chen-graph');
        expect(written).not.toContain('lab:');
    });

    it('writes a manifest field that names records of the second hub without the hub key (G8)', async () => {
        const { into, first, lab } = twoHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({
                kind: 'manifest',
                id: 'lab:alpha',
                fields: { collaborators: ['lab:rivera-lab'], 'waiting-on': ['lab:chen-graph'] }
            }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        const file = 'projects/manuscripts/alpha/project.yml';
        expect(differing(before.lab, filesOf(lab))).toEqual([file]);
        const written = parse(filesOf(lab).get(file) ?? '') as Record<string, unknown>;
        expect(written.collaborators).toEqual(['rivera-lab']);
        expect(written['waiting-on']).toEqual(['chen-graph']);
    });

    it('sends the status of a primary-hub lead titled like a lab id to the primary hub (G8)', async () => {
        const { into, first, lab } = twoHubs();
        const leads = join(first, '.oculus', 'data', 'academic', 'leads.yml');
        const title = 'lab: Postdoc in graph learning';
        writeFileSync(
            leads,
            `${readFileSync(leads, 'utf8')}  - title: "${title}"\n    status: open\n`
        );
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({
                kind: 'feed-field',
                feed: 'leads',
                id: `hub:${title}`,
                field: 'status',
                value: 'applied'
            }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([
            '.oculus/data/academic/leads.yml'
        ]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(readFileSync(leads, 'utf8')).toContain('status: applied');
    });

    it('answers a LinkedIn idea that no hub holds as missing and writes nothing', async () => {
        const { into, first, lab } = twoHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({ kind: 'linkedin-post', id: 'lab:xx-nowhere.md' }),
            TOKEN,
            into
        );
        expect(response.status).toBe(404);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
    });

    it('sends a LinkedIn idea of the primary hub, which lab also holds, to the primary hub', async () => {
        const { into, first, lab } = twoHubs();
        const idea = join('theaxec.github.io', '_linkedin', 'xx-route-idea.md');
        expect(existsSync(join(first, idea))).toBe(true);
        expect(existsSync(join(lab, idea))).toBe(true);
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({ kind: 'linkedin-post', id: 'hub:xx-route-idea.md' }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([
            join('theaxec.github.io', '_linkedin', '01-route-idea.md'),
            idea
        ]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        const [change] = changesOf(into);
        expect(
            isAbsolute(change.file) && change.file.startsWith(join(first, 'theaxec.github.io'))
        ).toBe(true);
    });

    it.each([
        [
            'a lead field',
            { kind: 'feed-field', feed: 'leads', id: 'Lead', field: 'status', value: 'applied' },
            'Lead'
        ],
        [
            'a lead field that carries a root beside a bare id',
            {
                kind: 'feed-field',
                feed: 'leads',
                id: 'Lead',
                root: 'lab',
                field: 'status',
                value: 'applied'
            },
            'Lead'
        ],
        ['a lead deletion', { kind: 'feed-delete', feed: 'leads', id: 'Lead' }, 'Lead'],
        [
            'a LinkedIn idea posted',
            { kind: 'linkedin-post', id: 'xx-route-idea.md' },
            'xx-route-idea.md'
        ]
    ])(
        'refuses %s whose id names no hub with 400 and the route sentence, and writes nothing',
        async (_name, body, key) => {
            const { into, first, lab } = twoHubs();
            const before = { first: filesOf(first), lab: filesOf(lab) };
            const response = await handleWrite(request(body), TOKEN, into);
            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: words(into.config.text, 'server.write_route.no_hub_part', key)
            });
            expect(differing(before.first, filesOf(first))).toEqual([]);
            expect(differing(before.lab, filesOf(lab))).toEqual([]);
            expect(changesOf(into)).toEqual([]);
        }
    );
});

describe('a write that makes a record', () => {
    it.each([
        ['a lead', { kind: 'lead-add', fields: { title: 'A new lead' } }, 'hub:A new lead'],
        [
            'an entry of the primary',
            { kind: 'new-entry', collection: 'tasks', fields: { title: 'A third task' } },
            'hub:A third task'
        ],
        [
            'an entry of the hub its root names',
            {
                kind: 'new-entry',
                collection: 'tasks',
                fields: { title: 'A third task' },
                root: 'lab'
            },
            'lab:A third task'
        ],
        ['a LinkedIn idea', { kind: 'linkedin-idea', title: 'A new idea' }, 'hub:xx-a-new-idea.md']
    ])('answers %s with its internal id, the hub it wrote and its key', async (_name, body, id) => {
        const { into } = twoHubs();
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(200);
        expect(((await response.json()) as { id?: string }).id).toBe(id);
    });

    it('answers a lead made in a workspace of one hub and no primary with the id of that hub, which it wrote (G8)', async () => {
        const { into, first, lab } = twoHubs();
        const open: WriteTarget = {
            ...into,
            hub: null,
            primary: null,
            hubs: [{ key: 'one', hub: first, config: into.config }]
        };
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({ kind: 'lead-add', fields: { title: 'A new lead' } }),
            TOKEN,
            open
        );
        expect(response.status).toBe(200);
        expect(((await response.json()) as { id?: string }).id).toBe('one:A new lead');
        expect(differing(before.first, filesOf(first))).toEqual([
            '.oculus/data/academic/leads.yml'
        ]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
    });

    it.each([
        ['a lead', { kind: 'lead-add', fields: { title: 'A new lead' } }],
        ['a new entry', { kind: 'new-entry', collection: 'tasks', fields: { title: 'A task' } }],
        [
            'a paper saved to Literature',
            { kind: 'literature-save', source: 'hand', paper: { url: 'https://example.org/p' } }
        ]
    ])(
        'refuses %s naming no hub in a workspace of two hubs and no primary, asking which, and writes no byte (G8)',
        async (_name, body) => {
            const { into, first, lab } = twoHubs();
            const open: WriteTarget = {
                ...into,
                hub: null,
                primary: null,
                hubs: [{ key: 'one', hub: first, config: into.config }, ...(into.hubs ?? [])]
            };
            const before = { first: filesOf(first), lab: filesOf(lab) };
            const response = await handleWrite(request(body), TOKEN, open);
            expect(response.status).toBe(409);
            expect(await response.json()).toEqual({
                error: words(into.config.text, 'server.workspace.which_hub')
            });
            expect(differing(before.first, filesOf(first))).toEqual([]);
            expect(differing(before.lab, filesOf(lab))).toEqual([]);
        }
    );
});

describe('the hub a new project is written to', () => {
    /** The files a new project `new-idea` makes under a hub's `new_project_dir` for projects. */
    const MADE = ['projects/ideas/new-idea/README.md', 'projects/ideas/new-idea/project.yml'];

    it.each([
        {
            name: 'the hub its root names, and no byte of the primary',
            root: 'lab',
            id: 'lab:new-idea'
        },
        { name: 'the primary, for a write that names no hub', root: undefined, id: 'hub:new-idea' }
    ])('writes the project into $name (G8)', async (row) => {
        const { into, first, lab } = twoHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const body = { kind: 'new-idea', fields: { id: 'new-idea' } };
        const response = await handleWrite(
            request(row.root === undefined ? body : { ...body, root: row.root }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(((await response.json()) as { id?: string }).id).toBe(row.id);
        const named = row.root === 'lab';
        expect(differing(before.first, filesOf(first))).toEqual(named ? [] : MADE);
        expect(differing(before.lab, filesOf(lab))).toEqual(named ? MADE : []);
    });

    it('refuses a new project for a hub no workspace folder carries, and writes nothing (G8)', async () => {
        const { into, first, lab } = twoHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({ kind: 'new-idea', fields: { id: 'new-idea' }, root: 'nowhere' }),
            TOKEN,
            into
        );
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({
            error: words(into.config.text, 'server.workspace.no_hub_named', 'nowhere')
        });
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(changesOf(into)).toEqual([]);
    });
});

describe('a write from an app', () => {
    const APP = { [APP_HEADER]: 'app:notes' };

    it.each([
        ['an entry', { kind: 'entry', collection: 'tasks', fields: { status: 'done' } }, 'entry'],
        ['a manifest field', { kind: 'manifest', fields: { 'status.line': 'x' } }, 'manifest']
    ])('finds no record of the second hub for %s', async (_name, body, kind) => {
        const { into, first, lab } = twoHubs();
        const apps = routeSetup({ machine: notesFiles(`${MANIFEST}writes: [${kind}]\n`) });
        const fromApp: PrimaryTarget = {
            ...into,
            apps: { held: apps.held, data: join(apps.fixture.base, 'data'), maxKb: 256 }
        };
        const ids = {
            entry: ['hub:Review the draft', 'lab:Review the draft'],
            manifest: ['hub:alpha', 'lab:alpha']
        };
        const [own, other] = ids[kind as 'entry' | 'manifest'];
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const headers = { ...APP, [KIND_HEADER]: kind };

        const refused = await handleWrite(request({ ...body, id: other }, headers), TOKEN, fromApp);
        expect(refused.status).toBe(404);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);

        const allowed = await handleWrite(request({ ...body, id: own }, headers), TOKEN, fromApp);
        expect(allowed.status).toBe(200);
        expect(differing(before.first, filesOf(first))).not.toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
    });

    it('makes no record for an app in a workspace with no primary, and writes nothing', async () => {
        const { into, first, lab } = twoHubs();
        const apps = routeSetup({ machine: notesFiles(`${MANIFEST}writes: [lead-add]\n`) });
        const fromApp: WriteTarget = {
            ...into,
            hub: null,
            primary: null,
            hubs: [{ key: 'one', hub: first, config: into.config }, ...(into.hubs ?? [])],
            apps: { held: apps.held, data: join(apps.fixture.base, 'data'), maxKb: 256 }
        };
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request(
                { kind: 'lead-add', fields: { title: 'A new lead' } },
                { ...APP, [KIND_HEADER]: 'lead-add' }
            ),
            TOKEN,
            fromApp
        );
        expect(response.status).toBe(409);
        expect(await response.json()).toEqual({
            error: words(into.config.text, 'server.workspace.no_primary')
        });
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
    });
});
