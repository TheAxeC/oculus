// Layer 4, test. What the file browser store holds for each answer of /api/fs that carries a list
// or a text field (the workspaces, the bookmarks, the notes, one note and a folder listing): a
// field of the wrong type, a list that is the answer's own, an item that is not one, and a body
// that is not a map.
//
// `fetch` and `window` are stubs; nothing here reaches a server or the real hub. What this does NOT
// cover: the endpoint itself (tests/routes/files/fs.test.ts) and the store's rounds and retries
// (tests/state/sources/fs/fs.test.ts).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import {
    createClientState,
    stubFetch,
    type ClientState,
    refused,
    unreadable
} from '../../../fixtures/client.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';

// Opening a file browser tab reads the view's own label out of the catalog, as the page does.
setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
});

afterEach(() => vi.unstubAllGlobals());

/** Let the scheduled request run and its answer land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** A response whose json() answers `body` itself, so a case can hold the object the store gets. */
function answered(body: unknown, status = 200): Response {
    const ok = status >= 200 && status < 300;
    return { ok, status, json: () => Promise.resolve(body) } as unknown as Response;
}

/** A response whose body is `text`, which is JSON, `null` or no JSON at all. */
function texted(text: string, status = 200): Response {
    return new Response(text, { status });
}

/** One kind of answer: how the store is asked for it and what it holds in each case. */
type Kind = {
    name: string;
    read: (state: ClientState) => unknown;
    /** Ask again after a read that failed, for the kinds whose control offers it. */
    retry?: (state: ClientState) => void;
    /** What the store holds when an answer had nothing usable, without its `error`. */
    nothing: Record<string, unknown>;
    /** Answers that are maps with a field of the wrong type, with what the store holds of each. */
    wrongTyped: [unknown, Record<string, unknown>][];
    /** An answer whose lists are well-formed, and the fields of the held state that are lists. */
    listed?: () => { body: Record<string, unknown>; lists: string[] };
    /** An answer whose lists hold items that are not items, with what the store holds of it. */
    dirty?: () => [Record<string, unknown>, Record<string, unknown>];
};

const FILE = { name: 'a.txt', kind: 'file', size: 1, mtime: 1 };
const ROOTS = [{ key: 'hub', dir: '/hub', fixed: true }];
const ENTRY = { id: 'manual', title: 'manual', fields: { label: 'manual' }, file: '', index: 0 };
const FIELD = { field: 'label', type: 'text' };
const NOTE_ROW = { id: 'n1', title: 'a title', modified: 5 };

