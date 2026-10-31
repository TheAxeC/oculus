// Layer 2, client-state tests. The page of an entry: which view opens it and with what state, how a
// page is found again from its name in the snapshot and the feeds as they stand now, and how the
// draft of a page is judged against it. The snapshot and the feeds are synthetic and hold only
// what the page reads.

import { describe, expect, it } from 'vitest';
import type { RegistryWord } from '../../../src/lib/data/helpers/hub-names.ts';
import type {
    Career,
    Collection,
    FeedsPayload,
    SchemaField,
    Snapshot
} from '../../../src/lib/data/model/index.ts';
import {
    createPages,
    pageDraftTarget,
    pageView,
    revealState
} from '../../../src/lib/state/forms/page-entry.ts';
import { mergedFeeds } from '../../../src/lib/data/snapshot/hubs/feeds.ts';
import { createSettled } from '../../../src/lib/state/forms/settled.svelte.ts';

const SCHEMA: SchemaField[] = [
    { field: 'key', type: 'text', primary_key: true },
    { field: 'title', type: 'text', display: 1 },
    { field: 'status', type: 'select', options: ['todo', 'done'] }
];

function collection(root: string, keys: string[]): Collection {
    return {
        id: `${root}:tasks`,
        title: 'Tasks',
        file: `/${root}/tasks.yml`,
        schema: SCHEMA,
        primary_key: 'key',
        entries: keys.map((key, index) => ({
            id: `${root}:${key}`,
            title: `Title of ${key}`,
            fields: { key, title: `Title of ${key}`, status: 'todo' },
            file: `/${root}/tasks.yml`,
            index,
            root
        })),
        root
    };
}

const CAREER: Career = {
    title: 'Career strategy',
    order: [],
    sections: { milestone: 'Veni' },
    schema: [{ field: 'milestone', type: 'text' }]
};

/** A file with no `schema:` list that reads, its key named by its `collections:` entry. */
const NO_SCHEMA: Collection = {
    id: 'hub:plain',
    title: 'Plain',
    file: '/hub/plain.yml',
    primary_key: 'name',
    entries: [
        {
            id: 'hub:one',
            title: 'one',
            fields: { name: 'one', status: 'open' },
            file: '/hub/plain.yml',
            index: 0,
            root: 'hub'
        }
    ],
    root: 'hub'
};

function snapshot(career: Career | null): Snapshot {
    const held = [collection('hub', ['a', 'b']), collection('second', ['c']), NO_SCHEMA];
    return {
        entities: { collections: Object.fromEntries(held.map((one) => [one.id, one])), career }
    } as unknown as Snapshot;
}

const FEEDS = {
    leads: {
        meta: {},
        entries: [{ title: 'Postdoc A', status: 'open', root: 'hub', id: 'hub:Postdoc A' }],
        schema: [{ field: 'title', type: 'text', primary_key: true }],
        primary_key: 'title'
    },
    radar: {
        meta: {},
        entries: [{ title: 'A paper', root: 'hub', id: 'hub:A paper' }],
        primary_key: 'title'
    }
} as unknown as FeedsPayload;

const pages = createPages(
    { snapshot: () => snapshot(CAREER), feeds: () => FEEDS },
    createSettled(() => 0)
);

describe('pageView', () => {
    it.each<[string, string, string, RegistryWord | undefined, Record<string, unknown>]>([
        [
            'a person opens the Person view',
            'people',
            'hub:wim',
            'people',
            { view: 'person', state: { hub: 'hub', key: 'wim', label: 'Wim' } }
        ],
        [
            'a person of a people registry keyed otherwise opens the Person view',
            'folks',
            'hub:wim',
            'people',
            { view: 'person', state: { hub: 'hub', key: 'wim', label: 'Wim' } }
        ],
        [
            'any other entry opens the entry view',
            'venues',
            'hub:jbhi',
            'venues',
            {
                view: 'entry',
                state: { collection: 'venues', hub: 'hub', key: 'jbhi', label: 'Wim' }
            }
        ],
        [
            'an entry of a collection keyed people that names no registry opens the entry view',
            'people',
            'hub:wim',
            undefined,
            {
                view: 'entry',
                state: { collection: 'people', hub: 'hub', key: 'wim', label: 'Wim' }
            }
        ]
    ])('%s', (_name, collectionKey, key, registry, opened) => {
        expect(pageView(collectionKey, key, 'Wim', registry)).toEqual(opened);
    });
});

