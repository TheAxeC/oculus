// Layer 4, state test. The row of terminals a Terminal tab draws side by side (state/sessions/
// terminal/terminal-tabs.ts): an ordered list with a share each and no count, the widths those
// shares give in a pane of a given width with 80 pixels the least any terminal keeps, a Split
// putting the new terminal right of the one split, Unsplit taking one out, a terminal leaving the
// row, and every older saved shape read into it. Every rule is pure, so a case hands it a state and
// reads the state it gives back.
//
// What this does NOT cover: the sideways scroll of a row wider than the pane and the left grid
// staying mounted when a second joins, which are seen on screen; the store that starts the
// terminal a Split adds is tests/state/client/terminal/terminal-start.test.ts.

import { describe, expect, it } from 'vitest';
import {
    ROW_MIN,
    emptyTab,
    readTab,
    resizedShares,
    rowWidths,
    splitRight,
    tabFolder,
    unsplit,
    withoutTerminal,
    type TerminalTabState
} from '../../../../src/lib/state/sessions/terminal/terminal-tabs.ts';

const A = 'a1b2c3-shell';
const B = 'b2b2b2-shell';
const C = 'c3c3c3-claude';
const D = 'd4d4d4-codex';
const E = 'e5e5e5-shell';

/** A tab owning these terminals with the first shown alone. */
function alone(terminals: string[]): TerminalTabState {
    return readTab({ id: 'tab', terminals, shown: terminals[0] });
}

/** A row of four made the way three Splits make one: each Split on the terminal last added. */
function four(): TerminalTabState {
    let tab = alone([A]);
    tab = splitRight(tab, A, B);
    tab = splitRight(tab, B, C);
    return splitRight(tab, C, D);
}

const sum = (shares: number[]): number => shares.reduce((total, one) => total + one, 0);

describe('a row of any number', () => {
    // Revert: keep at most two terminals in a row in splitRight (drop the third and fourth).
    it('holds four terminals after three splits in a row, with shares summing to 1', () => {
        const tab = four();
        expect(tab.row).toEqual([A, B, C, D]);
        expect(tab.terminals).toEqual([A, B, C, D]);
        expect(tab.shares).toHaveLength(4);
        expect(sum(tab.shares)).toBeCloseTo(1, 10);
        for (const share of tab.shares) expect(share).toBeGreaterThan(0);
    });

    // Revert: answer a width under ROW_MIN in rowWidths for a row wider than the pane.
    it('answers four widths of at least 80 in a 300 pixel pane, a row wider than the pane', () => {
        const widths = rowWidths(four().shares, 300);
        expect(widths).toHaveLength(4);
        for (const width of widths) expect(width).toBeGreaterThanOrEqual(ROW_MIN);
        expect(ROW_MIN).toBe(80);
        expect(sum(widths)).toBeGreaterThan(300);
    });

    // Revert: scale the shares to the pane without lifting a narrow terminal to ROW_MIN.
    it('lifts a narrow share to 80 and takes the difference from the others, filling the pane', () => {
        const widths = rowWidths([0.05, 0.45, 0.5], 800);
        expect(widths[0]).toBe(80);
        expect(sum(widths)).toBeCloseTo(800, 6);
        expect(widths[1]).toBeLessThan(widths[2]);
        expect(rowWidths([0.5, 0.5], 800)).toEqual([400, 400]);
        expect(rowWidths([1], 500)).toEqual([500]);
    });

    // Revert: share the whole pane in rowWidths and leave the handles out of it.
    it('leaves the pixels of the handles between the terminals out of the widths', () => {
        for (let count = 1; count <= 5; count += 1) {
            const equal = Array.from({ length: count }, () => 1 / count);
            const widths = rowWidths(equal, 900, (count - 1) * 6);
            expect(sum(widths)).toBeCloseTo(900 - (count - 1) * 6, 6);
        }
        const moved = resizedShares([0.5, 0.5], 0, 100, 806, 6);
        expect(rowWidths(moved, 806, 6)).toEqual([500, 300]);
    });

    // Revert: let resizedShares move a boundary past the 80 pixels either side keeps.
    it('moves a boundary by a drag and stops where either side would go under 80 pixels', () => {
        const moved = resizedShares([0.5, 0.5], 0, 100, 800);
        expect(rowWidths(moved, 800)).toEqual([500, 300]);
        expect(sum(moved)).toBeCloseTo(1, 10);
        const stopped = resizedShares([0.5, 0.5], 0, 900, 800);
        expect(rowWidths(stopped, 800)).toEqual([720, 80]);
        expect(resizedShares([0.5, 0.5], 0, -900, 800)).toEqual(
            resizedShares([0.5, 0.5], 0, -320, 800)
        );
    });

    // Revert: move the shares of a row wider than the pane in resizedShares.
    it('leaves the shares alone while the row is wider than the pane', () => {
        const shares = four().shares;
        expect(resizedShares(shares, 1, 50, 300)).toEqual(shares);
    });

    // Revert: leave the split terminal out of the tab's own order in splitRight.
    it('puts the new terminal right of the one split, in the row and in the tab', () => {
        const tab = readTab({
            id: 'tab',
            terminals: [A, B, C],
            shown: A,
            row: [A, B],
            shares: [0.5, 0.5]
        });
        const split = splitRight(tab, A, E);
        expect(split.row).toEqual([A, E, B]);
        expect(split.terminals).toEqual([A, E, B, C]);
        expect(sum(split.shares)).toBeCloseTo(1, 10);
    });

    // Revert: keep the row as it was when the terminal split is not in it.
    it('starts a row of the terminal split and the new one when the split one is not in the row', () => {
        const tab = readTab({
            id: 'tab',
            terminals: [A, B, C],
            shown: A,
            row: [A, B],
            shares: [0.5, 0.5]
        });
        const split = splitRight(tab, C, E);
        expect(split.row).toEqual([C, E]);
        expect(split.shown).toBe(C);
        expect(split.terminals).toEqual([A, B, C, E]);
    });

    // Revert: leave the shares of the row as they were when a terminal leaves it (mendedShares).
    it('takes a terminal out of the row and keeps the others in order, shares summing to 1', () => {
        const after = unsplit(four(), B);
        expect(after.row).toEqual([A, C, D]);
        expect(after.terminals).toEqual([A, B, C, D]);
        expect(sum(after.shares)).toBeCloseTo(1, 10);
    });

    // Revert: let unsplit empty a row of one.
    it('does nothing for Unsplit on a row of one', () => {
        const tab = readTab({ id: 'tab', terminals: [A, B], row: [B], shown: B });
        expect(unsplit(tab, B)).toEqual(tab);
        expect(unsplit(tab, A)).toEqual(tab);
    });

    // Revert: leave the shares of the row as they were when a terminal leaves it (mendedShares).
    it('keeps the others in order and renormalises the shares when the middle of four leaves', () => {
        const after = withoutTerminal(four(), B);
        expect(after.row).toEqual([A, C, D]);
        expect(after.terminals).toEqual([A, C, D]);
        expect(after.shares).toHaveLength(3);
        expect(sum(after.shares)).toBeCloseTo(1, 10);
        expect(withoutTerminal(four(), D).row).toEqual([A, B, C]);
    });

    // Revert: pick the next shown terminal from the tab's order instead of the row's neighbour.
    it('shows a neighbour in the row when the shown terminal leaves it', () => {
        // The row is C, A, D while the tab's order is A, B, C, D, so the neighbour to the right and
        // the next terminal of the order differ.
        const tab = readTab({ id: 'tab', terminals: [A, B, C, D], row: [C, A, D], shown: A });
        const after = withoutTerminal(tab, A);
        expect(after.shown).toBe(D);
        expect(after.row).toEqual([C, D]);
    });
});

