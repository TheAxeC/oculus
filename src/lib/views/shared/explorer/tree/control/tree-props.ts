// Layer 3, view partial of tree/Tree.svelte. What the explorer tree takes: its rows and roots, the
// selection and the record it is drawn for, what git and the Problems view say of a row, the
// workspace header, the callbacks of a press, a key and a pick, and what the Notes section hands in
// beyond the Files view. It is its own module, as ui/tree/item-props.ts is for a tree row, so the
// component holds the tree's markup and wiring and not the table of its properties.

import type { Snippet } from 'svelte';
import type { TreeNav } from '$lib/ui/tree/tree-keys';
import type { FsRoot, ProblemMark, RowRef, StatusFold, TreeRow } from '$lib/state/sources/fs';
import type { RowOrder } from './dragging.svelte';
import type { NamingHooks } from '../menu/row-ops';

export type TreeProps = {
    rows: TreeRow[];
    /** The roots the rows are under, for the absolute path a dragged row carries. */
    roots?: FsRoot[];
    /** Whether a filter draws the rows, which holds the folders it draws open. */
    filtering: boolean;
    selected: RowRef | null;
    /** The key of the record this tree is drawn for, which holds the name being typed. */
    owner: string;
    /** The root keys a removal refuses, so a configured root offers no remove control. */
    fixed: string[];
    /** The row keys a bookmark of the reader's own names. */
    marked: string[];
    /** What git says of the paths under the repositories the page carries. */
    fold?: StatusFold;
    /** What the Problems view counts for a row, null for a row with no error or warning. */
    problemOf?: (root: string, path: string, kind: 'file' | 'dir') => ProblemMark | null;
    /**
     * The workspace header, drawn as the first row of the tree; none for a tab that draws no
     * workspace (a following or a rooted one). `headerOpen` says whether the roots show.
     */
    header?: Snippet<[TreeNav]>;
    headerOpen?: boolean;
    /** A plain press or a key moved the cursor to a row. */
    onselect: (row: RowRef) => void;
    ontoggle: (row: TreeRow) => void;
    /**
     * Open one file. A single click asks for a preview tab, a double click for a kept one. A
     * press passes the time it was made at.
     */
    onopen: (row: TreeRow, preview: boolean, pressedAt?: number) => void;
    /** Open a file New File... made, as a kept tab; a tree given none leaves it unopened. */
    onmade?: (file: { root: string; path: string }) => void;
    onremove: (key: string) => void;
    onbookmark: (row: TreeRow) => void;
    /** The `..` row of a rooted tab was pressed: show this folder as the top. */
    onup?: (to: RowRef) => void;
    /**
     * Add folders to the workspace in force through the folder picker, the root menu's Add
     * Folder to Workspace...; none when the item is not offered.
     */
    onaddroot?: () => void;
    /**
     * The keys of the roots the reader may move, in the order written, and the write of a new
     * order of them; a tree given none moves no root.
     */
    order?: string[];
    onreorder?: (keys: string[]) => void;
    /** Alt+Up or Alt+Down on the workspace header row moves the tree's section. */
    onmoveheader?: (direction: 'up' | 'down') => void;
    /**
     * Say a pick's refusal on the caller's own line, the empty text when it ends; a tree given
     * none says it above its rows. `told` is true for a result that went through whole.
     */
    onrefused?: (note: string, told: boolean) => void;
    /** The order the caller keeps its rows in; none for a tree whose rows the disk orders. */
    rowOrder?: RowOrder;
    /** What a typed name makes beyond what the Files tree makes. */
    naming?: NamingHooks;
    /** Controls a row draws beside its own, handed the row and the tabindex they take. */
    rowActions?: Snippet<[TreeRow, number]>;
    /** Read again what a row that is a sentence says could not be read. */
    onretry?: () => void;
};
