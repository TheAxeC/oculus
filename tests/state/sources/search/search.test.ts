// Layer 2, client-state tests. What one Search tab holds: the query and the toggles it was given,
// the last answer, and the refusals it says without sending anything.
//
// The endpoint is stubbed with a fetch of the case's own, so nothing starts a process and nothing
// reaches the network; what the request carried is read off that stub.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_ROOTS, emptyQuery } from '../../../../src/lib/data/helpers/search/query.ts';
import {
    answerOf,
    firstLine,
    hitParts,
    parseSearchState,
    queryOf,
    type SearchState
} from '../../../../src/lib/state/sources/search/search.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { type ClientState } from '../../../fixtures/client.ts';
import { ANSWER, searchClient, stub } from './search-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = searchClient();
});

afterEach(() => vi.unstubAllGlobals());

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
            error: '',
            ran: null,
            replacing: false,
            replace: '',
            preserve: false,
            queries: [],
            replaces: []
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
        expect(client.ui.instanceState('one')).toMatchObject({
            q: 'needle',
            word: true,
            queries: ['needle'],
            ran: { q: 'needle', word: true, case: false, regex: false, under: '' }
        });
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
        expect(client.search.searchState('one').error).toBe(t('search.refused_empty'));
        expect(held.calls).toEqual([]);
    });

    it('says a root it does not serve is not one, and sends nothing', async () => {
        const held = stub(ANSWER);
        client.search.setSearchState('one', { q: 'needle', root: 'elsewhere' });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe(t('search.refused_unknown_root'));
        expect(held.calls).toEqual([]);
    });

    it('carries the server refusal through to the tab', async () => {
        stub({ error: 'pattern', reason: 'unclosed group' }, false);
        client.search.setSearchState('one', { q: 'fo(', regex: true });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe(
            t('search.refused_pattern', 'unclosed group')
        );
        expect(client.search.searchState('one').answer).toBeNull();
    });

    it('runs the held query again once per call, whatever the last answer was', async () => {
        const held = stub({ error: 'pattern', reason: 'unclosed group' }, false);
        client.search.setSearchState('one', { q: 'fo(', regex: true });
        await client.search.runSearch('one', ['hub']);
        expect(client.search.searchState('one').error).toBe(
            t('search.refused_pattern', 'unclosed group')
        );
        await client.search.runSearch('one', ['hub']);
        expect(held.calls).toHaveLength(2);
        expect(held.calls[1].url).toBe(held.calls[0].url);
    });

    it('leaves a second press alone while a run is in flight', async () => {
        const held = stub(ANSWER);
        client.search.setSearchState('one', { q: 'needle' });
        const first = client.search.runSearch('one', ['hub']);
        const second = client.search.runSearch('one', ['hub']);
        await Promise.all([first, second]);
        expect(held.calls).toHaveLength(1);
    });
});

