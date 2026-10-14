// Layer 2, client state, pure. The rows selected in the file browser, and how a press or a key
// changes them.
//
// A tab keeps one cursor row (`selected`), the rows selected with it (`selection`, empty while the
// cursor row is the only one selected) and the row a range grows from (`anchor`). The set the
// actions act on is `acting`: the selection when it holds the cursor row, else the cursor row
// alone, so a selection left behind by a cursor that moved elsewhere is no selection. Every
// function here takes the rows as drawn, in the order they are drawn, because a range is a range
// of drawn rows.

import { rowKey, parentOf, type FsEntry, type RowRef, type TreeRow } from '../view/place.ts';

/** The three fields of a file browser's state that make up its selection. */
export type Picked = { selected: RowRef | null; selection: RowRef[]; anchor: RowRef | null };

/** A row as the selection addresses it. */
function ref(row: RowRef): RowRef {
    return { root: row.root, path: row.path };
}

/** Whether two rows are the same row. */
function same(a: RowRef | null, b: RowRef | null): boolean {
    return a !== null && b !== null && rowKey(a) === rowKey(b);
}

/**
 * The rows the actions act on: the selection when it holds the cursor row, else the cursor row
 * alone, else none.
 */
export function acting(view: Picked): RowRef[] {
    const { selected, selection } = view;
    if (selected === null) return [];
    if (selection.length > 1 && selection.some((one) => same(one, selected))) return selection;
    return [selected];
}

/** The state of a selection of the given rows with the cursor on the last of them. */
function settle(rows: RowRef[], anchor: RowRef | null): Picked {
    const last = rows.at(-1);
    if (last === undefined) return { selected: null, selection: [], anchor };
    return { selected: ref(last), selection: rows.length > 1 ? rows.map(ref) : [], anchor };
}

/** A plain press: the row alone is selected and starts a range. */
export function selectOnly(row: RowRef): Picked {
    return { selected: ref(row), selection: [], anchor: ref(row) };
}

/**
 * A press with Cmd held: the row joins the selection, or leaves it when it was in. The cursor row
 * counts as selected, so the first Cmd+press on another row selects both.
 */
export function selectToggled(view: Picked, row: RowRef): Picked {
    const held = acting(view);
    const left = held.filter((one) => !same(one, row));
    if (left.length < held.length) {
        return settle(left, ref(row));
    }
    return settle([...held, ref(row)], ref(row));
}

/** The rows from one to another among the drawn ones, both ends included, in drawn order. */
function between(drawn: RowRef[], from: RowRef, to: RowRef): RowRef[] | null {
    const a = drawn.findIndex((one) => same(one, from));
    const b = drawn.findIndex((one) => same(one, to));
    if (a < 0 || b < 0) return null;
    return drawn.slice(Math.min(a, b), Math.max(a, b) + 1);
}

/**
 * A press with Shift held: every drawn row from the anchor to the row, the cursor on the row and
 * the anchor kept. Without an anchor in the drawn rows it is a plain press.
 */
export function selectRange(view: Picked, drawn: RowRef[], row: RowRef): Picked {
    const from = view.anchor ?? view.selected;
    const range = from === null ? null : between(drawn, from, row);
    if (range === null) return selectOnly(row);
    return {
        selected: ref(row),
        selection: range.length > 1 ? range.map(ref) : [],
        anchor: ref(from ?? row)
    };
}

/**
 * Shift+Down (`1`) or Shift+Up (`-1`): the cursor moves one drawn row and the range from the
 * anchor follows it. At either end of the drawn rows nothing changes.
 */
export function selectExtended(view: Picked, drawn: RowRef[], step: 1 | -1): Picked {
    const cursor = view.selected;
    if (cursor === null) return view;
    const at = drawn.findIndex((one) => same(one, cursor));
    if (at < 0 || at + step < 0) return view;
    const next = drawn.at(at + step);
    if (next === undefined) return view;
    return selectRange({ ...view, anchor: view.anchor ?? cursor }, drawn, next);
}

