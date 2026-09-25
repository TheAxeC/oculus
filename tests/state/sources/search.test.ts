// What one Search tab holds: the query and the toggles it was given, the last answer, and the
// refusals it says without sending anything.
//
// The endpoint is stubbed with a fetch of the case's own, so nothing starts a process and nothing
// reaches the network; what the request carried is read off that stub.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_ROOTS } from '../../../src/lib/data/helpers/search.ts';
import {
    answerOf,
    firstLine,
    hitParts,
    parseSearchState,
    queryOf
} from '../../../src/lib/state/sources/search.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

let client: ClientState;

const ANSWER = {
    ok: true,
    files: [{ root: 'hub', path: 'a.ts', hits: [{ line: 3, column: 1, length: 2, text: 'ab' }] }],
    total: 1,
    truncated: false,
    ms: 5,
    failed: [{ root: 'engine', reason: 'rg: no such file' }]
};

beforeEach(() => {
    client = createClientState();
    client.ui.loadUi({ getItem: () => null, setItem: noop });
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: textCatalog(config), findings: [] }
    });
    client.writes.setToken('token-one');
});

afterEach(() => vi.unstubAllGlobals());

/** A fetch of this case's own, recording the address and the headers each request carried. */
function stub(body: unknown, ok = true): { calls: { url: string; token: string }[] } {
    const calls: { url: string; token: string }[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        calls.push({ url, token: headers['x-oculus-token'] ?? '' });
        return Promise.resolve({
            ok,
            status: ok ? 200 : 400,
            json: () => Promise.resolve(body)
        } as Response);
    });
    return { calls };
}

describe('what a tab holds', () => {
    it('opens on every root, no option, and the cap the configuration carries', () => {
        expect(client.search.searchState('one')).toEqual({
            q: '',
            root: ALL_ROOTS,
            word: false,
            case: false,
            regex: false,
            max: 500,
            answer: null,
            error: ''
        });
    });

    it('keeps the query, the toggles and the answer under the instance', async () => {
        const held = stub(ANSWER);
        client.search.setSearchState('one', { q: 'needle', root: 'hub', word: true });
        await client.search.runSearch('one', ['hub']);

        expect(held.calls[0].url).toBe(
            '/api/search?root=hub&q=needle&word=1&case=0&regex=0&max=500'
        );
        expect(held.calls[0].token).toBe('token-one');
        expect(client.search.searchState('one').answer).toEqual({
            files: ANSWER.files,
            total: 1,
            truncated: false,
            ms: 5,
            failed: [{ root: 'engine', reason: 'rg: no such file' }]
        });
        expect(client.ui.instanceState('one')).toMatchObject({ q: 'needle', word: true });
    });

    it('keeps two tabs apart', async () => {
        stub(ANSWER);
        client.search.setSearchState('one', { q: 'one' });
        client.search.setSearchState('two', { q: 'two' });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('two').answer).toBeNull();
        expect(client.search.searchState('two').q).toBe('two');
    });
});

describe('what it refuses without asking', () => {
    it('says a search needs a pattern and sends nothing', async () => {
        const held = stub(ANSWER);
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe('A search needs a pattern.');
        expect(held.calls).toEqual([]);
    });

    it('says a root it does not serve is not one, and sends nothing', async () => {
        const held = stub(ANSWER);
        client.search.setSearchState('one', { q: 'needle', root: 'elsewhere' });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe('That root is not one oculus serves.');
        expect(held.calls).toEqual([]);
    });

    it('carries the server refusal through to the tab', async () => {
        stub({ error: 'error: unclosed group' }, false);
        client.search.setSearchState('one', { q: 'fo(', regex: true });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe('error: unclosed group');
        expect(client.search.searchState('one').answer).toBeNull();
    });
});

describe('the pure readers', () => {
    it('reads a saved tab back and refuses what is not an answer', () => {
        expect(parseSearchState({ q: 5, root: 'hub', word: true }, 500).q).toBe('');
        expect(parseSearchState(null, 500).root).toBe(ALL_ROOTS);
        expect(answerOf({ files: 'many' })).toBeNull();
        expect(answerOf({ files: [{ root: 'hub', path: 'a', hits: [{ line: 1 }] }] })).toEqual({
            files: [{ root: 'hub', path: 'a', hits: [] }],
            total: 0,
            truncated: false,
            ms: 0,
            failed: []
        });
    });

    it('keeps a failed root it can read and drops one it cannot', () => {
        const held = answerOf({
            files: [],
            failed: [{ root: 'hub', reason: 'rg: no such file' }, { reason: 'nameless' }, 7]
        });
        expect(held?.failed).toEqual([{ root: 'hub', reason: 'rg: no such file' }]);
    });

    it('sends the query half of a tab and nothing else', () => {
        const state = parseSearchState({ q: 'x', answer: null, error: 'gone' }, 500);
        expect(Object.keys(queryOf(state)).sort()).toEqual([
            'case',
            'max',
            'q',
            'regex',
            'root',
            'word'
        ]);
    });

    it('cuts a line into three around the match, holding to the line it was given', () => {
        expect(hitParts({ line: 1, column: 5, length: 6, text: 'the needle here' })).toEqual({
            before: 'the ',
            match: 'needle',
            after: ' here'
        });
        expect(hitParts({ line: 1, column: 90, length: 6, text: 'short' })).toEqual({
            before: 'short',
            match: '',
            after: ''
        });
    });

    it('opens a file heading at its first hit, and at line one for a file with none', () => {
        expect(
            firstLine({
                root: 'hub',
                path: 'a',
                hits: [{ line: 9, column: 1, length: 1, text: 'a' }]
            })
        ).toBe(9);
        expect(firstLine({ root: 'hub', path: 'a', hits: [] })).toBe(1);
    });
});
