// Layer 4, data test. Several hubs as one portfolio, as the watcher publishes it
// (lib/server/root/watch/portfolio.ts through lib/data/snapshot/hubs/merge.ts): what each hub shows
// is what its files say, every record of both hubs is present under an id of its own, and a
// reference never crosses from one hub to the other.
//
// The hubs are two copies of tests/fixtures/hubs/demo/ under the system temporary directory
// (hubs-fixture.ts), so every id of the second hub is also an id of the first, which is the case
// the prefix exists for. tests/data/hubs/hub-folders.test.ts reads what makes a folder of a
// workspace a hub.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { Entry, Relations, Snapshot } from '../../../src/lib/data/model/index.ts';
import { it } from '../../fixtures/scratch.ts';
import { copies, published } from './hubs-fixture.ts';

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
        'is the primary hub as it is built alone when the workspace lists one hub',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const config = portfolioConfigFrom(loadConfig(engineDir(), { hub: from.hub }).config);
            const direct = buildPortfolioWithSchemas(from.hub, config).snapshot;
            const watched = published([{ name: 'hub', dir: from.hub }], 'hub').snapshot;
            expect(JSON.stringify(watched)).not.toContain('"root"');
            for (const kind of KINDS) {
                expect(Object.keys(watched.entities[kind]), kind).toEqual(
                    Object.keys(direct.entities[kind])
                );
            }
            expect(seen(watched.findings)).toEqual(seen(direct.findings));
        }
    );

    it(
        'holds every record of both hubs, the second hub under the name of its folder',
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
                        record.id.startsWith('lab:') ? 'lab' : undefined
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
                const held = merged.entities.projects[`lab:${project.id}`];
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

    it('resolves a reference of the second hub in the second hub only', { tags: ['slow'] }, () => {
        const from = copies();
        const venues = join(from.hub, 'registries', 'venues.yml');
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
        expect(merged.entities.venues['only-first']).toBeDefined();
        expect(merged.entities.venues['lab:only-first']).toBeUndefined();
        expect(
            merged.relations.projectVenue.filter(([left]) => left === 'lab:graph-bandits')
        ).toEqual([]);
        const unknown = merged.findings.filter(
            (one) => one.file === manifest && one.message.includes('not a key of venues')
        );
        expect(unknown.map((one) => one.message)).toEqual([
            'venue_id is only-first, which is not a key of venues'
        ]);
    });

    it(
        'reads a field of a second-hub entry that names a record under the second hub id (G32)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const events = join(from.lab, 'network', 'events.yml');
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
            expect(Object.keys(merged.entities.people)).toContain('rivera-lab');
            expect(Object.keys(merged.entities.people)).toContain('lab:rivera-lab');
            expect(entry('joint-work', 'rivera-lab').fields.person).toBe('rivera-lab');
            expect(entry('lab:joint-work', 'rivera-lab').fields.person).toBe('lab:rivera-lab');
            const talk = 'streaming-anomaly-detection-at-scale';
            expect(entry('lab:events', talk).fields.related).toEqual(['lab:streaming-anomaly']);
            expect(entry('lab:events', talk).fields.tags).toEqual(['talk', 'streaming']);
            expect(entry('lab:events', talk).fields.role).toBe('present');
        }
    );

    it(
        'prefixes a value its hub cannot resolve too, so it never reads as a record of the primary hub (G32)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const people = join(from.hub, 'registries', 'people.yml');
            writeFileSync(
                people,
                readFileSync(people, 'utf8').replace(
                    /\nentries:\n/,
                    '\nentries:\n  - key: ghost\n    name: Ghost\n'
                )
            );
            const work = join(from.lab, 'network', 'joint-work.yml');
            const text = readFileSync(work, 'utf8');
            const named = text.replace('person: "rivera-lab"', 'person: "ghost"');
            expect(named).not.toBe(text);
            writeFileSync(work, named);
            const { merged } = builds(from);
            const held = merged.entities.collections['lab:joint-work'].entries.find(
                (one) => one.fields.key === 'rivera-lab'
            );
            expect(held?.fields.person).toBe('lab:ghost');
            expect(merged.entities.people.ghost).toBeDefined();
            expect(merged.entities.people['lab:ghost']).toBeUndefined();
            const unknown = merged.findings.filter(
                (one) => one.file === work && one.message.includes('ghost')
            );
            expect(unknown.length).toBeGreaterThan(0);
        }
    );

    it(
        'names a primary-hub lead whose title begins with the name of a hub folder and a colon (G32)',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const leads = join(from.hub, 'feeds', 'position-leads.yml');
            writeFileSync(
                leads,
                readFileSync(leads, 'utf8').replace(
                    /\nentries:\n/,
                    '\nentries:\n  - title: "lab: Postdoc in graph learning"\n    status: open\n'
                )
            );
            const { merged } = builds(from);
            const named = merged.findings.filter((one) => one.message.includes('lab: Postdoc'));
            expect(named.map((one) => one.file)).toEqual([leads]);
        }
    );

    it(
        'names a primary-hub id that begins with the name of a hub folder and a colon as a finding',
        { tags: ['slow'] },
        () => {
            const from = copies();
            const folder = join(from.hub, 'projects', 'ideas', 'lab:x');
            mkdirSync(folder, { recursive: true });
            writeFileSync(join(folder, 'project.yml'), 'title: Colon\ntype: idea\n');
            const { merged } = builds(from);
            const named = merged.findings.filter((one) => one.file === join(folder, 'project.yml'));
            expect(named.some((one) => one.message.includes('lab:x'))).toBe(true);
        }
    );
});
