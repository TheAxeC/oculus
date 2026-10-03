// Layer 2, client state, pure. Which roots and which folder a Files tab draws when it is not the
// workspace as it stands: a tab that follows the workspace of the selected session, and a tab
// rooted at one folder (Show in Files of a folder, Open Folder).
//
// A following tab draws the followed folder as the head of its own tree, read through the root
// that holds it. A rooted tab draws the folder its instance state names, with a row above the head
// that moves the head one folder up while it lies below the root serving it. Both draw no workspace
// header, since neither shows a workspace.
//
// The path rules come from data/helpers/files/paths.ts (`deepestHolding`).

import { deepestHolding } from '../../../../data/helpers/files/paths.ts';
import { isMap } from '../../../../data/helpers/guards.ts';
import { filesViewOf, patchedFilesView } from './files-view.ts';
import { parentOf, setExpanded, treeKey, type FsRoot, type RowRef, type TreeTop } from './place.ts';

/**
 * The root a folder lies in and its path inside that root, the deepest root holding it winning, or
 * null when no root holds it. A Files tab in follow mode shows the root holding the followed
 * session's workspace, and the composer's attach picker lists the workspace through the same root.
 */
export function rootHolding(roots: FsRoot[], dir: string): { root: FsRoot; path: string } | null {
    const found = deepestHolding(roots, (root) => root.dir, dir);
    return found === null ? null : { root: found.item, path: found.path };
}

/**
 * Whether a Files tab follows the workspace of the selected session: `follow: true` in its
 * instance's layout state, which the sessions arrangement gives its Files tab.
 */
export function followsSession(state: unknown): boolean {
    return isMap(state) && state.follow === true;
}

/** What a tree drawn from one folder shows: the root holding it, the roots drawn, and the head. */
export type FolderView = {
    found: { root: FsRoot; path: string } | null;
    /** The roots the tree draws: the one holding the folder, and none when no root does. */
    roots: FsRoot[];
    /** The folder as the head of the tree, which is then that folder and what is in it. */
    top: TreeTop | null;
};

/** What a Files tab's follow mode draws: the folder followed, and the view drawn from it. */
export type FollowView = FolderView & {
    following: boolean;
    dir: string | null;
};

/** The last segment of a folder, the name a tree drawn from it shows on its head. */
function folderName(dir: string): string {
    const trimmed = dir.endsWith('/') && dir.length > 1 ? dir.slice(0, -1) : dir;
    const at = trimmed.lastIndexOf('/');
    return at < 0 ? trimmed : trimmed.slice(at + 1);
}

/**
 * The tree of one folder given as an absolute path: the root that holds it, read through that root
 * alone, and the folder as the head of the tree, named by its last segment (a folder that is itself
 * a root has the path empty). A folder no root holds has no root and no head. The follow mode of a
 * Files tab and the file tree of a project card both draw a folder this way.
 */
export function folderView(roots: FsRoot[], dir: string): FolderView {
    const found = rootHolding(roots, dir);
    if (found === null) return { found: null, roots: [], top: null };
    return {
        found,
        roots: [found.root],
        top: { path: found.path, name: folderName(dir) }
    };
}

/**
 * The follow mode of one Files tab, from its layout state, its workspace's roots and a folder: the
 * tree is the followed folder itself, as the head of its own tree, read through the root that holds
 * it.
 */
export function followView(state: unknown, roots: FsRoot[], dir: string | null): FollowView {
    if (!followsSession(state)) {
        return { following: false, dir: null, found: null, roots, top: null };
    }
    if (dir === null) return { following: true, dir, found: null, roots: [], top: null };
    return { following: true, dir, ...folderView(roots, dir) };
}

/**
 * The folder follow mode shows for the selection: a session's workspace, else its folder, else a
 * selected terminal's folder, and null when nothing selected names one.
 */
export function followedDirOf(
    session: { workspace: string; cwd?: string | null } | null,
    terminal: { cwd: string } | null
): string | null {
    const dir =
        session !== null
            ? session.workspace === ''
                ? (session.cwd ?? '')
                : session.workspace
            : (terminal?.cwd ?? '');
    return dir === '' ? null : dir;
}

/** A tab's layout state with follow mode set on or off, the rest of it kept. */
export function withFollow(state: unknown, on: boolean): Record<string, unknown> {
    return { ...(isMap(state) ? state : {}), follow: on };
}

/**
 * A tab's layout state pinned to one session or terminal, which it then follows instead of the
 * selection, or with its pin taken away for null; follow mode stays on either way.
 */
export function withFollowPin(state: unknown, session: string | null): Record<string, unknown> {
    const kept: Record<string, unknown> = { ...withFollow(state, true) };
    delete kept.session;
    return session === null ? kept : { ...kept, session };
}

/** A tab's instance state with the followed folder, the head of its tree, open. */
export function followRevealed(held: unknown, found: { root: FsRoot; path: string }): object {
    const key = treeKey(found.root.key, found.path);
    return patchedFilesView(held, {
        expanded: setExpanded(filesViewOf(held).expanded, key, true)
    });
}

/**
 * What a Files tab draws when it is rooted at a folder: the one root holding the folder, the
 * folder as the head of the tree, and the folder the row above the head moves to (none at the
 * root's own top). A tab not rooted draws the workspace's roots as they are. A rooted tab whose
 * root the workspace no longer has draws nothing.
 */
export type RootedView = {
    rooted: boolean;
    roots: FsRoot[];
    top: TreeTop | null;
    up: RowRef | null;
};

/** The rooted view of one tab, from the folder its instance state names and the roots in force. */
export function rootedView(top: RowRef | null, roots: FsRoot[]): RootedView {
    if (top === null) return { rooted: false, roots, top: null, up: null };
    const root = roots.find((one) => one.key === top.root);
    if (root === undefined) return { rooted: true, roots: [], top: null, up: null };
    const at = top.path.lastIndexOf('/');
    const name = top.path === '' ? root.key : top.path.slice(at + 1);
    return {
        rooted: true,
        roots: [root],
        top: { path: top.path, name },
        up: parentOf(top)
    };
}

/**
 * A tab's instance state rooted at a folder: the folder is its top, open and selected, and the
 * filter that would hide it is cleared. The rest of the state is kept.
 */
export function rootedState(held: unknown, top: RowRef): object {
    const kept = filesViewOf(held);
    return patchedFilesView(held, {
        top: { root: top.root, path: top.path },
        expanded: setExpanded(kept.expanded, treeKey(top.root, top.path), true),
        selected: { root: top.root, path: top.path },
        selection: [],
        filter: ''
    });
}
