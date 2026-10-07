// Layer 2, client state, pure. The vocabulary the Files view's tree is addressed in: the keys of
// the two roots no workspace may drop, one entry of a listing, one line of the tree, and the
// functions that turn a root and a path into the key a row is known by, its parent, its ancestors
// and its absolute path. Every other module of the file browser reads rows through these.
//
// A row is addressed by its root's key and its path under that root; the empty path is the root's
// own line. A folder is open when its key is in the instance's set of open folders (`expanded`), so
// the set survives a reload and a tab switch, and the rows drawn are computed from it.

import { z } from 'zod';
import { fieldItemsShape, readAs } from '../../../../data/shapes/shapes.ts';

/** The root api/file serves the hub itself under, for a link that is a path inside the hub. */
export const HUB_ROOT = 'hub';

/**
 * The key the engine's own `config/` folder is served under, which is what the Settings view lists
 * and opens a file of. It is the client's half of the key lib/server/files/files.ts serves that
 * folder under, since nothing client-side may import a server module;
 * tests/routes/files/file.test.ts holds the two to one another.
 */
export const ENGINE_ROOT = 'engine';

/**
 * A path by its segments: the empty and the `.` ones dropped, and each `..` taking the segment
 * before it away, so `funding/x/`, `./funding//x` and `network/../funding/x` are one path. A `..`
 * with no segment before it is kept, which is how a path climbing above its root still says so.
 */
export function normalisePath(path: string): string {
    const kept: string[] = [];
    for (const part of path.split('/')) {
        if (part === '' || part === '.') continue;
        if (part === '..' && kept.length > 0 && kept[kept.length - 1] !== '..') {
            kept.pop();
            continue;
        }
        kept.push(part);
    }
    return kept.join('/');
}

/** One entry of one directory, as /api/fs answers it. */
export type FsEntry = {
    name: string;
    kind: 'file' | 'dir';
    size: number;
    mtime: number;
    /** True for a symbolic link, whose `kind` is that of what it points at. */
    link?: true;
    /** True for an entry git ignores, listed because the ignored toggle asks to see them. */
    ignored?: true;
};

/** One root as /api/fs answers it: `fixed` is a configured root, which a removal refuses. */
export type FsRoot = { key: string; dir: string; fixed: boolean };

/**
 * What a listing asks to see beside what the tree offers by default: the dotfiles and the build
 * folders (`hidden`), and the entries git ignores (`ignored`). A file browser's two toggles.
 */
export type ListingShown = { hidden: boolean; ignored: boolean };

/** What every listing shows unless a file browser's toggles ask for more. */
export const SHOWN_DEFAULT: ListingShown = { hidden: false, ignored: false };

/** One folder of a compacted row: its own name and its path under the root. */
export type ChainStep = { name: string; path: string };

/** One line of the tree: what it is, how deep it sits, and whether a folder is open. */
export type TreeRow = {
    root: string;
    /** The path under the root. The empty string is the root's own line. */
    path: string;
    name: string;
    kind: 'file' | 'dir';
    /** The file's size in bytes, and zero for a folder. */
    size: number;
    /** True for a symbolic link, whose `kind` is that of what it points at. */
    link?: true;
    depth: number;
    open: boolean;
    /**
     * Set on the row where a name is typed: `new` for the pending row of a new file or folder,
     * which has no name yet, `rename` for the row whose name the input replaces, and `title` for
     * the pending row of a new presentation, which holds the folder's name as the deck's title.
     */
    editing?: 'new' | 'rename' | 'title';
    /** True for an entry the listing marks as ignored by git. */
    ignored?: true;
    /** Set on a file with other files nested under it; `open` then says whether they are drawn. */
    nests?: true;
    /** The path of the file this row is nested under. */
    under?: string;
    /**
     * The folders a compacted row stands for, outermost first. The row's own `path` and `name` are
     * those of the last, which is the folder a press opens.
     */
    chain?: ChainStep[];
    /** The positions in `name` of the characters a fuzzy filter matched. */
    hits?: number[];
    /** Set on the row above a rooted tab's head, which moves the head one folder up. */
    up?: true;
};

/** How one open folder is addressed in the set of open folders, and in a listing's own cache. */
export function treeKey(root: string, path: string): string {
    return `${root}:${path}`;
}

/** The path of one entry under a folder. */
export function childPath(path: string, name: string): string {
    return path === '' ? name : `${path}/${name}`;
}

/** The one field of an instance's state that holds its open folders. */
const expandedHeldShape = z.object({ expanded: fieldItemsShape });

/**
 * The open folders an instance's state holds, which is what the tree remembers across a tab switch.
 */
export function expandedOf(state: unknown): string[] {
    return readAs(expandedHeldShape, state)?.expanded ?? [];
}

/** The same set with one folder opened or closed. */
export function toggleExpanded(expanded: string[], key: string): string[] {
    return expanded.includes(key) ? expanded.filter((one) => one !== key) : [...expanded, key];
}

/** The same set of open folders with one folder set open or closed, whatever it was before. */
export function setExpanded(expanded: string[], key: string, open: boolean): string[] {
    const rest = expanded.filter((one) => one !== key);
    return open ? [...rest, key] : rest;
}

/** One row as the tree addresses it: which root, and which path under it. */
export type RowRef = { root: string; path: string };

/** The key one row is addressed by among the rows, which is its key in the set of open folders. */
export function rowKey(row: RowRef): string {
    return treeKey(row.root, row.path);
}

/** The folder one path sits in, and null for a root's own line, which sits in nothing. */
export function parentOf(row: RowRef): RowRef | null {
    if (row.path === '') return null;
    const at = row.path.lastIndexOf('/');
    return { root: row.root, path: at < 0 ? '' : row.path.slice(0, at) };
}

/** The folders a row sits under, outermost first: the root's own line, then each folder down. */
export function ancestorsOf(row: RowRef): RowRef[] {
    const parts = row.path.split('/').filter((part) => part !== '');
    return parts.map((_, at) => ({ root: row.root, path: parts.slice(0, at).join('/') }));
}

/**
 * The open folders with every folder under one root closed, the root's own line left as it was;
 * with `from`, only the folders under that folder of the root, the folder's own line left as it
 * was.
 */
export function collapseRoot(expanded: string[], root: string, from = ''): string[] {
    const own = treeKey(root, from);
    const under = from === '' ? own : `${own}/`;
    return expanded.filter((key) => key === own || !key.startsWith(under));
}

/**
 * The folder a tree is drawn from when it is not its root's top: its path inside the root, and the
 * name its head row shows.
 */
export type TreeTop = { path: string; name: string };

/** The drag type a file row carries: its absolute path, for a drop target that takes a file. */
export const FILE_DRAG = 'application/x-oculus-file';

/**
 * The drag type a folder row carries: its absolute path. Only the Files tree takes it, so a drop
 * target that reads a file (the composer's prompt box) never sees a folder.
 */
export const FOLDER_DRAG = 'application/x-oculus-folder';
