// validate against hand-built raw records: one record per check, so a failure names the check.
// Nothing here reads or writes a file; validate is pure and the fixtures are literals.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import { validate } from '../../src/lib/data/validate.ts';
import type {
    Finding,
    RawCollection,
    RawManifest,
    RawPortfolio,
    RawRegistry,
    RegistryName,
    ValidationRules
} from '../../src/lib/data/model.ts';

const RULES: ValidationRules = {
    schema: [
        'id',
        'tier',
        'type',
        'title',
        'status.chips',
        'status.line',
        'venue_id',
        'domain',
        'pillar',
        'datasets',
        'related',
        'collaborators',
        'waiting-on',
        'funding',
        'followup.do',
        'followup.after',
        'focus',
        'paths'
    ],
    vocab: {
        types: ['active', 'idea'],
        statuses: ['planned', 'done'],
        chips: ['lead', 'submitted'],
        lanes: ['run', 'push', 'holding']
    }
};

/** One manifest record with the provenance a reader would have added, plus the keys the test needs. */
function manifest(data: Record<string, unknown> = {}, id = 'alpha'): RawManifest {
    return {
        file: `/hub/projects/active/${id}/project.yml`,
        folder: `projects/active/${id}`,
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        title: 'Alpha',
        ...data
    };
}

function registry(name: RegistryName, keys: string[]): RawRegistry {
    return {
        entries: keys.map((key) => ({ registry: name, key, file: `/hub/${name}.yml`, title: key })),
        meta: {}
    };
}

/** The people registry: one entry per key, each affiliated to the one organisation below. */
function people(keys: string[]): RawRegistry {
    return {
        entries: keys.map((key, at) => ({
            registry: 'people',
            key,
            file: '/hub/people.yml',
            name: 'Someone Else',
            affiliations: ['twente'],
            ...(at === 0 ? { self: true } : {})
        })),
        meta: {}
    };
}

/** The organisation registry: one entry per key, each a university. */
function organisations(keys: string[]): RawRegistry {
    return {
        entries: keys.map((key) => ({
            registry: 'organisations',
            key,
            file: '/hub/organisations.yml',
            name: 'University of Twente',
            kind: 'university'
        })),
        meta: {}
    };
}

function collection(key: string, entries: Record<string, unknown>[]): RawCollection {
    const file = `/hub/${key}.yml`;
    return {
        key,
        file,
        meta: {},
        entries: entries.map((fields, index) => ({ ...fields, provenance: { file, index } }))
    };
}

/** A portfolio whose registries hold one entry each, unless the caller replaces them. */
function portfolio(over: Partial<RawPortfolio> = {}): RawPortfolio {
    return {
        manifests: [manifest()],
        registries: {
            venues: registry('venues', ['bspc']),
            datasets: registry('datasets', ['mimic']),
            pillars: registry('pillars', ['federated']),
            domains: registry('domains', ['heart']),
            funding: registry('funding', ['FAIR']),
            people: people(['someone']),
            organisations: organisations(['twente'])
        },
        collections: {
            'joint-work': collection('joint-work', [
                { key: 'someone', title: 'A shared paper', person: 'someone' }
            ])
        },
        feeds: NO_FEEDS,
        career: null,
        docs: {},
        present: {},
        findings: [],
        ...over
    };
}

/** The findings of one manifest, as `key: message` lines, which is what every check asserts on. */
function lines(data: Record<string, unknown>, rules: ValidationRules = RULES): string[] {
    const found = validate(portfolio({ manifests: [manifest(data)] }), rules);
    return found.map((finding: Finding) => `${finding.key}: ${finding.message}`);
}

