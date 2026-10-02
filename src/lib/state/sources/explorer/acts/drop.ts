// Layer 2, client state, pure. What a drop on the tree comes to: which rows are dragged, where they
// land, whether they move or copy, and what a drop from outside the page is allowed to do.
//
// A row dragged while it is part of the selection takes the whole selection with it; a row that is
// not selected goes alone. A drop lands in the folder it is made on, or for a file row in the
// folder holding the file. A folder never lands in itself or below itself, nothing lands in the
// folder it already sits in, and a name being typed takes no drop. Holding Option copies where a
// drop would move. A drop is decided here and carried out by the explorer store.

import { parentOf, rowKey, type RowRef } from '../view/place.ts';
import { acting, type Picked } from './selection.ts';

/** A dragged or a target row: where it is, and whether it is a folder. */
export type DropRow = RowRef & { kind: 'file' | 'dir' };

/** What a drop comes to: nothing, or the rows that move or copy into a folder. */
export type DropVerdict =
    { kind: 'nothing' } | { kind: 'move' | 'copy'; into: RowRef; items: RowRef[] };

/** The rows a drag started on one row carries: the whole selection, or the row alone. */
export function draggedRows(view: Picked, row: DropRow, kindOf: (row: RowRef) => 'file' | 'dir') {
    const held = acting(view);
    if (held.length > 1 && held.some((one) => rowKey(one) === rowKey(row))) {
        return held.filter((one) => one.path !== '').map((one) => ({ ...one, kind: kindOf(one) }));
    }
    return [{ ...row }];
}

/** Whether a path is another path or lies below it, within one root. */
function within(path: string, folder: string): boolean {
    return folder === '' || path === folder || path.startsWith(`${folder}/`);
}

/** The folder a drop on a row lands in: the folder itself, or the folder holding a file. */
export function dropInto(target: DropRow): RowRef {
    return target.kind === 'dir'
        ? { root: target.root, path: target.path }
        : (parentOf(target) ?? { root: target.root, path: '' });
}

/**
 * The drop of rows on a row. `target` is the row the drop is made on, `copy` whether Option is
 * held, and `typing` whether the target is a row whose name is being typed. The rows that cannot
 * land (a root's own line, a folder into itself, a row already in the folder, a row below another
 * dragged row, which goes along with it) are left out, and when none is left the drop is nothing.
 */
export function dropVerdict(
    dragged: readonly DropRow[],
    target: DropRow,
    copy: boolean,
    typing: boolean
): DropVerdict {
    if (typing) return { kind: 'nothing' };
    const into = dropInto(target);
    const carried = dragged.filter((row) => row.path !== '');
    const items = carried.filter((row) => {
        if (row.root === into.root && row.kind === 'dir' && within(into.path, row.path)) {
            return false;
        }
        const parent = parentOf(row);
        if (parent !== null && parent.root === into.root && parent.path === into.path) {
            return false;
        }
        return !carried.some(
            (other) =>
                other !== row &&
                other.kind === 'dir' &&
                other.root === row.root &&
                within(row.path, other.path) &&
                row.path !== other.path
        );
    });
    if (items.length === 0) return { kind: 'nothing' };
    return {
        kind: copy ? 'copy' : 'move',
        into,
        items: items.map((row) => ({ root: row.root, path: row.path }))
    };
}

/** One thing dropped from outside the page: its name, and whether it is a folder. */
export type OutsideItem = { name: string; directory: boolean };

/** What a drop from outside the page comes to: the files to upload, and the folders refused. */
export type OutsideVerdict = { upload: number[]; refused: string[] };

/**
 * The indexes of the dropped things that are files, which are uploaded in the order dropped, and
 * the names of the folders among them, which are refused: a folder's files are not read.
 */
export function outsideVerdict(items: readonly OutsideItem[]): OutsideVerdict {
    return {
        upload: items.flatMap((one, at) => (one.directory ? [] : [at])),
        refused: items.filter((one) => one.directory).map((one) => one.name)
    };
}
