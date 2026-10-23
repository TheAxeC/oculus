// Layer 2, route tests. Which hub a write goes to when two hubs are built (G8, G9): a write that
// names a record of the hub `lab` by its hub and its key (`lab:<key>`) changes that hub's file and
// no byte of the primary hub, the change log names the file of `lab` by its absolute path, and the
// undo from History puts that file back.
//
// Both hubs are made by `target()` under the system temporary directory, so every key of `lab` is
// also a key of the first hub and only the hub part of an id tells the two records apart. Each case
// compares every file of both hubs before and after the write and after the undo.
// @module-tag slow: each case builds two hubs and takes 300 ms or more, so npm test leaves it out.

import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    realpathSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { APP_HEADER, KIND_HEADER } from '../../../src/lib/data/helpers/files/apps/apps.ts';
import {
    handleWrite,
    type PrimaryTarget,
    type WriteTarget
} from '../../../src/lib/server/edit/writes.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it, test } from '../../fixtures/scratch.ts';
import { MANIFEST, notesFiles, routeSetup } from '../apps/apps-fixture.ts';
import {
    DECK_ORDER,
    DECK_PATH,
    TOKEN,
    changesOf,
    deckOf,
    deckTarget,
    request,
    target,
    undone,
    warmConfig
} from '../edit/write-fixture.ts';

test.beforeAll(warmConfig);

/** The log, the overrides and the bookmarks are beside the hub's files and are not its content. */
const BESIDE = new Set(['changes.jsonl', 'sessions.json', 'bookmarks.yml']);

/** Every file under a hub by its path inside it, with its text. */
function filesOf(dir: string, at = ''): Map<string, string> {
    const held = new Map<string, string>();
    for (const name of readdirSync(join(dir, at))) {
        const path = join(at, name);
        if (at === '' && BESIDE.has(name)) continue;
        if (statSync(join(dir, path)).isDirectory()) {
            for (const [key, text] of filesOf(dir, path)) held.set(key, text);
        } else {
            held.set(path, readFileSync(join(dir, path), 'utf8'));
        }
    }
    return held;
}

/** The paths whose text differs between two readings, or that only one of them holds. */
function differing(before: Map<string, string>, after: Map<string, string>): string[] {
    const paths = new Set([...before.keys(), ...after.keys()]);
    return [...paths].filter((path) => before.get(path) !== after.get(path)).sort();
}

/** Whether a file lies inside a hub's folder, the folder named by either of its two spellings. */
function heldBy(dir: string, file: string): boolean {
    return [dir, realpathSync(dir)].some((one) => !relative(one, file).startsWith('..'));
}

/** A collection file whose `person` field takes a key of the people registry. */
const JOINT_WORK = `title: Joint work
schema:
  - { field: key, type: text }
  - { field: title, type: text }
  - { field: person, type: select, from: people }
entries:
  - key: rivera-lab
    title: "Streaming systems"
    person: rivera-lab
`;

