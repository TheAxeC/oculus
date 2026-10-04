// Layer 2, client-state tests. The rules over one Terminal tab's own layout state
// (state/sessions/terminal/terminal-tabs.ts): a saved state read into the tab's shape, the
// terminals it owns, the tab owning a terminal, a terminal added, removed or reordered, the split,
// New, a start from the composer and the Terminal tab of a page a terminal no tab owns is taken
// into. Every rule is pure, so each case hands it a state and reads the state it gives back.
//
// What this does NOT cover: the store that applies these rules to the layout, which is
// tests/state/client/terminal/terminal-tabs.test.ts, and the view that draws a tab, which is
// tests/views/sessions/terminal.test.ts.

import { describe, expect, it } from 'vitest';
import {
    composingIn,
    emptyTab,
    ownerOf,
    pageTarget,
    readTab,
    reordered,
    showingOne,
    showingRow,
    splitDrawn,
    splitRight,
    tabTerminals,
    withStarted,
    withTerminal,
    withoutTerminal,
    type TerminalTabState
} from '../../../../src/lib/state/sessions/terminal/terminal-tabs.ts';

const A = 'a1b2c3-shell';
const B = 'b2b2b2-shell';
const C = 'c3c3c3-claude';
const D = 'd4d4d4-codex';
const F = 'f6f6f6-shell';

/** A tab owning these terminals, showing the first, with nothing else set. */
function owning(terminals: string[], over: Partial<TerminalTabState> = {}): TerminalTabState {
    const shown = over.shown === undefined ? (terminals[0] ?? null) : over.shown;
    const row = over.row ?? (shown === null ? [] : [shown]);
    return {
        ...emptyTab('tab'),
        terminals,
        row,
        shares: row.map(() => 1 / row.length),
        shown,
        composing: false,
        ...over
    };
}

describe('a saved state read into the tab', () => {
    it('reads an old pinned tab as that one terminal shown, not composing', () => {
        const tab = readTab({ session: A, label: 'zsh' });
        expect(tab.terminals).toEqual([A]);
        expect(tab.shown).toBe(A);
        expect(tab.row).toEqual([A]);
        expect(tab.composing).toBe(false);
        expect(tab.label).toBe('zsh');
    });

    it('reads an old fresh or following tab as a tab with no terminal, composing', () => {
        for (const old of [{}, { id: 'x', follow: true }, { id: 'x' }, undefined]) {
            const tab = readTab(old);
            expect(tab.terminals).toEqual([]);
            expect(tab.shown).toBe(null);
            expect(tab.composing).toBe(true);
        }
        // the identity a fresh tab carried is kept, so the layout still tells it from another tab,
        // and a state that carried none is given one of its own
        expect(readTab({ id: 'x', follow: true }).id).toBe('x');
        expect(readTab({ session: A }).id).not.toBe('');
        expect(readTab({}).id).not.toBe(readTab({}).id);
    });

    it('reads a shown or beside id the tab does not own as none', () => {
        const tab = readTab({ terminals: [A, B], shown: C, beside: C });
        expect(tab.shown).toBe(A);
        expect(tab.row).toEqual([A]);
        expect(readTab({ terminals: [A, B], shown: A, beside: A }).row).toEqual([A]);
    });

    it('reads a tab that owns nothing as composing, whatever it says', () => {
        expect(readTab({ terminals: [], composing: false }).composing).toBe(true);
    });

    it('names the terminals a tab owns, from any saved shape', () => {
        expect(tabTerminals({ session: A })).toEqual([A]);
        expect(tabTerminals({ terminals: [A, B] })).toEqual([A, B]);
        expect(tabTerminals({})).toEqual([]);
        expect(tabTerminals({ session: 'fix-one' })).toEqual([]);
    });
});

describe('the tab owning a terminal', () => {
    const tabs = [
        { id: 'T1', state: { terminals: [A, B] } },
        { id: 'T2', state: { terminals: [C] } }
    ];

    it('is the tab whose terminals hold it, and none for a terminal no tab owns', () => {
        expect(ownerOf(tabs, C)?.id).toBe('T2');
        expect(ownerOf(tabs, A)?.id).toBe('T1');
        expect(ownerOf(tabs, D)).toBe(null);
        expect(ownerOf([], A)).toBe(null);
    });
});

describe('a terminal leaving a tab', () => {
    it('moves the shown one to the next row, else the previous', () => {
        expect(withoutTerminal(owning([A, B, C], { shown: B }), B)).toMatchObject({
            terminals: [A, C],
            shown: C
        });
        expect(withoutTerminal(owning([A, B, C], { shown: C }), C)).toMatchObject({
            terminals: [A, B],
            shown: B
        });
    });

    it('leaves the other half of a split alone', () => {
        const split = owning([A, B], { shown: A, row: [A, B] });
        expect(withoutTerminal(split, A)).toMatchObject({ terminals: [B], shown: B, row: [B] });
        expect(withoutTerminal(split, B)).toMatchObject({ terminals: [A], shown: A, row: [A] });
    });

    it('keeps the shown one when another row leaves, and changes nothing for one it does not own', () => {
        expect(withoutTerminal(owning([A, B, C], { shown: A }), C)).toMatchObject({
            terminals: [A, B],
            shown: A
        });
        const tab = owning([A]);
        expect(withoutTerminal(tab, D)).toEqual(tab);
    });

    it('leaves a tab that owned one terminal owning none, composing', () => {
        expect(withoutTerminal(owning([A]), A)).toMatchObject({
            terminals: [],
            shown: null,
            composing: true
        });
    });
});

