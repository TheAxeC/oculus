// Layer 1, data test. The one function that decides whether two names are one file on disk
// (data/helpers/hub-names.ts `sameDiskFile`, with `diskPath` under it), the guarded entry G28: a
// write over a file a source tab holds unsaved text of is refused, and the tab's file and the
// write's file are told apart by this function. Each row gives synthetic folders and two names.
// `fileNamed` gives a recorded absolute path the name this decision is made on.
//
// What this does NOT cover: the refusal itself, which tests/state/client/held-unsaved.test.ts runs
// through the page's write store, and the folders a real server serves.
//
// The guarded entry G131 is the describe 'the collection a flag or a registry names': which
// collection each feature reads, found by the flag or the registry its hub's entry carries rather
// than by its key, over two synthetic hubs that key their files differently, and the view joining
// one key across two hubs (state/boards/collection/joined.ts `joinedRegistries`), which reads each
// hub's file by the registry that hub's own entry of the key names.

import { describe, expect, it } from 'vitest';
import {
    diskPath,
    diskRelation,
    fileNamed,
    flaggedCollections,
    hubId,
    registryCollection,
    registryCollections,
    registryEntries,
    registryKeyOf,
    sameDiskFile,
    type CollectionFlag,
    type FileName,
    type RegistryWord,
    type RootFolder
} from '../../../src/lib/data/helpers/hub-names.ts';
import type {
    Collection,
    CollectionEntry,
    HubVocab,
    HubVocabs
} from '../../../src/lib/data/model/index.ts';
import { joinedRegistries } from '../../../src/lib/state/boards/collection/joined.ts';
import { pageView } from '../../../src/lib/state/forms/page-entry.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';

const HUB = '/work/hub';
const WORKTREE = '/work/hub/.agents/worktrees/feature';

type Row = {
    title: string;
    roots: RootFolder[];
    one: FileName;
    other: FileName;
    same: boolean;
};

const CONFIG_FILE: FileName = { root: 'config', path: 'defaults/layout.yml' };
const HUB_COPY: FileName = { root: 'hub', path: 'tools/oculus/config/defaults/layout.yml' };

