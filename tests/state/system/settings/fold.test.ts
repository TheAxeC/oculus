// Layer 2, client state tests. Which parts of a Settings row are folded (state/system/config/view/
// fold.ts): a press under a query stands for that query and leaves the fold kept for an empty
// search, and a nested list's fold is kept by its path. Which entries a search draws of a row's
// draft (state/system/config/view/matches.ts): the entries a plain word is found in, 25 in all,
// each at its real place, and the `by` of a Move over an entry the filter hides.
//
// It does not cover the fold lines, the filtered list or the focus of an Add, which need a page and
// are seen at the look on landing.

import { describe, expect, it } from 'vitest';
import { applyEdit, type Draft } from '../../../../src/lib/state/system/config/editors/draft.ts';
import { textOf, type Card } from '../../../../src/lib/state/system/config/editors/fields.ts';
import { withSettingsQuery } from '../../../../src/lib/state/system/config/typed.ts';
import {
    isFolded,
    keptOpen,
    withFold,
    type FoldPart
} from '../../../../src/lib/state/system/config/view/fold.ts';
import {
    moveBy,
    searchDrawn,
    type Entry
} from '../../../../src/lib/state/system/config/view/matches.ts';

const ROW = 'catalogs/latex.yml:latex_editing';
const LIST: FoldPart = [{ index: 0, field: 'at' }];

/** A tab's state after a press that folds or unfolds a part. */
const press = (state: unknown, part: FoldPart, folded: boolean) =>
    withFold(state, ROW, part, folded);

/** The state of a press folding the entries under the query `alpha`. */
const pressed = () => press(withSettingsQuery({}, 'alpha'), 'entries', true);

/** The state of an edit of the row's entries under the query `alpha`. */
const editedUnderQuery = () => keptOpen(withSettingsQuery({}, 'alpha'), ROW);

/** One row of the fold table: the state and the part read, and the fold they give. */
type FoldRow = {
    title: string;
    state: unknown;
    part: FoldPart;
    count: number;
    searched: boolean;
    folded: boolean;
    /** That the state holds no fold kept for an empty search. */
    noKeptFold?: boolean;
};

