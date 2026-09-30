// Layer 4, state test. The rules over one Terminal tab's own layout state (state/sessions/terminal/
// terminal-tabs.ts): a saved state read into the tab's shape, the terminals it owns, the tab owning
// a terminal, a terminal added, removed or reordered, the split, New, a start from the composer and
// the Terminal tab of a page a terminal no tab owns is taken into. Every rule is pure, so each case
// hands it a state and reads the state it gives back.
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
    withLabel,
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
const G = 'a7a7a7-shell';

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
        for (const old of [{}, { id: 'x', follow: true }, { id: 'x' }, undefined, null, ['a']]) {
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

    it('drops an id that is not a terminal and keeps a repeated one once', () => {
        expect(readTab({ terminals: [A, 'nope', A] }).terminals).toEqual([A]);
        expect(readTab({ terminals: [A, 7, '', B] }).terminals).toEqual([A, B]);
    });

    it('reads a shown or beside id the tab does not own as none, and a share out of range as the default', () => {
        const tab = readTab({ terminals: [A, B], shown: C, beside: C, share: 7 });
        expect(tab.shown).toBe(A);
        expect(tab.row).toEqual([A]);
        expect(readTab({ terminals: [A, B], shown: A, beside: A }).row).toEqual([A]);
        expect(readTab({ terminals: [A, B], shown: A, beside: B, share: 7 }).shares).toEqual([
            0.5, 0.5
        ]);
        expect(readTab({ terminals: [A, B], shown: A, beside: B, share: 0.3 }).shares).toEqual([
            0.3, 0.7
        ]);
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

    it('Split on a row puts the new terminal right of it in the tab order too', () => {
        const started = splitRight(owning([A, B]), A, G);
        expect(started).toMatchObject({ terminals: [A, G, B], shown: A, row: [A, G] });
        expect(started.composing).toBe(false);
        // a press on a terminal outside the row then shows it alone
        expect(showingRow(started, B)).toMatchObject({ shown: B, row: [B] });
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

    it("keeps the shown terminal's name as the label", () => {
        expect(withLabel(owning([A]), 'vim').label).toBe('vim');
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
