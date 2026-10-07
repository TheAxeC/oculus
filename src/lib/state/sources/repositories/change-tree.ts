// Layer 2, client state. The tree mode of a change group: how a list of changed paths falls into
// folder rows and file rows, what a folder row is called in the instance's closed list, which
// rows stay after a folder is closed, and which closed folders of a repository still name a folder.
//
// It also holds the rows of a repository as the keyboard walks them (`repositoryKeyRows`,
// `repoListRows`) and the change groups they are drawn in (`changeGroups`).
//
// An untracked folder that git lists as a whole (`newdir/`, from `--untracked-files=normal`) is one
// file row named for the folder, not a folder row holding a row without a name.
//
// A folder row is made for a folder that holds a file or more than one child; a chain of folders
// that each hold one folder and nothing else is one row named by the joined path (`a/b/c`), as
// VS Code compacts folders. Files at the root of a group make no folder row. Folders come before
// files, each sorted by name with the case and the accent ignored, ties broken by code unit.

import type { GitEntry, GitState } from '../../../data/model/index.ts';

/** A folder row: its name (the joined chain), its whole path, its depth and every path below it. */
export type FolderRow = {
    kind: 'folder';
    name: string;
    path: string;
    depth: number;
    paths: string[];
};

/** A file row: its name, its path, its depth and the entry it stands for. */
export type FileRow<E> = { kind: 'file'; name: string; path: string; depth: number; entry: E };

export type TreeRow<E> = FolderRow | FileRow<E>;

/** The groups the tree mode draws; the merge group stays a list. */
export const TREE_GROUPS = ['staged', 'changed', 'untracked'] as const;

type Node<E> = { name: string; dirs: Map<string, Node<E>>; files: { name: string; entry: E }[] };

/**
 * Order by base letter, then by code unit, so `A` comes before `a` and a letter before its accented
 * form.
 */
function byName(a: string, b: string): number {
    const base = a.localeCompare(b, 'en', { sensitivity: 'base' });
    if (base !== 0) return base;
    return a < b ? -1 : a > b ? 1 : 0;
}

/** Whether a path names a whole folder, which git lists with a slash at its end. */
export function isFolderPath(path: string): boolean {
    return path.endsWith('/');
}

/** A path without the slash that ends a folder's, so its last part is the folder's name. */
function bare(path: string): string {
    return isFolderPath(path) ? path.slice(0, -1) : path;
}

/** The last part of a path, which a row is named by: `newdir` for the folder `a/newdir/`. */
export function leafOf(path: string): string {
    const whole = bare(path);
    return whole.slice(whole.lastIndexOf('/') + 1);
}

/** The folder and file rows of a group's entries, in the order they are drawn. */
export function changeTree<E extends { path: string }>(entries: readonly E[]): TreeRow<E>[] {
    const top: Node<E> = { name: '', dirs: new Map(), files: [] };
    for (const entry of entries) {
        const parts = bare(entry.path).split('/');
        const name = parts.pop() ?? entry.path;
        let node = top;
        for (const part of parts) {
            let next = node.dirs.get(part);
            if (next === undefined) {
                next = { name: part, dirs: new Map(), files: [] };
                node.dirs.set(part, next);
            }
            node = next;
        }
        node.files.push({ name, entry });
    }
    const rows: TreeRow<E>[] = [];
    const emit = (node: Node<E>, depth: number, base: string): void => {
        const folders = [...node.dirs.values()].sort((a, b) => byName(a.name, b.name));
        for (const folder of folders) {
            let last = folder;
            let name = folder.name;
            while (last.files.length === 0 && last.dirs.size === 1) {
                last = [...last.dirs.values()][0];
                name = `${name}/${last.name}`;
            }
            const path = base === '' ? name : `${base}/${name}`;
            const at = rows.length;
            rows.push({ kind: 'folder', name, path, depth, paths: [] });
            emit(last, depth + 1, path);
            (rows[at] as FolderRow).paths = rows
                .slice(at + 1)
                .filter((row): row is FileRow<E> => row.kind === 'file')
                .map((row) => row.path);
        }
        const files = [...node.files].sort((a, b) => byName(a.name, b.name));
        for (const file of files) {
            const path = base === '' ? file.name : `${base}/${file.name}`;
            const whole = isFolderPath(file.entry.path) ? `${path}/` : path;
            rows.push({ kind: 'file', name: file.name, path: whole, depth, entry: file.entry });
        }
    };
    emit(top, 0, '');
    return rows;
}

