// Layer 3, view helper. Where the reader of a transcript stands in its column, apart from the
// component so its rule reads whole and the component keeps what it draws. This is the one place
// that corrects the column's `scrollTop`: the virtualizer's own correction is off and the column
// sets `overflow-anchor: none`, so no two corrections add up.
//
// The reader's words stay where they are through every draw, whichever read or tab caused it, by
// one rule: take a row and its top, and after the column changed under it move the column by that
// row's change. A take runs on a scroll and before a draw of new data. A hold runs after every draw
// and after every height change; it takes nothing itself while a place stands, since by then the
// rows have already moved. A draw that adds no older turns holds by the first row on screen, which
// covers an append, a patched result, a run that opens, a row above the view measured at last, and
// the line that comes and goes at the top of the list. A draw that adds older turns can change the
// rows at the top of the list, so it holds by the row past them (`Anchor.past`), unless the reader
// is on a call or a press that kept its key, which has no head to lose. The row is held by its key
// rather than by its element, since the keys stand across a read, among the rows drawn, which the
// window keeps drawn while they are held (`rows`). Nothing is taken while the column has no height,
// so a hidden tab keeps the row it had and is put right when it shows.
//
// When a spacer stands at the top of the view, which a fast drag of the bar leaves, no row stands
// there: the place taken before it is dropped, since holding it would pull the column back, and
// the first hold after the rows draw takes a new one.
//
// A jump to a row not drawn (`leave`, `land`) draws that row with the column still where it was, so
// from the press until the column has moved nothing is taken and a hold writes nothing: a place
// taken in that draw would pull the column back to where the reader stood. Once the column has
// moved, the place is taken there, ahead of the window moving, and it holds the words as the rows
// around them draw.
//
// A row's top is the top of its content, since the space above a row is padding of its box and the
// row at the head of the list has none until older turns stand above it.
//
// A height that changes just before a scroll event, as an image that loads, has moved the rows
// before anything measured it. A take therefore first puts right what the scroll itself does not
// explain, from the `scrollTop` the place was taken at.
//
// One place is made per component, so nothing is shared between tabs.

import type { FlatRow } from './turn-rows';

/** A row by its key, null for no row, and its top in the column. */
type Spot = { row: string | null; top: number };

/** Where the reader's words stand, taken both ways, since the draw decides which one holds. */
type Anchor = {
    /** The key of the list's top row, which a draw changes exactly when it adds older turns. */
    head: string;
    /** The first row on screen, which holds in a draw that adds no older turns. */
    first: Spot;
    /**
     * The row after the first said turn when the first row on screen is at or above that turn,
     * and otherwise the first row on screen, or no row when that row is not drawn. Older turns
     * above can take that turn's head or the look of a first row, both at its own top, and can grow
     * a run above it at its head. Their words keep their distance to the row below them, so that
     * row holds them too.
     */
    past: Spot;
    /**
     * The distance from the top of the column to the foot of the list, which holds in a draw that
     * adds older turns when that row is gone, there being none or a run the read extended, since
     * all that draw changes is above the foot.
     */
    below: number;
    /** The column's `scrollTop` the first row's top goes with. */
    scroll: number;
};

/** The box the rows are drawn in, a spacer between rows that stand apart, once there is one. */
type RowBox = Element | null | undefined;

/** The reader's place in one column. */
type ReaderPlace = {
    /** Note where the words stand in `box`, whose `list` draws from `rows`. */
    take: (box: Element, list: RowBox, rows: readonly FlatRow[]) => void;
    /** Move `box`, whose `list` draws from `rows`, so the words stand where they were taken. */
    hold: (box: Element, list: RowBox, rows: readonly FlatRow[]) => void;
    /** Drop the words taken, for a column sent elsewhere. */
    clear: () => void;
    /** Drop the words taken and take and hold none until `land`, for a jump under way. */
    leave: () => void;
    /** End a jump: take the place of `box`, whose `list` draws from `rows`, where it now stands. */
    land: (box: Element, list: RowBox, rows: readonly FlatRow[]) => void;
    /** The keys of the rows the place stands on, which the window keeps drawn. */
    rows: () => string[];
};

