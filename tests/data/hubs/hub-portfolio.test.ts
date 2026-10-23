// Layer 4, data test. Several hubs as one portfolio, as the watcher publishes it
// (lib/server/root/watch/portfolio.ts through lib/data/snapshot/hubs/merge.ts): what each hub shows
// is what its files say, every record of every hub, the primary's included, is present under the
// internal id of its hub and its key, and a reference resolves in its own hub first, then in the
// one other hub that holds its key, a key two other hubs hold being a finding. No joined id is
// shown: a record is shown by its key.
//
// The hubs are copies of tests/fixtures/hubs/demo/ under the system temporary directory
// (hubs-fixture.ts), so every key of one hub is also a key of the other, and each row plants the
// keys its case needs. tests/data/hubs/hub-folders.test.ts reads what makes a folder of a workspace
// a hub.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { bareId } from '../../../src/lib/data/helpers/hub-names.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { buildOneHub } from '../../fixtures/hubs/hub-build.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { Entry, Relations, Snapshot } from '../../../src/lib/data/model/index.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { createPages } from '../../../src/lib/state/forms/page-entry.ts';
import { createSettled } from '../../../src/lib/state/forms/settled.svelte.ts';
import { feedIdents } from '../../../src/lib/state/shared/page/idents.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { request, TOKEN } from '../../routes/edit/write-fixture.ts';
import { copies, copyHub, hubsTarget, published } from './hubs-fixture.ts';

/** The kinds of record the snapshot keeps in a table by id. */
const KINDS = [
    'projects',
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources',
    'collections'
] as const;

/** A record of any kind as far as its id and the hub it came from are concerned. */
type RootedId = { id: string; root?: string };

/** The first hub alone, the second hub as the only hub, and the two as one portfolio. */
function builds(from: ReturnType<typeof copies>): {
    first: Snapshot;
    alone: Snapshot;
    merged: Snapshot;
} {
    const first = published([{ name: 'hub', dir: from.hub }], 'hub').snapshot;
    const alone = published([{ name: 'lab', dir: from.lab }], 'lab').snapshot;
    const merged = published(
        [
            { name: 'hub', dir: from.hub },
            { name: 'lab', dir: from.lab }
        ],
        'hub'
    ).snapshot;
    return { first, alone, merged };
}

/** A finding as the fields a reader of the Findings view sees. */
function seen(findings: Snapshot['findings']): string[][] {
    return findings.map((one) => [one.file, one.key, one.message]);
}

