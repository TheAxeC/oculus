// Layer 1, data tests. normalise against hand-built raw records: the field mapping, the relation
// tables, determinism, and the JSON round trip. Nothing here reads or writes a file; normalise is
// pure.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import {
    collectionKeys,
    collectionSchema,
    followups,
    normalise,
    subtasks
} from '../../../src/lib/data/snapshot/normalise.ts';
import { career } from '../../../src/lib/data/snapshot/normalise-career.ts';
import type {
    DocPresence,
    RawCollection,
    RawManifest,
    RawPortfolio,
    RawRegistry,
    RawRegistryEntry,
    RegistryName
} from '../../../src/lib/data/model/index.ts';

/** What sources/docs.ts hands the build for one folder: the fixed names, with a path and a flag. */
function documents(id: string, present: string[], mtime = 0): DocPresence[] {
    return ['README.md', 'code/README.md'].map((name) => ({
        name,
        label: name === 'code/README.md' ? 'CODE' : 'README',
        path: `/hub/projects/active/${id}/${name}`,
        present: present.includes(name),
        human: false,
        mtime: present.includes(name) ? mtime : 0
    }));
}

/** The moment a day's midnight falls at, for the staleness cases. */
function day(iso: string): number {
    return new Date(`${iso}T12:00:00Z`).getTime();
}

function manifest(data: Record<string, unknown>, id: string): RawManifest {
    return {
        file: `/hub/projects/active/${id}/project.yml`,
        folder: `projects/active/${id}`,
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        ...data
    };
}

function entries(name: RegistryName, items: Record<string, unknown>[]): RawRegistry {
    const file = `/hub/${name}.yml`;
    return {
        entries: items.map(
            (item) => ({ ...item, registry: name, key: item.key ?? '', file }) as RawRegistryEntry
        ),
        meta: {}
    };
}

function collection(key: string, items: Record<string, unknown>[]): RawCollection {
    const file = `/hub/${key}.yml`;
    return {
        key,
        file,
        meta: { title: key.toUpperCase(), intro: 'about it' },
        entries: items.map((fields, index) => ({ ...fields, provenance: { file, index } }))
    };
}

/**
 * Two projects on one pillar: alpha names every relation and beta names a venue that is not
 * in the registry, so one fixture carries both the resolved and the dangling case.
 */
