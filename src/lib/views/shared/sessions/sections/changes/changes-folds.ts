// Layer 3, view helper of ChangesSection.svelte beside it. The rows of a session's Changes section
// as its tree walks them, and the ids its group rows fold under in the tab's folds
// (views/shared/card/pane-fold.ts, under `folded`).
//
// The section's tree holds two group rows under its head: `touched`, over the files the session
// touched (`file:<path>`), and `repository`, over the repository's change groups, whose rows are
// the ones the Repositories view walks (state/sources/repositories/change-tree.ts
// `changeGroupRows`): `group:<group>`, `change:<group>:<path>` and, in tree mode, the folder rows
// `dir:<root>:<group>:<path>`. A group row folds under an id of its own, which starts with
// `changes:` so it meets no fold of the session list (a workspace's absolute path, `list`,
// `terminals` or the empty key) and no row id of the tree: `changes:touched`,
// `changes:repository`, `changes:group:<group>` and `changes:folder:<group>:<path>`. The ids name
// no session, so a fold holds for every session the tab shows.

import type { KeyRow } from '$lib/ui/tree/tree-keys';
import { changeGroupRows, type GroupFolds } from '$lib/state/sources/repositories/change-tree';
import type { GitState } from '$lib/state/client/selectors.svelte';
import { rowKey } from '../session-sections';

/** The tree row of the files the session touched, and the id it folds under. */
export const TOUCHED_ROW = 'touched';
const TOUCHED_FOLD = 'changes:touched';

/** The tree row of the repository the session works in, and the id it folds under. */
export const REPOSITORY_ROW = 'repository';
const REPOSITORY_FOLD = 'changes:repository';

const GROUP_ROW = 'group:';
const FOLDER_ROW = 'dir:';

function groupFold(group: string): string {
    return `changes:group:${group}`;
}

function folderFold(group: string, path: string): string {
    return `changes:folder:${group}:${path}`;
}

/** The folds of the section's change groups, by their own ids in the tab's folds. */
export function changesFolds(folded: (id: string) => boolean): GroupFolds {
    return { group: groupFold, folder: folderFold, folded };
}

/** Whether the group row over the touched files is open. */
export function touchedOpen(folded: (id: string) => boolean): boolean {
    return !folded(TOUCHED_FOLD);
}

/** Whether the group row over the repository is open. */
export function repositoryOpen(folded: (id: string) => boolean): boolean {
    return !folded(REPOSITORY_FOLD);
}

/**
 * The fold id of a row of the section's tree that opens, for the repository at `root`; null for a
 * row that does not fold. A folder row's id carries the repository and the group before the path,
 * and a group's name holds no colon, so the path is the rest.
 */
export function foldOfRow(id: string, root: string): string | null {
    if (id === TOUCHED_ROW) return TOUCHED_FOLD;
    if (id === REPOSITORY_ROW) return REPOSITORY_FOLD;
    if (id.startsWith(GROUP_ROW)) return groupFold(id.slice(GROUP_ROW.length));
    const prefix = `${FOLDER_ROW}${root}:`;
    if (!id.startsWith(prefix)) return null;
    const rest = id.slice(prefix.length);
    const at = rest.indexOf(':');
    if (at < 0) return null;
    return folderFold(rest.slice(0, at), rest.slice(at + 1));
}

/** What the section's rows are made of. */
type ChangesInput = {
    /** The paths of the files the session touched, in the order they are drawn. */
    files: readonly string[];
    /** The repository's state while git has read it, else null. */
    git: GitState | null;
    root: string;
    mode: 'list' | 'tree';
    folded: (id: string) => boolean;
};

/**
 * The section's rows under its head as the keyboard reads them: the touched files' group row and,
 * while it is open, its files; the repository's group row and, while it is open and readable, its
 * change groups. The branch line, the new-branch field and the commit box are not rows, so the
 * arrows pass them by and Tab reaches them.
 */
export function changesRows(input: ChangesInput): KeyRow[] {
    const { files, git, root, mode, folded } = input;
    const touched = touchedOpen(folded);
    const repository = repositoryOpen(folded);
    const rows: KeyRow[] = [{ id: TOUCHED_ROW, parent: 'head', open: touched }];
    if (touched) {
        rows.push(...files.map((path) => ({ id: rowKey('file', path), parent: TOUCHED_ROW })));
    }
    rows.push({ id: REPOSITORY_ROW, parent: 'head', open: repository });
    if (repository && git !== null) {
        rows.push(...changeGroupRows(git, REPOSITORY_ROW, changesFolds(folded), { root, mode }));
    }
    return rows;
}