describe('a terminal joining a tab', () => {
    it('joins at the index and is shown alone', () => {
        const split = owning([A, B], { shown: A, row: [A, B] });
        expect(withTerminal(split, C, 1)).toMatchObject({
            terminals: [A, C, B],
            shown: C,
            row: [C],
            composing: false
        });
    });

    it('joins last at an index past the end, and first at a negative one', () => {
        expect(withTerminal(owning([A]), C, 9).terminals).toEqual([A, C]);
        expect(withTerminal(owning([A]), C, -1).terminals).toEqual([C, A]);
    });

    it('is moved rather than repeated when the tab already owns it', () => {
        expect(withTerminal(owning([A, B, C]), A, 3).terminals).toEqual([B, C, A]);
    });

    it('is refused when it is not a terminal id', () => {
        const tab = owning([A]);
        expect(withTerminal(tab, 'nope', 0)).toEqual(tab);
        expect(withTerminal(tab, '', 0)).toEqual(tab);
    });

    it('takes the order the reader dragged, owned ids only', () => {
        expect(reordered(owning([A, B, C]), [C, A, B]).terminals).toEqual([C, A, B]);
        // an id the tab does not own is passed over, and one the order forgets keeps its place last
        expect(reordered(owning([A, B, C]), [D, B, A]).terminals).toEqual([B, A, C]);
    });
});

describe('a split and a single row', () => {
    it('splits with the new terminal right of the row and the composer gone, and shows one alone', () => {
        const tab = owning([A, B], { composing: true });
        const split = splitRight(tab, A, B);
        expect(split).toMatchObject({ shown: A, row: [A, B], composing: false });
        expect(showingOne(split, B)).toMatchObject({ shown: B, row: [B], composing: false });
        // a split of the row's own terminal, or of one the tab does not own, splits nothing
        expect(splitRight(owning([A, B]), A, A).row).toEqual([A]);
        expect(splitRight(owning([A, B]), D, A).row).toEqual([A]);
    });

    it('keeps the row for a press on any terminal of it, and shows one outside it alone', () => {
        const split = owning([A, B, C], { shown: A, row: [A, B] });
        expect(showingRow(split, A)).toEqual(split);
        expect(showingRow(split, B)).toMatchObject({ shown: B, row: [A, B] });
        expect(showingRow(split, C)).toMatchObject({ shown: C, row: [C], composing: false });
    });

    it('is drawn while the row holds more than one or the composer shows beside the shown one', () => {
        expect(splitDrawn(owning([A, B], { row: [A, B] }))).toBe(true);
        expect(splitDrawn(owning([A, B], { composing: true }))).toBe(true);
        expect(splitDrawn(owning([A, B]))).toBe(false);
        expect(splitDrawn(composingIn(owning([A])))).toBe(false);
    });
});

describe('New and Split in a tab, and what the composer starts', () => {
    it('New in a tab owning one terminal shows the composer; what it starts is shown after it', () => {
        const composing = composingIn(owning([A]));
        expect(composing.composing).toBe(true);
        expect(splitDrawn(composing)).toBe(false);
        expect(withStarted(composing, F, 'Claude')).toMatchObject({
            terminals: [A, F],
            shown: F,
            row: [F],
            composing: false,
            label: 'Claude'
        });
    });

    it('New in a split tab puts the composer right of the row, and what it starts joins the row', () => {
        const split = owning([A, B], { shown: A, row: [A, B] });
        const composing = composingIn(split);
        expect(composing).toMatchObject({ shown: A, row: [A, B], composing: true });
        expect(withStarted(composing, F, 'zsh')).toMatchObject({
            terminals: [A, B, F],
            shown: A,
            row: [A, B, F],
            composing: false
        });
    });

    it('a start in a tab that owned nothing is its one terminal', () => {
        expect(withStarted(emptyTab('fresh'), F, 'Codex')).toMatchObject({
            id: 'fresh',
            terminals: [F],
            shown: F,
            composing: false
        });
    });
});

describe('the Terminal tab of a page for a terminal no tab owns', () => {
    const tabs = [
        { id: 'files', view: 'files' },
        { id: 'first', view: 'terminal' },
        { id: 'second', view: 'terminal' }
    ];

    it("is the active tab of the page's focused pane when it is a Terminal tab", () => {
        expect(pageTarget(tabs, 'second')).toBe('second');
    });

    it('else the first Terminal tab of the page in tab order, else none', () => {
        expect(pageTarget(tabs, 'files')).toBe('first');
        expect(pageTarget(tabs, null)).toBe('first');
        expect(pageTarget([{ id: 'files', view: 'files' }], 'files')).toBe(null);
    });
});