function portfolio(): RawPortfolio {
    return {
        personal: [],
        manifests: [
            manifest(
                {
                    title: 'Alpha',
                    short: 'a',
                    lead: 'Faes',
                    authors: ['Faes', 'Someone'],
                    year: 2026,
                    status: { chips: ['lead'], line: 'submit-ready' },
                    focus: 'run',
                    eli5: 'about alpha',
                    next: 'run it',
                    latest: 'ran it',
                    results: ['one'],
                    ideas: ['two'],
                    deadline: '2026-11-17',
                    doi: '10.0/alpha',
                    outcome: 'in review',
                    venue_id: 'bspc',
                    domain: 'heart',
                    pillar: ['federated'],
                    datasets: ['mimic'],
                    funding: ['FAIR'],
                    related: ['beta'],
                    collaborators: ['someone'],
                    compute: ['utwente'],
                    pin: true,
                    priority: 'high',
                    'waiting-on': ['someone', 'A Free Name'],
                    followup: [{ do: 'chase the coauthor', after: '2026-01-01' }, 'watch the call'],
                    snooze: '2026-12-01',
                    subtasks: {
                        fig: { do: 'redraw figure 2', deadline: '2026-10-01' },
                        ack: { do: 'add the funding line', done: true }
                    },
                    paths: { manuscript: 'ms' },
                    code_availability: {
                        status: 'deposited',
                        date: '2026-08-01',
                        url: 'https://example.invalid/alpha',
                        doi: '10.0/code',
                        repo: 'alpha-code',
                        visibility: 'public'
                    },
                    reproduced: { date: '2026-08-02', note: 'needs a GPU' }
                },
                'alpha'
            ),
            manifest(
                {
                    title: 'Beta',
                    authors: 'Faes and others',
                    venue_id: 'nowhere',
                    related: ['ghost'],
                    pin: false,
                    venue: 'a journal with no catalogue entry',
                    code_availability: { visibility: 'private' },
                    reproduced: 'not a map',
                    priority: 7,
                    'waiting-on': 'not a list',
                    followup: { after: '2026-01-01' },
                    snooze: 12,
                    subtasks: 'not a checklist'
                },
                'beta'
            )
        ],
        registries: {
            venues: entries('venues', [
                {
                    key: 'bspc',
                    name: 'BSPC',
                    jif: '4.9',
                    free: 'APC',
                    themes: ['signal'],
                    deadline: '2026-09-01',
                    deadline_month: 'Sep',
                    held_month: 'Jan',
                    timing: 'deadline Sep, held Jan',
                    call: 'https://example.invalid/call',
                    email: 'chair@example.invalid'
                },
                { key: 'indexed', name: 'Indexed', wos: '\u2705 SCIE', scopus: '\u274C' },
                { key: 'prose', name: 'Prose', wos: 'CPCI (likely)', scopus: '\u2705\uFE0F' }
            ]),
            datasets: entries('datasets', [
                {
                    key: 'mimic',
                    name: 'MIMIC-IV',
                    source: 'https://example.invalid/mimic',
                    hpc_path: '/data/mimic',
                    retrieval: { method: 'wget', notes: 'credentialed' },
                    themes: ['ecg']
                }
            ]),
            pillars: entries('pillars', [
                { key: 'federated', title: 'Federated learning', color: '#2563eb' }
            ]),
            domains: entries('domains', [{ key: 'heart', title: 'Cardiology' }]),
            funding: entries('funding', [
                { key: 'FAIR', title: 'Flanders AI', tags: ['flanders'], funder: 'fwo' },
                { title: 'A scheme with no key' }
            ]),
            people: entries('people', [
                {
                    key: 'someone',
                    name: 'Someone Else',
                    affiliations: ['twente', 'fwo', 'nowhere'],
                    role: 'co-author',
                    orcid: '0000-0000-0000-0000',
                    email: 'someone@example.invalid',
                    links: ['https://example.invalid/someone'],
                    self: true
                },
                { key: 'nobody-home', name: 'Nobody Home', affiliation: 'twente' }
            ]),
            organisations: entries('organisations', [
                { key: 'twente', name: 'University of Twente', kind: 'university', country: 'NL' },
                { key: 'fwo', name: 'Research Foundation Flanders', kind: 'funder' }
            ]),
            resources: entries('resources', [
                { key: 'utwente', name: 'UTwente HPC', kind: 'cluster', host: 'utwente' }
            ])
        },
        collections: {
            funding: collection('funding', [{ title: 'Flanders AI' }]),
            events: collection('events', [{ title: 'A talk', status: 'planned' }]),
            venues: {
                ...collection('venues', [{ name: 'BSPC', id: 'bspc' }]),
                meta: {
                    title: 'VENUES',
                    schema: [
                        { field: 'name', type: 'text' },
                        { field: 'category', type: 'select', options_from: 'venue_categories' }
                    ]
                }
            },
            pillars: {
                ...collection('pillars', [{ key: 'federated', title: 'Federated learning' }]),
                meta: { title: 'PILLARS', schema: [{ field: 'key', type: 'text' }] }
            },
            domains: {
                ...collection('domains', [{ key: 'heart', title: 'Cardiology' }]),
                meta: { title: 'DOMAINS', schema: [{ field: 'key', type: 'text' }] }
            },
            data: {
                ...collection('data', [
                    {
                        key: 'mimic',
                        name: 'MIMIC-IV',
                        source: 'https://example.invalid/mimic',
                        retrieval: { method: 'wget' },
                        themes: ['ecg']
                    }
                ]),
                meta: {
                    intro: 'dataset registry',
                    schema: [
                        { field: 'key', type: 'text' },
                        { field: 'retrieval', type: 'raw' }
                    ]
                }
            }
        },
        feeds: NO_FEEDS,
        career: null,
        docs: { alpha: documents('alpha', ['README.md']) },
        present: {},
        findings: []
    };
}

const snapshot = normalise(portfolio(), []);
const alpha = snapshot.entities.projects.alpha;

