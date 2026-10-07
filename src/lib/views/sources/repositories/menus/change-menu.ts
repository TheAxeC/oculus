// Layer 3, view partial. The right-click menus of the Changes section of the Repositories view, as
// VS Code's git extension builds them: a changed file's by its group, and a group head's. Each item
// is one the row's or the head's own controls already offer, and a pick runs the function that
// control calls, a Discard behind the question the row's Discard control asks.
//
// A folder row of the tree mode offers the actions of its group over every path under it: Unstage
// in Staged, Stage and Discard in Changes, Stage in Untracked.
//
// The merge group keeps its own controls and gets no menu. Discard Changes on an untracked path is
// not a restore, which git has no form for: the path goes to the Trash (`trashUntracked`) behind
// the question VS Code asks, and a tracked path is restored as before. Open File (HEAD) offers the
// version HEAD holds, for a Staged row and a Changes row alike; an untracked path has none. Compare
// with Workspace is offered on a linked worktree's rows and is a read. While a write is in flight
// on the repository its controls are disabled, so the menus offer no write either.
//
// The items are pure functions of the group, so which items a row offers is asserted without a DOM,
// and the words come in as `t` so every label is a catalog key.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

type Words = (key: string, ...args: (string | number)[]) => string;

/** A group of changes a row menu is built for; the merge group has none. */
export type MenuGroupId = 'changed' | 'staged' | 'untracked';

export const CHANGE_OPEN_CHANGES = 'open-changes';
export const CHANGE_OPEN_HEAD = 'open-head';
export const CHANGE_OPEN_FILE = 'open-file';
export const CHANGE_STAGE = 'stage';
export const CHANGE_UNSTAGE = 'unstage';
export const CHANGE_DISCARD = 'discard';
export const CHANGE_IGNORE = 'ignore';
export const CHANGE_COMPARE_WORKSPACE = 'compare-workspace';
export const CHANGE_REVEAL = 'reveal';

export const GROUP_STAGE_ALL = 'stage-all';
export const GROUP_DISCARD_ALL = 'discard-all';
export const GROUP_UNSTAGE_ALL = 'unstage-all';
export const GROUP_STAGE_UNTRACKED = 'stage-untracked';
export const GROUP_DISCARD_UNTRACKED = 'discard-untracked';

/** Whether a group of the Changes section has a row menu. */
export function hasMenu(group: string): group is MenuGroupId {
    return group === 'changed' || group === 'staged' || group === 'untracked';
}

/**
 * A changed file's items: Open Changes (a diff, which an untracked file has none of), Open File
 * (HEAD) (the version it is compared against, which an untracked file has none of) and Open File,
 * then Stage Changes or Unstage Changes and, outside Staged, Discard Changes and Add to
 * .gitignore, then Reveal in Explorer View, then, on a linked worktree, Compare with Workspace.
 */
export function changeMenu(
    group: MenuGroupId,
    busy: boolean,
    t: Words,
    linked = false
): MenuItem[] {
    const item = (id: string, label: string): MenuItem => ({ id, label });
    const writes: MenuItem[] = busy
        ? []
        : group === 'staged'
          ? [item(CHANGE_UNSTAGE, t('repositories.menu_unstage'))]
          : [
                item(CHANGE_STAGE, t('repositories.menu_stage')),
                item(CHANGE_DISCARD, t('repositories.menu_discard')),
                item(CHANGE_IGNORE, t('repositories.menu_ignore'))
            ];
    return grouped([
        [
            ...(group === 'untracked'
                ? []
                : [
                      item(CHANGE_OPEN_CHANGES, t('repositories.menu_open_changes')),
                      item(CHANGE_OPEN_HEAD, t('repositories.menu_open_head'))
                  ]),
            item(CHANGE_OPEN_FILE, t('repositories.open_file'))
        ],
        writes,
        [item(CHANGE_REVEAL, t('repositories.menu_reveal'))],
        linked ? [item(CHANGE_COMPARE_WORKSPACE, t('repositories.menu_compare_workspace'))] : []
    ]);
}

/**
 * A group head's items, the ones its controls offer: Stage All Changes and Discard All Changes on
 * Changes, Unstage All Changes on Staged, Stage All Untracked and Discard All Untracked Changes on
 * Untracked. A group with no path offers none, as its head draws no control then.
 */
export function groupMenu(group: MenuGroupId, count: number, busy: boolean, t: Words): MenuItem[] {
    if (busy || count === 0) return [];
    if (group === 'staged') return [{ id: GROUP_UNSTAGE_ALL, label: t('git.unstage_all') }];
    if (group === 'untracked') {
        return [
            { id: GROUP_STAGE_UNTRACKED, label: t('git.stage_all_untracked') },
            { id: GROUP_DISCARD_UNTRACKED, label: t('git.discard_all_untracked') }
        ];
    }
    return [
        { id: GROUP_STAGE_ALL, label: t('git.stage_all') },
        { id: GROUP_DISCARD_ALL, label: t('git.discard_all') }
    ];
}

/**
 * A folder row's items, the ones its controls offer over every path under the folder: Unstage
 * Changes in Staged, Stage Changes, Discard Changes and Add to .gitignore in Changes and in
 * Untracked.
 */
export function folderMenu(group: MenuGroupId, busy: boolean, t: Words): MenuItem[] {
    if (busy) return [];
    const item = (id: string, label: string): MenuItem => ({ id, label });
    if (group === 'staged') return [item(CHANGE_UNSTAGE, t('repositories.menu_unstage'))];
    return grouped([
        [item(CHANGE_STAGE, t('repositories.menu_stage'))],
        [
            item(CHANGE_DISCARD, t('repositories.menu_discard')),
            item(CHANGE_IGNORE, t('repositories.menu_ignore'))
        ]
    ]);
}

