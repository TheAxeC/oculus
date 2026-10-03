// What one Search tab says of the answer of the endpoint: a body it cannot read, a refusal with and
// without a word, the reason ripgrep gave for a pattern it could not read, and the folder a tab is
// scoped to.
//
// The endpoint is stubbed with a fetch of the case's own, so nothing starts a process and nothing
// reaches the network.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseSearchState, queryOf } from '../../../../src/lib/state/sources/search/search.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { refused, unreadable, type ClientState } from '../../../fixtures/client.ts';
import { ANSWER, searchClient, stub } from './search-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = searchClient();
});

afterEach(() => vi.unstubAllGlobals());

describe('the answer of the endpoint', () => {
    /** Run one search whose request is answered by `response`, and read the tab afterwards. */
    async function ran(response: () => Promise<Response>): Promise<ReturnType<typeof tabOf>> {
        vi.stubGlobal('fetch', response);
        client.search.setSearchState('one', { q: 'needle', root: 'hub' });
        await client.search.runSearch('one', ['hub']);
        return tabOf();
    }

    function tabOf(): { error: string; answer: unknown } {
        const { error, answer } = client.search.searchState('one');
        return { error, answer };
    }

    /** A response with a status and a json() of its own. */
    function json(body: unknown, status: number): () => Promise<Response> {
        const ok = status < 300;
        return () => Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);
    }

    it.each([[[]], ['x'], [7], [{ files: 'x' }], [{}]])(
        'says the search failed for a successful body %j without an answer in it',
        async (body) => {
            expect(await ran(json(body, 200))).toStrictEqual({
                error: t('search.failed'),
                answer: null
            });
        }
    );

    it.each([
        [{ error: 'bad' }],
        [{ error: '' }],
        [{ error: 3 }],
        [{ error: null }],
        [{}],
        [[]],
        [null],
        ['x'],
        [7]
    ])('says the refusal sentence for a refused body %j that is no word', async (body) => {
        expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });
    });

    it('says the refusal sentence with the status of a 500 holding an empty map', async () => {
        expect(await ran(json({}, 500))).toStrictEqual({ error: refused(500), answer: null });
    });

    it('says the refusal sentence with the status of a 403 that gives a text of its own', async () => {
        expect(await ran(json({ error: 'denied by x' }, 403))).toStrictEqual({
            error: refused(403),
            answer: null
        });
    });

    it.each([
        ['empty', 'search.refused_empty'],
        ['too_long', 'search.refused_too_long'],
        ['unknown_root', 'search.refused_unknown_root'],
        ['outside', 'search.refused_outside'],
        ['missing', 'search.refused_missing'],
        ['token', 'search.refused_token'],
        ['timed_out', 'search.refused_timed_out']
    ])('says the words of the search for the refusal word %s', async (word, key) => {
        const held = await ran(json({ error: word }, 400));
        expect(held).toStrictEqual({ error: t(key), answer: null });
    });

    it('says the pattern ripgrep could not read with its reason', async () => {
        const held = await ran(json({ error: 'pattern', reason: 'unclosed group' }, 400));
        expect(held.error).toBe(t('search.refused_pattern', 'unclosed group'));
    });

    it('says the reason a request that failed gave', async () => {
        expect(await ran(() => Promise.reject(new Error('offline')))).toStrictEqual({
            error: 'offline',
            answer: null
        });
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- a reason that is no Error
        expect(await ran(() => Promise.reject('down'))).toStrictEqual({
            error: 'down',
            answer: null
        });
    });

    it.each([[() => Promise.resolve(new Response('<html>gateway</html>'))], [json(null, 200)]])(
        'says the unreadable sentence for a successful body that is null or not JSON',
        async (response) => {
            expect(await ran(response)).toStrictEqual({ error: unreadable(200), answer: null });
        }
    );

    it('says the refusal sentence for a refused body that is not JSON', async () => {
        const held = await ran(() =>
            Promise.resolve(new Response('<html>gateway</html>', { status: 502 }))
        );
        expect(held).toStrictEqual({ error: refused(502), answer: null });
    });
});

describe('the folder a tab is scoped to', () => {
    it('reads a state held without under as the whole root', () => {
        expect(parseSearchState({ q: 'x', root: 'hub' }, 500).under).toBe('');
        expect(parseSearchState({ q: 'x', root: 'hub', under: 7 }, 500).under).toBe('');
        expect(parseSearchState({ q: 'x', root: 'hub', under: 'src/lib' }, 500).under).toBe(
            'src/lib'
        );
    });

    it('carries under into the query and the request', async () => {
        const held = stub(ANSWER);
        client.search.setSearchState('one', { q: 'needle', root: 'hub', under: 'src/lib' });
        expect(queryOf(client.search.searchState('one')).under).toBe('src/lib');
        await client.search.runSearch('one', ['hub']);
        expect(held.calls[0].url).toBe(
            '/api/search?root=hub&q=needle&word=0&case=0&regex=0&max=500&under=src%2Flib'
        );
    });

    it('clears under when a root is chosen, and keeps it when the change names under too', () => {
        client.search.setSearchState('one', { root: 'hub', under: 'a' });
        expect(client.search.searchState('one').under).toBe('a');
        client.search.setSearchState('one', { root: 'engine' });
        expect(client.search.searchState('one').under).toBe('');
        client.search.setSearchState('one', { root: 'hub', under: 'b' });
        expect(client.search.searchState('one').under).toBe('b');
        client.search.setSearchState('one', { q: 'x' });
        expect(client.search.searchState('one').under).toBe('b');
    });

    it('says a refused folder as a sentence of the search words, not as the key', async () => {
        const held = stub({ error: 'outside' }, false);
        client.search.setSearchState('one', { q: 'needle', root: 'all', under: 'src' });
        await client.search.runSearch('one', ['hub']);
        expect(held.calls).toHaveLength(0);
        const error = client.search.searchState('one').error;
        expect(error).not.toBe('');
        expect(error).not.toBe('outside');
    });

    it('says a folder the server found missing as the search words, and any other refusal text as the refusal sentence', async () => {
        stub({ error: 'missing' }, false);
        client.search.setSearchState('one', { q: 'needle', root: 'hub', under: 'gone' });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe(t('search.refused_missing'));
        stub({ error: 'the write token is missing or stale' }, false);
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe(t('ui.answer_refused', 400));
    });
});
