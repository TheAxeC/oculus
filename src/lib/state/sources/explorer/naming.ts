// Layer 2, client state, pure. The pending name of the Files view: the row where a reader types the
// name of a new file or folder, or a new name for a row. It is part of the view's own state, so a
// tree left with a name half typed is the same tree after a switch of tab, and the virtualised tree
// draws it as a row of treeRows() like any other.
//
// The record is parsed by fs.ts's filesViewOf, with the rest of the view's state. A new item is a
// row under its folder, the first of that folder's rows, whose path is the folder's path with a
// trailing `/` so it can be the key of no real entry. A rename is the row it renames, drawn with
// its name replaced by the input. Starting either opens the folders the row sits under, so the row
// is drawn, and clears the filter, since the rows a filter draws are not the tree's.

import { ancestorsOf, setExpanded, treeKey, type RowRef } from '../fs.ts';

/** What the reader is naming: a new file, a new folder, or a row that is being renamed. */
export type Naming = { mode: 'file' | 'folder' | 'rename'; root: string; path: string };

/** The path the row of a new item is drawn at: the folder's, with a `/` after it. */
export function pendingPath(folder: string): string {
    return `${folder}/`;
}

/**
 * The part of the view's state that starting a name changes: the pending name itself, the filter
 * cleared, and every folder above the row open. A new item is made in `row`, a rename is of `row`.
 */
export function namingStarted(
    expanded: string[],
    mode: Naming['mode'],
    row: RowRef
): { naming: Naming; filter: string; expanded: string[] } {
    const above = mode === 'rename' ? ancestorsOf(row) : [...ancestorsOf(row), row];
    const open = above.reduce(
        (kept, one) => setExpanded(kept, treeKey(one.root, one.path), true),
        expanded
    );
    return {
        naming: { mode, root: row.root, path: row.path },
        filter: '',
        expanded: open
    };
}