/** A Literature file with no entry, which a save adds one to. */
const LITERATURE = `title: Literature
schema:
  - { field: key, type: text, required: true }
  - { field: title, type: text }
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
        const collections = into.config.collections.filter((one) => one.key !== 'literature');
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
        const collections = held.config.collections.filter((one) => one.key !== 'literature');
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
            mkdirSync(join(hub, '.oculus', 'data', 'academic'), { recursive: true });
            writeFileSync(join(hub, '.oculus', 'data', 'academic', 'joint-work.yml'), JOINT_WORK);
        }
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request({
                kind: 'entry',
                collection: 'joint-work',
                id: 'lab:rivera-lab',
                fields: { person: 'lab:chen-graph' }
            }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        const file = '.oculus/data/academic/joint-work.yml';
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

    it('answers a lead made in a workspace with no primary with the id of the first hub, which it wrote', async () => {
        const { into, first, lab } = twoHubs();
        const open: WriteTarget = {
            ...into,
            hub: null,
            primary: null,
            hubs: [{ key: 'one', hub: first, config: into.config }, ...(into.hubs ?? [])]
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

    it("writes an app's host status to the first hub's career file in a workspace with no primary", async () => {
        const { into, first, lab } = twoHubs();
        const apps = routeSetup({ machine: notesFiles(`${MANIFEST}writes: [host]\n`) });
        const fromApp: WriteTarget = {
            ...into,
            hub: null,
            primary: null,
            hubs: [{ key: 'one', hub: first, config: into.config }, ...(into.hubs ?? [])],
            apps: { held: apps.held, data: join(apps.fixture.base, 'data'), maxKb: 256 }
        };
        const before = { lab: filesOf(lab) };
        const response = await handleWrite(
            request(
                { kind: 'host', name: 'Naesens', status: 'candidate' },
                { ...APP, [KIND_HEADER]: 'host' }
            ),
            TOKEN,
            fromApp
        );
        expect(response.status).toBe(200);
        expect(readFileSync(join(first, '.oculus/data/academic/career.yml'), 'utf8')).toContain(
            'status: "candidate"'
        );
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
    });
});

/** Two deck hubs: each holds the portfolio deck and the decks of its three projects. */
function twoDeckHubs(): { into: PrimaryTarget; first: string; lab: string } {
    const first = deckTarget();
    const second = deckTarget();
    const labProjects = second.projects().map((project) => ({
        ...project,
        id: `lab:${project.id}`,
        root: 'lab'
    }));
    const into: PrimaryTarget = {
        ...first,
        projects: () => [...first.projects(), ...labProjects],
        files: {
            roots: () => [
                { key: 'hub', dir: first.hub },
                { key: 'lab', dir: second.hub }
            ]
        },
        hubs: [{ key: 'lab', hub: second.hub, config: second.config }]
    };
    return { into, first: first.hub, lab: second.hub };
}

describe('a deck write to the second hub', () => {
    const MOVE = [
        { group: 'pillars', base: ['alpha'], slides: ['beta'] },
        { group: 'more', base: [], slides: ['alpha'] }
    ];
    const send = (groups: unknown, over: Record<string, unknown> = {}): unknown => ({
        kind: 'deck-slides',
        root: 'lab',
        path: DECK_PATH,
        groups,
        ...over
    });

    it('writes the deck file of the second hub, logs its path and undoes it', async () => {
        const { into, first, lab } = twoDeckHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(request(send(MOVE)), TOKEN, into);
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([DECK_PATH]);
        const records = changesOf(into);
        expect(records).toHaveLength(2);
        for (const record of records) {
            expect(heldBy(lab, record.file)).toBe(true);
            expect(record.file.endsWith(DECK_PATH)).toBe(true);
            expect((await undone(into, record)).status).toBe(200);
        }
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(deckOf({ ...into, hub: lab })).toBe(before.lab.get(DECK_PATH));
    });

    it('refuses a base the file of the second hub does not hold, and writes nothing', async () => {
        const { into, first, lab } = twoDeckHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const response = await handleWrite(
            request(send([{ group: 'pillars', base: ['beta'], slides: ['alpha'] }])),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        const answer = (await response.json()) as {
            changed: string[];
            refused: { reason: string }[];
        };
        expect(answer.changed).toEqual([]);
        expect(answer.refused.map((one) => one.reason)).toEqual([
            "The group's slides list changed on disk while you were working. Read the deck again and make the change again."
        ]);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([]);
        expect(changesOf(into)).toEqual([]);
    });

    it('writes the order list of the second hub', async () => {
        const { into, first, lab } = twoDeckHubs();
        const before = { first: filesOf(first), lab: filesOf(lab) };
        const order = { base: DECK_ORDER, entries: ['slides:more', 'intro.md', 'slides:pillars'] };
        const response = await handleWrite(request(send([], { order })), TOKEN, into);
        expect(response.status).toBe(200);
        expect(differing(before.first, filesOf(first))).toEqual([]);
        expect(differing(before.lab, filesOf(lab))).toEqual([DECK_PATH]);
    });
});