describe('normalise, the field mapping', () => {
    it('fills a project from the manifest keys of the same meaning', () => {
        expect(alpha).toEqual({
            id: 'alpha',
            tier: 'active',
            ghost: false,
            type: 'active',
            title: 'Alpha',
            short: 'a',
            lead: 'Faes',
            authors: ['Faes', 'Someone'],
            year: 2026,
            chips: ['lead'],
            statusLine: 'submit-ready',
            focus: 'run',
            priority: 'high',
            eli5: 'about alpha',
            next: 'run it',
            latest: 'ran it',
            results: ['one'],
            ideas: ['two'],
            deadline: '2026-11-17',
            waitingOn: ['someone', 'A Free Name'],
            followups: [
                { do: 'chase the coauthor', after: '2026-01-01' },
                { do: 'watch the call' }
            ],
            snooze: '2026-12-01',
            subtasks: [
                { key: 'fig', do: 'redraw figure 2', deadline: '2026-10-01', done: false },
                { key: 'ack', do: 'add the funding line', done: true }
            ],
            doi: '10.0/alpha',
            outcome: 'in review',
            resourceIds: ['utwente'],
            pin: true,
            codeAvailability: {
                status: 'deposited',
                date: '2026-08-01',
                url: 'https://example.invalid/alpha',
                doi: '10.0/code',
                repo: 'alpha-code'
            },
            reproduced: { date: '2026-08-02', note: 'needs a GPU' },
            relatedIds: ['beta'],
            venueId: 'bspc',
            fundingIds: ['FAIR'],
            datasetIds: ['mimic'],
            pillarIds: ['federated'],
            domainIds: ['heart'],
            collaborators: ['someone'],
            docs: [
                { name: 'README.md', label: 'README', present: true, human: false },
                { name: 'code/README.md', label: 'CODE', present: false, human: false }
            ],
            folder: 'projects/active/alpha',
            file: '/hub/projects/active/alpha/project.yml'
        });
    });

    it('keeps an authors line that was written as one string', () => {
        expect(snapshot.entities.projects.beta.authors).toBe('Faes and others');
    });

    it('keeps the free-text venue prose of a manifest that has one', () => {
        expect(snapshot.entities.projects.beta.venue).toBe('a journal with no catalogue entry');
        expect('venue' in alpha).toBe(false);
    });

    it('drops a pin that is not set, a deposit with nothing the model declares, and a bad map', () => {
        const beta = snapshot.entities.projects.beta;
        expect('pin' in beta).toBe(false);
        expect('codeAvailability' in beta).toBe(false);
        expect('reproduced' in beta).toBe(false);
    });

    it('leaves a project with no documents read an empty list rather than nothing', () => {
        expect(snapshot.entities.projects.beta.docs).toEqual([]);
    });

    it('carries no manifest key the model does not declare', () => {
        expect('paths' in alpha).toBe(false);
        expect('visibility' in (alpha.codeAvailability ?? {})).toBe(false);
    });

    it('drops a priority, a waiting-on, a follow-up, a snooze and a checklist of the wrong shape', () => {
        const beta = snapshot.entities.projects.beta;
        expect('priority' in beta).toBe(false);
        expect('snooze' in beta).toBe(false);
        expect(beta.waitingOn).toEqual([]);
        expect(beta.followups).toEqual([]);
        expect(beta.subtasks).toEqual([]);
    });

    it('numbers the lines of a checklist written as a list, since a list has no keys of its own', () => {
        const one = normalise(
            {
                personal: [],
                manifests: [
                    manifest({ subtasks: ['first', { do: 'second', done: true }] }, 'solo')
                ],
                registries: {
                    venues: entries('venues', []),
                    datasets: entries('datasets', []),
                    pillars: entries('pillars', []),
                    domains: entries('domains', []),
                    funding: entries('funding', []),
                    people: entries('people', []),
                    organisations: entries('organisations', []),
                    resources: entries('resources', [])
                },
                collections: {},
                feeds: NO_FEEDS,
                career: null,
                docs: {},
                present: {},
                findings: []
            },
            []
        );
        expect(one.entities.projects.solo.subtasks).toEqual([
            { key: '0', do: 'first', done: false },
            { key: '1', do: 'second', done: true }
        ]);
    });

    it('reads a leading check or cross of an indexing field as its mark, and keeps the words', () => {
        const { indexed, prose } = snapshot.entities.venues;
        expect([indexed.wos, indexed.wosMark, indexed.scopus, indexed.scopusMark]).toEqual([
            'SCIE',
            'yes',
            undefined,
            'no'
        ]);
        expect([prose.wos, prose.wosMark, prose.scopus, prose.scopusMark]).toEqual([
            'CPCI (likely)',
            undefined,
            undefined,
            'yes'
        ]);
        const drawn = JSON.stringify(snapshot.entities.venues);
        expect(drawn).not.toMatch(/[^\t\n\r\x20-\x7E]/);
    });

    it('fills the registry entities, hpc_path and retrieval included', () => {
        expect(snapshot.entities.venues.bspc).toEqual({
            id: 'bspc',
            name: 'BSPC',
            jif: '4.9',
            free: 'APC',
            deadline: '2026-09-01',
            deadlineMonth: 'Sep',
            heldMonth: 'Jan',
            timing: 'deadline Sep, held Jan',
            call: 'https://example.invalid/call',
            email: 'chair@example.invalid',
            themes: ['signal']
        });
        expect(snapshot.entities.datasets.mimic).toEqual({
            id: 'mimic',
            name: 'MIMIC-IV',
            source: 'https://example.invalid/mimic',
            hpcPath: '/data/mimic',
            retrieval: { method: 'wget', notes: 'credentialed' },
            themes: ['ecg'],
            projectIds: ['alpha']
        });
    });

    it('carries the funding file as a collection as well as a registry', () => {
        expect(Object.keys(snapshot.entities.collections)).toEqual([
            'data',
            'domains',
            'events',
            'funding',
            'pillars',
            'venues'
        ]);
        expect(Object.keys(snapshot.entities.funding)).toEqual(['A scheme with no key', 'FAIR']);
        expect(snapshot.entities.collections.events).toEqual({
            id: 'events',
            title: 'EVENTS',
            intro: 'about it',
            file: '/hub/events.yml',
            entries: [
                {
                    id: 'A talk',
                    title: 'A talk',
                    fields: { title: 'A talk', status: 'planned' },
                    file: '/hub/events.yml',
                    index: 0
                }
            ]
        });
        expect(snapshot.entities.collections.venues.entries[0]).toMatchObject({
            id: 'bspc',
            title: 'BSPC',
            fields: { name: 'BSPC', id: 'bspc' }
        });
        expect(snapshot.entities.collections.pillars.entries[0].id).toBe('federated');
        expect(snapshot.entities.collections.domains.entries[0].id).toBe('heart');
        expect(snapshot.entities.collections.data).toMatchObject({
            id: 'data',
            intro: 'dataset registry',
            schema: [
                { field: 'key', type: 'text' },
                { field: 'retrieval', type: 'raw' }
            ]
        });
        expect(snapshot.entities.collections.data.entries[0]).toMatchObject({
            id: 'mimic',
            fields: {
                key: 'mimic',
                name: 'MIMIC-IV',
                source: 'https://example.invalid/mimic',
                retrieval: { method: 'wget' },
                themes: ['ecg']
            }
        });
    });
});

