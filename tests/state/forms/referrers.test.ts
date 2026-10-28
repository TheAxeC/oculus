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
    }),
    fixtureProject({ id: 'sketch', title: 'Sketch', lead: ['lena'] })
];

/** A registry's collection under the key `id`, its entry naming `registry`; the joins read none. */
function registry(id: string, word: Collection['registry']): [string, Collection] {
    return [id, { id, title: id, file: `/hub/${id}.yml`, registry: word, entries: [] }];
}

/** The collections of the snapshot: the registries, one keyed otherwise, and a plain one. */
const collections: Record<string, Collection> = Object.fromEntries([
    registry('pillars', 'pillars'),
    registry('domains', 'domains'),
    registry('venues', 'venues'),
    registry('data', 'datasets'),
    registry('funding', 'funding'),
    registry('people', 'people'),
    registry('organisations', 'organisations'),
    registry('resources', 'resources'),
    registry('outlets', 'venues'),
    ['statements', { id: 'statements', title: 'Statements', file: '', entries: [] }]
]);

const snapshot = {
    entities: {
        projects: Object.fromEntries(projects.map((one) => [one.id, one])),
        people: {
            wim: {
                id: 'wim',
                name: 'Wim',
                affiliations: ['kuleuven'],
                links: []
            },
            an: {
                id: 'an',
                name: '',
                affiliations: ['kuleuven', 'ut'],
                links: []
            }
        },
        funding: {
            veni: { id: 'veni', title: 'Veni', funder: 'nwo' },
            fwo: { id: 'fwo', title: '', funder: 'kuleuven' }
        },
        resources: { utwente: { id: 'utwente', name: 'UT', kind: 'cluster' } },
        collections
    }
} as unknown as Snapshot;

const config = { slurm: { resource: ['utwente'] } };

const ids = (collection: string, id: string, settings: Record<string, unknown> = config) =>
    referrersOf(snapshot, settings, collection, id, null).map((one) => `${one.kind}:${one.id}`);

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
        ['a venue of the venues registry keyed otherwise', 'outlets', 'media', ['project:raw-pls']],
        ['a dataset', 'data', 'ptb', ['project:raw-pls']],
        ['a funding scheme', 'funding', 'veni', ['project:raw-pls']],
        ['a person a project names only as its lead', 'people', 'lena', ['project:sketch']],
        ['a record nothing names', 'pillars', 'unused', []],
        ['a collection whose entries nothing refers to', 'statements', 'any', []]
    ])('%s', (_name, collection, id, expected) => {
        expect(ids(collection, id)).toEqual(expected);
    });

    it('names for a person the projects with them as collaborator or awaited', () => {
        const referrers = referrersOf(snapshot, config, 'people', 'wim', null);
        expect(referrers.map((one) => `${one.kind}:${one.id}`)).toEqual([
            'project:raw-pls',
            'project:hccnet'
        ]);
    });

    it('names for an organisation the people affiliated and the schemes it funds', () => {
        const referrers = referrersOf(snapshot, config, 'organisations', 'kuleuven', null);
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
        expect(ids('resources', 'utwente', { slurm: { resource: ['other', 'utwente'] } })).toEqual([
            'project:raw-pls',
            'project:hccnet',
            'setting:slurm.resource'
        ]);
        expect(ids('resources', 'utwente', { slurm: { resource: ['other'] } })).toEqual([
            'project:raw-pls',
            'project:hccnet'
        ]);
        expect(ids('resources', 'utwente', { slurm: { resource: 'utwente' } })).toEqual([
            'project:raw-pls',
            'project:hccnet'
        ]);
    });

    it('names the setting for the resource its key resolves to in the primary hub alone', () => {
        const resource = (root: string) => ({
            id: `${root}:utwente`,
            root,
            name: 'UT',
            kind: 'cluster'
        });
        const hubs = {
            ...snapshot,
            entities: {
                ...snapshot.entities,
                projects: {},
                collections: {
                    'lab:resources': registry('lab:resources', 'resources')[1],
                    'other:resources': registry('other:resources', 'resources')[1]
                },
                resources: { 'lab:utwente': resource('lab'), 'other:utwente': resource('other') }
            }
        } as unknown as Snapshot;
        const named = (id: string, primary: string | null) =>
            referrersOf(hubs, config, 'resources', id, primary).map((one) => one.id);
        expect(named('lab:utwente', 'lab')).toEqual(['slurm.resource']);
        expect(named('other:utwente', 'lab')).toEqual([]);
        expect(named('other:utwente', 'other')).toEqual(['slurm.resource']);
    });

    it('labels a project by its short name, else its title', () => {
        const labels = referrersOf(snapshot, config, 'pillars', 'tensor', null).map(
            (one) => one.label
        );
        expect(labels).toEqual(['RP', 'HCCNet']);
    });
});