describe('the pure readers', () => {
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
        expect(hitParts({ line: 1, column: 5, length: 6, text: 'the needle here', at: 4 })).toEqual(
            {
                before: 'the ',
                match: 'needle',
                after: ' here'
            }
        );
        expect(hitParts({ line: 1, column: 90, length: 6, text: 'short', at: 89 })).toEqual({
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
                hits: [{ line: 9, column: 1, length: 1, text: 'a', at: 0 }]
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
        ['a hit whose line is text', [{ line: '3', text: 'x', at: 0 }], []],
        ['a hit whose text is a number', [{ line: 3, text: 7, at: 0 }], []],
        ['an item that is not a map', [null, [], 'x', 3], []],
        [
            'a hit holding text, a line and a place only',
            [{ line: 3, text: 'x', at: 2 }],
            [{ line: 3, column: 1, length: 0, text: 'x', at: 2 }]
        ],
        [
            'a hit whose column and length are text',
            [{ line: 3, text: 'x', at: 2, column: '2', length: '4' }],
            [{ line: 3, column: 1, length: 0, text: 'x', at: 2 }]
        ],
        [
            'a hit whose numbers are not finite',
            [{ line: NaN, text: 'x', at: 1, column: Infinity, length: -1 }],
            [{ line: NaN, column: Infinity, length: -1, text: 'x', at: 1 }]
        ],
        [
            'a hit with an empty text and an extra key',
            [{ line: 1, text: '', at: 3, extra: true, column: 4, length: 2 }],
            [{ line: 1, column: 4, length: 2, text: '', at: 3 }]
        ],
        [
            'a hit with groups, one of them a number (left out of the groups)',
            [{ line: 1, text: 'ab', at: 0, column: 1, length: 2, groups: { '0': 'ab', '1': 3 } }],
            [{ line: 1, column: 1, length: 2, text: 'ab', at: 0, groups: { '0': 'ab' } }]
        ],
        [
            'a hit with groups of text',
            [{ line: 1, text: 'ab', at: 0, column: 1, length: 2, groups: { '0': 'ab', n: 'b' } }],
            [{ line: 1, column: 1, length: 2, text: 'ab', at: 0, groups: { '0': 'ab', n: 'b' } }]
        ]
    ])('keeps of %s what it can read', (_label, hits, expected) => {
        const held = answerOf({ files: [fileOf(hits)] });
        expect(held).toStrictEqual(
            answerWith({ files: [fileOf(expected)], total: expected.length })
        );
    });

    it.each([
        ['text and a line only', [{ line: 3, column: 2, length: 1, text: 'x' }]],
        ['a place that is text', [{ line: 3, column: 2, length: 1, text: 'x', at: '0' }]],
        [
            'one hit without a place beside one with it',
            [
                { line: 3, column: 1, length: 1, text: 'x', at: 0 },
                { line: 4, column: 1, length: 1, text: 'x' }
            ]
        ]
    ])('reads an answer holding a hit of %s as no answer', (_label, hits) => {
        expect(answerOf({ files: [fileOf(hits)] })).toBeNull();
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
        ['no root', [{ reason: 'nameless' }], []],
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
        const file = fileOf([{ line: 1, text: 'x', at: 0 }]);
        const hit = { line: 1, column: 1, length: 0, text: 'x', at: 0 };
        expect(answerOf({ files: [file], ...over })).toStrictEqual(
            answerWith({ files: [fileOf([hit])], ...expected })
        );
    });

    it('reads fields off the answer and not off an own __proto__ key of it', () => {
        const parsed = JSON.parse(
            '{"files":[{"root":"r","path":"p","hits":[{"line":1,"text":"x","at":0,"__proto__":{"column":9}}]}],' +
                '"__proto__":{"total":9}}'
        ) as unknown;
        const held = answerOf(parsed);
        expect(held?.total).toBe(1);
        expect(held?.files[0].hits[0].column).toBe(1);
    });

    it('answers its fields in one order, and no field it was not asked for', () => {
        const held = answerOf({
            files: [
                {
                    ...FILE_AT,
                    extra: 1,
                    hits: [{ text: 'x', length: 1, line: 1, column: 1, at: 0 }]
                }
            ],
            failed: [{ reason: 'r', root: 'hub', extra: 1 }],
            extra: 1
        });
        expect(Object.keys(held ?? {})).toEqual(['files', 'total', 'truncated', 'ms', 'failed']);
        expect(Object.keys(held?.files[0] ?? {})).toEqual(['root', 'path', 'hits']);
        expect(Object.keys(held?.files[0].hits[0] ?? {})).toEqual([
            'line',
            'column',
            'length',
            'text',
            'at'
        ]);
        expect(Object.keys(held?.failed[0] ?? {})).toEqual(['root', 'reason']);
    });
});

describe('a saved tab read back', () => {
    const empty: SearchState = {
        ...emptyQuery(500),
        answer: null,
        error: '',
        ran: null,
        replacing: false,
        replace: '',
        preserve: false,
        queries: [],
        replaces: []
    };

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
            under: 7,
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
            'error',
            'ran',
            'replacing',
            'replace',
            'preserve',
            'queries',
            'replaces'
        ]);
        expect(held).toMatchObject({ q: 'a', error: 'e' });
    });

    it('reads a field off the saved map and not off an own __proto__ key of it', () => {
        expect(parseSearchState(JSON.parse('{"__proto__":{"q":"p"},"q":"s"}'), 500).q).toBe('s');
        expect(parseSearchState(JSON.parse('{"__proto__":{"q":"p"}}'), 500).q).toBe('');
    });
});
