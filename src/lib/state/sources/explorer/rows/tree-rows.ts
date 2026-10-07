// Layer 2, client state, pure. The lines of the file browser's tree. The tree is a flat list rather
// than a component that renders itself: a row carries its depth, so one `each` draws the whole tree
// and the view holds no recursion; and because the list is computed from the listings the server
// answered and the set of open folders, what is on screen is state rather than what some component
// last did to the DOM.
//
// A line is a root, a folder, a file, a file nested under another file (nesting.ts), a run of
// folders drawn as one line (compact.ts), the pending line of a name being typed, or the line above
// a rooted tab's head that moves it up.

import type { NestingRule } from '../../../../data/helpers/files/nesting.ts';
import type { Naming } from '../naming.ts';
import {
    childPath,
    parentOf,
    rowKey,
    treeKey,
    type ChainStep,
    type FsEntry,
    type FsRoot,
    type RowRef,
    type TreeRow,
    type TreeTop
} from '../view/place.ts';
import { compactChain, type HeldListing } from './compact.ts';
import { nestEntries } from './nesting.ts';

/**
 * What a tree is drawn with beyond the listings and the open folders: the listings as read, null
 * for a folder never read, which is what lets folders compact (without it none does); the nesting
 * rules, none for a tab with file nesting off; and the folder a rooted tab's `..` line moves to.
 */
export type RowOptions = {
    held?: HeldListing;
    nesting?: NestingRule[];
    up?: RowRef | null;
};

/** Whether the name being typed sits at a folder, as a new file or folder there. */
function newIn(naming: Naming | null, root: string, path: string): boolean {
    return (
        naming !== null && naming.mode !== 'rename' && naming.root === root && naming.path === path
    );
}

/** Whether the name being typed renames the folder at a path. */
function renaming(naming: Naming | null, root: string, path: string): boolean {
    return naming?.mode === 'rename' && naming.root === root && naming.path === path;
}

/**
 * The lines of the tree: every root, and under each open folder the entries the server answered for
 * it. A folder that is open but whose listing has not arrived contributes its own line and nothing
 * under it, so the tree grows as the answers land rather than waiting for all of them. The name
 * being typed (`naming`) is a row too: for a new file or folder the first row under its folder,
 * for a new presentation the first row under its folder holding the folder's name, and for a rename
 * the renamed row itself, each marked `editing`.
 *
 * A compacted line stands at the last folder of its run: its `path` and `name` are that folder's,
 * its `chain` lists every folder of the run, and it is open when that last folder is. A run stops
 * short of a folder whose name is being typed, so that folder keeps a line of its own to type in.
 */