/** Cmd+A: every drawn row is selected, the cursor and the anchor kept where they were. */
export function selectEvery(view: Picked, drawn: RowRef[]): Picked {
    const rows = drawn.map(ref);
    const held = view.selected;
    const cursor =
        held !== null && rows.some((one) => same(one, held)) ? held : (rows.at(0) ?? null);
    return {
        selected: cursor === null ? null : ref(cursor),
        selection: rows.length > 1 ? rows : [],
        anchor: view.anchor ?? cursor
    };
}

/**
 * The rows a listing no longer holds, taken out of a selection. A row whose folder was never read
 * is kept, since nothing says it is gone. The cursor row and the anchor that are gone are dropped
 * too.
 */
export function selectPruned(
    view: Picked,
    held: (root: string, path: string) => FsEntry[] | null
): Picked {
    const alive = (row: RowRef): boolean => {
        const parent = parentOf(row);
        if (parent === null) return true;
        const listed = held(parent.root, parent.path);
        if (listed === null) return true;
        const name = row.path.slice(row.path.lastIndexOf('/') + 1);
        return listed.some((one) => one.name === name);
    };
    const selected = view.selected !== null && alive(view.selected) ? view.selected : null;
    const selection = view.selection.filter(alive);
    const anchor = view.anchor !== null && alive(view.anchor) ? view.anchor : null;
    return {
        selected,
        selection: selection.length > 1 && selected !== null ? selection : [],
        anchor
    };
}

/** Whether pruning changed anything, so the view writes only when it has to. */
export function selectionChanged(a: Picked, b: Picked): boolean {
    const keys = (rows: RowRef[]): string => rows.map(rowKey).join('\n');
    const one = (x: RowRef | null): string => (x === null ? '' : rowKey(x));
    return (
        one(a.selected) !== one(b.selected) ||
        one(a.anchor) !== one(b.anchor) ||
        keys(a.selection) !== keys(b.selection)
    );
}

/**
 * The rows of the tree an action may act on: not a root's line, the `..` line, a name being typed
 * or a row that is a sentence.
 */
export function actable(row: TreeRow): boolean {
    return (
        row.depth > 0 && row.up === undefined && row.editing === undefined && row.said === undefined
    );
}

/**
 * What the selection holds, for the questions and the menu: how many rows, how many are files and
 * how many are folders.
 */
export function selectionFacts(
    rows: RowRef[],
    kindOf: (row: RowRef) => 'file' | 'dir'
): { size: number; files: number; folders: number } {
    const folders = rows.filter((one) => kindOf(one) === 'dir').length;
    return { size: rows.length, files: rows.length - folders, folders };
}

/**
 * The row a path is, as the actions read it: the drawn row at that path, or for a segment of a
 * compacted row a row of that folder alone, with the segment's name and no chain. Null when no
 * drawn row stands for the path.
 */
export function rowAt(rows: readonly TreeRow[], at: RowRef): TreeRow | null {
    const exact = rows.find((one) => one.root === at.root && one.path === at.path);
    if (exact !== undefined) return exact;
    for (const one of rows) {
        const step = one.chain?.find((one) => one.path === at.path);
        if (one.root === at.root && step !== undefined) {
            const { chain: _chain, ...rest } = one;
            return { ...rest, path: step.path, name: step.name, open: true };
        }
    }
    return null;
}

/**
 * The drawn rows the actions act on for a press on one row: the selection's rows when the row is
 * among them, else the row alone. The rows come in the order they were selected.
 */
export function rowsActed(view: Picked, drawn: readonly TreeRow[], row: TreeRow): TreeRow[] {
    const held = acting(view);
    if (held.length > 1 && held.some((one) => same(one, row))) {
        return held.flatMap((one) => {
            const found = rowAt(drawn, one);
            return found === null ? [] : [found];
        });
    }
    return [row];
}