describe('normalise, an entry whose YAML carries a __proto__ key', () => {
    it('skips the key when it builds the fields', () => {
        const raw = portfolio();
        const planted = JSON.parse('{"__proto__":{"injected":"yes"},"title":"t"}') as Record<
            string,
            unknown
        >;
        raw.collections.events.entries = [
            { ...planted, provenance: { file: '/hub/events.yml', index: 0 } }
        ];
        const found = normalise(raw, []).entities.collections.events.entries[0];

        expect(Object.getPrototypeOf(found.fields)).toBe(Object.prototype);
        expect(found.fields).not.toHaveProperty('injected');
        expect(Object.keys(found.fields)).toStrictEqual(['title']);
    });
});

describe("normalise, a collection's schema", () => {
    /**
     * The events collection with one `schema:` value under its meta, as the file would carry it.
     */
    function events(schema: unknown) {
        const raw = portfolio();
        raw.collections.events.meta.schema = schema;
        return normalise(raw, []).entities.collections.events;
    }

    it('carries the file schema onto the wire, one map per field', () => {
        const found = events([
            { field: 'title', type: 'text', required: true },
            { field: 'sub', type: 'text', label: 'Subtitle' },
            { field: 'status', type: 'select', options: ['planned', 'completed'], help: 'pick one' }
        ]);
        expect(found.schema).toEqual([
            { field: 'title', type: 'text', required: true },
            { field: 'sub', type: 'text', label: 'Subtitle' },
            { field: 'status', type: 'select', options: ['planned', 'completed'], help: 'pick one' }
        ]);
    });

    it('carries a select options_from key onto the wire', () => {
        const found = events([{ field: 'status', type: 'select', options_from: 'statuses' }]);
        expect(found.schema).toEqual([
            { field: 'status', type: 'select', optionsFrom: 'statuses' }
        ]);
    });

    it('carries no schema for a file that has none', () => {
        expect('schema' in events(undefined)).toBe(false);
    });

    it('leaves off a schema that is not a list of maps naming a field and a type', () => {
        expect(events('title, status').schema).toBe(undefined);
        expect(events([{ field: 'title' }]).schema).toBe(undefined);
        expect(events([{ type: 'text' }]).schema).toBe(undefined);
        expect(events(['title']).schema).toBe(undefined);
    });
});

