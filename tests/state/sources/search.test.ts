// What one Search tab holds: the query and the toggles it was given, the last answer, and the
// refusals it says without sending anything.
//
// The endpoint is stubbed with a fetch of the case's own, so nothing starts a process and nothing
// reaches the network; what the request carried is read off that stub.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_ROOTS } from '../../../src/lib/data/helpers/search.ts';
import {
    answerOf,
    emptySearchState,
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
import { setCatalog, setGlyphs, t } from '../../../src/lib/state/shared/words/text.ts';
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
            under: '',
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
            'under',
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

/** An answer with `over` laid on the fields an empty answer holds. */
function answerWith(over: Record<string, unknown>): Record<string, unknown> {
    return { files: [], total: 0, truncated: false, ms: 0, failed: [], ...over };
}

const FILE_AT = { root: 'r', path: 'p' };

/** A file of the hub's answer holding `hits` under a root and a path. */
function fileOf(hits: unknown): unknown {
    return { ...FILE_AT, hits };
}

describe('an answer read from stored or fetched data', () => {
    it.each([
        ['a hit whose line is text', [{ line: '3', text: 'x' }], []],
        ['a hit whose text is a number', [{ line: 3, text: 7 }], []],
        ['an item that is not a map', [null, [], 'x', 3], []],
        [
            'a hit holding text and a line only',
            [{ line: 3, text: 'x' }],
            [{ line: 3, column: 1, length: 0, text: 'x' }]
        ],
        [
            'a hit whose column and length are text',
            [{ line: 3, text: 'x', column: '2', length: '4' }],
            [{ line: 3, column: 1, length: 0, text: 'x' }]
        ],
        [
            'a hit whose numbers are not finite',
            [{ line: NaN, text: 'x', column: Infinity, length: -1 }],
            [{ line: NaN, column: Infinity, length: -1, text: 'x' }]
        ],
        [
            'a hit with an empty text and an extra key',
            [{ line: 1, text: '', extra: true, column: 4, length: 2 }],
            [{ line: 1, column: 4, length: 2, text: '' }]
        ]
    ])('keeps of %s what it can read', (_label, hits, expected) => {
        const held = answerOf({ files: [fileOf(hits)] });
        expect(held).toStrictEqual(
            answerWith({ files: [fileOf(expected)], total: expected.length })
        );
    });

    it.each([
        ['hits that are a map', {}],
        ['hits that are text', 'x'],
        ['hits that are null', null],
        ['no hits at all', undefined]
    ])('gives a file with %s no hits', (_label, hits) => {
        const held = answerOf({ files: [{ ...FILE_AT, hits }] });
        expect(held).toStrictEqual(answerWith({ files: [fileOf([])] }));
    });

    it.each([
        ['without a path', { root: 'r', hits: [] }],
        ['without a root', { path: 'p', hits: [] }],
        ['whose root is a number', { root: 3, path: 'p', hits: [] }],
        ['that is a list', []],
        ['that is text', 'x'],
        ['that is null', null]
    ])('leaves out a file %s', (_label, file) => {
        expect(answerOf({ files: [file, fileOf([])] })).toStrictEqual(
            answerWith({ files: [fileOf([])] })
        );
    });

    it('keeps a file whose root and path are empty', () => {
        const held = answerOf({ files: [{ root: '', path: '', hits: [] }] });
        expect(held?.files).toStrictEqual([{ root: '', path: '', hits: [] }]);
    });

    it.each([
        ['a reason that is a number', [{ root: 'hub', reason: 3 }], [{ root: 'hub', reason: '' }]],
        ['no reason', [{ root: 'hub' }], [{ root: 'hub', reason: '' }]],
        ['a root that is a number', [{ root: 3, reason: 'r' }], []],
        ['items that are not maps', [null, [], 'x', 7], []]
    ])('reads a failure with %s', (_label, failed, expected) => {
        expect(answerOf({ files: [], failed })).toStrictEqual(answerWith({ failed: expected }));
    });

    it.each([[{}], ['x'], [null], [[]]])('reads failed roots that are %j as none', (failed) => {
        expect(answerOf({ files: [], failed })).toStrictEqual(answerWith({}));
    });

    it.each([[{}], ['x'], [null], [7], [undefined]])(
        'refuses an answer whose files are %j',
        (files) => {
            expect(answerOf({ files })).toBeNull();
        }
    );

    it.each([[null], [[]], ['x'], [5], [undefined], [true]])('refuses %j as an answer', (value) => {
        expect(answerOf(value)).toBeNull();
    });

    it.each([
        ['text', { total: '9' }, { total: 1 }],
        ['NaN', { total: NaN }, { total: NaN }],
        ['infinite', { total: Infinity }, { total: Infinity }],
        ['negative', { total: -1 }, { total: -1 }],
        ['more than the hits', { total: 5 }, { total: 5 }],
        ['a milliseconds text', { ms: '5' }, { total: 1 }],
        ['a milliseconds NaN', { ms: NaN }, { total: 1, ms: NaN }],
        ['a milliseconds infinity', { ms: Infinity }, { total: 1, ms: Infinity }],
        ['truncated as text', { truncated: 'true' }, { total: 1 }],
        ['truncated as one', { truncated: 1 }, { total: 1 }],
        ['truncated', { truncated: true }, { total: 1, truncated: true }]
    ])('reads a count that is %s', (_label, over, expected) => {
        const file = fileOf([{ line: 1, text: 'x' }]);
        const hit = { line: 1, column: 1, length: 0, text: 'x' };
        expect(answerOf({ files: [file], ...over })).toStrictEqual(
            answerWith({ files: [fileOf([hit])], ...expected })
        );
    });

    it('reads fields off the answer and not off an own __proto__ key of it', () => {
        const parsed = JSON.parse(
            '{"files":[{"root":"r","path":"p","hits":[{"line":1,"text":"x","__proto__":{"column":9}}]}],' +
                '"__proto__":{"total":9}}'
        ) as unknown;
        const held = answerOf(parsed);
        expect(held?.total).toBe(1);
        expect(held?.files[0].hits[0].column).toBe(1);
    });

    it('answers its fields in one order, and no field it was not asked for', () => {
        const held = answerOf({
            files: [{ ...FILE_AT, extra: 1, hits: [{ text: 'x', length: 1, line: 1, column: 1 }] }],
            failed: [{ reason: 'r', root: 'hub', extra: 1 }],
            extra: 1
        });
        expect(Object.keys(held ?? {})).toEqual(['files', 'total', 'truncated', 'ms', 'failed']);
        expect(Object.keys(held?.files[0] ?? {})).toEqual(['root', 'path', 'hits']);
        expect(Object.keys(held?.files[0].hits[0] ?? {})).toEqual([
            'line',
            'column',
            'length',
            'text'
        ]);
        expect(Object.keys(held?.failed[0] ?? {})).toEqual(['root', 'reason']);
    });
});

describe('a saved tab read back', () => {
    const empty = emptySearchState(500);

    it.each([[undefined], [null], [[]], ['x'], [5], [true]])(
        'opens on the empty state for %j',
        (saved) => {
            expect(parseSearchState(saved, 500)).toStrictEqual(empty);
        }
    );

    it.each([
        ['a root that is absent', {}, ALL_ROOTS],
        ['a root that is null', { root: null }, ''],
        ['a root that is a number', { root: 3 }, ''],
        ['a root that is empty', { root: '' }, ''],
        ['a root that is named', { root: 'hub' }, 'hub']
    ])('reads %s', (_label, saved, root) => {
        expect(parseSearchState(saved, 500)).toStrictEqual({ ...empty, root });
    });

    it('reads a field of the wrong type as its default', () => {
        const saved = {
            q: 3,
            word: 'true',
            case: 1,
            regex: null,
            error: 3,
            answer: { files: 'x' }
        };
        expect(parseSearchState(saved, 500)).toStrictEqual(empty);
    });

    it.each([
        ['text', '9', 500],
        ['NaN', NaN, 500],
        ['infinite', Infinity, 500],
        ['zero', 0, 500],
        ['negative', -1, 500],
        ['fractional', 7.9, 7],
        ['above the cap', 1e9, 500],
        ['within the cap', 100, 100]
    ])('reads a max that is %s', (_label, max, expected) => {
        expect(parseSearchState({ max }, 500).max).toBe(expected);
    });

    it('answers its fields in one order, and no field it was not asked for', () => {
        const held = parseSearchState({ q: 'a', zzz: 1, error: 'e' }, 500);
        expect(Object.keys(held)).toEqual([
            'q',
            'root',
            'word',
            'case',
            'regex',
            'max',
            'under',
            'answer',
            'error'
        ]);
        expect(held).toMatchObject({ q: 'a', error: 'e' });
    });

    it('reads a field off the saved map and not off an own __proto__ key of it', () => {
        expect(parseSearchState(JSON.parse('{"__proto__":{"q":"p"},"q":"s"}'), 500).q).toBe('s');
        expect(parseSearchState(JSON.parse('{"__proto__":{"q":"p"}}'), 500).q).toBe('');
    });
});

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
        [{ error: 'bad' }, 'bad'],
        [{ error: '' }, ''],
        [{ error: 3 }, 'HTTP 400'],
        [{ error: null }, 'HTTP 400'],
        [{}, 'HTTP 400'],
        [[], 'HTTP 400'],
        [null, 'HTTP 400'],
        ['x', 'HTTP 400'],
        [7, 'HTTP 400']
    ])('says what a refused body %j said', async (body, error) => {
        expect(await ran(json(body, 400))).toStrictEqual({ error, answer: null });
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
        'says the status of a successful body that is null or not JSON',
        async (response) => {
            expect(await ran(response)).toStrictEqual({ error: 'HTTP 200', answer: null });
        }
    );

    it('says the status of a refused body that is not JSON', async () => {
        const held = await ran(() =>
            Promise.resolve(new Response('<html>gateway</html>', { status: 502 }))
        );
        expect(held).toStrictEqual({ error: 'HTTP 502', answer: null });
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

    it('says a folder the server found missing as the search words, and any other refusal text as it came', async () => {
        stub({ error: 'the folder is not there', refused: 'missing' }, false);
        client.search.setSearchState('one', { q: 'needle', root: 'hub', under: 'gone' });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe(t('search.refused_missing'));
        stub({ error: 'the write token is missing or stale' }, false);
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe('the write token is missing or stale');
    });
});
