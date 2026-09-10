// normalise against hand-built raw records: the field mapping, the relation tables, determinism,
// and the JSON round trip. Nothing here reads or writes a file; normalise is pure.

import { describe, expect, it } from 'vitest';
import { normalise } from '../../src/lib/data/normalise.ts';
import type {
    DocPresence,
    RawCollection,
    RawManifest,
    RawPortfolio,
    RawRegistry,
    RawRegistryEntry,
    RegistryName
} from '../../src/lib/data/model.ts';

/** What sources/docs.ts hands the build for one folder: the fixed names, with a path and a flag. */
function documents(id: string, present: string[]): DocPresence[] {
    return ['README.md', 'code/README.md'].map((name) => ({
        name,
        path: `/hub/projects/active/${id}/${name}`,
        present: present.includes(name)
    }));
}

function manifest(data: Record<string, unknown>, id: string): RawManifest {
    return {
        file: `/hub/projects/active/${id}/project.yml`,
        folder: `projects/active/${id}`,
        id,
        tier: 'active',
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
        entries: items.map((fields, index) => ({ ...fields, source: { file, index } }))
    };
}

/**
 * Two projects on one research line: alpha names every relation and beta names a venue that is not
 * in the registry, so one fixture carries both the resolved and the dangling case.
 */
function portfolio(): RawPortfolio {
    return {
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
                    program: ['federated'],
                    datasets: ['mimic'],
                    funding: ['FAIR'],
                    related: ['beta'],
                    collaborators: ['someone'],
                    compute: 'hpc',
                    pin: true,
                    priority: 'high',
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
                    reproduced: 'not a map'
                },
                'beta'
            )
        ],
        registries: {
            venues: entries('venues', [
                { key: 'bspc', name: 'BSPC', jif: '4.9', free: 'APC', themes: ['signal'] }
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
            programs: entries('programs', [{ key: 'federated', title: 'Federated learning' }]),
            domains: entries('domains', [{ key: 'heart', title: 'Cardiology' }]),
            funding: entries('funding', [
                { key: 'FAIR', title: 'Flanders AI', tags: ['flanders'] },
                { title: 'A scheme with no key' }
            ])
        },
        collections: {
            funding: collection('funding', [{ title: 'Flanders AI' }]),
            events: collection('events', [{ title: 'A talk', status: 'planned' }])
        },
        docs: { alpha: documents('alpha', ['README.md']) },
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
            type: 'active',
            title: 'Alpha',
            short: 'a',
            lead: 'Faes',
            authors: ['Faes', 'Someone'],
            year: 2026,
            chips: ['lead'],
            statusLine: 'submit-ready',
            focus: 'run',
            eli5: 'about alpha',
            next: 'run it',
            latest: 'ran it',
            results: ['one'],
            ideas: ['two'],
            deadline: '2026-11-17',
            doi: '10.0/alpha',
            outcome: 'in review',
            compute: 'hpc',
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
            programIds: ['federated'],
            domainIds: ['heart'],
            collaborators: ['someone'],
            docs: [
                { name: 'README.md', present: true },
                { name: 'code/README.md', present: false }
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
        expect('priority' in alpha).toBe(false);
        expect('visibility' in (alpha.codeAvailability ?? {})).toBe(false);
    });

    it('fills the registry entities, hpc_path and retrieval included', () => {
        expect(snapshot.entities.venues.bspc).toEqual({
            id: 'bspc',
            name: 'BSPC',
            jif: '4.9',
            free: 'APC',
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

    it('knows a funding scheme by its title when it has no key', () => {
        expect(Object.keys(snapshot.entities.funding)).toEqual(['A scheme with no key', 'FAIR']);
    });

    it('leaves the funding collection out, since the registry already carries it', () => {
        expect(Object.keys(snapshot.entities.collections)).toEqual(['events']);
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
    });
});

describe('normalise, the relations', () => {
    it('writes one table per relation, sorted by the pair', () => {
        expect(snapshot.relations).toEqual({
            projectVenue: [['alpha', 'bspc']],
            projectFunding: [['alpha', 'FAIR']],
            projectDataset: [['alpha', 'mimic']],
            projectProgram: [['alpha', 'federated']],
            projectDomain: [['alpha', 'heart']],
            projectRelated: [['alpha', 'beta']],
            fundingProgram: [['FAIR', 'federated']]
        });
    });

    it('fills the other side of each relation on the entity that is pointed at', () => {
        expect(snapshot.entities.programs.federated.projectIds).toEqual(['alpha']);
        expect(snapshot.entities.programs.federated.fundingIds).toEqual(['FAIR']);
        expect(snapshot.entities.domains.heart.projectIds).toEqual(['alpha']);
        expect(snapshot.entities.funding.FAIR.projectIds).toEqual(['alpha']);
        expect(snapshot.entities.funding.FAIR.programIds).toEqual(['federated']);
    });

    it('leaves an id that names nothing out of the table and out of the entity', () => {
        expect(snapshot.entities.projects.beta.relatedIds).toEqual([]);
        expect('venueId' in snapshot.entities.projects.beta).toBe(false);
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
