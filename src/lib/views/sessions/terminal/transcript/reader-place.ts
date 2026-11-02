// Layer 3, view helper. Where the reader of a transcript stands in its column, apart from the
// component so its rule reads whole and the component keeps what it draws.
//
// The reader's words stay where they are through every draw, whichever read or tab caused it, by
// one rule: before a draw take a row and its top, and after the draw move the column by that row's
// change. A draw that adds no older turns holds by the first row on screen, which covers an append,
// a patched result, a run that opens and the line that comes and goes at the top of the list. A
// draw that adds older turns can change the rows at the top of the list, so it holds by the row
// past them (`Anchor.past`), unless the reader is on a run that kept its key, which has no head to
// lose. The row is held by its key rather than by its element, since the keys
// stand across a read, and nothing is taken while the column has no height, so a hidden tab keeps
// the row it had and is put right when it shows. The correction is absolute, so the browser's own
// scroll anchoring can stand beside it.
//
// One place is made per component, so nothing is shared between tabs.

import type { TurnRow } from './turn-rows';

/** A row by its key, null for no row, and its top in the column. */
type Spot = { row: number | null; top: number };

/** Where the reader's words stand, taken both ways, since the draw decides which one holds. */
type Anchor = {
    /** The key of the list's top row, which a draw changes exactly when it adds older turns. */
    head: number;
    /** The first row on screen, which holds in a draw that adds no older turns. */
    first: Spot;
    /**
     * The row after the first said turn when the first row on screen is at or above that turn,
     * and otherwise the first row on screen. Older turns above can take that turn's head or the
     * look of a first row, both at its own top, and can grow a run above it at its head. Their
     * words keep their distance to the row below them, so that row holds them too.
     */
    past: Spot;
    /**
     * The distance from the top of the column to the foot of the list, which holds in a draw that
     * adds older turns when that row is gone, there being none or a run the read extended, since
     * all that draw changes is above the foot.
     */
    below: number;
};

/** The box whose children are the rows drawn, one for each row, once there is one. */
type RowBox = Element | null | undefined;

/** The reader's place in one column. */
type ReaderPlace = {
    /** Note where the words stand in `box`, whose `list` draws `rows`. */
    take: (box: Element, list: RowBox, rows: readonly TurnRow[]) => void;
    /** Move `box`, whose `list` draws `rows`, so the words stand where they were taken. */
    hold: (box: Element, list: RowBox, rows: readonly TurnRow[]) => void;
    /** Drop the words taken, for a column sent elsewhere. */
    clear: () => void;
};

/** A new place, with no words taken. */
export function readerPlace(): ReaderPlace {
    /** The reader's words as last taken. It stays as it was while the tab is hidden. */
    let anchor: Anchor | null = null;

    function take(box: Element, list: RowBox, rows: readonly TurnRow[]): void {
        const children = list?.children;
        if (box.clientHeight === 0 || !children || rows.length === 0) return;
        const edge = box.getBoundingClientRect().top;
        const rectOf = (at: number) => children.item(at)?.getBoundingClientRect();
        const spot = (at: number): Spot =>
            at < rows.length
                ? { row: rows[at].first, top: (rectOf(at)?.top ?? edge) - edge }
                : { row: null, top: 0 };
        const onScreen = Math.max(
            0,
            rows.findIndex((_, at) => (rectOf(at)?.bottom ?? 0) > edge)
        );
        const said = rows.findIndex((row) => row.kind === 'said');
        anchor = {
            head: rows[0].first,
            first: spot(onScreen),
            past: spot(Math.max(onScreen, said + 1)),
            below: box.scrollHeight - box.scrollTop
        };
    }

    function hold(box: Element, list: RowBox, rows: readonly TurnRow[]): void {
        const kept = anchor;
        if (kept === null || box.clientHeight === 0) return;
        const added = rows.at(0)?.first !== kept.head;
        const stands = rows.find((row) => row.first === kept.first.row)?.kind === 'run';
        const spot = added && !stands ? kept.past : kept.first;
        const at = rows.findIndex((row) => row.first === spot.row);
        const row = at < 0 ? undefined : list?.children[at];
        if (row !== undefined) {
            const top = row.getBoundingClientRect().top - box.getBoundingClientRect().top;
            box.scrollTop += top - spot.top;
        } else if (added) {
            box.scrollTop = box.scrollHeight - kept.below;
        }
    }

    return {
        take,
        hold,
        clear: () => {
            anchor = null;
        }
    };
}