describe('folds a part of a Settings row', () => {
    const rows: FoldRow[] = [
        {
            title: 'a part the query is found in, no press under it: unfolded',
            state: withSettingsQuery({}, 'alpha'),
            part: 'entries',
            count: 9,
            searched: true,
            folded: false
        },
        {
            title: 'a press that folds it, same query: folded',
            state: pressed(),
            part: 'entries',
            count: 9,
            searched: true,
            folded: true
        },
        {
            title: 'that press, query changed: unfolded',
            state: withSettingsQuery(pressed(), 'beta'),
            part: 'entries',
            count: 9,
            searched: true,
            folded: false
        },
        {
            title: 'that press, query A, then B, then A: unfolded',
            state: withSettingsQuery(withSettingsQuery(pressed(), 'beta'), 'alpha'),
            part: 'entries',
            count: 9,
            searched: true,
            folded: false
        },
        {
            title: 'that press, the same words in another case and spacing: folded',
            state: withSettingsQuery(pressed(), ' ALPHA '),
            part: 'entries',
            count: 9,
            searched: true,
            folded: true
        },
        {
            title: 'that press, query cleared: the fold kept for an empty search',
            state: withSettingsQuery(
                press(withSettingsQuery(press({}, 'entries', false), 'alpha'), 'entries', true),
                ''
            ),
            part: 'entries',
            count: 9,
            searched: false,
            folded: false
        },
        {
            title: 'a press under no query, then a search comes and goes: that fold',
            state: withSettingsQuery(withSettingsQuery(press({}, 'entries', true), 'alpha'), ''),
            part: 'entries',
            count: 1,
            searched: false,
            folded: true
        },
        {
            title: 'a part the query is not found in, held open: unfolded',
            state: withSettingsQuery(press({}, 'entries', false), 'alpha'),
            part: 'entries',
            count: 9,
            searched: false,
            folded: false
        },
        {
            title: 'a part the query is not found in, held folded: folded',
            state: withSettingsQuery(press({}, 'entries', true), 'alpha'),
            part: 'entries',
            count: 1,
            searched: false,
            folded: true
        },
        {
            title: 'a query of filters alone over a part with a held fold: the held fold',
            state: withSettingsQuery(press({}, 'entries', true), '@modified @id:latex'),
            part: 'entries',
            count: 1,
            searched: false,
            folded: true
        },
        {
            title: 'a nested list of 6 entries, no held fold: folded',
            state: {},
            part: LIST,
            count: 6,
            searched: false,
            folded: true
        },
        {
            title: 'a nested list of 5 entries, no held fold: open',
            state: {},
            part: LIST,
            count: 5,
            searched: false,
            folded: false
        },
        {
            title: "a press on a nested list against the row's entries",
            state: press({}, LIST, true),
            part: 'entries',
            count: 1,
            searched: false,
            folded: false
        },
        {
            title: "a press on a nested list against the row's Fields list",
            state: press({}, LIST, false),
            part: 'fields',
            count: 1,
            searched: false,
            folded: true
        },
        {
            title: "a press on the row's entries against a nested list",
            state: press({}, 'entries', true),
            part: LIST,
            count: 1,
            searched: false,
            folded: false
        },
        {
            title: "a press on the row's Fields list against a nested list",
            state: press({}, 'fields', false),
            part: LIST,
            count: 6,
            searched: false,
            folded: true
        },
        {
            title: 'a press on a nested list against a list of the same name in another entry',
            state: press({}, LIST, true),
            part: [{ index: 1, field: 'at' }],
            count: 1,
            searched: false,
            folded: false
        },
        {
            title: 'a list of 5 under a query, an Add to 6: unfolded, no kept fold written',
            state: editedUnderQuery(),
            part: 'entries',
            count: 6,
            searched: false,
            folded: false,
            noKeptFold: true
        },
        {
            title: 'that open press, query cleared: the part as its count says',
            state: withSettingsQuery(editedUnderQuery(), ''),
            part: 'entries',
            count: 6,
            searched: false,
            folded: true,
            noKeptFold: true
        },
        {
            title: 'that open press, query cleared, a kept fold held open: open',
            state: withSettingsQuery(
                keptOpen(withSettingsQuery(press({}, 'entries', false), 'alpha'), ROW),
                ''
            ),
            part: 'entries',
            count: 6,
            searched: false,
            folded: false
        },
        {
            title: 'an edit in a nested list under a query: that list unfolded',
            state: keptOpen(withSettingsQuery({}, 'alpha'), ROW, LIST),
            part: LIST,
            count: 6,
            searched: false,
            folded: false,
            noKeptFold: true
        },
        {
            title: 'an edit under a query over a press that folded the part: folded',
            state: keptOpen(pressed(), ROW),
            part: 'entries',
            count: 6,
            searched: false,
            folded: true,
            noKeptFold: true
        },
        {
            title: 'an edit under no query: the kept fold is written open',
            state: keptOpen({}, ROW),
            part: 'entries',
            count: 6,
            searched: false,
            folded: false
        }
    ];

    it.each(rows.map((row) => [row.title, row] as const))('%s', (_, row) => {
        const { state, part, count, searched, folded, noKeptFold = false } = row;
        expect(isFolded(state, ROW, part, count, searched)).toBe(folded);
        if (noKeptFold) expect(state).not.toHaveProperty('folds');
    });
});

/** A card of one text, as a list of items holds it. */
const item = (text: string): Card => ({ fields: { item: text }, kept: {}, order: [] });

/** A record holding a nested list of cards under `items`, its own text holding no query. */
const holder = (cards: Card[]): Card => ({
    fields: { items: cards },
    kept: {},
    order: ['items']
});

/** `count` entries that each hold `alpha`. */
const matching = (count: number): Card[] => places(count).map((at) => item(`alpha ${at}`));

/** A record holding two nested lists, `a` and `b`, its own text holding no query. */
const pair = (a: Card[], b: Card[]): Card => ({
    fields: { a, b },
    kept: {},
    order: ['a', 'b']
});

/** Texts of which each second one holds `alpha`. */
const every = (count: number): Card[] =>
    Array.from({ length: count }, (_, at) => item(at % 2 === 0 ? `alpha ${at}` : `other ${at}`));

/** The numbers from 0, `step` apart, `count` of them. */
const places = (count: number, step = 1): number[] =>
    Array.from({ length: count }, (_, at) => at * step);

/** One row of the picks table: the cards, the query, the entries edited and what is drawn. */
type PickRow = {
    title: string;
    cards: Card[];
    query: string;
    edited?: Entry[];
    lists: Record<string, number[]> | null;
    more?: number;
};

