// The window of a long explorer list, ui/tree/list/virtual.ts: which rows @tanstack/virtual-core's
// virtualizer draws for a scroll box and a scroll offset, the rows the list keeps drawn wherever it
// is scrolled, and the heights held before each drawn row and after the last that keep the list at
// its full height around them, and the window handed back as the same object when a read of the
// virtualizer finds the rows unmoved, so the list writes nothing for it. The virtualizer is driven
// here by a rectangle and an offset handed in rather than read from a DOM. Each case names the
// change that turns it red.
//
// What this does NOT cover: a real scroll box, a row measured on the page, a key scrolling a row
// into view, or the list's effects settling in a page, which run only in a browser and are looked
// at on landing.

import { describe, expect, it } from 'vitest';
import { Virtualizer, type Range } from '@tanstack/virtual-core';
import {
    OVERSCAN,
    firstWindow,
    keptRange,
    rowWindow,
    type RowWindow
} from '../../../src/lib/ui/tree/list/virtual.ts';
import { noop } from '../../fixtures/doubles.ts';

/**
 * A virtualizer over `count` rows of `size` px in a box `height` px tall scrolled to `offset`,
 * keeping the rows `kept` drawn as ui/tree/list/VirtualRows.svelte hands them.
 */
function windowed(
    count: number,
    size: number,
    height: number,
    offset: number,
    margin = 0,
    kept: readonly number[] = []
): Virtualizer<Element, Element> {
    // A stand-in for the scroll box: the virtualizer only hands it to the two observers below.
    const box = {} as Element;
    const virtualizer = new Virtualizer<Element, Element>({
        count,
        estimateSize: () => size,
        overscan: OVERSCAN,
        scrollMargin: margin,
        rangeExtractor: (range: Range) => keptRange(range, kept),
        getScrollElement: () => box,
        observeElementRect: (_, report) => {
            report({ width: 200, height });
            return noop;
        },
        observeElementOffset: (_, report) => {
            report(offset, false);
            return noop;
        },
        scrollToFn: noop
    });
    virtualizer._willUpdate();
    return virtualizer;
}

/** The indexes a window draws. */
function indexesOf(drawn: RowWindow): number[] {
    return drawn.rows.map((row) => row.index);
}

/** Every height the window holds: each gap, each drawn row at `size`, and the height after. */
function heightOf(drawn: RowWindow, size: number): number {
    return drawn.rows.reduce((sum, row) => sum + row.gap + size, 0) + drawn.after;
}

/** The indexes from `first` through `last`. */
function through(first: number, last: number): number[] {
    return Array.from({ length: last - first + 1 }, (_, at) => first + at);
}

describe('the window of a long list', () => {
    // Revert: compute `after` in rowWindow as the total less the first drawn row's start.
    it('draws rows 95 to 124 of 1,000 in a 440 px box at 2,200 px, and keeps the list 22,000 px tall', () => {
        const drawn = rowWindow(windowed(1000, 22, 440, 2200));

        expect(indexesOf(drawn)).toEqual(through(95, 124));
        expect(drawn.total).toBe(22000);
        expect(drawn.rows[0].gap).toBe(95 * 22);
        expect(drawn.rows.slice(1).every((row) => row.gap === 0)).toBe(true);
        expect(drawn.after).toBe(22000 - 125 * 22);
        expect(heightOf(drawn, 22)).toBe(drawn.total);
    });

    // Revert: set `end` to 0 rather than the scroll margin at the start of rowWindow.
    it('measures the gaps from the list, not from the top of the scroll box it sits in', () => {
        const drawn = rowWindow(windowed(1000, 22, 440, 2200 + 300, 300));

        expect(drawn.rows.at(0)?.index).toBe(95);
        expect(drawn.rows.at(0)?.gap).toBe(95 * 22);
        expect(drawn.total).toBe(22000);
        expect(heightOf(drawn, 22)).toBe(drawn.total);
    });
});

describe('the rows a list keeps drawn', () => {
    // Revert: return `defaultRangeExtractor(range)` alone from keptRange.
    it('draws a kept row far above the window at its place, with the gaps around it', () => {
        const drawn = rowWindow(windowed(1000, 22, 440, 2200, 0, [3]));

        expect(indexesOf(drawn)).toEqual([3, ...through(95, 124)]);
        expect(drawn.rows[0].gap).toBe(3 * 22);
        expect(drawn.rows[1].gap).toBe(91 * 22);
        expect(drawn.rows.slice(2).every((row) => row.gap === 0)).toBe(true);
        expect(drawn.after).toBe(22000 - 125 * 22);
        expect(heightOf(drawn, 22)).toBe(drawn.total);
    });

    // Revert: in keptRange, build `drawn` as an array and push each kept index onto it.
    it('draws a kept row already inside the window once', () => {
        const drawn = rowWindow(windowed(1000, 22, 440, 2200, 0, [100]));

        expect(indexesOf(drawn)).toEqual(through(95, 124));
        expect(heightOf(drawn, 22)).toBe(drawn.total);
    });

    // Revert: drop the bounds test on each kept index in keptRange.
    it('ignores a kept index the list does not hold', () => {
        const drawn = rowWindow(windowed(1000, 22, 440, 2200, 0, [-1, 1000]));

        expect(indexesOf(drawn)).toEqual(through(95, 124));
    });
});

describe('the window before the list has its scroll box', () => {
    // Revert: set `shown` to `count` in firstWindow.
    it('draws the first two overscans of rows of a longer list', () => {
        expect(indexesOf(firstWindow(1000))).toEqual(through(0, OVERSCAN * 2 - 1));
    });

    // Revert: set `shown` to `OVERSCAN * 2` in firstWindow, whatever the count.
    it('draws every row of a list shorter than that', () => {
        expect(indexesOf(firstWindow(3))).toEqual([0, 1, 2]);
    });
});

describe('a window read again', () => {
    // Revert: return the window computed in rowWindow, whatever it is handed as the one held.
    it('hands back the window the list holds when the virtualizer draws the same rows', () => {
        const virtualizer = windowed(1000, 22, 440, 2200);
        const held = rowWindow(virtualizer);

        expect(rowWindow(virtualizer, held)).toBe(held);
    });

    // Revert: compare only the indexes of the rows drawn in sameWindow.
    it('hands back a new window when the rows drawn move, or the heights around them change', () => {
        const held = rowWindow(windowed(1000, 22, 440, 2200));
        const moved = rowWindow(windowed(1000, 22, 440, 2200 + 22), held);
        const longer = rowWindow(windowed(1001, 22, 440, 2200), held);
        const taller = rowWindow(windowed(1000, 30, 440, 2200), held);

        expect(moved).not.toBe(held);
        expect(moved.rows[0].index).toBe(96);
        expect(longer).not.toBe(held);
        expect(indexesOf(longer)).toEqual(indexesOf(held));
        expect(longer.after).toBe(held.after + 22);
        expect(taller).not.toBe(held);
        expect(taller.total).toBe(30000);
    });
});
