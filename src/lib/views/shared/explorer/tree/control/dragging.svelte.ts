// Layer 3, view partial of tree/Tree.svelte. The drag half of the tree: what a row carries when a
// drag starts, which rows a drag over a row tints, and what a drop on a row asks the drop rules
// (state/sources/explorer/acts/drop.ts) and the drop's calls (../menu/row-drop.ts) to do.
//
// A file row is dragged under FILE_DRAG, which a drop target that takes a file (the composer's
// prompt box) reads, and a folder row under FOLDER_DRAG, which only this tree takes. The folder a
// drop would land in is tinted, with the rows open under it.
//
// A movable root row (one the caller lists in `order`) is dragged under ROOT_DRAG, which holds the
// keys of the roots carried: the selected roots when the row is one of several, else the row's
// own. It lands before or after another movable root, by the half of the row the pointer is in,
// drawn as a line on that edge of the row, or last when it is dropped below the final row. Over any
// other row, a fixed root or itself it answers no drop and draws nothing, and so does a tree that
// did not start the drag (another Files tab's): a root drag also carries a type only this tree's
// drags carry, which a drag over the tree is read for, so a drag that ended without `dragend`
// leaves nothing a later drag from another tree is read against. The order
// arithmetic is state/sources/explorer/acts/reorder.ts's and the write is the caller's `onreorder`.
//
// A tree whose rows keep an order of the caller's (`RowOrder`, the Notes section's notes) is asked
// of each drag of rows over a row whether the drop would reorder them rather than move them: such
// a drop draws the line on the edge of the row the pointer is nearer and hands the caller the rows
// and that edge; every other drop moves or copies as in any tree.

import { absoluteOf } from '$lib/state/workbench/navigation/pages';
import {
    FILE_DRAG,
    FOLDER_DRAG,
    ROOT_DRAG,
    rowKey,
    type FsRoot,
    type RowRef,
    type TreeRow
} from '$lib/state/sources/fs';
import { acting, rowAt, type Picked } from '$lib/state/sources/explorer/acts/selection';
import {
    dropPlace,
    reorderedKeys,
    reorderedLast,
    type Place
} from '$lib/state/sources/explorer/acts/reorder';
import {
    dropInto,
    draggedRows,
    dropVerdict,
    type DropRow
} from '$lib/state/sources/explorer/acts/drop';
import { carriesOutside, carriesRow, outsideThings, targetOf } from '../drag';
import type { rowDropper } from '../menu/row-drop';

/**
 * A tree whose rows keep an order of the caller's: whether a drop of rows on a row puts them before
 * or after it rather than into its folder, the write of that order, and Alt+Up and Alt+Down on a
 * row, which answers whether it moved the row.
 */
export type RowOrder = {
    takes: (rows: readonly RowRef[], onto: TreeRow) => boolean;
    place: (rows: readonly RowRef[], onto: TreeRow, place: Place) => void;
    step: (row: TreeRow, direction: 'up' | 'down') => boolean;
};

export type DraggingDeps = {
    roots: () => FsRoot[] | undefined;
    picked: () => Picked;
    drawn: () => TreeRow[];
    dropper: ReturnType<typeof rowDropper>;
    /**
     * The keys of the roots the reader may move, in the order they are written; empty when the
     * tree offers no reorder (a rooted tab, a following tab, a typed filter, a project card).
     */
    order: () => string[];
    /** Write the new order of the movable roots. */
    onreorder: (keys: string[]) => void;
    /** The order the caller keeps its rows in, or undefined for a tree that keeps none. */
    rowOrder?: () => RowOrder | undefined;
};

const dropRowOf = (row: TreeRow): DropRow => ({ root: row.root, path: row.path, kind: row.kind });