const rows: Row[] = [
    {
        title: 'is one file for a folder listed inside another listed folder',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            { key: 'config', dir: `${HUB}/tools/oculus/config`, real: `${HUB}/tools/oculus/config` }
        ],
        one: CONFIG_FILE,
        other: HUB_COPY,
        same: true
    },
    {
        title: 'is two files for a folder listed in a worktree beside the hub folder',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            {
                key: 'config',
                dir: `${WORKTREE}/tools/oculus/config`,
                real: `${WORKTREE}/tools/oculus/config`
            }
        ],
        one: CONFIG_FILE,
        other: HUB_COPY,
        same: false
    },
    {
        title: 'is one file for a configured root inside the hub and the hub name of its folder',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            { key: 'x', dir: `${HUB}/projects/x`, real: `${HUB}/projects/x` }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: true
    },
    {
        title: 'is two files when a root real folder is empty, a folder that does not exist',
        roots: [
            { key: 'hub', dir: HUB, real: HUB },
            { key: 'x', dir: `${HUB}/projects/x`, real: '' }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: false
    },
    {
        title: 'uses the dir of a root that carries no real folder',
        roots: [
            { key: 'hub', dir: HUB },
            { key: 'x', dir: `${HUB}/projects/x` }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: true
    },
    {
        title: 'compares the names of a root not among the roots by root and path',
        roots: [{ key: 'hub', dir: HUB, real: HUB }],
        one: { root: 'gone', path: 'a.yml' },
        other: { root: 'gone', path: 'a.yml' },
        same: true
    },
    {
        title: 'tells two names of a root not among the roots apart when the paths differ',
        roots: [{ key: 'hub', dir: HUB, real: HUB }],
        one: { root: 'gone', path: 'a.yml' },
        other: { root: 'gone', path: 'b.yml' },
        same: false
    },
    {
        title: 'is one file for a folder listed twice under two names, a link to it included',
        roots: [
            { key: 'a', dir: '/work/a', real: '/work/a' },
            { key: 'b', dir: '/links/b', real: '/work/a' }
        ],
        one: { root: 'a', path: 'x.yml' },
        other: { root: 'b', path: 'x.yml' },
        same: true
    },
    {
        title: 'counts a trailing slash of a root folder once',
        roots: [
            { key: 'hub', dir: `${HUB}/`, real: `${HUB}/` },
            { key: 'x', dir: `${HUB}/projects/x`, real: `${HUB}/projects/x` }
        ],
        one: { root: 'x', path: 'project.yml' },
        other: { root: 'hub', path: 'projects/x/project.yml' },
        same: true
    }
];

describe('two names while the roots are not yet read', () => {
    it('are not known to be one file or two, unless the names are the same', () => {
        expect(diskRelation(CONFIG_FILE, HUB_COPY, [])).toBe('unread');
        expect(diskRelation(HUB_COPY, CONFIG_FILE, [])).toBe('unread');
        expect(
            diskRelation(
                { root: 'hub', path: '.oculus/data/research/venues.yml' },
                { root: 'hub', path: '.oculus/data/people/people.yml' },
                []
            )
        ).toBe('unread');
        expect(diskRelation(HUB_COPY, HUB_COPY, [])).toBe('same');
    });

    it('are two files once the roots are read and no folder joins them', () => {
        const roots = [{ key: 'hub', dir: HUB, real: HUB }];
        expect(
            diskRelation(
                { root: 'hub', path: '.oculus/data/research/venues.yml' },
                { root: 'hub', path: '.oculus/data/people/people.yml' },
                roots
            )
        ).toBe('other');
    });
});

describe('the name of a recorded absolute path', () => {
    it('is its name under the root that holds it, and null for a path no root holds', () => {
        const roots = [{ key: 'hub', dir: HUB, real: HUB }];
        expect(fileNamed(`${HUB}/.oculus/data/academic/tasks.yml`, roots, 'hub')).toEqual({
            root: 'hub',
            path: '.oculus/data/academic/tasks.yml'
        });
        expect(fileNamed('/elsewhere/x.yml', roots, 'hub')).toBeNull();
    });

    it('is a name under no root while the roots are not read, which no tab name equals', () => {
        const file = `${HUB}/.oculus/data/academic/tasks.yml`;
        const named = fileNamed(file, [], 'hub');
        expect(named).toEqual({ root: '', path: file });
        const tab: FileName = { root: 'hub', path: '.oculus/data/academic/tasks.yml' };
        expect(diskRelation(tab, { root: '', path: file }, [])).toBe('unread');
    });
});

describe('one disk file under two names', () => {
    it.each(rows)('$title', (row) => {
        expect(sameDiskFile(row.one, row.other, row.roots)).toBe(row.same);
        expect(sameDiskFile(row.other, row.one, row.roots)).toBe(row.same);
    });

    it('names a file by its root real folder, and null for a root with none', () => {
        const roots: RootFolder[] = [
            { key: 'hub', dir: '/dir/hub', real: '/real/hub' },
            { key: 'empty', dir: '/dir/e', real: '' }
        ];
        expect(diskPath({ root: 'hub', path: 'a/b.yml' }, roots)).toBe('/real/hub/a/b.yml');
        expect(diskPath({ root: 'hub', path: '' }, roots)).toBe('/real/hub');
        expect(diskPath({ root: 'empty', path: 'a.yml' }, roots)).toBeNull();
        expect(diskPath({ root: 'other', path: 'a.yml' }, roots)).toBeNull();
    });
});

describe('the collection a flag or a registry names', () => {
    /**
     * The primary hub `hub` keys its files its own way (case 2); the hub `lab` keys funding as
     * oculus does and names no venues registry (case 3).
     */
    const HUB_LIST: CollectionEntry[] = [
        { key: 'grants', file: 'grants.yml', registry: 'funding', ticker: { category: 'funding' } },
        {
            key: 'jobs',
            file: 'jobs.yml',
            band_positions: true,
            awaiting: true,
            open_badge: true,
            lead_applications: true,
            dissemination: true,
            ticker: { category: 'position' }
        },
        { key: 'courses', file: 'courses.yml', band_teaching: true, dissemination: true },
        { key: 'todo', file: 'todo.yml', tasks: true },
        { key: 'collab', file: 'collab.yml', joint_work: true },
        { key: 'outlets', file: 'outlets.yml', registry: 'venues' },
        { key: 'sets', file: 'sets.yml', registry: 'datasets' },
        { key: 'positions', file: 'positions.yml', registry: 'leads' },
        { key: 'papers', file: 'papers.yml', registry: 'literature' }
    ];
    const LAB_LIST: CollectionEntry[] = [
        { key: 'funding', file: 'funding.yml', registry: 'funding' },
        { key: 'talks', file: 'talks.yml', dissemination: true }
    ];
    /** Oculus's own entries of the registries the lab names none of. */
    const OWN_LIST: CollectionEntry[] = [
        { key: 'venues', file: '.oculus/data/research/venues.yml', registry: 'venues' },
        { key: 'funding', file: '.oculus/data/academic/funding.yml', registry: 'funding' }
    ];

    /** A hub's collections as the snapshot holds them, the feeds left out, each with one entry. */
    function held(root: string, list: CollectionEntry[]): [string, Collection][] {
        return list
            .filter((one) => one.registry !== 'leads')
            .map((one, index) => {
                const { key, file: _file, ...traits } = one;
                const id = hubId(root, key);
                const entry = { id: hubId(root, `${key}-1`), root, title: key, fields: {} };
                const collection = {
                    ...traits,
                    id,
                    root,
                    title: key,
                    file: `/${root}/${one.file}`,
                    entries: [{ ...entry, file: '', index: 0 }],
                    index
                };
                return [id, collection];
            });
    }

    const COLLECTIONS: Record<string, Collection> = Object.fromEntries([
        ...held('hub', HUB_LIST),
        ...held('lab', LAB_LIST)
    ]);

    /** A hub's vocabulary holding only its list, which the lookups read. */
    const vocab = (collections: CollectionEntry[]): HubVocab => ({
        domains: {},
        venue_themes: [],
        data_themes: [],
        collections,
        words: {}
    });

    const HUBS: HubVocabs = {
        primary: 'hub',
        lists: { hub: vocab(HUB_LIST), lab: vocab(LAB_LIST) },
        order: ['hub', 'lab'],
        own: {},
        ownCollections: OWN_LIST
    };

    it.each<[string, CollectionFlag, string[]]>([
        ['the Focus band positions column', 'band_positions', ['hub:jobs']],
        ['the Awaiting box applications', 'awaiting', ['hub:jobs']],
        ['the open count and green badge', 'open_badge', ['hub:jobs']],
        ["a lead's applied press", 'lead_applications', ['hub:jobs']],
        ['the Focus band teaching column', 'band_teaching', ['hub:courses']],
        [
            'Disseminated in, each hub in order',
            'dissemination',
            ['hub:jobs', 'hub:courses', 'lab:talks']
        ],
        ['Add Task, the task seed and the task lines', 'tasks', ['hub:todo']],
        ["a person's joint work and the cross-links", 'joint_work', ['hub:collab']]
    ])('%s reads the collections flagged %s', (_feature, flag, ids) => {
        expect(flaggedCollections(COLLECTIONS, flag).map((one) => one.id)).toEqual(ids);
    });

    it('joins the funding registry of both hubs, whatever each keys it (case 3)', () => {
        expect(registryCollections(COLLECTIONS, 'funding').map((one) => one.id)).toEqual([
            'hub:grants',
            'lab:funding'
        ]);
        expect(registryEntries(COLLECTIONS, 'funding').map((one) => one.id)).toEqual([
            'hub:grants-1',
            'lab:funding-1'
        ]);
        expect(registryCollection(COLLECTIONS, 'funding', 'lab')?.id).toBe('lab:funding');
        expect(registryCollection(COLLECTIONS, 'venues', 'hub')?.id).toBe('hub:outlets');
        expect(registryCollection(COLLECTIONS, 'venues', 'lab')).toBeUndefined();
    });

    it.each<[string, RegistryWord, string, string | undefined]>([
        ["a scheme's Funding view link and its writes", 'funding', 'hub', 'grants'],
        ['the Venues view', 'venues', 'hub', 'outlets'],
        ['the Data view', 'datasets', 'hub', 'sets'],
        ['the Leads view', 'leads', 'hub', 'positions'],
        ['Save to Literature and the BibTeX', 'literature', 'hub', 'papers'],
        ["the second hub's Funding view link", 'funding', 'lab', 'funding'],
        [
            "the Venues view of a hub naming no venues registry, oculus's entry",
            'venues',
            'lab',
            'venues'
        ],
        ['a registry neither list names', 'pillars', 'lab', undefined],
        ["a hub with no list, oculus's entry", 'funding', 'nohub', 'funding']
    ])('%s reads the %s registry of %s under its key', (_feature, registry, hub, key) => {
        expect(registryKeyOf(HUBS, hub, registry)).toBe(key);
    });

    /**
     * The collections of one key a joined view reads, hub `a` with `first`, hub `b` with `second`.
     */
    function joinedOf(first: CollectionEntry, second: CollectionEntry): Collection[] {
        return [...held('a', [first]), ...held('b', [second])].map(([, one]) => one);
    }

    /** The page each entry of a joined view of `key` opens, by its own hub's entry's registry. */
    function pagesOf(key: string, parts: Collection[]): [string, string][] {
        const joined = joinedRegistries(parts);
        return parts
            .flatMap((part) => part.entries)
            .map((entry) => [entry.id, pageView(key, entry.id, '', joined.registryOf(entry)).view]);
    }

    it("reads a joined view's funding hub alone for the card of the projects no scheme covers", () => {
        const parts = joinedOf(
            { key: 'grants', file: 'grants.yml', registry: 'funding' },
            { key: 'grants', file: 'grants.yml' }
        );
        const joined = joinedRegistries(parts);
        expect(joined.funded.map((entry) => entry.id)).toEqual(['a:grants-1']);
        const projects = ['a', 'b'].map((root) => fixtureProject({ id: `${root}:p`, root }));
        expect(joined.fundedProjects(projects).map((project) => project.id)).toEqual(['a:p']);
        expect(joined.literature).toEqual([]);
        expect(pagesOf('grants', parts)).toEqual([
            ['a:grants-1', 'entry'],
            ['b:grants-1', 'entry']
        ]);
    });

    it("opens a joined view's entry by its own hub's registry, the person page only for people", () => {
        const parts = joinedOf(
            { key: 'people', file: 'people.yml', registry: 'people' },
            { key: 'people', file: 'people.yml' }
        );
        expect(joinedRegistries(parts).funded).toEqual([]);
        expect(pagesOf('people', parts)).toEqual([
            ['a:people-1', 'person'],
            ['b:people-1', 'entry']
        ]);
    });

    it("saves a joined view's paper only into a hub whose entry names literature", () => {
        const parts = joinedOf(
            { key: 'grants', file: 'papers.yml' },
            { key: 'grants', file: 'papers.yml', registry: 'literature' }
        );
        expect(joinedRegistries(parts).literature.map((one) => one.id)).toEqual(['b:grants']);
    });
});