const KINDS: Kind[] = [
    {
        name: 'workspaces',
        read: (state) => state.fs.workspaces(),
        retry: (state) => state.fs.retryWorkspaces(),
        nothing: { home: '', current: '', workspaces: [], dropped: [], loading: false },
        wrongTyped: [
            [{ workspaces: {}, current: 3 }, {}],
            [{ home: 7 }, {}],
            [{ workspaces: 'x', current: null, dropped: {} }, {}],
            [{ workspaces: null, dropped: null, current: 'a' }, { current: 'a' }]
        ],
        listed: () => ({
            body: {
                current: 'a',
                workspaces: [
                    { name: 'a', roots: ROOTS, extra: 1 },
                    { name: 'b', roots: [] }
                ],
                dropped: ['x', 'y']
            },
            lists: ['workspaces', 'dropped']
        }),
        dirty: () => [
            {
                current: 'a',
                workspaces: [3, { name: 'a', roots: ROOTS }, null, 'x', []],
                dropped: [1, 'a', null]
            },
            { current: 'a', workspaces: [{ name: 'a', roots: ROOTS }], dropped: ['a'] }
        ]
    },
    {
        name: 'bookmarks',
        read: (state) => state.fs.bookmarks(),
        retry: (state) => state.fs.retryBookmarks(),
        nothing: { entries: [], schema: [], loading: false },
        wrongTyped: [
            [{ entries: 'x', schema: null }, {}],
            [{ entries: {}, schema: {} }, {}],
            [{ entries: [ENTRY], schema: {} }, { entries: [ENTRY] }]
        ],
        listed: () => ({
            body: { entries: [{ ...ENTRY, extra: 1 }, ENTRY], schema: [{ ...FIELD, extra: 1 }] },
            lists: ['entries', 'schema']
        }),
        dirty: () => [
            { entries: [3, ENTRY, 'x'], schema: [null, FIELD, []] },
            { entries: [ENTRY], schema: [FIELD] }
        ]
    },
    {
        name: 'notes',
        read: (state) => state.fs.notes(),
        retry: (state) => state.fs.retryNotes(),
        nothing: { notes: [], loading: false },
        wrongTyped: [
            [{ notes: {} }, {}],
            [{ notes: 'x' }, {}],
            [{ notes: null }, {}]
        ],
        listed: () => ({
            body: { notes: [{ ...NOTE_ROW, extra: 1 }, NOTE_ROW] },
            lists: ['notes']
        }),
        dirty: () => [{ notes: [3, NOTE_ROW, null] }, { notes: [NOTE_ROW] }]
    },
    {
        name: 'a note',
        read: (state) => state.fs.note('n1'),
        nothing: { id: 'n1', title: '', body: '', modified: 0, loading: false },
        wrongTyped: [
            [{ title: 3, body: null, modified: '1' }, {}],
            [
                { title: 't', body: 'b', modified: 5 },
                { title: 't', body: 'b', modified: 5 }
            ],
            [
                { title: 't', body: ['b'], modified: 1.5 },
                { title: 't', modified: 1.5 }
            ],
            [{ modified: NaN }, { modified: NaN }],
            [{ modified: Infinity }, { modified: Infinity }],
            [{ modified: -1 }, { modified: -1 }],
            [{ id: 'other', title: 'a' }, { title: 'a' }]
        ]
    },
    {
        name: 'a folder listing',
        read: (state) => state.fs.listing('hub', ''),
        nothing: { entries: [], loading: false },
        wrongTyped: [
            [{ entries: null, error: 3 }, {}],
            [{ entries: {} }, {}],
            [{ entries: 'x' }, {}]
        ],
        listed: () => ({
            body: {
                entries: [
                    { ...FILE, extra: 1 },
                    { name: 'b', kind: 'dir', size: 0, mtime: 2 }
                ]
            },
            lists: ['entries']
        }),
        dirty: () => [{ entries: [3, FILE, null, 'x'] }, { entries: [FILE] }]
    }
];

/** What the store holds for `kind` once `response` has answered its request. */
async function held(kind: Kind, response: Response): Promise<Record<string, unknown>> {
    stubFetch([], () => response);
    kind.read(client);
    await settle();
    return kind.read(client) as Record<string, unknown>;
}

