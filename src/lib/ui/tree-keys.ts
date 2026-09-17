// Layer 3, primitive. The keyboard of an explorer tree, apart from the component so the rule can be
// read and asserted without a DOM: which row a key moves to, which row opens or closes, and which
// row carries the tree's one stop in the browser's focus order.
//
// A tree is one stop: the row at the stop carries tabindex 0 and every other row -1, so a reader
// tabs past the whole tree in one press and moves inside it with the arrow keys. The rows are the
// ones drawn, in the order they are drawn, each naming the row it sits under.

/** One drawn row as the keyboard reads it. */
export type KeyRow = {
    id: string;
    /** The row this one sits under, or null for a row at the top of the tree. */
    parent: string | null;
    /** Whether the row is open; omitted for a row that does not open. */
    open?: boolean;
    /**
     * Drawn as it is for a reason the keyboard does not own, such as a filter holding a folder open:
     * Right and Left then step through it and never open or close it.
     */
    fixed?: boolean;
};

/** What one key asks of the tree: the focus moved to a row, or a row opened or closed. */
export type RowMove = { kind: 'focus' | 'toggle'; id: string };

/** What a row reads off the tree it is drawn in: its place in the focus order and its key handler. */
export type TreeNav = {
    tabindex: (id: string) => number;
    onkeydown: (id: string) => (event: KeyboardEvent) => void;
};

/** The row holding the stop: the one asked for while it is drawn, and the first row otherwise. */
export function stopOf(rows: KeyRow[], wanted: string): string {
    return rows.some((row) => row.id === wanted) ? wanted : (rows[0]?.id ?? '');
}

/**
 * What one key asks of the tree, from the row that has the focus. Up and Down step one row and stop
 * at the ends, Home and End go to them; Right opens a closed row and steps into an open one; Left
 * closes an open row and otherwise steps out to the row above it. Enter is the row's own, which
 * presses its button (ui/TreeItem.svelte). From a row that is not drawn, a movement key goes to
 * the first row, or the last for End. A key the tree does not answer, or a step with nowhere to go,
 * asks for nothing.
 */
export function rowMove(rows: KeyRow[], current: string, key: string): RowMove | null {
    if (rows.length === 0) return null;
    const at = rows.findIndex((row) => row.id === current);
    const focus = (index: number): RowMove => ({ kind: 'focus', id: rows[index].id });
    if (key === 'Home') return focus(0);
    if (key === 'End') return focus(rows.length - 1);
    if (at < 0) {
        return ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(key) ? focus(0) : null;
    }
    const row = rows[at];
    if (key === 'ArrowDown') return at + 1 < rows.length ? focus(at + 1) : null;
    if (key === 'ArrowUp') return at > 0 ? focus(at - 1) : null;
    if (key === 'ArrowRight') {
        if (row.open === undefined) return null;
        if (!row.open) return row.fixed === true ? null : { kind: 'toggle', id: row.id };
        const next = rows.at(at + 1);
        return next?.parent === row.id ? focus(at + 1) : null;
    }
    if (key === 'ArrowLeft') {
        if (row.open === true && row.fixed !== true) return { kind: 'toggle', id: row.id };
        if (row.parent === null) return null;
        const index = rows.findIndex((one) => one.id === row.parent);
        return index < 0 ? null : focus(index);
    }
    return null;
}