describe('normalise, the relations', () => {
    it('carries a pillar registry color into the entity', () => {
        expect(snapshot.entities.pillars.federated.color).toBe('#2563eb');
    });

    it('writes one table per relation, sorted by the pair', () => {
        expect(snapshot.relations).toEqual({
            projectVenue: [['alpha', 'bspc']],
            projectFunding: [['alpha', 'FAIR']],
            projectDataset: [['alpha', 'mimic']],
            projectPillar: [['alpha', 'federated']],
            projectDomain: [['alpha', 'heart']],
            projectRelated: [['alpha', 'beta']],
            fundingPillar: [['FAIR', 'federated']],
            projectPerson: [['alpha', 'someone']],
            jointWorkPerson: [],
            personOrganisation: [
                ['nobody-home', 'twente'],
                ['someone', 'fwo'],
                ['someone', 'twente']
            ],
            fundingOrganisation: [['FAIR', 'fwo']]
        });
    });

    it('keeps every affiliations key the organisation registry holds, and drops the rest', () => {
        expect(snapshot.entities.people.someone.affiliations).toEqual(['twente', 'fwo']);
        expect(snapshot.entities.organisations.twente.personIds).toEqual([
            'nobody-home',
            'someone'
        ]);
    });

    it('reads the one key the list replaced as a list of that one', () => {
        expect(snapshot.entities.people['nobody-home'].affiliations).toEqual(['twente']);
    });

    it('fills the other side of each relation on the entity that is pointed at', () => {
        expect(snapshot.entities.pillars.federated.projectIds).toEqual(['alpha']);
        expect(snapshot.entities.pillars.federated.fundingIds).toEqual(['FAIR']);
        expect(snapshot.entities.domains.heart.projectIds).toEqual(['alpha']);
        expect(snapshot.entities.funding.FAIR.projectIds).toEqual(['alpha']);
        expect(snapshot.entities.funding.FAIR.pillarIds).toEqual(['federated']);
    });

    it('leaves an id that names nothing out of the table and out of the entity', () => {
        expect(snapshot.entities.projects.beta.relatedIds).toEqual([]);
        expect('venueId' in snapshot.entities.projects.beta).toBe(false);
    });
});

describe('normalise, staleness', () => {
    /** One project whose documents and whose manifest were written on the days named. */
    function stale(docDay: string, manifestDay: string | undefined) {
        const raw = portfolio();
        raw.manifests = [
            {
                ...raw.manifests[0],
                ...(manifestDay === undefined ? {} : { fileMtime: day(manifestDay) })
            }
        ];
        raw.docs = { alpha: documents('alpha', ['README.md'], day(docDay)) };
        return normalise(raw, []).entities.projects.alpha;
    }

    it('carries each present document mtime and leaves an absent one without', () => {
        const docs = stale('2026-09-10', '2026-09-01').docs;
        expect(docs.find((doc) => doc.name === 'README.md')?.mtime).toBe(day('2026-09-10'));
        expect('mtime' in (docs.find((doc) => doc.name === 'code/README.md') ?? {})).toBe(false);
    });

    it('counts the whole days a document is ahead of the manifest', () => {
        expect(stale('2026-09-10', '2026-09-01').staleDays).toBe(9);
    });

    it('leaves the field out when the manifest is the newer of the two', () => {
        expect('staleDays' in stale('2026-09-01', '2026-09-10')).toBe(false);
    });

    it('leaves the field out when both were written on the same day', () => {
        expect('staleDays' in stale('2026-09-10', '2026-09-10')).toBe(false);
    });

    it('leaves the field out when the manifest has no mtime at all', () => {
        expect('staleDays' in stale('2026-09-10', undefined)).toBe(false);
    });
});