describe.each(KINDS)('the answer of $name', (kind) => {
    const empty = { ...kind.nothing, error: '' };

    it.each(kind.wrongTyped)(
        'holds a field of the wrong type as its fallback: %j',
        async (body, over) => {
            expect(await held(kind, answered(body))).toStrictEqual({ ...empty, ...over });
        }
    );

    it.each([[[]], ['x'], [7], [true], [{ error: 'said on success' }]])(
        'holds what a successful body that is not a map without the fields holds: %j',
        async (body) => {
            expect(await held(kind, answered(body))).toStrictEqual(empty);
        }
    );

    it.each([
        [{ error: 'origin' }, 403],
        [{ error: '' }, 500],
        [{ error: 3 }, 500],
        [{ error: ['a'] }, 404],
        [{ error: null }, 500],
        [{}, 502],
        [[], 500],
        ['x', 500],
        [7, 500]
    ])('says the refusal sentence for a refused read: %j at %i', async (body, status) => {
        expect(await held(kind, answered(body, status))).toStrictEqual({
            ...empty,
            error: refused(status)
        });
    });

    it('says the sentence of the catalog for a refused read whose error is one of its words', async () => {
        expect(await held(kind, answered({ error: 'outside' }, 400))).toStrictEqual({
            ...empty,
            error: t('files.refused_outside')
        });
    });

    if (kind.listed !== undefined && kind.dirty !== undefined) {
        const { listed, dirty } = kind;

        it('holds each list of a well-formed answer as the list the answer carried', async () => {
            const { body, lists } = listed();
            const state = await held(kind, answered(body));
            for (const key of lists) expect(state[key]).toBe(body[key]);
            expect(state).toMatchObject({ error: '', loading: false });
        });

        it('leaves out the items of a list that are not items and holds the rest', async () => {
            const [body, expected] = dirty();
            expect(await held(kind, answered(body))).toStrictEqual({ ...empty, ...expected });
        });
    }

    it.each([['null'], ['<html>gateway</html>']])(
        'holds the unreadable sentence when a refused body is %s',
        async (text) => {
            expect(await held(kind, texted(text, 500))).toStrictEqual({
                ...empty,
                error: unreadable(500)
            });
        }
    );

    it.each([['null'], ['<html>gateway</html>']])(
        'holds the unreadable sentence when a successful body is %s',
        async (text) => {
            expect(await held(kind, texted(text))).toStrictEqual({
                ...empty,
                error: unreadable(200)
            });
        }
    );

    if (kind.retry !== undefined) {
        const retry = kind.retry;

        it('offers the retry after a successful body that is not JSON, and reads again', async () => {
            await held(kind, texted('<html>gateway</html>'));
            stubFetch([], () => answered({}));
            retry(client);
            kind.read(client);
            await settle();
            expect(kind.read(client)).toStrictEqual(empty);
        });
    }
});

describe('the bookmark forms', () => {
    // Revert: in readBookmarks of state/sources/fs.svelte.ts, call closeGoneForms for a body the
    // read could not parse.
    it.each([['null'], ['<html>gateway</html>']])(
        'stay open over a successful read whose body is %s',
        async (text) => {
            client.layout.loadLayout(fakeStorage());
            const own = client.layout.openView('files');
            client.ui.setInstanceState(own, { form: 'bookmark', editing: 'manual' });
            stubFetch([], () => texted(text));

            client.fs.bookmarks();
            await settle();

            expect(client.ui.instanceState(own)).toMatchObject({
                form: 'bookmark',
                editing: 'manual'
            });
        }
    );
});

describe('the files message that names the bookmarks', () => {
    /** How many times the bookmarks were asked for. */
    let reads: string[];

    async function readBookmarks(): Promise<void> {
        client.fs.bookmarks();
        await settle();
    }

    beforeEach(async () => {
        reads = [];
        stubFetch(reads, () => answered({ entries: [], schema: [] }));
        await readBookmarks();
    });

    // Revert: in the files listener of state/sources/fs.svelte.ts, read the payload without
    // checking that it is a map.
    it('asks for nothing again over a message whose payload is null', async () => {
        expect(() =>
            client.entities.receive({ channel: 'files', version: 1, payload: null })
        ).not.toThrow();
        await readBookmarks();
        expect(reads).toHaveLength(1);
    });

    it.each([
        [{ root: 'r', bookmarks: 'true' }],
        [{ root: 'r', bookmarks: 1 }],
        [{ root: 'r', bookmarks: false }],
        [{ root: 'r', bookmarks: null }],
        [{ root: 'r' }],
        [{}]
    ])('asks for nothing again over %j', async (payload) => {
        client.entities.receive({ channel: 'files', version: 1, payload });
        await readBookmarks();
        expect(reads).toHaveLength(1);
    });

    it('asks again only for a version newer than the newest one that named them', async () => {
        const named = { root: '', bookmarks: true };
        client.entities.receive({ channel: 'files', version: 5, payload: named });
        await readBookmarks();
        expect(reads).toHaveLength(2);

        client.entities.receive({ channel: 'files', version: 5, payload: named });
        client.entities.receive({ channel: 'files', version: 4, payload: named });
        await readBookmarks();
        expect(reads).toHaveLength(2);

        client.entities.receive({ channel: 'files', version: 6, payload: named });
        await readBookmarks();
        expect(reads).toHaveLength(3);
    });
});