describe('validate', () => {
    it('reports nothing on a manifest that is entirely in order', () => {
        // A second project stands beside it, so the `related:` id has something to resolve to.
        const held = manifest(
            {
                status: { chips: ['lead'], line: 'submitted 2026-09-01' },
                venue_id: 'bspc',
                domain: 'heart',
                pillar: ['federated'],
                datasets: ['mimic'],
                funding: ['FAIR'],
                related: ['bravo'],
                collaborators: ['someone']
            },
            'alpha'
        );
        expect(validate(portfolio({ manifests: [held, manifest({}, 'bravo')] }), RULES)).toEqual(
            []
        );
    });

    it('reports a top-level key the schema does not name', () => {
        expect(lines({ nonesuch: 1 })).toEqual([
            'nonesuch: key nonesuch is not in the manifest schema'
        ]);
    });

    it('reports a manifest still carrying the old key under the name it is written under now', () => {
        expect(lines({ program: ['tensor'] })).toEqual([
            'program: key program is now pillar: write the tags under pillar:'
        ]);
    });

    it('reports a key inside a map the schema gave dotted names to', () => {
        expect(lines({ status: { chips: ['lead'], colour: 'red' } })).toEqual([
            'status.colour: key status.colour is not in the manifest schema'
        ]);
    });

    it('exempts the provenance keys the reader adds', () => {
        expect(lines({ category: 'published', manifestId: 'alpha' })).toEqual([]);
    });

    it('does not look inside a dotted key whose value is not a map', () => {
        expect(lines({ followup: 'ask the coauthor' })).toEqual([]);
    });

    it('reports every key when the schema names nothing', () => {
        const empty: ValidationRules = { schema: null, vocab: RULES.vocab };
        expect(lines({ title: 'Alpha' }, empty)).toEqual([
            'title: key title is not in the manifest schema'
        ]);
    });

    it('reads the field names out of a schema written as a map of fields', () => {
        const rules: ValidationRules = {
            schema: { sections: { Core: 'Core' }, fields: { title: { label: 'Title' } } },
            vocab: { types: ['active'], statuses: [] }
        };
        expect(lines({}, rules)).toEqual([]);
    });

    it('reports a type outside the type vocabulary', () => {
        expect(lines({ type: 'monograph' })).toEqual([
            'type: type "monograph" is not one of the type vocabulary'
        ]);
    });

    it('reports a focus that names no lane, and accepts a lane and the holding backlog', () => {
        expect(lines({ focus: 'submit' })).toEqual([
            'focus: focus "submit" is not a lane of focus_lanes'
        ]);
        expect(lines({ focus: 7 })).toEqual(['focus: focus 7 is not a lane of focus_lanes']);
        expect(lines({ focus: 'run' })).toEqual([]);
        expect(lines({ focus: 'holding' })).toEqual([]);
    });

    it('leaves focus unchecked when the vocabulary names no lanes', () => {
        const rules: ValidationRules = {
            schema: RULES.schema,
            vocab: { types: RULES.vocab.types, statuses: RULES.vocab.statuses }
        };
        expect(validate(portfolio({ manifests: [manifest({ focus: 'submit' })] }), rules)).toEqual(
            []
        );
    });

    it('reports a dangling id in every relation field', () => {
        expect(
            lines({
                venue_id: 'nowhere',
                domain: 'nothing',
                pillar: ['nobody'],
                datasets: ['nodata'],
                funding: ['nomoney'],
                related: ['nobody-else']
            })
        ).toEqual([
            'datasets: datasets names no dataset: nodata',
            'domain: domain names no domain: nothing',
            'funding: funding names no funding scheme: nomoney',
            'pillar: pillar names no pillar: nobody',
            'related: related names no project: nobody-else',
            'venue_id: venue_id names no venue: nowhere'
        ]);
    });

    it('accepts the shapes the tree has, absent fields and nulls included', () => {
        expect(lines({ venue_id: null, funding: null })).toEqual([]);
    });

    it('reports a wrong shape in every relation field', () => {
        expect(
            lines({
                venue_id: 7,
                domain: null,
                pillar: 'federated',
                datasets: { key: 'mimic' },
                related: 'alpha',
                collaborators: 'someone',
                'waiting-on': 'someone',
                funding: 'FAIR'
            })
        ).toEqual([
            'collaborators: collaborators must be a list, not a string',
            'datasets: datasets must be a list, not a map',
            'domain: domain must be a string, not null',
            'funding: funding must be a list or null, not a string',
            'pillar: pillar must be a list, not a string',
            'related: related must be a list, not a string',
            'venue_id: venue_id must be a string or null, not a number',
            'waiting-on: waiting-on must be a list, not a string'
        ]);
    });

    it('reports a collaborator that names no entry of the people registry', () => {
        expect(lines({ collaborators: ['someone', 'nobody'] })).toEqual([
            'collaborators: collaborators names no person: nobody'
        ]);
    });

    it('takes a waiting-on value that is a person key and one that is a project id', () => {
        const held = manifest({ 'waiting-on': ['someone', 'bravo'] }, 'alpha');
        expect(validate(portfolio({ manifests: [held, manifest({}, 'bravo')] }), RULES)).toEqual(
            []
        );
    });

    it('reports a project waiting on itself', () => {
        expect(lines({ 'waiting-on': ['alpha'] })).toEqual([
            'waiting-on: waiting-on names the project itself: alpha'
        ]);
    });

    it('reports a waiting-on value that names neither a person nor a project', () => {
        expect(lines({ 'waiting-on': ['someone', 'nobody'] })).toEqual([
            'waiting-on: waiting-on names no person or project: nobody'
        ]);
    });

    it('reports every collaborator when the people registry is not there', () => {
        const held = portfolio();
        const raw = portfolio({
            manifests: [manifest({ collaborators: ['someone'] })],
            registries: { ...held.registries, people: { entries: [], meta: {} } },
            collections: {}
        });
        expect(validate(raw, RULES).map((finding) => finding.message)).toEqual([
            'collaborators names no person: someone'
        ]);
    });

    it('reports a chip outside the chip vocabulary when the config holds one', () => {
        expect(lines({ status: { chips: ['lead', 'unheard-of'] } })).toEqual([
            'status.chips: chip unheard-of is not in the chip vocabulary'
        ]);
    });

    it('leaves chips unchecked when the config holds no chip vocabulary', () => {
        const free: ValidationRules = {
            schema: RULES.schema,
            vocab: { types: RULES.vocab.types, statuses: RULES.vocab.statuses }
        };
        expect(lines({ status: { chips: ['unheard-of'] } }, free)).toEqual([]);
    });

    it('reports chips that are not a list of strings', () => {
        expect(lines({ status: { chips: 'lead' } })).toEqual([
            'status.chips: status.chips must be a list, not a string'
        ]);
        expect(lines({ status: { chips: [3] } })).toEqual([
            'status.chips: chip a number is not a string'
        ]);
    });

    it('reports a collection entry status outside the status vocabulary', () => {
        const raw = portfolio({
            collections: {
                events: collection('events', [
                    { title: 'A talk', status: 'planned' },
                    { title: 'Another', status: 'mulled' }
                ])
            }
        });
        expect(validate(raw, RULES)).toEqual([
            {
                file: '/hub/events.yml',
                key: 'entries[1].status',
                message: 'status "mulled" is not one of the status vocabulary'
            }
        ]);
    });

    it('reports a funding entry that has neither a key nor a title', () => {
        const raw = portfolio({
            registries: {
                ...portfolio().registries,
                funding: {
                    entries: [
                        { registry: 'funding', key: '', file: '/hub/funding.yml', note: 'a' }
                    ],
                    meta: {}
                }
            }
        });
        expect(validate(raw, RULES)).toEqual([
            {
                file: '/hub/funding.yml',
                key: 'entries[0]',
                message: 'funding entry has neither a key nor a title'
            }
        ]);
    });

    it('reports an awarded or contributing funding entry without a key or a statement', () => {
        const raw = portfolio({
            registries: {
                ...portfolio().registries,
                funding: {
                    entries: [
                        {
                            registry: 'funding',
                            key: '',
                            file: '/hub/funding.yml',
                            title: 'A grant',
                            status: 'awarded'
                        },
                        {
                            registry: 'funding',
                            key: 'FAIR',
                            file: '/hub/funding.yml',
                            status: 'contributing',
                            statement: 'This work was supported by FAIR.'
                        },
                        {
                            registry: 'funding',
                            key: '',
                            file: '/hub/funding.yml',
                            title: 'An application',
                            status: 'planned'
                        }
                    ],
                    meta: {}
                }
            }
        });
        expect(validate(raw, RULES)).toEqual([
            {
                file: '/hub/funding.yml',
                key: 'entries[0]',
                message: 'funding entry A grant is awarded and has no key'
            },
            {
                file: '/hub/funding.yml',
                key: 'entries[0]',
                message: 'funding entry A grant is awarded and has no statement'
            }
        ]);
    });

    it('reports a collection file whose schema is not a list of field maps', () => {
        const raw = portfolio();
        raw.collections['joint-work'].meta.schema = 'title, status';
        expect(validate(raw, RULES)).toEqual([
            {
                file: '/hub/joint-work.yml',
                key: 'schema',
                message: 'schema a string is not a list of maps naming a field and a type'
            }
        ]);
    });

    it('reports nothing for a collection file whose schema is in order, or has none', () => {
        const raw = portfolio();
        raw.collections['joint-work'].meta.schema = [
            { field: 'title', type: 'text', required: true },
            { field: 'status', type: 'select', options: ['active'] }
        ];
        expect(validate(raw, RULES)).toEqual([]);
        expect(validate(portfolio(), RULES)).toEqual([]);
    });

    it('reports a project whose related names itself', () => {
        expect(lines({ related: ['alpha'] })).toEqual([
            'related: related names the project itself: alpha'
        ]);
    });

    it('reports two manifests under folders of one name, whose ids collide', () => {
        const one: RawManifest = {
            ...manifest({}, 'alpha'),
            file: '/hub/projects/active/alpha/project.yml',
            folder: 'projects/active/alpha'
        };
        const two: RawManifest = {
            ...manifest({}, 'alpha'),
            file: '/hub/projects/archive/published/alpha/project.yml',
            folder: 'projects/archive/published/alpha'
        };
        expect(
            validate(portfolio({ manifests: [one, two] }), RULES).map(
                (finding) => `${finding.file} ${finding.key}: ${finding.message}`
            )
        ).toEqual([
            '/hub/projects/active/alpha/project.yml folder: 2 projects share the folder name alpha, so their ids collide',
            '/hub/projects/archive/published/alpha/project.yml folder: 2 projects share the folder name alpha, so their ids collide'
        ]);
    });

    it('reports two entries of one collection that share an identity value', () => {
        const raw = portfolio({
            collections: {
                venues: {
                    key: 'venues',
                    file: '/hub/venues.yml',
                    meta: { schema: [{ field: 'name', type: 'text' }] },
                    entries: [
                        { name: 'One', provenance: { file: '/hub/venues.yml', index: 0 } },
                        { name: 'Two', provenance: { file: '/hub/venues.yml', index: 1 } },
                        { name: 'One', provenance: { file: '/hub/venues.yml', index: 2 } }
                    ]
                }
            }
        });
        expect(validate(raw, RULES).map((finding) => `${finding.key}: ${finding.message}`)).toEqual(
            [
                'entries[0].name: two entries share the name One',
                'entries[2].name: two entries share the name One'
            ]
        );
    });

    it('reports nothing when every entry of a collection has its own identity value', () => {
        const raw = portfolio({
            collections: {
                venues: {
                    key: 'venues',
                    file: '/hub/venues.yml',
                    meta: { schema: [{ field: 'name', type: 'text' }] },
                    entries: [
                        { name: 'One', provenance: { file: '/hub/venues.yml', index: 0 } },
                        { name: 'Two', provenance: { file: '/hub/venues.yml', index: 1 } }
                    ]
                }
            }
        });
        expect(validate(raw, RULES)).toEqual([]);
    });

    it('passes the sources findings through without re-deriving them', () => {
        const source: Finding = { file: '/hub/a.yml', key: '', message: 'does not parse: bad' };
        expect(validate(portfolio({ findings: [source] }), RULES)).toEqual([source]);
    });

    it('sorts by file then key', () => {
        const raw = portfolio({
            manifests: [
                manifest({ nonesuch: 1, type: 'monograph' }, 'zulu'),
                manifest({ nonesuch: 1 }, 'alpha')
            ]
        });
        expect(validate(raw, RULES).map((f) => `${f.file} ${f.key}`)).toEqual([
            '/hub/projects/active/alpha/project.yml nonesuch',
            '/hub/projects/active/zulu/project.yml nonesuch',
            '/hub/projects/active/zulu/project.yml type'
        ]);
    });
});