export function treeRows(
    roots: FsRoot[],
    entriesOf: (root: string, path: string) => FsEntry[],
    expanded: string[],
    top: TreeTop | null = null,
    naming: Naming | null = null,
    options: RowOptions = {}
): TreeRow[] {
    const rows: TreeRow[] = [];
    const rules = options.nesting ?? [];
    const { held } = options;
    const blocked = (step: { from: string; to: string }, root: string): boolean =>
        [step.from, step.to].some((path) => renaming(naming, root, path)) ||
        newIn(naming, root, step.from);
    const entryRow = (
        root: string,
        entry: FsEntry,
        path: string,
        depth: number,
        children: FsEntry[],
        under?: string
    ): TreeRow => {
        const start: ChainStep = { name: entry.name, path };
        const chain =
            entry.kind === 'dir' && held !== undefined && entry.link !== true
                ? compactChain(root, start, held, (step) => blocked(step, root))
                : [start];
        const last = chain[chain.length - 1];
        const own = renaming(naming, root, last.path);
        // A line whose folder is being named inside it is drawn open, or the name could not be
        // seen.
        const named =
            chain.length === 1 &&
            naming?.mode === 'rename' &&
            naming.root === root &&
            parentOf(naming)?.path === last.path;
        const open =
            (entry.kind === 'dir' || children.length > 0) &&
            (expanded.includes(treeKey(root, last.path)) || named);
        return {
            root,
            path: last.path,
            name: last.name,
            kind: entry.kind,
            size: entry.size,
            ...(entry.link === true ? { link: true as const } : {}),
            ...(entry.ignored === true ? { ignored: true as const } : {}),
            ...(children.length > 0 ? { nests: true as const } : {}),
            ...(under !== undefined ? { under } : {}),
            ...(chain.length > 1 ? { chain } : {}),
            depth,
            open,
            ...(own ? { editing: 'rename' as const } : {})
        };
    };
    const walk = (root: string, path: string, depth: number, folder: string): void => {
        if (newIn(naming, root, path)) {
            rows.push({
                root,
                path: `${path}/`,
                name: naming?.mode === 'deck' ? folder : '',
                kind: naming?.mode === 'folder' ? 'dir' : 'file',
                size: 0,
                depth,
                open: false,
                editing: naming?.mode === 'deck' ? 'title' : 'new'
            });
        }
        for (const { entry, children } of nestEntries(entriesOf(root, path), rules, folder)) {
            const child = childPath(path, entry.name);
            const row = entryRow(root, entry, child, depth, children);
            rows.push(row);
            if (!row.open) continue;
            if (entry.kind === 'dir') {
                walk(root, row.path, depth + 1, row.name);
                continue;
            }
            for (const nested of children) {
                rows.push(
                    entryRow(root, nested, childPath(path, nested.name), depth + 1, [], child)
                );
            }
        }
    };
    if (options.up !== undefined && options.up !== null) {
        rows.push({
            root: options.up.root,
            path: options.up.path,
            name: '..',
            kind: 'dir',
            size: 0,
            depth: 0,
            open: false,
            up: true
        });
    }
    for (const root of roots) {
        const path = top?.path ?? '';
        const open = expanded.includes(treeKey(root.key, path));
        rows.push({
            root: root.key,
            path,
            name: top?.name ?? root.key,
            kind: 'dir',
            size: 0,
            depth: 0,
            open
        });
        if (open) walk(root.key, path, 1, top?.name ?? root.key);
    }
    return rows;
}

/**
 * One row as the tree's keyboard reads it: its key, the row it sits under, and whether it is open.
 */
export type KeyedRow = { id: string; parent: string | null; open?: boolean; fixed?: boolean };

/** The key of the workspace header, the row every root sits under in a tree that draws one. */
export const HEADER_ID = 'fs-header';

/**
 * The rows as the tree's keyboard reads them (ui/tree/tree-keys.ts's KeyRow): each row's key, the
 * key of the row it sits under, and whether a folder or a file with nested files is open. While a
 * filter draws the rows, a folder is open because the filter holds it so, and the keyboard steps
 * through it without opening or closing it, which is what leaves the reader's own open folders as
 * they were when the filter is cleared.
 */
export function treeKeyRows(rows: TreeRow[], filtering: boolean): KeyedRow[] {
    return rows.map((row) => {
        // A tree drawn from a folder inside its root has that folder as its head, with no parent.
        // A nested file sits under its parent file, and a compacted line under the folder its
        // first folder sits in.
        const above =
            row.depth === 0
                ? null
                : row.under !== undefined
                  ? { root: row.root, path: row.under }
                  : parentOf({ root: row.root, path: row.chain?.[0]?.path ?? row.path });
        return {
            id: rowKey(row),
            parent: above === null ? null : rowKey(above),
            open: row.kind === 'dir' || row.nests === true ? row.open : undefined,
            fixed: filtering
        };
    });
}

/**
 * The keyboard's rows with the workspace header first: the header is a row that opens, every root
 * sits under it, and a closed header leaves the keyboard its own row alone.
 */
export function withHeader(rows: readonly KeyedRow[], open: boolean): KeyedRow[] {
    const header: KeyedRow = { id: HEADER_ID, parent: null, open };
    if (!open) return [header];
    return [
        header,
        ...rows.map((row) => (row.parent === null ? { ...row, parent: HEADER_ID } : row))
    ];
}