describe('normalise, the wire', () => {
    it('takes the version from the caller and defaults it to zero', () => {
        expect(snapshot.version).toBe(0);
        expect(normalise(portfolio(), [], 7).version).toBe(7);
    });

    it('carries the findings it was given', () => {
        const finding = { file: '/hub/a.yml', key: 'x', message: 'wrong' };
        expect(normalise(portfolio(), [finding]).findings).toEqual([finding]);
    });

    it('survives JSON.stringify and JSON.parse unchanged', () => {
        expect(JSON.parse(JSON.stringify(snapshot))).toStrictEqual(snapshot);
    });

    it('produces the same bytes on two runs over the same records', () => {
        expect(JSON.stringify(normalise(portfolio(), []))).toBe(
            JSON.stringify(normalise(portfolio(), []))
        );
    });
});

describe('normalise, the readers of an entry over values of the wrong shape', () => {
    it.each([
        ['str', [{ do: 'str' }]],
        [{}, []],
        [['a'], [{ do: 'a' }]],
        [[3], []],
        [{ do: 3 }, []],
        [{ do: 'x', after: 'y' }, [{ do: 'x', after: 'y' }]],
        [{ do: 'x', after: 3 }, [{ do: 'x' }]],
        [
            ['a', { do: 'b', after: 'c' }, 3, { do: ' ' }],
            [{ do: 'a' }, { do: 'b', after: 'c' }]
        ],
        [null, []],
        [3, []]
    ])('reads the followup %j as %j', (value, notes) => {
        expect(followups(value)).toStrictEqual(notes);
    });

    it.each([
        ['str', []],
        [{}, []],
        [null, []],
        [7, []],
        [
            ['a', { do: 'b' }],
            [
                { key: '0', do: 'a', done: false },
                { key: '1', do: 'b', done: false }
            ]
        ],
        [
            {
                a: 'x',
                b: { do: 3 },
                c: { do: 'y', done: 'true' },
                d: { do: 'z', done: true, deadline: 3, snooze: 's' },
                e: 3,
                f: null,
                g: { do: 'w', deadline: 'd1' }
            },
            [
                { key: 'a', do: 'x', done: false },
                { key: 'c', do: 'y', done: false },
                { key: 'd', do: 'z', done: true, snooze: 's' },
                { key: 'g', do: 'w', deadline: 'd1', done: false }
            ]
        ],
        [[3, ' ', { do: 'q', done: true }], [{ key: '2', do: 'q', done: true }]]
    ])('reads the subtasks %j as %j', (value, rows) => {
        expect(subtasks(value)).toStrictEqual(rows);
    });

    it.each([
        ['str', undefined],
        [{}, undefined],
        [['x'], undefined],
        [null, undefined],
        [[], []],
        [[{ field: 3, type: 't' }], undefined],
        [[{ key: 'k', required: 'yes' }], undefined],
        [[{ key: 3 }], undefined],
        [[{ field: 'a', type: 'text' }, 3], undefined],
        [[{ field: 'a', type: 'text' }], [{ field: 'a', type: 'text' }]],
        [
            [
                {
                    field: 'a',
                    type: 'text',
                    required: 'yes',
                    options: [1, 'a'],
                    label: 3,
                    help: 'h',
                    options_from: 'x'
                }
            ],
            [{ field: 'a', type: 'text', options: ['a'], optionsFrom: 'x', help: 'h' }]
        ],
        [[{ field: 'a', type: 'text', options: 'x' }], [{ field: 'a', type: 'text', options: [] }]],
        [
            [
                { field: 'a', type: 'text', required: true },
                { field: 'b', type: 'text', required: false }
            ],
            [
                { field: 'a', type: 'text', required: true },
                { field: 'b', type: 'text', required: false }
            ]
        ]
    ])('reads the schema %j as %j', (value, schema) => {
        expect(collectionSchema(value)).toStrictEqual(schema);
    });

    it('reads the collection keys that name a collection of their own, once each', () => {
        const keys = [
            3,
            { key: '' },
            { key: 'registry key' },
            { key: 'a' },
            { key: 'a' },
            'k',
            null,
            { key: 'venues' },
            { key: 'data' },
            { key: 'b' }
        ];
        expect(collectionKeys({ collections: keys })).toStrictEqual(['registry key', 'a', 'b']);
        for (const held of ['x', {}, null, undefined]) {
            expect(collectionKeys({ collections: held })).toStrictEqual([]);
        }
    });

    it('reads a project whose year is not a finite number and whose status is not a map', () => {
        const raw = portfolio();
        raw.manifests.push(
            manifest({ title: 'G', year: Number.NaN, status: [] }, 'gamma'),
            manifest({ title: 'H', year: '2020', status: 'done' }, 'delta')
        );
        const found = normalise(raw, []).entities.projects;
        for (const id of ['gamma', 'delta']) {
            expect('year' in found[id]).toBe(false);
            expect('statusLine' in found[id]).toBe(false);
            expect(found[id].chips).toStrictEqual([]);
        }
    });
});

