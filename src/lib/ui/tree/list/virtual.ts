// Layer 3, primitive. The window of a long explorer list, apart from
// ui/tree/list/VirtualRows.svelte so it can be asserted without a DOM: which rows
// @tanstack/virtual-core's virtualizer draws, the rows it keeps drawn wherever the list is
// scrolled, and the height held before each drawn row and after the last one, so the list keeps its
// full height and the scroll box's bar and whatever follows the list stay where they would be with
// every row drawn.

import { defaultRangeExtractor, type Range, type Virtualizer } from '@tanstack/virtual-core';

/** How many rows are drawn past each edge of the scroll box, so a short scroll shows no gap. */
export const OVERSCAN = 5;

/** One drawn row: its index and the height held before it for the rows not drawn, in px. */
export type DrawnRow = { index: number; gap: number };

/** The rows drawn, the height held after the last of them, and the list's full height, in px. */
export type RowWindow = { rows: DrawnRow[]; after: number; total: number };

/**
 * The rows the virtualizer draws: the ones in view with the overscan around them, and the rows the
 * list keeps drawn wherever it is scrolled, each once and in order.
 */
export function keptRange(range: Range, kept: readonly number[]): number[] {
    const drawn = new Set(defaultRangeExtractor(range));
    for (const index of kept) {
        if (index >= 0 && index < range.count) drawn.add(index);
    }
    return [...drawn].sort((one, two) => one - two);
}

/**
 * The rows the virtualizer draws now and the height held around them. The virtualizer counts a
 * row's start from the top of the scroll box, the list's own offset in it being its scroll margin,
 * so each gap is measured from the list's top or from the end of the row drawn before it.
 *
 * Handed the window the list holds, it gives that same window back when nothing in it moved, so
 * the list writes nothing and the rows drawn from it are not run again. A row whose effect makes
 * the list configure itself again (the open commit's files, whose rows the Graph's kept items are
 * counted from) would otherwise be run again by the window it caused, and again, without end.
 */
export function rowWindow<S extends Element | Window, I extends Element>(
    virtualizer: Virtualizer<S, I>,
    held?: RowWindow
): RowWindow {
    const items = virtualizer.getVirtualItems();
    const total = virtualizer.getTotalSize();
    const margin = virtualizer.options.scrollMargin;
    let end = margin;
    const rows = items.map((item) => {
        const gap = Math.max(0, item.start - end);
        end = item.end;
        return { index: item.index, gap };
    });
    const next = { rows, after: Math.max(0, total - (end - margin)), total };
    return held !== undefined && sameWindow(held, next) ? held : next;
}

/** Whether two windows draw the same rows with the same heights held around them. */
export function sameWindow(one: RowWindow, two: RowWindow): boolean {
    return (
        one.after === two.after &&
        one.total === two.total &&
        one.rows.length === two.rows.length &&
        one.rows.every(
            (row, at) => row.index === two.rows[at].index && row.gap === two.rows[at].gap
        )
    );
}

/**
 * The window a list draws before it has found its scroll box, on the server and at the first
 * render in the page: the first rows, as many as two overscans. The rows after them are held by
 * the list at the row height its tokens give, since no row has been measured yet.
 */
export function firstWindow(count: number): RowWindow {
    const shown = Math.min(count, OVERSCAN * 2);
    return {
        rows: Array.from({ length: shown }, (_, index) => ({ index, gap: 0 })),
        after: 0,
        total: 0
    };
}

/** Where an element sits in the content of the scroll box it is in, in px from its top. */
export function offsetIn(element: Element, box: Element): number {
    return element.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
}
