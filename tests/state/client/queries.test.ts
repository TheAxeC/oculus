// Layer 4, state test. What the fetch stores share: one request for a key however often it is read,
// a failed read that is not asked again, an answer held across time with no reader, a request that
// goes while the browser says it is offline, the value a hold puts in, a reload dropped while a
// request is out, two clients that share nothing, and an empty key that builds nothing.
//
// `fetch` and `window` are stubs; nothing here reaches a server. What this does NOT cover: a store
// read inside a `$derived` on a mounted page, which needs a DOM and is seen at the look on landing.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryCache, environmentManager, isServer, onlineManager } from '@tanstack/query-core';
import type { Turn } from '../../../src/lib/data/model/index.ts';
import { createDocs } from '../../../src/lib/state/system/docs.svelte.ts';
import { createEntities } from '../../../src/lib/state/client/entities.svelte.ts';
import { createQueries } from '../../../src/lib/state/client/queries.svelte.ts';
import {
    createClientState,
    stubFetch,
    stubGated,
    type ClientState
} from '../../fixtures/client.ts';

let client: ClientState;

/** The addresses the stub was asked for, in order. */
let asked: string[] = [];

/** One JSON answer. */
function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** A fetch that records the address and answers what `answer` gives back. */
function serving(answer: (url: string) => Response | Promise<Response>): void {
    asked = [];
    stubFetch(asked, answer);
}

