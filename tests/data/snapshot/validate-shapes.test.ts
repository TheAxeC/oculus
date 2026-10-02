// validate over raw records whose fields hold values of the wrong shape, and the readers of the
// schema's field names. Findings are compared whole and in order. Nothing here reads or writes a
// file; validate is pure and the records are literals.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { fieldNames, schemaKeys, validate } from '../../../src/lib/data/snapshot/validate.ts';
import { readManifests } from '../../../src/lib/data/sources/manifests.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type {
    RawManifest,
    RawPortfolio,
    RawRegistry,
    RegistryName,
    ValidationRules
} from '../../../src/lib/data/model/index.ts';

const NAMES: RegistryName[] = [
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources'
];

const RULES: ValidationRules = {
    schema: [
        'id',
        'title',
        'type',
        'status.chips',
        'domain',
        'pillar',
        'funding',
        'related',
        'collaborators',
        'waiting-on',
        'focus',
        'datasets',
        'venue_id'
    ],
    vocab: {
        types: ['active'],
        statuses: ['planned', 'done'],
        chips: ['lead'],
        lanes: ['run', 'holding'],
        hostStatuses: ['warm', 'cold'],
        venueThemes: ['on'],
        dataThemes: ['on']
    },
    careerFile: '/hub/career.yml',
    datasetsFile: '/hub/data.yml',
    text: textCatalog(loadConfig(engineDir()).config)
};

/** A raw portfolio with no entries in any registry, and the parts a case sets in place of that. */
function raw(over: Partial<RawPortfolio> = {}): RawPortfolio {
    const registries = Object.fromEntries(
        NAMES.map((name): [string, RawRegistry] => [name, { entries: [], meta: {} }])
    ) as Record<RegistryName, RawRegistry>;
    return {
        personal: [],
        manifests: [],
        registries,
        collections: {},
        feeds: NO_FEEDS,
        career: null,
        docs: {},
        present: {},
        findings: [],
        ...over
    };
}

/** One manifest record with the provenance a reader adds, and the keys a case sets. */
function held(data: Record<string, unknown>, id = 'alpha'): RawManifest {
    return {
        file: `/hub/projects/${id}/project.yml`,
        folder: `projects/${id}`,
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        title: id,
        ...data
    };
}

const at = (file: string, key: string, message: string) => ({ file, key, message });

/** A registry holding one entry per key, with the fields a case sets on all of them. */
function registryOf(name: RegistryName, keys: string[], fields: object = {}): RawRegistry {
    const file = `/hub/${name}.yml`;
    return { entries: keys.map((key) => ({ ...fields, registry: name, key, file })), meta: {} };
}

/** A collection of entries, each with its provenance. */
function collectionOf(key: string, entries: object[], meta: Record<string, unknown> = {}) {
    const file = `/hub/${key}.yml`;
    return {
        key,
        file,
        meta,
        entries: entries.map((fields, index) => ({ ...fields, provenance: { file, index } }))
    };
}

describe('fieldNames and schemaKeys', () => {
    it.each([
        [
            ['a', { field: 'b' }, { field: 3 }, 3],
            ['a', 'b']
        ],
        [{ fields: { a: 1 } }, ['a']],
        [{ fields: [] }, ['fields']],
        [{ a: 1 }, ['a']],
        [{ fields: 'x', a: 1 }, ['fields', 'a']],
        [
            [{ field: 'a.b' }, 'c.d', 'e'],
            ['a.b', 'c.d', 'e']
        ],
        [null, []],
        ['x', []],
        [3, []],
        [[], []]
    ])('reads the names of %j as %j', (schema, names) => {
        expect(fieldNames(schema)).toStrictEqual(names);
    });

    it('splits dotted names under their prefix and adds the provenance keys', () => {
        const keys = schemaKeys([{ field: 'a.b' }, 'c.d', 'e', 3]);
        expect([...keys.top].slice(-3)).toStrictEqual(['a', 'c', 'e']);
        expect([...keys.top]).toContain('manifestId');
        expect([...keys.nested]).toStrictEqual([
            ['a', new Set(['b'])],
            ['c', new Set(['d'])]
        ]);
        expect(schemaKeys(null).nested.size).toBe(0);
    });
});

