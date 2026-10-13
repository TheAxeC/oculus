// Layer 2, client-state tests. The page of an entry: which view opens it and with what state, how a
// page is found again from its name in the snapshot and the feeds as they stand now, and how the
// draft of a page is judged against it. The snapshot and the feeds are synthetic and hold only
// what the page reads.

import { describe, expect, it } from 'vitest';
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
import { createSettled } from '../../../src/lib/state/forms/settled.svelte.ts';

const SCHEMA: SchemaField[] = [
    { field: 'key', type: 'text' },
    { field: 'title', type: 'text' },
    { field: 'status', type: 'select', options: ['todo', 'done'] }
];

function collection(root: string | undefined, keys: string[]): Collection {
    return {
        id: root === undefined ? 'tasks' : `${root}:tasks`,
        title: 'Tasks',
        file: `/${root ?? 'hub'}/tasks.yml`,
        schema: SCHEMA,
        entries: keys.map((key, index) => ({
            id: root === undefined ? key : `${root}:${key}`,
            title: `Title of ${key}`,
            fields: { key, title: `Title of ${key}`, status: 'todo' },
            file: `/${root ?? 'hub'}/tasks.yml`,
            index,
            ...(root === undefined ? {} : { root })
        })),
        ...(root === undefined ? {} : { root })
    };
}

const CAREER: Career = {
    title: 'Career strategy',
    situation: [],
    order: [],
    hosts: [],
    hostCriteria: [],
    notHosts: [],
    eligibility: null,
    dropped: [],
    sections: { milestone: 'Veni' },
    schema: [{ field: 'milestone', type: 'text' }]
};

function snapshot(career: Career | null): Snapshot {
    const held = [collection(undefined, ['a', 'b']), collection('second', ['c'])];
    return {
        entities: { collections: Object.fromEntries(held.map((one) => [one.id, one])), career }
    } as unknown as Snapshot;
}

const FEEDS = {
    leads: {
        meta: {},
        entries: [{ title: 'Postdoc A', status: 'open' }],
        schema: [{ field: 'title', type: 'text' }]
    },
    radar: { meta: {}, entries: [{ title: 'A paper' }] }
} as unknown as FeedsPayload;

const pages = createPages(
    { snapshot: () => snapshot(CAREER), feeds: () => FEEDS },
    createSettled(() => 0)
);

describe('pageView', () => {
    it.each([
        [
            'a person opens the Person view',
            'people',
            'wim',
            { view: 'person', state: { key: 'wim', label: 'Wim' } }
        ],
        [
            'any other entry opens the entry view',
            'venues',
            'jbhi',
            {
                view: 'entry',
                state: { id: 'venues:jbhi', collection: 'venues', key: 'jbhi', label: 'Wim' }
            }
        ]
    ])('%s', (_name, collectionKey, key, opened) => {
        expect(pageView(collectionKey, key, 'Wim')).toEqual(opened);
    });
});

describe('revealState', () => {
    it.each([
        ['an entry of a collection', 'venues', { reveal: 'k' }],
        ['a lead, whose expired disclosure opens', 'leads', { reveal: 'k', expiredOpen: true }],
        ['a paper, whose dismissed disclosure opens', 'radar', { reveal: 'k', dismissedOpen: true }]
    ])('%s', (_name, collectionKey, state) => {
        expect(revealState(collectionKey, 'k')).toEqual(state);
    });
});

describe('pageOf', () => {
    it('finds a collection entry with the values, the fixed fields and the peers', () => {
        const page = pages.pageOf('tasks', 'a');
        expect(page).toMatchObject({
            kind: 'collection',
            name: 'tasks:a',
            writeId: 'a',
            root: '',
            title: 'Title of a',
            fixed: ['key']
        });
        expect(page?.peers).toEqual([{ key: 'b', title: 'Title of b', status: 'todo' }]);
    });

    it('finds an entry of another hub by the id the merged portfolio gives it', () => {
        expect(pages.pageOf('tasks', 'second:c')).toMatchObject({
            root: 'second',
            writeId: 'second:c'
        });
    });

    it('finds a feed entry by its identity and writes it by its title', () => {
        expect(pages.pageOf('leads', 'Postdoc A')).toMatchObject({
            kind: 'feed',
            collection: 'leads',
            writeId: 'Postdoc A',
            fixed: ['title']
        });
    });

    it.each([
        ['an entry no file holds', 'tasks', 'missing'],
        ['a collection no hub holds', 'nothing', 'a'],
        ['a feed that has no schema', 'radar', 'A paper'],
        ['a feed entry no file holds', 'leads', 'Postdoc B']
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

    it('splits a name at its first colon, so a key may hold more', () => {
        expect(pages.pageNamed('tasks:second:c')?.writeId).toBe('second:c');
        expect(pages.pageNamed('nocolon')).toBeNull();
    });
});

describe('pageDraftTarget', () => {
    const target = pageDraftTarget(pages);

    it('reads the saved values of the page now, and none for a page that is gone', () => {
        expect(target.values('tasks:a')).toEqual({ key: 'a', title: 'Title of a', status: 'todo' });
        expect(target.values('tasks:gone')).toBeNull();
    });

    it.each([
        ['the same words', 'todo', false],
        ['other words', 'done', true]
    ])('judges an edit of a field by its payload: %s', (_name, edit, differs) => {
        expect(target.differs('tasks:a', 'status', edit, 'todo')).toBe(differs);
    });

    it('judges an edit of a page that is gone by whether it holds words', () => {
        expect(target.differs('tasks:gone', 'status', 'done', undefined)).toBe(true);
        expect(target.differs('tasks:gone', 'status', ' ', undefined)).toBe(false);
    });

    it('writes every field but the fixed ones', () => {
        expect(target.writable('tasks:a', 'status', {})).toBe(true);
        expect(target.writable('tasks:a', 'key', {})).toBe(false);
    });
});