describe('the portfolio of several hubs', () => {
    it(
        'is the primary hub as it is built alone, each record under its hub and its key, when the workspace lists one hub',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const config = portfolioConfigFrom(loadConfig(engineDir(), { hub: from.hub }).config);
            const direct = buildOneHub(from.hub, config).snapshot;
            const watched = published([{ name: 'hub', dir: from.hub }], 'hub').snapshot;
            for (const kind of KINDS) {
                expect(Object.keys(watched.entities[kind]), kind).toEqual(
                    Object.keys(direct.entities[kind]).map((key) => `hub:${key}`)
                );
                for (const record of Object.values(watched.entities[kind]) as RootedId[]) {
                    expect(record.root, `${kind} ${record.id}`).toBe('hub');
                }
            }
            expect(seen(watched.findings)).toEqual(seen(direct.findings));
        }
    );

    it(
        "holds every record of both hubs, each under the name of its hub's folder",
        { tags: ['slow'] },
        () => {
            const from = copies();
            const { first, alone, merged } = builds(from);
            for (const kind of KINDS) {
                const own = Object.keys(first.entities[kind]).length;
                const added = Object.keys(alone.entities[kind]).length;
                expect(Object.keys(merged.entities[kind]).length, kind).toBe(own + added);
                const records = Object.values(merged.entities[kind]) as RootedId[];
                for (const record of records) {
                    expect(record.root, `${kind} ${record.id}`).toBe(
                        record.id.startsWith('lab:') ? 'lab' : 'hub'
                    );
                }
                const prefixed = Object.keys(merged.entities[kind]).filter((id) =>
                    id.startsWith('lab:')
                );
                expect(prefixed.length, kind).toBe(added);
            }
            // What the second hub shows is what its files say: each project reads as it does when
            // the hub is the only one.
            for (const project of Object.values(alone.entities.projects)) {
                const held = merged.entities.projects[project.id];
                expect(held.title).toBe(project.title);
                expect(held.folder).toBe(project.folder);
            }
        }
    );

    it(
        'names a record of the second hub in a relation pair only by ids of the second hub',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const { first, alone, merged } = builds(from);
            for (const name of Object.keys(merged.relations) as (keyof Relations)[]) {
                const pairs = merged.relations[name];
                const ofLab = pairs.filter(([left]) => left.startsWith('lab:'));
                expect(ofLab.length, name).toBe(alone.relations[name].length);
                expect(pairs.length, name).toBe(first.relations[name].length + ofLab.length);
                for (const [left, right] of pairs) {
                    expect(right.startsWith('lab:'), `${name} ${left} ${right}`).toBe(
                        left.startsWith('lab:')
                    );
                }
            }
        }
    );

    it(
        'reports the findings each hub gives, the second hub own naming its files',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const { first, alone, merged } = builds(from);
            const ofLab = merged.findings.filter((one) => one.file.startsWith(from.lab));
            expect(seen(ofLab)).toEqual(seen(alone.findings));
            const ofHub = merged.findings.filter((one) => !one.file.startsWith(from.lab));
            expect(seen(ofHub)).toEqual(seen(first.findings));
        }
    );

    it(
        'resolves a reference of the second hub in the primary hub when the primary alone holds the key',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const venues = join(from.hub, '.oculus', 'data', 'research', 'venues.yml');
            writeFileSync(
                venues,
                readFileSync(venues, 'utf8').replace(
                    /\nentries:\n/,
                    '\nentries:\n  - id: only-first\n    name: Only First\n'
                )
            );
            const manifest = join(from.lab, 'projects', 'active', 'graph-bandits', 'project.yml');
            writeFileSync(
                manifest,
                readFileSync(manifest, 'utf8').replace(
                    /^type: active$/m,
                    'type: active\nvenue_id: only-first'
                )
            );
            const { merged } = builds(from);
            expect(merged.entities.venues['hub:only-first']).toBeDefined();
            expect(merged.entities.venues['lab:only-first']).toBeUndefined();
            expect(
                merged.relations.projectVenue.filter(([left]) => left === 'lab:graph-bandits')
            ).toEqual([['lab:graph-bandits', 'hub:only-first']]);
            const unknown = merged.findings.filter(
                (one) => one.file === manifest && one.message.includes('not a key of venues')
            );
            expect(unknown.map((one) => one.message)).toEqual([]);
        }
    );

    it(
        'reads a field of a second-hub entry that names a record as the key its file holds (G32)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const events = join(from.lab, '.oculus', 'data', 'academic', 'events.yml');
            const schema = readFileSync(events, 'utf8');
            const declared = schema.replace(
                'type: tags,     help: "Project ids"',
                'type: tags,     from: projects, help: "Project ids"'
            );
            expect(declared).not.toBe(schema);
            writeFileSync(events, declared);
            const { merged } = builds(from);
            const entry = (collection: string, key: string): Entry => {
                const found = merged.entities.collections[collection].entries.find(
                    (one) => one.fields.key === key
                );
                if (found === undefined) throw new Error(`${collection} holds no entry ${key}`);
                return found;
            };
            expect(Object.keys(merged.entities.people)).toContain('hub:rivera-lab');
            expect(Object.keys(merged.entities.people)).toContain('lab:rivera-lab');
            expect(entry('hub:joint-work', 'rivera-lab').fields.person).toBe('rivera-lab');
            expect(entry('lab:joint-work', 'rivera-lab').fields.person).toBe('rivera-lab');
            const talk = 'streaming-anomaly-detection-at-scale';
            expect(entry('lab:events', talk).fields.related).toEqual(['streaming-anomaly']);
            expect(entry('lab:events', talk).fields.tags).toEqual(['talk', 'streaming']);
            expect(entry('lab:events', talk).fields.role).toBe('present');
        }
    );

    it(
        'resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const people = join(from.hub, '.oculus', 'data', 'people', 'people.yml');
            writeFileSync(
                people,
                readFileSync(people, 'utf8').replace(
                    /\nentries:\n/,
                    '\nentries:\n  - key: ghost\n    name: Ghost\n'
                )
            );
            const work = join(from.lab, '.oculus', 'data', 'academic', 'joint-work.yml');
            const text = readFileSync(work, 'utf8');
            const named = text.replace('person: "rivera-lab"', 'person: "ghost"');
            expect(named).not.toBe(text);
            writeFileSync(work, named);
            const { merged } = builds(from);
            const held = merged.entities.collections['lab:joint-work'].entries.find(
                (one) => one.fields.key === 'rivera-lab'
            );
            expect(held?.fields.person).toBe('ghost');
            expect(merged.entities.people['hub:ghost']).toBeDefined();
            expect(merged.entities.people['lab:ghost']).toBeUndefined();
            expect(merged.relations.jointWorkPerson).toContainEqual([
                'lab:rivera-lab',
                'hub:ghost'
            ]);
            const unknown = merged.findings.filter(
                (one) => one.file === work && one.message.includes('ghost')
            );
            expect(unknown).toEqual([]);
        }
    );

    it(
        'keeps a primary-hub lead whose title begins with the name of a hub folder and a colon as a lead of the primary, with no finding (G32)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const leads = join(from.hub, '.oculus', 'data', 'academic', 'leads.yml');
            writeFileSync(
                leads,
                readFileSync(leads, 'utf8').replace(
                    /\nentries:\n/,
                    '\nentries:\n  - title: "lab: Postdoc in graph learning"\n    status: open\n'
                )
            );
            const { snapshot, feeds } = published(
                [
                    { name: 'hub', dir: from.hub },
                    { name: 'lab', dir: from.lab }
                ],
                'hub'
            );
            const named = snapshot.findings.filter((one) => one.message.includes('lab: Postdoc'));
            expect(named.map((one) => one.file)).toEqual([]);
            const lead = feeds.leads.entries.filter(
                (one) => one.title === 'lab: Postdoc in graph learning'
            );
            expect(lead.map(feedIdents('leads', feeds.leads.entries))).toEqual([
                'hub:lab: Postdoc in graph learning'
            ]);
        }
    );

    it(
        'keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const folder = join(from.hub, 'projects', 'ideas', 'lab:x');
            mkdirSync(folder, { recursive: true });
            writeFileSync(join(folder, 'project.yml'), 'title: Colon\ntype: idea\n');
            const { merged } = builds(from);
            const named = merged.findings.filter((one) => one.file === join(folder, 'project.yml'));
            expect(named.some((one) => one.message.includes('lab:x'))).toBe(false);
            expect(merged.entities.projects['hub:lab:x']).toMatchObject({ root: 'hub' });
        }
    );
});