/** The drag handlers of the rows and of the movable roots, over the drag in progress. */
export function createDragging(deps: DraggingDeps) {
    /** The rows a drag started on one row carries, set when the drag starts. */
    let dragging: DropRow[] = [];

    /** The folder a drop would land in, tinted with the rows open under it; null for none. */
    let landing: RowRef | null = $state.raw(null);

    /** The roots a drag in progress carries, set when a root row's drag starts in this tree. */
    let carried: string[] = [];

    /** The type only this tree's root drags carry. */
    const mine = `${ROOT_DRAG}.${Math.random().toString(36).slice(2)}`;

    /**
     * Where a root drag would land: the key of the row the line is drawn on, the edge of it, the
     * movable root it is relative to (the empty key for after the last root), and its place.
     */
    let line: { row: string; edge: Place; target: string; place: Place } | null = $state.raw(null);

    /** The edge of a row a root drag would land on, for the drop line; undefined for none. */
    function dropEdge(row: TreeRow): Place | undefined {
        return line?.row === rowKey(row) ? line.edge : undefined;
    }

    /** Whether a row is a root row the reader may move. */
    function movable(row: TreeRow): boolean {
        return row.path === '' && row.depth === 0 && deps.order().includes(row.root);
    }

    /** Whether a drag carries a root, of this tree or of another. */
    function carriesRoot(event: DragEvent): boolean {
        return (event.dataTransfer?.types ?? []).includes(ROOT_DRAG);
    }

    /** Whether a drag carries roots of this tree: it started here and carries this tree's type. */
    function ours(event: DragEvent): boolean {
        return carried.length > 0 && (event.dataTransfer?.types ?? []).includes(mine);
    }

    function tinted(row: TreeRow): boolean {
        if (row.root !== landing?.root) return false;
        return (
            landing.path === '' ||
            row.path === landing.path ||
            row.path.startsWith(`${landing.path}/`)
        );
    }

    /** Whether a row can be dragged: a file or a folder inside a root, or a movable root. */
    function draggable(row: TreeRow): boolean {
        if (movable(row)) return row.editing === undefined;
        return (
            deps.roots() !== undefined &&
            row.editing === undefined &&
            row.depth > 0 &&
            row.up === undefined
        );
    }

    /** The movable roots a drag started on one root row carries, in the order they are written. */
    function rootsOf(row: TreeRow): string[] {
        const held = acting(deps.picked());
        const group =
            held.length > 1 && held.some((one) => rowKey(one) === rowKey(row)) ? held : [row];
        const keys = group.filter((one) => one.path === '').map((one) => one.root);
        return deps.order().filter((key) => keys.includes(key));
    }

    /** Put the roots a movable root row carries on the drag. */
    function startedRoot(event: DragEvent, row: TreeRow): void {
        const data = event.dataTransfer;
        if (data === null) return;
        carried = rootsOf(row);
        const dirs = carried.map((key) => deps.roots()?.find((one) => one.key === key)?.dir ?? '');
        data.setData(ROOT_DRAG, carried.join('\n'));
        data.setData(mine, carried.join('\n'));
        data.setData('text/plain', dirs.join('\n'));
        data.effectAllowed = 'move';
    }

    /** Put a row's absolute path on the drag under the type of its kind; a root carries its key. */
    function started(event: DragEvent, row: TreeRow): void {
        if (movable(row)) {
            startedRoot(event, row);
            return;
        }
        const dir = deps.roots()?.find((one) => one.key === row.root)?.dir ?? '';
        if (dir === '' || event.dataTransfer === null) return;
        const here = targetOf(row, event);
        const path = absoluteOf(dir, here.path);
        dragging = draggedRows(
            deps.picked(),
            dropRowOf(here),
            (ref) => rowAt(deps.drawn(), ref)?.kind ?? 'file'
        );
        if (here.kind === 'dir') {
            event.dataTransfer.setData(FOLDER_DRAG, path);
        } else {
            event.dataTransfer.setData(FILE_DRAG, path);
            event.dataTransfer.setData('text/plain', path);
        }
        event.dataTransfer.effectAllowed = 'copyMove';
    }

    /**
     * A root drag over a row: allowed over another movable root, with the line on the edge the
     * pointer is nearer; over anything else it answers no drop.
     */
    function overRoot(event: DragEvent, row: TreeRow): void {
        const rect =
            event.currentTarget instanceof Element
                ? event.currentTarget.getBoundingClientRect()
                : null;
        if (!ours(event) || !movable(row) || carried.includes(row.root) || rect === null) {
            line = null;
            if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'none';
            return;
        }
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
        const place = dropPlace(rect, event.clientY);
        line = { row: rowKey(row), edge: place, target: row.root, place };
    }

    /** A root drag over the empty space below the last row: the roots would go last. */
    function overTail(event: DragEvent): void {
        if (!carriesRoot(event) || event.target !== event.currentTarget) return;
        const last = deps.drawn().at(-1);
        if (!ours(event) || last === undefined) {
            line = null;
            if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'none';
            return;
        }
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
        line = { row: rowKey(last), edge: 'after', target: '', place: 'after' };
    }

    /** Write the order a root drop comes to, when it moves anything. */
    function reorder(target: string, place: Place): void {
        const order = deps.order();
        const next =
            target === ''
                ? reorderedLast(order, carried)
                : reorderedKeys(order, carried, target, place);
        if (next !== order) deps.onreorder(next);
    }

    /** A drop of roots on a row or on the space below the last row. */
    function droppedRoot(event: DragEvent): void {
        const at = line;
        line = null;
        if (at === null || !ours(event)) return;
        event.preventDefault();
        reorder(at.target, at.place);
        carried = [];
    }

    /**
     * A drag over a row: allowed where a drop there would do something, which tints the folder; a
     * root over a movable root draws the line of where it would land.
     */
    function over(event: DragEvent, row: TreeRow): void {
        if (carriesRoot(event)) {
            overRoot(event, row);
            return;
        }
        const here = targetOf(row, event);
        const typing = row.editing !== undefined;
        if (carriesRow(event) && reordering(event, here)) return;
        line = null;
        if (carriesRow(event)) {
            const verdict = dropVerdict(dragging, dropRowOf(here), event.altKey, typing);
            if (verdict.kind === 'nothing') {
                landing = null;
                return;
            }
            event.preventDefault();
            if (event.dataTransfer !== null) {
                event.dataTransfer.dropEffect = verdict.kind === 'copy' ? 'copy' : 'move';
            }
            landing = verdict.into;
        } else if (carriesOutside(event) && !typing) {
            event.preventDefault();
            if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'copy';
            landing = dropInto(dropRowOf(here));
        }
    }

    /**
     * A drag of rows over a row of a tree that keeps their order: when the drop would reorder
     * them, the line on the nearer edge and true; else false and nothing drawn.
     */
    function reordering(event: DragEvent, here: TreeRow): boolean {
        const order = deps.rowOrder?.();
        const rect =
            event.currentTarget instanceof Element
                ? event.currentTarget.getBoundingClientRect()
                : null;
        if (order === undefined || rect === null || !order.takes(dragging, here)) return false;
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
        landing = null;
        const place = dropPlace(rect, event.clientY);
        line = { row: rowKey(here), edge: place, target: '', place };
        return true;
    }

    function dropped(event: DragEvent, row: TreeRow): void {
        if (carriesRoot(event)) {
            droppedRoot(event);
            return;
        }
        const here = targetOf(row, event);
        const typing = row.editing !== undefined;
        landing = null;
        const order = deps.rowOrder?.();
        const at = line;
        line = null;
        if (carriesRow(event) && order !== undefined && at?.row === rowKey(here)) {
            event.preventDefault();
            if (order.takes(dragging, here)) order.place(dragging, here, at.place);
            dragging = [];
            return;
        }
        if (carriesRow(event)) {
            event.preventDefault();
            void deps.dropper.rows(dragging, dropRowOf(here), event.altKey, typing);
        } else if (carriesOutside(event)) {
            event.preventDefault();
            void deps.dropper.outside(outsideThings(event), dropRowOf(here), typing);
        }
        dragging = [];
    }

    /** The drag ended, wherever it ended, and every drop line goes. */
    function ended(): void {
        dragging = [];
        carried = [];
        landing = null;
        line = null;
    }

    /** The pointer leaving the tree altogether takes the tint away. */
    function left(event: DragEvent): void {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget instanceof Node) {
            if (event.currentTarget.contains(next)) return;
        }
        landing = null;
        line = null;
    }

    return {
        tinted,
        draggable,
        started,
        over,
        overTail,
        dropped,
        droppedRoot,
        ended,
        left,
        dropEdge
    };
}