describe('revealState', () => {
    it.each([
        ['an entry of a collection', 'venues', {}],
        ['a lead, whose Expired group opens', 'leads', { expiredOpen: true }],
        ['a paper, whose Dismissed group opens', 'radar', { dismissedOpen: true }]
    ])('%s', (_name, collectionKey, state) => {
        expect(revealState(collectionKey, 'hub:k')).toEqual({
            reveal: { hub: 'hub', key: 'k' },
            ...state
        });
    });
});

describe('pageOf', () => {
    it('finds a collection entry with the values, the fixed fields and the peers', () => {
        const page = pages.pageOf('tasks', 'hub:a');
        expect(page).toMatchObject({
            kind: 'collection',
            name: 'hub:tasks:a',
            writeId: 'hub:a',
            root: 'hub',
            title: 'Title of a',
            schema: SCHEMA,
            fixed: ['key']
        });
        expect(page?.peers).toEqual([{ key: 'b', title: 'Title of b', status: 'todo' }]);
    });

    it('finds an entry of a file with no schema, with its title and values and no schema', () => {
        const page = pages.pageOf('plain', 'hub:one');
        expect(page).toMatchObject({
            kind: 'collection',
            name: 'hub:plain:one',
            writeId: 'hub:one',
            title: 'one',
            values: { name: 'one', status: 'open' },
            fixed: ['name']
        });
        expect(page?.schema).toBeUndefined();
    });

    it('makes the page of an Add to a file with no schema from the fields the write took', () => {
        const settled = createSettled(() => 0);
        const added = createPages(
            { snapshot: () => snapshot(CAREER), feeds: () => FEEDS },
            settled
        );
        added.settle.added('plain', 'hub:new', { name: 'new' }, settled.begin());
        expect(added.pageOf('plain', 'hub:new')).toMatchObject({
            key: 'hub:new',
            title: 'new',
            values: { name: 'new' }
        });
    });

    it('shows the values a write took over an entry of a file with no schema', () => {
        const settled = createSettled(() => 0);
        const written = createPages(
            { snapshot: () => snapshot(CAREER), feeds: () => FEEDS },
            settled
        );
        written.settle.entry('plain', 'hub:one', { status: 'closed' }, settled.begin());
        expect(written.pageOf('plain', 'hub:one')?.values).toEqual({
            name: 'one',
            status: 'closed'
        });
    });

    it('finds an entry of another hub by the id the merged portfolio gives it', () => {
        expect(pages.pageOf('tasks', 'second:c')).toMatchObject({
            root: 'second',
            writeId: 'second:c'
        });
    });

    it('finds a feed entry by its internal id and writes it by that id', () => {
        expect(pages.pageOf('leads', 'hub:Postdoc A')).toMatchObject({
            kind: 'feed',
            collection: 'leads',
            writeId: 'hub:Postdoc A',
            fixed: ['title']
        });
    });

    it('finds a feed entry of a workspace with no primary with the schema of its own hub', () => {
        const feed = (schema: SchemaField[] | undefined, title: string, key?: string) => ({
            ok: true,
            kind: 'leads',
            file: 'leads.yml',
            meta: {},
            entries: [{ title }],
            ...(schema === undefined ? {} : { schema }),
            ...(key === undefined ? {} : { primary_key: key })
        });
        const empty = { ok: true, file: '', meta: {}, entries: [], missing: true };
        const none = {
            radar: { ...empty, kind: 'radar' },
            leads: { ...empty, kind: 'leads' },
            linkedin: { ...empty, kind: 'linkedin' }
        } as unknown as FeedsPayload;
        const own = (schema: SchemaField[] | undefined, title: string, key?: string) =>
            ({ ...none, leads: feed(schema, title, key) }) as unknown as FeedsPayload;
        const lab: SchemaField[] = [
            { field: 'title', type: 'text', primary_key: true },
            { field: 'fit', type: 'text' }
        ];
        const merged = mergedFeeds(none, [
            { key: 'lab', feeds: own(lab, 'Postdoc L', 'title') },
            { key: 'team', feeds: own(undefined, 'Postdoc T') },
            { key: 'named', feeds: own(undefined, 'Postdoc N', 'title') }
        ]);
        const found = createPages(
            { snapshot: () => snapshot(CAREER), feeds: () => merged },
            createSettled(() => 0)
        );
        expect(found.pageOf('leads', 'lab:Postdoc L')).toMatchObject({
            root: 'lab',
            writeId: 'lab:Postdoc L',
            schema: lab
        });
        expect(found.pageOf('leads', 'Postdoc T')).toBeNull();
        const named = found.pageOf('leads', 'named:Postdoc N');
        expect(named).toMatchObject({
            root: 'named',
            writeId: 'named:Postdoc N',
            fixed: ['title']
        });
        expect(named?.schema).toBeUndefined();
    });

    it('finds no page for a feed entry with no key, whatever identity the feed gives it', () => {
        const feeds = {
            ...FEEDS,
            leads: {
                ok: true,
                kind: 'leads',
                file: 'leads.yml',
                meta: {},
                entries: [{ title: 'Same' }, { title: 'Same' }]
            }
        } as unknown as FeedsPayload;
        const found = createPages(
            { snapshot: () => snapshot(CAREER), feeds: () => feeds },
            createSettled(() => 0)
        );
        expect(found.pageOf('leads', 'Same#0')).toBeNull();
        expect(found.pageOf('leads', 'Same#1')).toBeNull();
    });

    it("reads a hub's key of a feed with no schema from the hub's own row alone", () => {
        const feeds = {
            ...FEEDS,
            radar: {
                ok: true,
                kind: 'radar',
                file: 'radar.yml',
                meta: {},
                entries: [{ id: 'constructor:A paper', root: 'constructor', title: 'A paper' }],
                hubSchemas: {},
                hubPrimaryKeys: {}
            }
        } as unknown as FeedsPayload;
        const found = createPages(
            { snapshot: () => snapshot(CAREER), feeds: () => feeds },
            createSettled(() => 0)
        );
        expect(found.pageOf('radar', 'constructor:A paper')?.fixed).toEqual([]);
    });

    it('finds a feed entry of a file with no schema, named by the key of the file', () => {
        const page = pages.pageOf('radar', 'hub:A paper');
        expect(page).toMatchObject({
            kind: 'feed',
            title: 'A paper',
            writeId: 'hub:A paper',
            values: { title: 'A paper' },
            fixed: ['title']
        });
        expect(page?.schema).toBeUndefined();
    });

    it.each([
        ['an entry no file holds', 'tasks', 'missing'],
        ['a collection no hub holds', 'nothing', 'a'],
        ['a key no entry of a file with no schema holds', 'plain', 'hub:missing'],
        ['a feed entry no file holds', 'leads', 'hub:Postdoc B'],
        ['a key no entry of a feed with no schema holds', 'radar', 'hub:No paper']
    ])('finds none for %s', (_name, collectionKey, key) => {
        expect(pages.pageOf(collectionKey, key)).toBeNull();
    });
});

