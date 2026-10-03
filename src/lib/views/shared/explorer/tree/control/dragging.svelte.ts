// Layer 3, view partial of tree/Tree.svelte. The drag half of the tree: what a row carries when a
// drag starts, which rows a drag over a row tints, and what a drop on a row asks the drop rules
// (state/sources/explorer/acts/drop.ts) and the drop's calls (../menu/row-drop.ts) to do.
//
// A file row is dragged under FILE_DRAG, which a drop target that takes a file (the composer's
// prompt box) reads, and a folder row under FOLDER_DRAG, which only this tree takes. The folder a
// drop would land in is tinted, with the rows open under it.

import { absoluteOf } from '$lib/state/workbench/navigation/pages';
import {
    FILE_DRAG,
    FOLDER_DRAG,
    type FsRoot,
    type RowRef,
    type TreeRow
} from '$lib/state/sources/fs';
import { rowAt, type Picked } from '$lib/state/sources/explorer/acts/selection';
import {
    dropInto,
    draggedRows,
    dropVerdict,
    type DropRow
} from '$lib/state/sources/explorer/acts/drop';
import { carriesOutside, carriesRow, outsideThings, targetOf } from '../drag';
import type { rowDropper } from '../menu/row-drop';

export type DraggingDeps = {
    roots: () => FsRoot[] | undefined;
    picked: () => Picked;
    drawn: () => TreeRow[];
    dropper: ReturnType<typeof rowDropper>;
};

const dropRowOf = (row: TreeRow): DropRow => ({ root: row.root, path: row.path, kind: row.kind });

/** The drag handlers of the rows, over the state of the drag in progress. */
export function createDragging(deps: DraggingDeps) {
    /** The rows a drag started on one row carries, set when the drag starts. */
    let dragging: DropRow[] = [];

    /** The folder a drop would land in, tinted with the rows open under it; null for none. */
    let landing: RowRef | null = $state.raw(null);

    function tinted(row: TreeRow): boolean {
        if (row.root !== landing?.root) return false;
        return (
            landing.path === '' ||
            row.path === landing.path ||
            row.path.startsWith(`${landing.path}/`)
        );
    }

    /** Whether a row can be dragged: a file or a folder inside a root, not a name being typed. */
    function draggable(row: TreeRow): boolean {
        return (
            deps.roots() !== undefined &&
            row.editing === undefined &&
            row.depth > 0 &&
            row.up === undefined
        );
    }

    /** Put a row's absolute path on the drag, under the type of what it is. */
    function started(event: DragEvent, row: TreeRow): void {
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

    /** A drag over a row: allowed where a drop there would do something, which tints the folder. */
    function over(event: DragEvent, row: TreeRow): void {
        const here = targetOf(row, event);
        const typing = row.editing !== undefined;
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

    function dropped(event: DragEvent, row: TreeRow): void {
        const here = targetOf(row, event);
        const typing = row.editing !== undefined;
        landing = null;
        if (carriesRow(event)) {
            event.preventDefault();
            void deps.dropper.rows(dragging, dropRowOf(here), event.altKey, typing);
        } else if (carriesOutside(event)) {
            event.preventDefault();
            void deps.dropper.outside(outsideThings(event), dropRowOf(here), typing);
        }
        dragging = [];
    }

    /** The drag ended, wherever it ended. */
    function ended(): void {
        dragging = [];
        landing = null;
    }

    /** The pointer leaving the tree altogether takes the tint away. */
    function left(event: DragEvent): void {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget instanceof Node) {
            if (event.currentTarget.contains(next)) return;
        }
        landing = null;
    }

    return { tinted, draggable, started, over, dropped, ended, left };
}
