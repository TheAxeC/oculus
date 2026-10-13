// Layer 2, client-state tests. What refers to a record: the projects that name a pillar, a domain,
// a venue, a dataset, a funding scheme or a resource, what names an organisation, a person or a
// resource, and the setting that names a resource. The snapshot is synthetic and holds only what
// the joins read.

import { describe, expect, it } from 'vitest';
import type { Collection, Snapshot } from '../../../src/lib/data/model/index.ts';
import { referrersOf } from '../../../src/lib/state/forms/referrers.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';

const projects = [
    fixtureProject({
        id: 'raw-pls',
        title: 'RAW-PLS',
        short: 'RP',
        pillarIds: ['tensor'],
        domainIds: ['heart'],
        venueId: 'media',
        datasetIds: ['ptb'],
        fundingIds: ['veni'],
        resourceIds: ['utwente'],
        collaborators: ['wim']
    }),
    fixtureProject({
        id: 'hccnet',
        title: 'HCCNet',
        pillarIds: ['tensor', 'federated'],
        resourceIds: ['utwente'],
        waitingOn: ['wim']
    })
];

const jointWork: Collection = {
    id: 'joint-work',
    title: 'Joint work',
    file: '/hub/network/joint-work.yml',
    entries: [
        { id: 'paper-a', title: 'Paper A', fields: {}, file: '', index: 0 },
        { id: 'paper-b', title: '', fields: {}, file: '', index: 1 }
    ]
};

const snapshot = {
    entities: {
        projects: Object.fromEntries(projects.map((one) => [one.id, one])),
        people: {
            wim: {
                id: 'wim',
                name: 'Wim',
                affiliations: ['kuleuven'],
                links: [],
                jointWorkIds: ['paper-b']
            },
            an: {
                id: 'an',
                name: '',
                affiliations: ['kuleuven', 'ut'],
                links: [],
                jointWorkIds: []
            }
        },
        funding: {
            veni: { id: 'veni', title: 'Veni', funder: 'nwo' },
            fwo: { id: 'fwo', title: '', funder: 'kuleuven' }
        },
        collections: { 'joint-work': jointWork }
    }
} as unknown as Snapshot;

const config = { slurm: { resource: 'utwente' } };

const ids = (collection: string, id: string, settings: Record<string, unknown> = config) =>
    referrersOf(snapshot, settings, collection, id).map((one) => `${one.kind}:${one.id}`);

describe('referrersOf', () => {
    it.each([
        [
            'a pillar names the projects under it',
            'pillars',
            'tensor',
            ['project:raw-pls', 'project:hccnet']
        ],
        ['a pillar one project names', 'pillars', 'federated', ['project:hccnet']],
        ['a domain', 'domains', 'heart', ['project:raw-pls']],
        ['a venue', 'venues', 'media', ['project:raw-pls']],
        ['a dataset', 'data', 'ptb', ['project:raw-pls']],
        ['a funding scheme', 'funding', 'veni', ['project:raw-pls']],
        ['a record nothing names', 'pillars', 'unused', []],
        ['a collection whose entries nothing refers to', 'statements', 'any', []]
    ])('%s', (_name, collection, id, expected) => {
        expect(ids(collection, id)).toEqual(expected);
    });

    it('names for a person the projects with them as collaborator or awaited, and the joint work', () => {
        const referrers = referrersOf(snapshot, config, 'people', 'wim');
        expect(referrers.map((one) => `${one.kind}:${one.id}`)).toEqual([
            'project:raw-pls',
            'project:hccnet',
            'entry:paper-b'
        ]);
        expect(referrers.at(-1)).toMatchObject({ label: 'paper-b', collection: 'joint-work' });
    });

    it('names for an organisation the people affiliated and the schemes it funds', () => {
        const referrers = referrersOf(snapshot, config, 'organisations', 'kuleuven');
        expect(referrers).toEqual([
            { kind: 'person', id: 'wim', label: 'Wim' },
            { kind: 'person', id: 'an', label: 'an' },
            { kind: 'funding', id: 'fwo', label: 'fwo' }
        ]);
    });

    it('names for a resource the projects that compute on it and the setting that names it', () => {
        expect(ids('resources', 'utwente')).toEqual([
            'project:raw-pls',
            'project:hccnet',
            'setting:slurm.resource'
        ]);
        expect(ids('resources', 'utwente', { slurm: { resource: 'other' } })).toEqual([
            'project:raw-pls',
            'project:hccnet'
        ]);
    });

    it('labels a project by its short name, else its title', () => {
        const labels = referrersOf(snapshot, config, 'pillars', 'tensor').map((one) => one.label);
        expect(labels).toEqual(['RP', 'HCCNet']);
    });
});
