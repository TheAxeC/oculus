// Layer 3, view partial. The right-click menus of a repository row and of a worktree row of the
// Repositories view, as VS Code's Source Control builds them for a repository: a shell in the
// folder, and Reveal in Finder for a repository or Delete Worktree for a worktree. Each pick runs
// what the view already has: the Source Control store's shell, the open endpoint's reveal, and the
// removal of a worktree behind its question.
//
// A repository whose folder is gone offers nothing, since a shell and a reveal need the folder,
// and no removal is offered while a write is in flight on the repository, as its control is
// disabled then. The words come in as `t` so every label is a catalog key.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

type Words = (key: string, ...args: (string | number)[]) => string;

export const REPO_TERMINAL = 'terminal';
export const REPO_REVEAL = 'reveal';
export const WORKTREE_DELETE = 'delete-worktree';

/** A repository row's items, while its folder is there. */
export function repoRowMenu(present: boolean, t: Words): MenuItem[] {
    if (!present) return [];
    return [
        { id: REPO_TERMINAL, label: t('repositories.menu_terminal') },
        { id: REPO_REVEAL, label: t('repositories.menu_reveal_finder') }
    ];
}

/** A worktree row's items: its shell, and its removal while no write is in flight. */
export function worktreeMenu(busy: boolean, t: Words): MenuItem[] {
    return grouped([
        [{ id: REPO_TERMINAL, label: t('repositories.menu_terminal') }],
        busy ? [] : [{ id: WORKTREE_DELETE, label: t('repositories.menu_delete_worktree') }]
    ]);
}
