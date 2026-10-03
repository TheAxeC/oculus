// Layer 3, primitive test. The arithmetic of a tab strip that wraps its tabs
// (ui/tabs/tab-strip.ts): when the strip wraps, what its scroll state says, the rows the measured
// tabs fall into, and where a drop lands on a strip of several rows. Plain numbers stand for the
// measured extents; the strip that measures them needs a DOM and is not run here.

import { describe, expect, it } from 'vitest';
import {
    afterDelete,
    stripWraps,
    tabRows,
    tabScrollState,
    wrappedInsertion,
    type TabBox,
    type TabRow
} from '../../../src/lib/ui/tabs/tab-strip.ts';

describe('wrapped tabs', () => {
    // Revert: wrap whatever show_tabs says.
    it('wrap only under show_tabs multiple', () => {
        expect(stripWraps(true, 'multiple')).toBe(true);
        expect(stripWraps(true, 'single')).toBe(false);
        expect(stripWraps(true, 'none')).toBe(false);
        expect(stripWraps(false, 'multiple')).toBe(false);
    });

    it('report no overflow and no scroll offset while the strip wraps', () => {
        expect(tabScrollState(900, 300, 120, 300, true)).toEqual({
            overflowing: false,
            atStart: true,
            atEnd: true
        });
        expect(tabScrollState(900, 300, 120, 300, false)).toMatchObject({
            overflowing: true,
            atStart: false
        });
    });
});

describe('the rows of a wrapped strip', () => {
    const box = (left: number, top: number): TabBox => ({
        left,
        right: left + 100,
        top,
        bottom: top + 35
    });

    it('group the measured tabs by the line they sit on', () => {
        const rows = tabRows([box(0, 0), box(100, 0), box(200, 0), box(0, 35), box(100, 35)]);
        expect(rows.map((row) => [row.first, row.mids.length])).toEqual([
            [0, 3],
            [3, 2]
        ]);
        expect(rows[1].mids).toEqual([50, 150]);
        expect(rows[1].top).toBe(35);
    });

    it('make one row of a strip that did not wrap', () => {
        expect(tabRows([box(0, 0), box(100, 0)])).toHaveLength(1);
        expect(tabRows([])).toEqual([]);
    });
});

describe('a drop on a wrapped strip', () => {
    const rows: TabRow[] = [
        { first: 0, top: 0, bottom: 35, mids: [50, 150, 250] },
        { first: 3, top: 35, bottom: 70, mids: [50, 150] }
    ];

    // Revert: use the x position alone, as insertionIndex does.
    it('lands by the row under the pointer as well as its x position', () => {
        expect(wrappedInsertion(rows, 120, 50)).toBe(4);
        expect(wrappedInsertion(rows, 10, 50)).toBe(3);
        expect(wrappedInsertion(rows, 300, 50)).toBe(5);
        expect(wrappedInsertion(rows, 120, 10)).toBe(1);
    });

    it('lands at the end of the first row above the strip and of the last row below it', () => {
        expect(wrappedInsertion(rows, 500, 10)).toBe(3);
        expect(wrappedInsertion(rows, 10, -20)).toBe(0);
        expect(wrappedInsertion(rows, 10, 400)).toBe(3);
    });
});

describe('Delete on a tab', () => {
    const tabs = [{ id: 'p', pinned: true }, { id: 'a' }, { id: 'b' }];

    // Revert: close the tab whatever pinned says.
    it('closes an unpinned tab', () => {
        expect(afterDelete(tabs, 'a')).toEqual({ kind: 'close' });
    });

    it('keeps a pinned tab open and activates the first unpinned tab', () => {
        expect(afterDelete(tabs, 'p')).toEqual({ kind: 'activate', id: 'a' });
    });

    it('does nothing for a pinned tab when the pane holds no unpinned tab', () => {
        expect(afterDelete([{ id: 'p', pinned: true }], 'p')).toEqual({ kind: 'none' });
    });
});