/** The folder a path sits in, which a list row says after the file's name; empty at the root. */
export function dirOf(path: string): string {
    const whole = bare(path);
    const at = whole.lastIndexOf('/');
    return at < 0 ? '' : whole.slice(0, at);
}

/** The id a folder row has in the instance's closed list, apart in each group and repository. */
export function folderId(root: string, group: string, path: string): string {
    return `dir:${root}:${group}:${path}`;
}

/** The paths of the folder rows among some rows. */
export function folderPathsOf<E>(rows: readonly TreeRow<E>[]): string[] {
    return rows.filter((row) => row.kind === 'folder').map((row) => row.path);
}

/**
 * The rows that stay drawn when the folders `isClosed` names are closed: none of their contents.
 */
export function visibleRows<E>(
    rows: readonly TreeRow<E>[],
    isClosed: (folderPath: string) => boolean
): TreeRow<E>[] {
    const shown: TreeRow<E>[] = [];
    let hiding = -1;
    for (const row of rows) {
        if (hiding >= 0 && row.depth > hiding) continue;
        hiding = -1;
        shown.push(row);
        if (row.kind === 'folder' && isClosed(row.path)) hiding = row.depth;
    }
    return shown;
}

/**
 * Whether the focused row is inside the folder `folderPath` of a group, not the folder itself.
 * `filePrefix` is what the ids of the group's file rows begin with before the path: a change
 * group's rows begin with `change:<group>:`, the files of a graph commit with
 * `file:<place>:<hash>:`.
 */
export function insideFolder(
    focusId: string,
    root: string,
    group: string,
    folderPath: string,
    filePrefix = `change:${group}:`
): boolean {
    return (
        focusId.startsWith(`${filePrefix}${folderPath}/`) ||
        focusId.startsWith(`${folderId(root, group, folderPath)}/`)
    );
}

/**
 * The closed list without the folder ids of `root`'s commits other than `commit`, the one whose
 * files the Graph has open (the empty string for none). A folder of a commit's files is named
 * `dir:<root>:commit-<place>-<hash>:<path>`, and a commit that is not open has no folder rows.
 */
export function withoutClosedCommits(
    collapsed: readonly string[],
    root: string,
    commit: string
): string[] {
    const prefix = `dir:${root}:commit-`;
    return collapsed.filter((id) => {
        if (!id.startsWith(prefix)) return true;
        const hash = /^[a-z]+-([0-9a-f]+):/.exec(id.slice(prefix.length));
        return hash === null || hash[1] === commit;
    });
}

/**
 * The closed list without a folder id of `root` in a change group whose folder is in none of the
 * entries of that group, and without the folder ids of `root`'s commits other than `commit`.
 */
export function prunedCollapsed(
    collapsed: readonly string[],
    root: string,
    git: GitState,
    commit: string
): string[] {
    const alive = new Set<string>();
    const groups = { staged: git.staged, changed: git.unstaged, untracked: git.untracked };
    for (const group of TREE_GROUPS) {
        for (const path of folderPathsOf(changeTree(groups[group]))) {
            alive.add(folderId(root, group, path));
        }
    }
    const prefixes = TREE_GROUPS.map((group) => folderId(root, group, ''));
    return withoutClosedCommits(collapsed, root, commit).filter(
        (id) => !prefixes.some((prefix) => id.startsWith(prefix)) || alive.has(id)
    );
}

/**
 * The change groups in the order they are drawn, with the entries each holds: Merge Changes first,
 * as VS Code draws it, then staged, changed and untracked. Only Changes is drawn while it holds no
 * entry.
 */