/** The file of a hub of the demo's shape at a path under its `.oculus/data/` folder. */
const dataFile = (hub: string, path: string): string => join(hub, '.oculus', 'data', path);

/** One text put in front of the entries of a file of the demo's shape. */
function plantEntries(file: string, text: string): void {
    const held = readFileSync(file, 'utf8');
    const planted = held.replace(/\nentries:\n/, `\nentries:\n${text}`);
    expect(planted).not.toBe(held);
    writeFileSync(file, planted);
}

/** A venue of the id `id` planted in a hub's venues file. */
function plantVenue(hub: string, id: string): void {
    plantEntries(dataFile(hub, 'research/venues.yml'), `  - id: "${id}"\n    name: Venue ${id}\n`);
}

/** A person of the key `key` planted in a hub's people file. */
function plantPerson(hub: string, key: string): void {
    plantEntries(dataFile(hub, 'people/people.yml'), `  - key: ${key}\n    name: Person ${key}\n`);
}

/** A project `id` of the ideas folder of a hub, its manifest holding `lines` too; its file. */
function plantProject(hub: string, id: string, lines = ''): string {
    const folder = join(hub, 'projects', 'ideas', id);
    mkdirSync(folder, { recursive: true });
    const file = join(folder, 'project.yml');
    writeFileSync(file, `title: Project ${id}\ntier: projects\ntype: idea\n${lines}`);
    return file;
}