describe('a saved state of the wrong shape read into a tab', () => {
    const FORM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

    /** The tab with a fresh identity written `fresh`, so the rest of it is compared whole. */
    function read(state: unknown): TerminalTabState {
        const tab = readTab(state);
        return { ...tab, id: FORM.test(tab.id) ? 'fresh' : tab.id };
    }

    /** A tab that owns nothing and composes, the answer to a state that names no terminal. */
    const none = (id: string, label = ''): TerminalTabState => ({
        id,
        terminals: [],
        row: [],
        shares: [],
        shown: null,
        composing: true,
        label
    });

    /** A tab of A and B in a row with these shares, the first shown. */
    const pair = (shares: number[], over: Partial<TerminalTabState> = {}): TerminalTabState => ({
        id: 'q',
        terminals: [A, B],
        row: [A, B],
        shares,
        shown: A,
        composing: false,
        label: '',
        ...over
    });

    /** A tab of A and B saved in the older two-terminal shape, with this `share`. */
    const beside = (share: unknown) => ({ id: 'q', terminals: [A, B], shown: A, beside: B, share });

    /** A saved tab of A and B with a row and these shares. */
    const withShares = (shares: unknown) => ({ id: 'q', terminals: [A, B], row: [A, B], shares });

    it.each([
        [
            'an id that is a number, a label that is null, terminals that are a string',
            { id: 3, label: null, terminals: 'x' },
            none('fresh')
        ],
        ['a row and shares without terminals', { row: [1], shares: ['a', 0.5] }, none('fresh')],
        ['a share without terminals', { share: 2 }, none('fresh')],
        ['a list', [], none('fresh')],
        ['null', null, none('fresh')],
        ['a string', 'x', none('fresh')],
        ['an id that is empty', { id: '' }, none('fresh')],
        ['a label that is a number', { id: 'q', label: 3 }, none('q')],
        [
            'a session that is a number beside a label',
            { id: 'q', session: 3, label: 'l' },
            none('q', 'l')
        ],
        ['a session that is no terminal id', { id: 'q', session: 'nope' }, none('q')],
        [
            'an own __proto__ key holding a state',
            JSON.parse('{"__proto__":{"id":"p","terminals":["a1b2c3-shell"]},"label":"l"}'),
            none('fresh', 'l')
        ],
        [
            'terminals that are null beside a session',
            { id: 'q', terminals: null, session: A },
            { ...pair([1]), terminals: [A], row: [A] }
        ]
    ])('reads %s as a tab that owns what it names', (_name, state, expected) => {
        expect(read(state)).toStrictEqual(expected);
    });

    it.each([
        ['a share that is a string', withShares(['a', 0.5]), pair([0.5, 0.5])],
        ['a share that is infinite', withShares([1, Infinity]), pair([0.5, 0.5])],
        ['a share that is NaN', withShares([Number.NaN, 1]), pair([0.5, 0.5])],
        ['shares that are a map', withShares({}), pair([0.5, 0.5])],
        ['more shares than terminals', withShares([1, 2, 3]), pair([1 / 3, 2 / 3])],
        [
            'shares scaled to sum to 1',
            { ...withShares([1, 3]), shown: B },
            pair([0.25, 0.75], { shown: B })
        ],
        [
            'a row that is a string',
            { id: 'q', terminals: [A, B], row: 'x', shown: A },
            pair([1], { row: [A] })
        ],
        ['a share of 0.3', beside(0.3), pair([0.3, 0.7])],
        ['a share of 0.1', beside(0.1), pair([0.1, 0.9])],
        ['a share of 0.9', beside(0.9), pair([0.9, 0.09999999999999998])],
        ['a share of 0.95', beside(0.95), pair([0.5, 0.5])],
        ['a share that is NaN beside a second terminal', beside(Number.NaN), pair([0.5, 0.5])],
        ['a share that is infinite beside a second terminal', beside(Infinity), pair([0.5, 0.5])],
        ['a share that is a string beside a second terminal', beside('0.3'), pair([0.5, 0.5])],
        [
            'a second terminal the tab does not own',
            { id: 'q', terminals: [A], shown: A, beside: B, share: 0.3 },
            pair([1], { terminals: [A], row: [A] })
        ],
        [
            'a composing flag that is a string',
            { id: 'q', terminals: [A], shown: A, composing: 'yes' },
            pair([1], { terminals: [A], row: [A] })
        ],
        [
            'a shown terminal that is a number',
            { id: 'q', terminals: [A], shown: 3 },
            pair([1], { terminals: [A], row: [A] })
        ],
        [
            'terminals that are a number, null, a word and a repeat',
            { id: 'q', terminals: [A, 3, null, 'x', B, A] },
            pair([1], { row: [A] })
        ]
    ])('reads %s as the row it makes', (_name, state, expected) => {
        expect(read(state)).toStrictEqual(expected);
    });

    it('reads a tab that composes with no terminal shown as a tab with an empty row', () => {
        const state = { id: 'q', terminals: [A], shown: null, composing: true };
        expect(read(state)).toStrictEqual({
            ...pair([], { terminals: [A], row: [] }),
            shown: null,
            composing: true
        });
    });
});