export function changeGroups(git: GitState): { id: string; entries: GitEntry[] }[] {
    const groups = [
        { id: 'merge', entries: git.conflicted },
        { id: 'staged', entries: git.staged },
        { id: 'changed', entries: git.unstaged },
        { id: 'untracked', entries: git.untracked }
    ];
    // An empty merge, staged or untracked group says nothing a reader acts on, so it is not drawn;
    // Changes keeps its head with no rows, as VS Code's does.
    return groups.filter((group) => group.id === 'changed' || group.entries.length > 0);
}

/**
 * One row of the keyboard's order: its id, the row it sits under, whether it is open, and whether
 * it is held as it is drawn, so a key never opens or closes it.
 */
export type KeyRow = { id: string; parent: string | null; open?: boolean; fixed?: boolean };

/**
 * The rows of the Repositories section as its keyboard reads them: its head, and under it while it
 * is open one row per repository.
 */
export function repoListRows(roots: readonly string[], collapsed: readonly string[]): KeyRow[] {
    const open = !collapsed.includes('repos');
    const rows: KeyRow[] = [{ id: 'repos', parent: null, open }];
    if (open) for (const root of roots) rows.push({ id: `repo:${root}`, parent: 'repos' });
    return rows;
}

/** The key rows of one group in tree mode: its folder rows and file rows that stay drawn. */
function treeKeyRows(
    group: string,
    entries: readonly GitEntry[],
    collapsed: readonly string[],
    root: string
): KeyRow[] {
    const closed = (path: string): boolean => collapsed.includes(folderId(root, group, path));
    const rows: KeyRow[] = [];
    const folders: string[] = [];
    for (const row of visibleRows(changeTree(entries), closed)) {
        const parent = row.depth === 0 ? `group:${group}` : folders[row.depth - 1];
        if (row.kind === 'folder') {
            const id = folderId(root, group, row.path);
            folders[row.depth] = id;
            rows.push({ id, parent, open: !closed(row.path) });
        } else {
            rows.push({ id: `change:${group}:${row.path}`, parent });
        }
    }
    return rows;
}

/**
 * The rows of one repository as its keyboard reads them (ui/tree/tree-keys.ts's KeyRow), in the
 * order the view draws them: each section head, and under an open one its groups and rows. A line
 * that only says something (a section is empty, the .gitignore lacks the rule) and the lines a name
 * is typed into are not among them.
 */
export function repositoryKeyRows(
    git: GitState,
    collapsed: string[],
    graph: readonly KeyRow[] = [],
    tree?: { root: string; mode: 'list' | 'tree' }
): KeyRow[] {
    const rows: KeyRow[] = [];
    const head = (id: string): boolean => {
        const open = !collapsed.includes(id);
        rows.push({ id, parent: null, open });
        return open;
    };
    const under = (parent: string, ids: string[]): void => {
        for (const id of ids) rows.push({ id, parent });
    };
    if (head('changes')) {
        for (const group of changeGroups(git)) {
            const open = !collapsed.includes(group.id);
            rows.push({ id: `group:${group.id}`, parent: 'changes', open });
            if (open && tree?.mode === 'tree' && group.id !== 'merge') {
                rows.push(...treeKeyRows(group.id, group.entries, collapsed, tree.root));
            } else if (open) {
                under(
                    `group:${group.id}`,
                    group.entries.map((entry) => `change:${group.id}:${entry.path}`)
                );
            }
        }
    }
    // The graph's rows are read on demand, so the view hands in the rows it has drawn, each under
    // the section or under the commit whose files it is.
    if (head('graph')) rows.push(...graph);
    if (head('stashes'))
        under(
            'stashes',
            git.stashes.map((stash) => `stash:${stash.ref}`)
        );
    if (head('tags'))
        under(
            'tags',
            git.tags.map((tag) => `tag:${tag.name}`)
        );
    if (head('branches'))
        under(
            'branches',
            git.branches.map((branch) => `branch:${branch.name}`)
        );
    if (head('worktrees')) {
        under(
            'worktrees',
            git.worktrees.filter((one) => !one.main).map((tree) => `worktree:${tree.path}`)
        );
    }
    return rows;
}