/** Let the scheduled request run and its answer land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
});

afterEach(() => {
    vi.useRealTimers();
    environmentManager.setIsServer(() => isServer);
    onlineManager.setOnline(true);
    vi.unstubAllGlobals();
});

describe('a read that failed', () => {
    // Revert: in read of state/client/queries.svelte.ts, make wants answer true so every
    // read asks again, or in fetcherOf of state/system/docs.svelte.ts rethrow the error of a
    // request that never reached the server.
    it.each([
        ['a fetch that rejects', () => Promise.reject(new TypeError('Failed to fetch'))],
        ['a 500', () => Promise.resolve(json({ error: 'broken' }, 500))]
    ])('is asked once and not again by the reads after it, for %s', async (_name, answer) => {
        asked = [];
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            return answer();
        });
        client.docs.document('alpha', 'README.md');
        await settle();
        const failure = client.docs.document('alpha', 'README.md').error;
        expect(failure).not.toBe('');
        client.docs.document('alpha', 'README.md');
        await settle();
        client.docs.document('alpha', 'README.md');
        await settle();
        client.docs.document('alpha', 'README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=alpha&name=README.md']);
        expect(client.docs.document('alpha', 'README.md').error).toBe(failure);
    });

    // Revert: in fetcherOf of state/system/docs.svelte.ts, rethrow the error of a request that
    // never reached the server instead of answering it.
    it('is still asked once where the runtime counts as a browser, which retries by default', async () => {
        environmentManager.setIsServer(() => false);
        vi.useFakeTimers();
        serving(() => Promise.reject(new TypeError('Failed to fetch')));
        const browser = createClientState();
        browser.docs.document('alpha', 'README.md');
        await vi.advanceTimersByTimeAsync(0);
        browser.docs.document('alpha', 'README.md');
        await vi.advanceTimersByTimeAsync(60_000);
        browser.docs.document('alpha', 'README.md');
        await vi.advanceTimersByTimeAsync(0);
        expect(asked).toEqual(['/api/docs?project=alpha&name=README.md']);
    });
});

describe('an answer held with no reader', () => {
    // Revert: in createQueries of state/client/queries.svelte.ts, take gcTime: Infinity out
    // of the query defaults.
    it('is still held after six minutes, and is not asked again on the next read', async () => {
        environmentManager.setIsServer(() => false);
        vi.useFakeTimers();
        serving(() => json({ html: '<p>held</p>', frontmatter: null }));
        const browser = createClientState();
        browser.docs.document('alpha', 'README.md');
        await vi.advanceTimersByTimeAsync(0);
        expect(browser.docs.document('alpha', 'README.md').html).toBe('<p>held</p>');

        await vi.advanceTimersByTimeAsync(6 * 60_000);
        expect(browser.docs.document('alpha', 'README.md').html).toBe('<p>held</p>');
        await vi.advanceTimersByTimeAsync(0);
        expect(asked).toEqual(['/api/docs?project=alpha&name=README.md']);
    });
});

describe('a browser that says it is offline', () => {
    // Revert: in createQueries, take networkMode: 'always' out of the query defaults.
    it('still sends the request, since the page reaches its own server', async () => {
        onlineManager.setOnline(false);
        serving(() => json({ html: '<p>offline</p>', frontmatter: null }));
        client.docs.document('alpha', 'README.md');
        await settle();
        expect(asked).toEqual(['/api/docs?project=alpha&name=README.md']);
        expect(client.docs.document('alpha', 'README.md').html).toBe('<p>offline</p>');
    });
});

describe('a value put in by hand', () => {
    const turn: Turn = {
        at: null,
        role: 'user',
        text: 'held',
        html: 'held',
        cut: false,
        tool: null
    };

    // Revert: in hold of state/client/queries.svelte.ts, take out the client.setQueryData
    // call.
    it('reads back at once on deposit, memories, changes and transcripts, and sends no request', async () => {
        serving(() => json({}));
        client.deposit.hold('alpha', null, 'held error');
        client.memories.hold([{ name: 'a.png', width: 4, height: 3 }]);
        client.changes.hold([], true);
        client.transcripts.hold('s1', [turn], 9);
        await settle();

        expect(client.deposit.mirror('alpha')).toEqual({
            state: null,
            error: 'held error',
            loading: false
        });
        expect(client.memories.wall().images.map((one) => one.name)).toEqual(['a.png']);
        expect(client.changes.more()).toBe(true);
        expect(client.transcripts.turnsFor('s1').offset).toBe(9);
        await settle();
        expect(asked).toEqual([]);
    });

    // Revert: in hold, cancel the fetch of the key before putting the value in.
    it('reads at once while that key is being fetched, and the fetch answer then replaces it', async () => {
        asked = [];
        const { release } = stubGated(asked, () =>
            json({ images: [{ name: 'fetched.png', width: 1, height: 1 }] })
        );
        client.memories.wall();
        await settle();
        expect(asked).toEqual(['/api/memories']);

        client.memories.hold([{ name: 'held.png', width: 2, height: 2 }]);
        expect(client.memories.wall().images.map((one) => one.name)).toEqual(['held.png']);
        release();
        await settle();
        expect(client.memories.wall().images.map((one) => one.name)).toEqual(['fetched.png']);
    });
});

describe('a reload while a request is out', () => {
    // Revert: in reload of state/system/deposit.svelte.ts, refetch with 'replace' instead of
    // 'drop'.
    it('sends nothing more for deposit', async () => {
        asked = [];
        const { release } = stubGated(asked, () => json({ state: null }));
        client.deposit.mirror('alpha');
        await settle();
        client.deposit.reload('alpha');
        client.deposit.reload('alpha');
        await settle();
        expect(asked).toEqual(['/api/deposit?id=alpha']);
        release();
        await settle();
        client.deposit.reload('alpha');
        await settle();
        expect(asked).toHaveLength(2);
    });

    // Revert: in reload of state/life/memories.svelte.ts, refetch with 'replace' instead of 'drop'.
    it('sends nothing more for memories', async () => {
        asked = [];
        const { release } = stubGated(asked, () => json({ images: [] }));
        client.memories.wall();
        await settle();
        client.memories.reload();
        client.memories.reload();
        await settle();
        expect(asked).toEqual(['/api/memories']);
        release();
        await settle();
        client.memories.reload();
        await settle();
        expect(asked).toHaveLength(2);
    });
});

describe('two client states', () => {
    // Revert: in createClientState of state/client/context.ts, share one createQueries() between
    // client states.
    it('share no answer: a key held in one is asked for again by the other', async () => {
        serving(() => json({ html: '<p>one</p>', frontmatter: null }));
        const other = createClientState();
        client.docs.document('alpha', 'README.md');
        await settle();
        expect(client.docs.document('alpha', 'README.md').html).toBe('<p>one</p>');

        expect(other.docs.document('alpha', 'README.md').loading).toBe(true);
        await settle();
        expect(asked).toHaveLength(2);
    });
});

describe('an empty id, name, path or root', () => {
    // Revert: in document of state/system/docs.svelte.ts, take out the empty id and name test.
    it('answers its empty reading in every keyed store, builds no query and sends no request', async () => {
        serving(() => json({}));
        const built = vi.spyOn(QueryCache.prototype, 'build');
        expect(client.docs.document('', 'README.md').loading).toBe(false);
        expect(client.docs.document('alpha', '').loading).toBe(false);
        expect(client.docs.hubDocument('').loading).toBe(false);
        expect(client.files.files('').loading).toBe(false);
        expect(client.latex.state('').loading).toBe(false);
        expect(client.deposit.mirror('').loading).toBe(false);
        expect(client.transcripts.turnsFor('').pending).toBe(false);
        expect(client.fs.listing('', '').loading).toBe(false);
        expect(client.fs.fileText('hub', '').loading).toBe(false);
        expect(client.fs.fileText('', 'a.txt').loading).toBe(false);
        expect(client.fs.note('').loading).toBe(false);
        expect((await client.fs.readListing('', '')).loading).toBe(false);
        await settle();
        expect(asked).toEqual([]);
        expect(built).not.toHaveBeenCalled();
        built.mockRestore();
    });
});

describe('the query helper on its own', () => {
    const KEY = ['probe', 'one'];

    // Revert: in document of state/system/docs.svelte.ts, take out the empty id and name test.
    it('builds no query for an empty key, in the cache of the client that docs reads through', async () => {
        const queries = createQueries();
        const docs = createDocs(createEntities(), queries);
        serving(() => json({}));
        docs.document('', 'README.md');
        docs.document('alpha', '');
        docs.hubDocument('');
        await settle();
        expect(queries.client.getQueryCache().getAll()).toEqual([]);
        expect(asked).toEqual([]);
    });

    // Revert: none turns it red, since Queries.fetch and the scheduled read go through
    // client.query, which never retries; it audits that a throwing query function is called once.
    it('audit: calls a query function that throws once, where the runtime retries by default', async () => {
        environmentManager.setIsServer(() => false);
        vi.useFakeTimers();
        const queries = createQueries();
        let calls = 0;
        const throwing = (): Promise<string> => {
            calls += 1;
            return Promise.reject(new Error('down'));
        };
        queries.read(KEY, throwing, { enabled: true });
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(60_000);
        expect(calls).toBe(1);
    });

    // Revert: in hold of state/client/queries.svelte.ts, take out the line that marks the
    // key again when it was marked before.
    it('reads a marked key as stale, keeps the mark across a hold, and asks again on the next read', async () => {
        const queries = createQueries();
        let answers = 0;
        const answer = (): Promise<number> => Promise.resolve(++answers);
        queries.read(KEY, answer, { enabled: true });
        await settle();
        expect(queries.peek<number>(KEY)).toEqual({ data: 1, stale: false });

        queries.mark(['probe'], 'wait');
        expect(queries.peek<number>(KEY).stale).toBe(true);
        queries.hold(KEY, 5);
        expect(queries.peek<number>(KEY)).toEqual({ data: 5, stale: true });

        queries.read(KEY, answer, { enabled: true });
        await settle();
        expect(queries.peek<number>(KEY)).toEqual({ data: 2, stale: false });
    });

    // Revert: in markOne of state/client/queries.svelte.ts, take out the line that records a
    // 'wait' mark for a fetch in flight.
    it('applies a wait mark after the fetch in flight lands, and a drop mark not at all', async () => {
        const queries = createQueries();
        let release: (value: number) => void = () => undefined;
        const held = (): Promise<number> =>
            new Promise<number>((resolve) => {
                release = resolve;
            });
        queries.read(KEY, held, { enabled: true });
        await settle();
        queries.mark(KEY, 'drop');
        release(1);
        await settle();
        expect(queries.peek<number>(KEY)).toEqual({ data: 1, stale: false });

        queries.mark(KEY, 'wait');
        expect(queries.peek<number>(KEY).stale).toBe(true);
        queries.read(KEY, held, { enabled: true });
        await settle();
        queries.mark(KEY, 'wait');
        release(2);
        await settle();
        expect(queries.peek<number>(KEY)).toEqual({ data: 2, stale: true });
    });

    // Revert: in fetch of state/client/queries.svelte.ts, return the promise of the query
    // client rather than the call's own.
    it('never holds the answer of a fetch a replace mark cancelled, yet returns it to the awaited call', async () => {
        const queries = createQueries();
        let release: (value: string) => void = () => undefined;
        const fetcher = (): Promise<string> =>
            new Promise<string>((resolve) => {
                release = resolve;
            });
        const awaited = queries.fetch(KEY, fetcher);
        await settle();
        queries.mark(KEY, 'replace');
        release('older');
        expect(await awaited).toBe('older');
        expect(queries.peek<string>(KEY).data).toBeUndefined();
    });

    // Revert: in forget of state/client/queries.svelte.ts, take out the loop that drops the
    // scheduled reads of the key.
    it('sends a fetch scheduled in this tick nowhere once its key is forgotten', async () => {
        const queries = createQueries();
        let calls = 0;
        const fetcher = (): Promise<number> => Promise.resolve(++calls);
        queries.read(KEY, fetcher, { enabled: true });
        queries.forget(['probe']);
        await settle();
        expect(calls).toBe(0);
        expect(queries.entries(['probe'])).toEqual([]);
    });
});

describe('a note saved before it was read', () => {
    // Revert: in saveNote of state/sources/fs.svelte.ts, take out the queries.mark call after the
    // hold.
    it('is read from the server on the next read, which ends with the disk body and time', async () => {
        asked = [];
        const methods: string[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            asked.push(url);
            methods.push(init?.method ?? 'GET');
            return Promise.resolve(
                url.includes('note=n9')
                    ? json({ id: 'n9', title: 'disk', body: 'disk body', modified: 77 })
                    : json({ ok: true, changed: ['note'], refused: [] })
            );
        });
        await client.fs.saveNote('n9', 'mine', 'my body');
        client.fs.note('n9');
        await settle();

        expect(asked).toEqual(['/api/fs', '/api/fs?note=n9']);
        expect(methods).toEqual(['POST', 'GET']);
        expect(client.fs.note('n9')).toMatchObject({ body: 'disk body', modified: 77 });
    });
});
