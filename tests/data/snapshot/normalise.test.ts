// Layer 1, data tests. normalise against hand-built raw records: the field mapping. Nothing here
// reads or writes a file; normalise is pure.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import { normalise } from '../../../src/lib/data/snapshot/normalise.ts';
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
                        { field: 'category', type: 'select', from: 'vocab.venue_categories' }
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
        decks: {},
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
});