/** The question a control asks before a write: the words, and the label of its yes button. */
type Ask = (message: string, detail: string, act: () => void, confirm?: string) => void;

/** The calls a pick from a folder row's menu runs, and its Discard control's question. */
export type FolderDeps = {
    ask: Ask;
    stagePaths: (root: string, paths: readonly string[]) => void;
    unstagePaths: (root: string, paths: readonly string[]) => void;
    discardPaths: (root: string, paths: readonly string[]) => void;
    trashPaths: (root: string, paths: readonly string[]) => void;
    ignorePaths: (root: string, paths: readonly string[]) => void;
};

/** Ask before throwing away every change under a folder, naming how many paths and the folder. */
export function askDiscardFolder(
    target: { root: string; folder: string; paths: readonly string[] },
    deps: Pick<FolderDeps, 'ask' | 'discardPaths'>,
    t: Words
): void {
    const { root, folder, paths } = target;
    deps.ask(
        t('repositories.folder_discard_confirm', paths.length, folder),
        t('git.discard_all_detail'),
        () => {
            deps.discardPaths(root, paths);
        }
    );
}

/** The last segment of a repository-relative path, which is how the Trash question names it. */
function baseName(path: string): string {
    return (
        path
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? path
    );
}

/**
 * Ask before sending untracked paths to the Trash, VS Code's question: the base name for one path,
 * or `named` (a folder's name) when the paths are what a folder holds, the count for several, the
 * restore from the Trash in the detail, and Move to Trash on the button.
 */
export function askTrash(
    root: string,
    paths: readonly string[],
    deps: { ask: Ask; trash: (root: string, paths: readonly string[]) => void },
    t: Words,
    named?: string
): void {
    const name = named ?? (paths.length === 1 ? baseName(paths[0]) : undefined);
    deps.ask(
        name === undefined
            ? t('git.trash_confirm_many', paths.length)
            : t('git.trash_confirm', baseName(name)),
        name === undefined ? t('git.trash_detail_many') : t('git.trash_detail'),
        () => {
            deps.trash(root, paths);
        },
        t('git.trash_button')
    );
}

/** Run a pick from a folder row's menu. */
export function folderPicked(
    pick: string,
    target: { root: string; folder: string; paths: readonly string[]; group: string },
    deps: FolderDeps,
    t: Words
): void {
    if (pick === CHANGE_STAGE) deps.stagePaths(target.root, target.paths);
    else if (pick === CHANGE_UNSTAGE) deps.unstagePaths(target.root, target.paths);
    else if (pick === CHANGE_IGNORE) deps.ignorePaths(target.root, target.paths);
    else if (pick === CHANGE_DISCARD && target.group === 'untracked') {
        askTrash(
            target.root,
            target.paths,
            { ask: deps.ask, trash: deps.trashPaths },
            t,
            target.folder
        );
    } else if (pick === CHANGE_DISCARD) askDiscardFolder(target, deps, t);
}

/** The calls a pick runs: the Source Control store's, the view's question and the Files view's. */
export type ChangeDeps = {
    ask: Ask;
    openChange: (root: string, group: string, path: string) => void;
    openHead: (root: string, group: string, path: string) => void;
    openFile: (root: string, path: string) => void;
    stage: (root: string, path: string) => void;
    unstage: (root: string, path: string) => void;
    discard: (root: string, path: string) => void;
    trash: (root: string, paths: readonly string[]) => void;
    ignore: (root: string, paths: readonly string[]) => void;
    compareWorkspace: (root: string, group: string, path: string) => void;
    reveal: (root: string, path: string) => void;
};

/** Ask before throwing one path's change away, as the row's Discard control asks. */
function askDiscard(
    root: string,
    path: string,
    deps: Pick<ChangeDeps, 'ask' | 'discard'>,
    t: Words
): void {
    deps.ask(t('git.discard_confirm', path), t('git.discard_detail'), () => {
        deps.discard(root, path);
    });
}

/**
 * Ask before throwing away the changes to some paths, as the row's Discard control asks: the
 * question of one path when there is one, the question of Discard All Changes with the count when
 * there are several.
 */
export function askDiscardPaths(
    root: string,
    paths: readonly string[],
    deps: Pick<FolderDeps, 'ask' | 'discardPaths'>,
    t: Words
): void {
    if (paths.length === 1) {
        askDiscard(
            root,
            paths[0],
            { ask: deps.ask, discard: (at, path) => deps.discardPaths(at, [path]) },
            t
        );
        return;
    }
    deps.ask(t('git.discard_all_confirm', paths.length), t('git.discard_detail'), () => {
        deps.discardPaths(root, paths);
    });
}

/** Run a pick from a changed file's menu. */
export function changePicked(
    pick: string,
    row: { root: string; group: string; path: string },
    deps: ChangeDeps,
    t: Words
): void {
    const { root, group, path } = row;
    if (pick === CHANGE_OPEN_CHANGES) deps.openChange(root, group, path);
    else if (pick === CHANGE_OPEN_HEAD) deps.openHead(root, group, path);
    else if (pick === CHANGE_OPEN_FILE) deps.openFile(root, path);
    else if (pick === CHANGE_STAGE) deps.stage(root, path);
    else if (pick === CHANGE_UNSTAGE) deps.unstage(root, path);
    else if (pick === CHANGE_IGNORE) deps.ignore(root, [path]);
    else if (pick === CHANGE_COMPARE_WORKSPACE) deps.compareWorkspace(root, group, path);
    else if (pick === CHANGE_DISCARD && group === 'untracked') askTrash(root, [path], deps, t);
    else if (pick === CHANGE_DISCARD) askDiscard(root, path, deps, t);
    else if (pick === CHANGE_REVEAL) deps.reveal(root, path);
}
