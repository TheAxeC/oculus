// Layer 3, view partial. The right-click menus of a repository row and of a worktree row of the
// Repositories view, as VS Code's Source Control builds them: a shell in the folder, Reveal in
// Finder (Open Containing Folder off macOS), Close Repository and Close Other Repositories for a
// repository; a shell, Claude and Codex started there, Open Worktree, Open Worktree in New Window
// and Delete Worktree for a worktree. Each pick runs what the view already has: the Source Control
// store's shell, the open endpoint's reveal, the repositories the view draws, the workspace's
// add-root write, and the removal of a worktree behind its question.
//
// A repository whose folder is gone offers no shell and no reveal, since they need the folder, but
// it can still be closed. Close Other Repositories is offered only while more than one repository
// is listed. No removal is offered while a write is in flight on the repository, as its control is
// disabled then. The words come in as `t` so every label is a catalog key.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

type Words = (key: string, ...args: (string | number)[]) => string;

export const REPO_TERMINAL = 'terminal';
export const REPO_REVEAL = 'reveal';
export const REPO_CLOSE = 'close';
export const REPO_CLOSE_OTHERS = 'close-others';
export const WORKTREE_OPEN = 'open';
export const WORKTREE_OPEN_WINDOW = 'open-window';
export const WORKTREE_DELETE = 'delete-worktree';
export const WORKTREE_CLAUDE = 'start-claude';
export const WORKTREE_CODEX = 'start-codex';

/** What a pick from a repository row's menu asks for. */
export type RepoPick = 'terminal' | 'reveal' | 'close' | 'close-others';

/** What a pick from a worktree row's menu asks for. */
export type WorktreePick = 'terminal' | 'claude' | 'codex' | 'open' | 'open-window' | 'delete';

/** A repository row's items; `listed` is how many repositories the view lists. */
export function repoRowMenu(present: boolean, listed: number, t: Words): MenuItem[] {
    return grouped([
        present
            ? [
                  { id: REPO_TERMINAL, label: t('repositories.menu_terminal') },
                  { id: REPO_REVEAL, label: t('repositories.menu_reveal_finder') }
              ]
            : [],
        [
            { id: REPO_CLOSE, label: t('repositories.menu_close_repository') },
            ...(listed > 1
                ? [{ id: REPO_CLOSE_OTHERS, label: t('repositories.menu_close_others') }]
                : [])
        ]
    ]);
}

/** The pick a repository row's item stands for, or null for an id it never gives. */
export function repoPick(id: string): RepoPick | null {
    if (id === REPO_TERMINAL) return 'terminal';
    if (id === REPO_REVEAL) return 'reveal';
    if (id === REPO_CLOSE) return 'close';
    return id === REPO_CLOSE_OTHERS ? 'close-others' : null;
}

/**
 * A worktree row's items: its shell, Claude and Codex started there, Open Worktree and Open
 * Worktree in New Window, and its removal while no write is in flight.
 */
export function worktreeMenu(busy: boolean, t: Words): MenuItem[] {
    return grouped([
        [
            { id: REPO_TERMINAL, label: t('repositories.menu_terminal') },
            { id: WORKTREE_CLAUDE, label: t('repositories.menu_start_claude') },
            { id: WORKTREE_CODEX, label: t('repositories.menu_start_codex') },
            { id: WORKTREE_OPEN, label: t('repositories.menu_open_worktree') },
            { id: WORKTREE_OPEN_WINDOW, label: t('repositories.menu_open_worktree_window') }
        ],
        busy ? [] : [{ id: WORKTREE_DELETE, label: t('repositories.menu_delete_worktree') }]
    ]);
}

/** The pick a worktree row's item stands for, or null for an id it never gives. */
export function worktreePick(id: string): WorktreePick | null {
    if (id === REPO_TERMINAL) return 'terminal';
    if (id === WORKTREE_CLAUDE) return 'claude';
    if (id === WORKTREE_CODEX) return 'codex';
    if (id === WORKTREE_OPEN) return 'open';
    if (id === WORKTREE_OPEN_WINDOW) return 'open-window';
    return id === WORKTREE_DELETE ? 'delete' : null;
}

/** The id of the quick pick row that reopens every closed repository. */
export const REOPEN_ALL = '*';

/** One row of the Reopen Closed Repositories quick pick. */
export type ClosedChoice = { id: string; label: string; rule?: true };

/**
 * The rows of the Reopen Closed Repositories quick pick: one per closed repository, named as the
 * list names it, and All Repositories after a rule when more than one is closed.
 */
export function closedChoices(
    closed: readonly string[],
    names: Record<string, string>,
    t: Words
): ClosedChoice[] {
    const rows: ClosedChoice[] = closed.map((root) => ({ id: root, label: names[root] ?? root }));
    if (closed.length > 1)
        rows.push({ id: REOPEN_ALL, label: t('repositories.reopen_all'), rule: true });
    return rows;
}