/** How far a row may stand from its place, in px, before the column is written. */
const SUBPIXEL = 0.5;

/** The key a drawn row carries. A spacer carries none. */
export function rowKey(row: Element): string | null {
    return row.getAttribute('data-row-key');
}

/** The drawn row of a key among the list's own children, or undefined for one not drawn. */
export function rowBox(list: Element, key: string): Element | undefined {
    for (const child of list.children) {
        if (rowKey(child) === key) return child;
    }
    return undefined;
}

/** The top of a row's content in the column. */
function topIn(row: Element, box: Element): number {
    const content = row.firstElementChild ?? row;
    return content.getBoundingClientRect().top - box.getBoundingClientRect().top;
}

/** Move the column by what a row is off its place. */
function shift(box: Element, off: number): void {
    if (Math.abs(off) >= SUBPIXEL) box.scrollTop += off;
}

/** The key of the row at the top of the view, or null while a spacer stands there. */
function keyAtTop(list: Element, edge: number): string | null {
    for (const child of list.children) {
        if (child.getBoundingClientRect().bottom > edge) return rowKey(child);
    }
    return null;
}

/** A new place, with no words taken. */
export function readerPlace(): ReaderPlace {
    /** The reader's words as last taken. It stays as it was while the tab is hidden. */
    let anchor: Anchor | null = null;
    /** Whether a jump is under way. */
    let away = false;

    /** Put right what the column's rows did since the place was taken, past the scroll's own. */
    function settle(box: Element, list: Element): void {
        const kept = anchor;
        const key = kept?.first.row ?? null;
        const row = key === null ? undefined : rowBox(list, key);
        if (kept === null || row === undefined) return;
        shift(box, topIn(row, box) - (kept.first.top - (box.scrollTop - kept.scroll)));
    }

    function take(box: Element, list: RowBox, rows: readonly FlatRow[]): void {
        if (away || box.clientHeight === 0 || !list || rows.length === 0) return;
        settle(box, list);
        const key = keyAtTop(list, box.getBoundingClientRect().top);
        const onScreen = key === null ? -1 : rows.findIndex((row) => row.key === key);
        if (onScreen < 0) {
            anchor = null;
            return;
        }
        const spot = (at: number): Spot => {
            const row = rows.at(at)?.key;
            const drawn = row === undefined ? undefined : rowBox(list, row);
            return row === undefined || drawn === undefined
                ? { row: null, top: 0 }
                : { row, top: topIn(drawn, box) };
        };
        const said = rows.findIndex((row) => row.kind === 'said');
        anchor = {
            head: rows[0].key,
            first: spot(onScreen),
            past: spot(Math.max(onScreen, said + 1)),
            below: box.scrollHeight - box.scrollTop,
            scroll: box.scrollTop
        };
    }

    function hold(box: Element, list: RowBox, rows: readonly FlatRow[]): void {
        if (away || box.clientHeight === 0 || !list) return;
        const kept = anchor;
        if (kept === null) {
            take(box, list, rows);
            return;
        }
        const added = rows.at(0)?.key !== kept.head;
        const onFirst = rows.find((row) => row.key === kept.first.row);
        const stands = onFirst !== undefined && onFirst.kind !== 'said';
        const spot = added && !stands ? kept.past : kept.first;
        const row = spot.row === null ? undefined : rowBox(list, spot.row);
        if (row !== undefined) shift(box, topIn(row, box) - spot.top);
        else if (added) box.scrollTop = box.scrollHeight - kept.below;
        // A hold by the row past the top leaves the first row wherever the read left it.
        const first = kept.first.row === null ? undefined : rowBox(list, kept.first.row);
        if (spot !== kept.first && first !== undefined) kept.first.top = topIn(first, box);
        kept.scroll = box.scrollTop;
    }

    return {
        take,
        hold,
        clear: () => {
            anchor = null;
        },
        leave: () => {
            anchor = null;
            away = true;
        },
        land: (box, list, rows) => {
            away = false;
            take(box, list, rows);
        },
        rows: () =>
            [anchor?.first.row, anchor?.past.row].filter((key) => key !== null && key !== undefined)
    };
}