describe('validate, the people and organisation registries', () => {
    /** The messages of one portfolio, so a case asserts the sentences and not the provenance. */
    function said(raw: RawPortfolio): string[] {
        return validate(raw, RULES).map((finding) => finding.message);
    }

    /** A portfolio whose people registry is replaced by the entries given. */
    function withPeople(entries: Record<string, unknown>[]): RawPortfolio {
        const held = portfolio();
        return {
            ...held,
            registries: {
                ...held.registries,
                people: {
                    entries: entries.map((one) => ({
                        registry: 'people',
                        key: '',
                        file: '/hub/people.yml',
                        ...one
                    })),
                    meta: {}
                }
            }
        };
    }

    it('reports every affiliations key that names no organisation', () => {
        const raw = withPeople([
            {
                key: 'someone',
                name: 'Someone Else',
                affiliations: ['twente', 'nowhere', 12],
                self: true
            }
        ]);
        expect(said(raw)).toEqual([
            'affiliations names no organisation: "nowhere"',
            'affiliations names no organisation: 12'
        ]);
    });

    it('reads the one key the list replaced as a list of that one, and asks for the new name', () => {
        const raw = withPeople([
            { key: 'someone', name: 'Someone Else', affiliation: 'twente', self: true }
        ]);
        expect(said(raw)).toEqual([
            'affiliation is read as a one-entry affiliations list; write affiliations'
        ]);
        const unknown = withPeople([
            { key: 'someone', name: 'Someone Else', affiliation: 'nowhere', self: true }
        ]);
        expect(said(unknown)).toEqual([
            'affiliation is read as a one-entry affiliations list; write affiliations',
            'affiliations names no organisation: "nowhere"'
        ]);
    });

    it('takes a person with no affiliations at all', () => {
        const raw = withPeople([{ key: 'someone', name: 'Someone Else', self: true }]);
        expect(said(raw)).toEqual([]);
    });

    it('reports a people registry that carries no self entry, and one that carries two', () => {
        const none = withPeople([{ key: 'someone', name: 'Someone Else' }]);
        expect(said(none)).toEqual(['0 people entries carry self: true, and exactly one may']);
        const two = withPeople([
            { key: 'someone', name: 'Someone Else', self: true },
            { key: 'other', name: 'Other One', self: true }
        ]);
        expect(said(two)).toEqual(['2 people entries carry self: true, and exactly one may']);
    });

    it('reports an organisation kind outside the five words', () => {
        const held = portfolio();
        const raw: RawPortfolio = {
            ...held,
            registries: {
                ...held.registries,
                organisations: {
                    entries: [
                        {
                            registry: 'organisations',
                            key: 'twente',
                            file: '/hub/organisations.yml',
                            name: 'University of Twente',
                            kind: 'institute'
                        }
                    ],
                    meta: {}
                }
            }
        };
        expect(said(raw)).toContain('kind "institute" is not one of the organisation kinds');
    });

    it('reports a joint-work entry with no person and one whose person is unknown', () => {
        const raw = portfolio({
            collections: {
                'joint-work': collection('joint-work', [
                    { key: 'a', title: 'A shared paper' },
                    { key: 'b', title: 'Another', person: 'nobody' }
                ])
            }
        });
        expect(said(raw)).toEqual(['entry has no person', 'person names no person: "nobody"']);
    });

    it('reports a funding scheme whose funder names no organisation', () => {
        const held = portfolio();
        const raw: RawPortfolio = {
            ...held,
            registries: {
                ...held.registries,
                funding: {
                    entries: [
                        {
                            registry: 'funding',
                            key: 'FAIR',
                            file: '/hub/funding.yml',
                            title: 'A grant',
                            funder: 'nowhere'
                        }
                    ],
                    meta: {}
                }
            }
        };
        expect(said(raw)).toEqual(['funder names no organisation: "nowhere"']);
    });
});