describe('validate over fields of the wrong shape', () => {
    const KNOWN = {
        funding: registryOf('funding', ['FAIR']),
        people: registryOf('people', ['someone'], { self: true }),
        organisations: registryOf('organisations', ['twente'], { kind: 'university' })
    };
    const portfolio = (over: Partial<RawPortfolio>) => {
        const base = raw();
        return {
            ...base,
            ...over,
            registries: { ...base.registries, ...KNOWN, ...over.registries }
        };
    };

    it('reports a key the schema does not name', () => {
        const found = validate(raw({ manifests: [held({ nonesuch: 1 })] }), RULES);
        expect(found).toStrictEqual([
            at(
                '/hub/projects/alpha/project.yml',
                'nonesuch',
                'key nonesuch is not in the manifest schema'
            )
        ]);
    });

    it('reports a key a project.yml carries that the schema does not name, after readManifests', () => {
        const hub = plantScratch('oculus-validate-shapes-', {
            'projects/active/alpha/project.yml': 'title: Alpha\nnonesuch: 1\nid: alpha\n'
        });
        const read = readManifests(hub, [{ dir: 'projects/active', type: 'active' }], RULES.text);
        expect(Object.keys(read.manifests[0]).slice(0, 3)).toStrictEqual([
            'title',
            'nonesuch',
            'id'
        ]);
        expect(validate(raw({ manifests: read.manifests }), RULES)).toStrictEqual([
            at(
                join(hub, 'projects/active/alpha/project.yml'),
                'nonesuch',
                'key nonesuch is not in the manifest schema'
            )
        ]);
    });

    it('reports a list field holding a number, a text field holding a list, and a chip list that is a map', () => {
        const found = validate(
            portfolio({ manifests: [held({ pillar: 3, domain: [], status: { chips: {} } })] }),
            RULES
        );
        expect(found).toStrictEqual([
            at('/hub/projects/alpha/project.yml', 'domain', 'domain must be a string, not a list'),
            at('/hub/projects/alpha/project.yml', 'pillar', 'pillar must be a list, not a number'),
            at(
                '/hub/projects/alpha/project.yml',
                'status.chips',
                'status.chips must be a list, not a map'
            )
        ]);
    });

    it('reports each relation field set to a value that is neither text nor a list', () => {
        const FIELDS = [
            'venue_id',
            'domain',
            'pillar',
            'datasets',
            'related',
            'collaborators',
            'waiting-on',
            'funding'
        ];
        const lines: Record<string, string[]> = {};
        for (const [label, value] of [
            ['number', 3],
            ['text', 'x'],
            ['empty list', []],
            ['map', {}],
            ['null', null],
            ['boolean', true]
        ] as const) {
            const data = Object.fromEntries(FIELDS.map((field) => [field, value]));
            const found = validate(portfolio({ manifests: [held(data)] }), RULES);
            lines[label] = found.map((one) => `${one.key}: ${one.message}`);
        }
        expect(lines).toStrictEqual({
            number: [
                'collaborators: collaborators must be a list, not a number',
                'datasets: datasets must be a list, not a number',
                'domain: domain must be a string, not a number',
                'funding: funding must be a list or null, not a number',
                'pillar: pillar must be a list, not a number',
                'related: related must be a list, not a number',
                'venue_id: venue_id must be a string or null, not a number',
                'waiting-on: waiting-on must be a list, not a number'
            ],
            text: [
                'collaborators: collaborators must be a list, not a string',
                'datasets: datasets must be a list, not a string',
                'domain: domain names no domain: x',
                'funding: funding must be a list or null, not a string',
                'pillar: pillar must be a list, not a string',
                'related: related must be a list, not a string',
                'venue_id: venue_id names no venue: x',
                'waiting-on: waiting-on must be a list, not a string'
            ],
            'empty list': [
                'domain: domain must be a string, not a list',
                'venue_id: venue_id must be a string or null, not a list'
            ],
            map: [
                'collaborators: collaborators must be a list, not a map',
                'datasets: datasets must be a list, not a map',
                'domain: domain must be a string, not a map',
                'funding: funding must be a list or null, not a map',
                'pillar: pillar must be a list, not a map',
                'related: related must be a list, not a map',
                'venue_id: venue_id must be a string or null, not a map',
                'waiting-on: waiting-on must be a list, not a map'
            ],
            null: [
                'collaborators: collaborators must be a list, not null',
                'datasets: datasets must be a list, not null',
                'domain: domain must be a string, not null',
                'pillar: pillar must be a list, not null',
                'related: related must be a list, not null',
                'waiting-on: waiting-on must be a list, not null'
            ],
            boolean: [
                'collaborators: collaborators must be a list, not a boolean',
                'datasets: datasets must be a list, not a boolean',
                'domain: domain must be a string, not a boolean',
                'funding: funding must be a list or null, not a boolean',
                'pillar: pillar must be a list, not a boolean',
                'related: related must be a list, not a boolean',
                'venue_id: venue_id must be a string or null, not a boolean',
                'waiting-on: waiting-on must be a list, not a boolean'
            ]
        });
    });

    it('reports a chip that is not text, and one outside the vocabulary', () => {
        const found = validate(
            portfolio({ manifests: [held({ status: { chips: ['lead', 3, 'x', null] } })] }),
            RULES
        );
        expect(found).toStrictEqual([
            at('/hub/projects/alpha/project.yml', 'status.chips', 'chip a number is not a string'),
            at(
                '/hub/projects/alpha/project.yml',
                'status.chips',
                'chip x is not in the chip vocabulary'
            ),
            at('/hub/projects/alpha/project.yml', 'status.chips', 'chip null is not a string')
        ]);
    });

    it('passes over a relation list item that is not text beside an id that resolves', () => {
        const found = validate(
            portfolio({
                manifests: [
                    held({
                        funding: [3, 'FAIR'],
                        related: [3, 'beta'],
                        collaborators: [3, 'someone'],
                        'waiting-on': [3, 'someone']
                    }),
                    held({}, 'beta')
                ]
            }),
            RULES
        );
        expect(found).toStrictEqual([]);
    });

    it('reports a type or a focus that is not text', () => {
        const found = validate(
            portfolio({ manifests: [held({ title: 3, type: 3, focus: [] }, 'gamma')] }),
            RULES
        );
        expect(found).toStrictEqual([
            at('/hub/projects/gamma/project.yml', 'focus', 'focus [] is not a lane of focus_lanes'),
            at(
                '/hub/projects/gamma/project.yml',
                'type',
                'type 3 is not one of the type vocabulary'
            )
        ]);
    });

    it('reads each host row of the career file by its own shape', () => {
        const found = validate(
            portfolio({
                career: {
                    hosts: [[], 3, null, { status: 'bogus' }, { status: 3 }, { status: 'warm' }]
                }
            }),
            RULES
        );
        expect(found).toStrictEqual([
            at(
                '/hub/career.yml',
                'hosts[3]',
                'host status "bogus" is not one of the host status vocabulary'
            )
        ]);
        expect(
            validate(portfolio({ career: { hosts: { status: 'bogus' } } }), RULES)
        ).toStrictEqual([]);
    });

    it('passes over a theme list that is text, and reports each theme word off its list', () => {
        const found = validate(
            portfolio({
                registries: {
                    ...raw().registries,
                    venues: {
                        entries: [
                            { registry: 'venues', key: 'a', file: '/hub/venues.yml', themes: 'x' },
                            {
                                registry: 'venues',
                                key: 'b',
                                file: '/hub/venues.yml',
                                themes: [3, 'off', 'on']
                            }
                        ],
                        meta: {}
                    },
                    datasets: {
                        entries: [
                            {
                                registry: 'datasets',
                                key: 'c',
                                file: '/hub/data.yml',
                                themes: { a: 1 }
                            },
                            {
                                registry: 'datasets',
                                key: 'd',
                                file: '/hub/data.yml',
                                themes: ['off']
                            }
                        ],
                        meta: { theme_labels: {} }
                    }
                }
            }),
            RULES
        );
        expect(found).toStrictEqual([
            at(
                '/hub/data.yml',
                'datasets[1].themes[0]',
                'theme "off" is not one of the dataset themes'
            ),
            at(
                '/hub/data.yml',
                'theme_labels',
                'theme_labels is not read; the labels are data_themes in config/catalogs/vocab.yml'
            ),
            at(
                '/hub/venues.yml',
                'entries[1].themes[1]',
                'theme "off" is not one of the venue themes'
            )
        ]);
    });

    it('reads a collection entry whose title is a number and whose status is not a known word', () => {
        const found = validate(
            portfolio({
                collections: {
                    events: collectionOf('events', [
                        { title: 3, status: 'weird' },
                        { title: '3', status: 3 },
                        { title: [], status: ['done'] },
                        { title: 'ok', status: 'done' },
                        { title: 'ok', status: null }
                    ])
                }
            }),
            RULES
        );
        expect(found).toStrictEqual([
            at(
                '/hub/events.yml',
                'entries[0].status',
                'status "weird" is not one of the status vocabulary'
            ),
            at('/hub/events.yml', 'entries[0].title', 'two entries share the title 3'),
            at(
                '/hub/events.yml',
                'entries[1].status',
                'status 3 is not one of the status vocabulary'
            ),
            at('/hub/events.yml', 'entries[1].title', 'two entries share the title 3'),
            at(
                '/hub/events.yml',
                'entries[2].status',
                'status ["done"] is not one of the status vocabulary'
            ),
            at('/hub/events.yml', 'entries[3].title', 'two entries share the title ok'),
            at(
                '/hub/events.yml',
                'entries[4].status',
                'status null is not one of the status vocabulary'
            ),
            at('/hub/events.yml', 'entries[4].title', 'two entries share the title ok')
        ]);
    });

    it('reports a collection schema that is not a list of maps naming a field and a type', () => {
        const found = validate(
            portfolio({
                collections: {
                    one: collectionOf('one', [], { schema: 'x' }),
                    two: collectionOf('two', [], { schema: [3] }),
                    three: collectionOf('three', [], { schema: [{ field: 'a', type: 'text' }] }),
                    four: collectionOf('four', [], { schema: { fields: {} } })
                }
            }),
            RULES
        );
        expect(found).toStrictEqual([
            at(
                '/hub/four.yml',
                'schema',
                'schema a map is not a list of maps naming a field and a type'
            ),
            at(
                '/hub/one.yml',
                'schema',
                'schema a string is not a list of maps naming a field and a type'
            ),
            at(
                '/hub/two.yml',
                'schema',
                'schema a list is not a list of maps naming a field and a type'
            )
        ]);
    });

    it('reads the fields of a person, an organisation, a funding scheme and a joint-work entry', () => {
        const found = validate(
            portfolio({
                registries: {
                    ...raw().registries,
                    people: {
                        entries: [
                            {
                                registry: 'people',
                                key: 'p',
                                file: '/hub/people.yml',
                                self: true,
                                affiliations: 3
                            },
                            {
                                registry: 'people',
                                key: 'q',
                                file: '/hub/people.yml',
                                affiliations: [3, 'twente', 'gone']
                            },
                            {
                                registry: 'people',
                                key: 'r',
                                file: '/hub/people.yml',
                                affiliation: 'twente'
                            }
                        ],
                        meta: {}
                    },
                    organisations: {
                        entries: [
                            {
                                registry: 'organisations',
                                key: 'twente',
                                file: '/hub/org.yml',
                                kind: 3
                            },
                            {
                                registry: 'organisations',
                                key: 'x',
                                file: '/hub/org.yml',
                                kind: 'other'
                            }
                        ],
                        meta: {}
                    },
                    funding: {
                        entries: [
                            { registry: 'funding', key: '', file: '/hub/funding.yml', title: 3 },
                            {
                                registry: 'funding',
                                key: 'f',
                                file: '/hub/funding.yml',
                                status: 'awarded',
                                statement: 3,
                                funder: 3
                            },
                            {
                                registry: 'funding',
                                key: '',
                                file: '/hub/funding.yml',
                                title: 'T',
                                status: 'contributing',
                                statement: ' ',
                                funder: 'twente'
                            }
                        ],
                        meta: {}
                    }
                },
                collections: {
                    'joint-work': collectionOf('joint-work', [
                        { person: 3 },
                        { title: 'no person' },
                        { person: 'p' },
                        { person: 'gone' }
                    ])
                }
            }),
            RULES
        );
        expect(found).toStrictEqual([
            at('/hub/funding.yml', 'entries[0]', 'funding entry has neither a key nor a title'),
            at('/hub/funding.yml', 'entries[1]', 'funding entry f is awarded and has no statement'),
            at('/hub/funding.yml', 'entries[1].funder', 'funder names no organisation: 3'),
            at('/hub/funding.yml', 'entries[2]', 'funding entry T is contributing and has no key'),
            at(
                '/hub/funding.yml',
                'entries[2]',
                'funding entry T is contributing and has no statement'
            ),
            at('/hub/joint-work.yml', 'entries[0].person', 'person names no person: 3'),
            at('/hub/joint-work.yml', 'entries[1].person', 'entry has no person'),
            at('/hub/joint-work.yml', 'entries[3].person', 'person names no person: "gone"'),
            at('/hub/org.yml', 'entries[0].kind', 'kind 3 is not one of the organisation kinds'),
            at(
                '/hub/people.yml',
                'entries[0].affiliations[0]',
                'affiliations names no organisation: 3'
            ),
            at(
                '/hub/people.yml',
                'entries[1].affiliations[0]',
                'affiliations names no organisation: 3'
            ),
            at(
                '/hub/people.yml',
                'entries[1].affiliations[2]',
                'affiliations names no organisation: "gone"'
            ),
            at(
                '/hub/people.yml',
                'entries[2].affiliation',
                'affiliation is read as a one-entry affiliations list; write affiliations'
            )
        ]);
    });
});