/** The findings of a snapshot on one file whose sentence holds the word. */
const findingsOn = (snapshot: Snapshot, file: string, word: string): string[] =>
    snapshot.findings
        .filter((one) => one.file === file && one.message.includes(word))
        .map((one) => one.message);

describe('a workspace of several hubs, every record under its hub and its key', () => {
    it(
        'gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            plantVenue(from.hub, 'nature');
            plantVenue(from.lab, 'nature');
            plantProject(from.hub, 'own-paper', 'venue_id: nature\n');
            plantProject(from.lab, 'lab-paper', 'venue_id: nature\n');
            const { merged } = builds(from);
            const { venues, projects } = merged.entities;
            expect(venues['hub:nature']).toMatchObject({ id: 'hub:nature', root: 'hub' });
            expect(venues['lab:nature']).toMatchObject({ id: 'lab:nature', root: 'lab' });
            expect(projects['hub:own-paper'].venueId).toBe('hub:nature');
            expect(projects['lab:lab-paper'].venueId).toBe('lab:nature');
            expect(bareId(venues['hub:nature'])).toBe('nature');
            expect(bareId(venues['lab:nature'])).toBe('nature');
        }
    );

    it(
        'resolves a key its own hub does not hold in the one other hub that holds it, with no finding (C2, C4)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            plantPerson(from.lab, 'rivera');
            plantVenue(from.hub, 'science');
            const own = plantProject(from.hub, 'own-paper', 'collaborators: [rivera]\n');
            const lab = plantProject(from.lab, 'lab-paper', 'venue_id: science\n');
            const { merged } = builds(from);
            const { projects } = merged.entities;
            expect(projects['hub:own-paper'].collaborators).toEqual(['lab:rivera']);
            expect(merged.relations.projectPerson).toContainEqual(['hub:own-paper', 'lab:rivera']);
            expect(findingsOn(merged, own, 'rivera')).toEqual([]);
            expect(projects['lab:lab-paper'].venueId).toBe('hub:science');
            expect(merged.relations.projectVenue).toContainEqual(['lab:lab-paper', 'hub:science']);
            expect(findingsOn(merged, lab, 'science')).toEqual([]);
        }
    );

    it(
        "names the folder of each hub, and the project of a project folder by the folder's name, in a workspace with no primary (C3)",
        { tags: ['slow'] },
        () => {
            const base = copies().base;
            const a = copyHub(base, 'a');
            const b = copyHub(base, 'b');
            plantProject(a, 'alpha');
            plantProject(b, 'alpha');
            const c = plantScratch('oculus-hubs-folder-', {
                'project.yml': 'title: Alpha\ntier: projects\ntype: idea\n'
            });
            const { snapshot } = published([
                { name: 'a', dir: a },
                { name: 'b', dir: b },
                { name: 'c', dir: c }
            ]);
            expect(Object.keys(snapshot.entities.projects)).toEqual(
                expect.arrayContaining(['a:alpha', 'b:alpha', 'c:c'])
            );
            expect(bareId(snapshot.entities.projects['c:c'])).toBe('c');
        }
    );

    it(
        'gives a reference one finding naming the key and both hubs when two other hubs hold it, and resolves it to none (C5)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const team = copyHub(from.base, 'team');
            plantVenue(from.lab, 'cell');
            plantVenue(team, 'cell');
            const own = plantProject(from.hub, 'own-paper', 'venue_id: cell\n');
            const { snapshot } = published(
                [
                    { name: 'hub', dir: from.hub },
                    { name: 'lab', dir: from.lab },
                    { name: 'team', dir: team }
                ],
                'hub'
            );
            const found = findingsOn(snapshot, own, 'cell');
            expect(found).toHaveLength(1);
            expect(found[0]).toMatch(/cell.*lab.*team/);
            expect(snapshot.entities.projects['hub:own-paper'].venueId).toBeUndefined();
            expect(
                snapshot.relations.projectVenue.filter(([one]) => one === 'hub:own-paper')
            ).toEqual([]);
        }
    );

    it(
        "finds the page of an entry of the one hub that holds it and writes that hub's file (C6)",
        { tags: ['slow'] },
        async () => {
            const from = copies();
            const labEvents = dataFile(from.lab, 'academic/events.yml');
            const hubEvents = dataFile(from.hub, 'academic/events.yml');
            plantEntries(
                labEvents,
                '  - key: x\n    title: "Only lab"\n    role: attend\n    status: planned\n'
            );
            const { merged } = builds(from);
            expect(Object.keys(merged.entities.collections)).toEqual(
                expect.arrayContaining(['hub:events', 'lab:events'])
            );
            const pages = createPages(
                { snapshot: () => merged, feeds: () => null },
                createSettled(() => 0)
            );
            expect(pages.pageOf('events', 'lab:x')).toMatchObject({
                root: 'lab',
                writeId: 'lab:x'
            });
            const folders = [
                { name: 'hub', dir: from.hub },
                { name: 'lab', dir: from.lab }
            ];
            const into = hubsTarget(from.base, folders, 'hub');
            const before = readFileSync(hubEvents, 'utf8');
            const answer = await handleWrite(
                request({
                    kind: 'entry',
                    collection: 'events',
                    id: 'lab:x',
                    fields: { title: 'Lab only' }
                }),
                TOKEN,
                into
            );
            expect(answer.status).toBe(200);
            expect(readFileSync(labEvents, 'utf8')).toContain('title: "Lab only"');
            expect(readFileSync(hubEvents, 'utf8')).toBe(before);
        }
    );

    it(
        "keeps a key that begins with another hub's key and a colon as a record of its own hub, with no finding (C13)",
        { tags: ['slow'] },
        () => {
            const from = copies();
            const team = copyHub(from.base, 'team');
            plantVenue(from.lab, 'team:x');
            plantVenue(team, 'x');
            const { snapshot } = published(
                [
                    { name: 'lab', dir: from.lab },
                    { name: 'team', dir: team }
                ],
                'lab'
            );
            expect(snapshot.entities.venues['lab:team:x']).toMatchObject({ root: 'lab' });
            expect(snapshot.entities.venues['team:x']).toMatchObject({ root: 'team' });
            expect(snapshot.findings.filter((one) => one.message.includes('team:x'))).toEqual([]);
        }
    );

    it(
        "gives a lead of two hubs of one title two entries, and writes each to its own hub's file (C15)",
        { tags: ['slow'] },
        async () => {
            const from = copies();
            const lead = '  - title: "Shared lead"\n    status: open\n';
            const hubLeads = dataFile(from.hub, 'academic/leads.yml');
            const labLeads = dataFile(from.lab, 'academic/leads.yml');
            plantEntries(hubLeads, lead);
            plantEntries(labLeads, lead);
            const folders = [
                { name: 'hub', dir: from.hub },
                { name: 'lab', dir: from.lab }
            ];
            const { feeds } = published(folders, 'hub');
            const entries = feeds.leads.entries.filter((one) => one.title === 'Shared lead');
            const ids = entries.map(feedIdents('leads', feeds.leads.entries));
            expect(ids.sort()).toEqual(['hub:Shared lead', 'lab:Shared lead']);
            const into = hubsTarget(from.base, folders, 'hub');
            for (const [root, file, other, status] of [
                ['lab', labLeads, hubLeads, 'applied'],
                ['hub', hubLeads, labLeads, 'declined']
            ]) {
                const untouched = readFileSync(other, 'utf8');
                const answer = await handleWrite(
                    request({
                        kind: 'feed-field',
                        feed: 'leads',
                        id: `${root}:Shared lead`,
                        field: 'status',
                        value: status
                    }),
                    TOKEN,
                    into
                );
                expect(answer.status, root).toBe(200);
                expect(readFileSync(file, 'utf8')).toContain(`Shared lead"\n    status: ${status}`);
                expect(readFileSync(other, 'utf8')).toBe(untouched);
            }
        }
    );
});