describe('a saved state read into the row', () => {
    // Revert: read `beside` and `share` as nothing in readTab.
    it('reads the old two-terminal shape as a row of both with the share and its rest', () => {
        const tab = readTab({ terminals: [A, B], shown: A, beside: B, share: 0.3 });
        expect(tab.row).toEqual([A, B]);
        expect(tab.shares[0]).toBeCloseTo(0.3, 10);
        expect(tab.shares[1]).toBeCloseTo(0.7, 10);
        expect(tab.shown).toBe(A);
    });

    // Revert: read an old tab with no beside as an empty row in readTab.
    it('reads an old tab with no second terminal as a row of one', () => {
        const tab = readTab({ terminals: [A], shown: A, beside: null });
        expect(tab.row).toEqual([A]);
        expect(tab.shares).toEqual([1]);
    });

    // Revert: keep a row entry the tab does not own, or a share list of another length, in readTab.
    it('drops a row entry the tab does not own and mends shares that do not fit the row', () => {
        const tab = readTab({ terminals: [A, B], shown: A, row: [A, C, B, A], shares: [1, 2] });
        expect(tab.row).toEqual([A, B]);
        expect(tab.shares).toHaveLength(2);
        expect(sum(tab.shares)).toBeCloseTo(1, 10);
        expect(
            readTab({ terminals: [A, B], shown: A, row: [A, B], shares: [0, -1] }).shares
        ).toEqual([0.5, 0.5]);
    });

    // Revert: give a tab showing the composer alone the first terminal as a row.
    it('holds an empty row while the composer shows alone', () => {
        const tab = emptyTab('x');
        expect(tab.row).toEqual([]);
        expect(tab.shares).toEqual([]);
        const owning = readTab({ id: 'x', terminals: [A, B], shown: null, composing: true });
        expect(owning.row).toEqual([]);
        expect(owning.shown).toBe(null);
    });
});

describe('the folder of a tab', () => {
    const cwds: Record<string, string> = { [A]: '/x', [B]: '/y' };
    const cwdOf = (id: string): string | null => cwds[id] ?? null;

    // Revert: read the first terminal's folder before the shown one's in tabFolder.
    it('is the shown terminal folder, else the first terminal folder, else none', () => {
        expect(tabFolder(readTab({ id: 't', terminals: [A, B], shown: B }), cwdOf)).toBe('/y');
        expect(tabFolder(readTab({ id: 't', terminals: [C, B], shown: C }), cwdOf)).toBe('/y');
        expect(tabFolder(readTab({ id: 't', terminals: [C], shown: C }), cwdOf)).toBe(null);
        expect(tabFolder(emptyTab('t'), cwdOf)).toBe(null);
    });
});