describe('pageNamed', () => {
    it('finds the career file by its name and by no other', () => {
        expect(pages.pageNamed('career')).toMatchObject({
            kind: 'career',
            title: 'Career strategy',
            values: { milestone: 'Veni' }
        });
    });

    it('finds a hub with no career file as none', () => {
        const bare = createPages(
            { snapshot: () => snapshot(null), feeds: () => FEEDS },
            createSettled(() => 0)
        );
        expect(bare.pageNamed('career')).toBeNull();
    });

    it('reads a name as its hub, its collection and its key, so a key may hold more', () => {
        expect(pages.pageNamed('second:tasks:c')?.writeId).toBe('second:c');
        expect(pages.pageNamed('nocolon')).toBeNull();
    });
});

describe('pageDraftTarget', () => {
    const target = pageDraftTarget(pages);

    it('reads the saved values of the page now, and none for a page that is gone', () => {
        expect(target.values('hub:tasks:a')).toEqual({
            key: 'a',
            title: 'Title of a',
            status: 'todo'
        });
        expect(target.values('hub:tasks:gone')).toBeNull();
    });

    it.each([
        ['the same words', 'todo', false],
        ['other words', 'done', true]
    ])('judges an edit of a field by its payload: %s', (_name, edit, differs) => {
        expect(target.differs('hub:tasks:a', 'status', edit, 'todo')).toBe(differs);
    });

    it('judges an edit of a page that is gone by whether it holds words', () => {
        expect(target.differs('hub:tasks:gone', 'status', 'done', undefined)).toBe(true);
        expect(target.differs('hub:tasks:gone', 'status', ' ', undefined)).toBe(false);
    });

    it('writes every field but the fixed ones', () => {
        expect(target.writable('hub:tasks:a', 'status', {})).toBe(true);
        expect(target.writable('hub:tasks:a', 'key', {})).toBe(false);
    });
});