describe('picks the entries a search draws', () => {
    const kept: Card = { fields: { a: 'x' }, kept: { note: 'kept word' }, order: ['a', 'note'] };
    const rows: PickRow[] = [
        {
            title: 'a flat list: the matching entries, the first 25, and the count left over',
            cards: every(60),
            query: 'alpha',
            lists: { '': places(25, 2) },
            more: 5
        },
        {
            title: 'nested lists: 25 in all, each with its real path',
            cards: [
                holder(places(20).map((at) => item(`alpha ${at}`))),
                item('other'),
                holder(places(20).map((at) => item(`alpha ${at}`)))
            ],
            query: 'alpha',
            lists: { '': [0, 2], '0.items': places(20), '2.items': places(5) },
            more: 15
        },
        {
            title: "a query equal to `fields`: no match from a card's own keys",
            cards: [item('x')],
            query: 'fields',
            lists: null
        },
        {
            title: "a query equal to `kept`: no match from a card's own keys",
            cards: [item('x')],
            query: 'kept',
            lists: null
        },
        {
            title: "a query equal to `order`: no match from a card's own keys",
            cards: [item('x')],
            query: 'order',
            lists: null
        },
        {
            title: "a query equal to `item`: no match from the draft's name for an item",
            cards: [item('x')],
            query: 'item',
            lists: null
        },
        {
            title: 'a query equal to `kept`: a match from a kept value',
            cards: [item('x'), kept],
            query: 'kept',
            lists: { '': [1] },
            more: 0
        },
        {
            title: 'a map key of the file: a match',
            cards: [item('x'), kept],
            query: 'note',
            lists: { '': [1] },
            more: 0
        },
        {
            title: 'an unread text: a match',
            cards: [item('x'), { ...item('y'), unread: { path: 'alpha: [' } }],
            query: 'alpha',
            lists: { '': [1] },
            more: 0
        },
        {
            title: '`@8` over an entry holding `@8`: picked',
            cards: [item('x'), item('@8')],
            query: '@8',
            lists: { '': [1] },
            more: 0
        },
        {
            title: 'a query of the filter `@modified`: no filter',
            cards: every(4),
            query: '@modified',
            lists: null
        },
        {
            title: 'a query of the filter `@id:`: no filter',
            cards: every(4),
            query: '@id:alpha',
            lists: null
        },
        {
            title: 'two words, one found: picked',
            cards: every(2),
            query: 'zzz alpha',
            lists: { '': [0] },
            more: 0
        },
        {
            title: 'an edited entry the query is not found in: drawn, uncounted',
            cards: every(60),
            query: 'alpha',
            edited: [{ path: [], index: 59 }],
            lists: { '': [...places(25, 2), 59] },
            more: 5
        },
        {
            title: 'lists of 30 and 3, all matching: the second list filtered to no entry',
            cards: [pair(matching(30), matching(3))],
            query: 'alpha',
            lists: { '': [0], '0.a': places(25), '0.b': [] },
            more: 8
        },
        {
            title: 'a list whose matches stand past the cap only under it: filtered to no entry',
            cards: [pair(matching(25), [holder(matching(3))])],
            query: 'alpha',
            lists: { '': [0], '0.a': places(25), '0.b': [], '0.b/0.items': [] },
            more: 3
        },
        {
            title: 'an entry past the cap with an edited child: drawn, and not in the count',
            cards: [
                holder(matching(25)),
                { fields: { item: 'alpha', items: [item('x')] }, kept: {}, order: ['items'] }
            ],
            query: 'alpha',
            edited: [{ path: [{ index: 1, field: 'items' }], index: 0 }],
            lists: { '': [0, 1], '0.items': places(25), '1.items': [0] },
            more: 0
        },
        {
            title: 'one edited matching entry in lists of 25 and 9: the same picks as with none',
            cards: [pair(matching(25), matching(9))],
            query: 'alpha',
            edited: [{ path: [{ index: 0, field: 'a' }], index: 3 }],
            lists: { '': [0], '0.a': places(25), '0.b': [] },
            more: 9
        }
    ];

    it.each(rows.map((row) => [row.title, row] as const))('%s', (_, row) => {
        const drawn = searchDrawn(row.cards, row.query, row.edited);
        expect(drawn === null ? null : Object.fromEntries(drawn.lists)).toEqual(row.lists);
        expect(drawn?.more).toBe(row.more);
    });

    it.each([
        { title: 'Down', at: 0, step: 1, by: 2, order: 'x1 a2 a0 x3 a4' },
        { title: 'Up', at: 4, step: -1, by: -2, order: 'a0 x1 a4 a2 x3' }
    ] as const)(
        'a Move $title over a hidden neighbour lands past the next drawn entry',
        ({ at, step, by, order }) => {
            const cards = ['a0', 'x1', 'a2', 'x3', 'a4'].map(item);
            const drawn: Draft = { form: 'items', keyed: false, fields: ['item'], cards };
            expect(moveBy([0, 2, 4], at, step)).toBe(by);
            const moved = applyEdit(drawn, { do: 'move', index: at, by });
            expect(moved.cards.map((card) => textOf(card.fields.item)).join(' ')).toBe(order);
        }
    );

    it('a Move past the last drawn entry goes nowhere', () => {
        expect(moveBy([0, 2, 4], 4, 1)).toBe(0);
    });
});
