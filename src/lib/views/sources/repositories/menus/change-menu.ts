// Layer 3, view partial. The right-click menus of the Changes section of the Repositories view, as
// VS Code's git extension builds them: a changed file's by its group, and a group head's. Each item
// is one the row's or the head's own controls already offer, and a pick runs the function that
// control calls, a Discard behind the question the row's Discard control asks.
//
// The merge group keeps its own controls and gets no menu. An untracked file offers no Discard: the
// server restores tracked paths only (server/git/git-write.ts, `discard`). While a write is in
// flight on the repository its controls are disabled, so the menus offer no write either.
//
// The items are pure functions of the group, so which items a row offers is asserted without a DOM,
// and the words come in as `t` so every label is a catalog key.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

type Words = (key: string, ...args: (string | number)[]) => string;

/** A group of changes a row menu is built for; the merge group has none. */
export type MenuGroupId = 'changed' | 'staged' | 'untracked';

export const CHANGE_OPEN_CHANGES = 'open-changes';
export const CHANGE_OPEN_FILE = 'open-file';
export const CHANGE_STAGE = 'stage';
export const CHANGE_UNSTAGE = 'unstage';
export const CHANGE_DISCARD = 'discard';
export const CHANGE_REVEAL = 'reveal';

export const GROUP_STAGE_ALL = 'stage-all';
export const GROUP_DISCARD_ALL = 'discard-all';
export const GROUP_UNSTAGE_ALL = 'unstage-all';
export const GROUP_STAGE_UNTRACKED = 'stage-untracked';

/** Whether a group of the Changes section has a row menu. */
export function hasMenu(group: string): group is MenuGroupId {
    return group === 'changed' || group === 'staged' || group === 'untracked';
}

/**
 * A changed file's items: Open Changes (a diff, which an untracked file has none of) and Open File,
 * then Stage Changes or Unstage Changes and, in Changes, Discard Changes, then Reveal in Explorer
 * View.
 */
export function changeMenu(group: MenuGroupId, busy: boolean, t: Words): MenuItem[] {
    const item = (id: string, label: string): MenuItem => ({ id, label });
    const writes: MenuItem[] = busy
        ? []
        : group === 'staged'
          ? [item(CHANGE_UNSTAGE, t('repositories.menu_unstage'))]
          : [
                item(CHANGE_STAGE, t('repositories.menu_stage')),
                ...(group === 'changed'
                    ? [item(CHANGE_DISCARD, t('repositories.menu_discard'))]
                    : [])
            ];
    return grouped([
        [
            ...(group === 'untracked'
                ? []
                : [item(CHANGE_OPEN_CHANGES, t('repositories.menu_open_changes'))]),
            item(CHANGE_OPEN_FILE, t('repositories.open_file'))
        ],
        writes,
        [item(CHANGE_REVEAL, t('repositories.menu_reveal'))]
    ]);
}

/**
 * A group head's items, the ones its controls offer: Stage All Changes and Discard All Changes on
 * Changes, Unstage All Changes on Staged, Stage All Untracked on Untracked. A group with no path
 * offers none, as its head draws no control then.
 */
export function groupMenu(group: MenuGroupId, count: number, busy: boolean, t: Words): MenuItem[] {
    if (busy || count === 0) return [];
    if (group === 'staged') return [{ id: GROUP_UNSTAGE_ALL, label: t('git.unstage_all') }];
    if (group === 'untracked') {
        return [{ id: GROUP_STAGE_UNTRACKED, label: t('git.stage_all_untracked') }];
    }
    return [
        { id: GROUP_STAGE_ALL, label: t('git.stage_all') },
        { id: GROUP_DISCARD_ALL, label: t('git.discard_all') }
    ];
}

/** The calls a pick runs: the Source Control store's, the view's question and the Files view's. */
export type ChangeDeps = {
    ask: (message: string, detail: string, act: () => void) => void;
    openChange: (root: string, group: string, path: string) => void;
    openFile: (root: string, path: string) => void;
    stage: (root: string, path: string) => void;
    unstage: (root: string, path: string) => void;
    discard: (root: string, path: string) => void;
    reveal: (root: string, path: string) => void;
};

/** Ask before throwing one path's change away, as the row's Discard control asks. */
export function askDiscard(
    root: string,
    path: string,
    deps: Pick<ChangeDeps, 'ask' | 'discard'>,
    t: Words
): void {
    deps.ask(t('git.discard_confirm', path), t('git.discard_detail'), () => {
        deps.discard(root, path);
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
    else if (pick === CHANGE_OPEN_FILE) deps.openFile(root, path);
    else if (pick === CHANGE_STAGE) deps.stage(root, path);
    else if (pick === CHANGE_UNSTAGE) deps.unstage(root, path);
    else if (pick === CHANGE_DISCARD) askDiscard(root, path, deps, t);
    else if (pick === CHANGE_REVEAL) deps.reveal(root, path);
}