describe('normalise, the career strategy over values of the wrong shape', () => {
    const EMPTY = {
        title: '',
        situation: [],
        order: [],
        hosts: [],
        hostCriteria: [],
        notHosts: [],
        eligibility: null,
        dropped: []
    };

    it('answers null for no file', () => {
        expect(career(null)).toBeNull();
    });

    it.each([
        [{}],
        [{ hosts: 'x', order: [3], situation: [], not_hosts: 'x', dropped: 'x', eligibility: 3 }],
        [{ situation: [], hosts: {}, order: {}, not_hosts: {}, dropped: {}, eligibility: [] }],
        [{ eligibility: { rule: 3 } }]
    ])('reads %j as an empty strategy', (raw) => {
        expect(career(raw)).toStrictEqual(EMPTY);
    });

    it('reads each row of each section by its own shape', () => {
        expect(
            career({
                hosts: [
                    3,
                    { name: 3 },
                    { name: ' ' },
                    { name: 'N', status: 3, x: 's', y: 3, z: ' ', note: '[proposal: Strong] hello' }
                ],
                order: [
                    3,
                    'task',
                    ' ',
                    { task: 3 },
                    { task: ' ' },
                    { task: 't', when: 3, note: 'n' }
                ],
                situation: { a: 'x', b: 3, c: null },
                not_hosts: [3, 'who', { who: 3 }, { who: 'w', why: 3 }, { who: 'w2', why: 'y' }],
                dropped: [{ what: 'x' }, 'y', 5],
                host_criteria: ['a', 3],
                title: 3,
                milestone: 3,
                order_note: 3
            })
        ).toStrictEqual({
            title: '',
            situation: [{ label: 'a', value: 'x' }],
            order: [{ task: 'task' }, { task: 't', note: 'n' }],
            hosts: [{ name: 'N', status: 'candidate', scores: { x: 's' }, note: 'hello' }],
            hostCriteria: ['a'],
            notHosts: [{ who: 'who' }, { who: 'w' }, { who: 'w2', why: 'y' }],
            eligibility: null,
            dropped: [{ what: 'x' }, { what: 'y' }]
        });
    });

    it('reads the eligibility rule as a text, a list or neither', () => {
        expect(career({ eligibility: { rule: 'single', shots: 'x' } })?.eligibility).toStrictEqual({
            rule: ['single'],
            shots: []
        });
        expect(
            career({ eligibility: { rule: ['a', 3], shots: ['s'], caveat: 3 } })?.eligibility
        ).toStrictEqual({ rule: ['a'], shots: ['s'] });
        expect(career({ eligibility: { rule: 3, caveat: 'c' } })?.eligibility).toStrictEqual({
            rule: [],
            shots: [],
            caveat: 'c'
        });
    });
});
