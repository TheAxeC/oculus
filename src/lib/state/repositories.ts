// Layer 2, client state. What the Repositories view computes rather than draws: the addresses of
// the two diff reads, the identity of a diff pane, and the worktree rule the view and the write
// share.
//
// The worktree rule comes from data/worktrees.ts, the one place it lives, so the path the view shows
// before a worktree is made is the path the write makes. Nothing here fetches: the view owns its own
// requests, and these are the strings they are made from.

import { worktreePath, worktreesDir } from '../data/worktrees.ts';

export { validName, worktreePath, worktreesDir } from '../data/worktrees.ts';

/** The endpoint one file's diff is read from, staged or from the worktree. */
export function fileDiffUrl(root: string, path: string, staged: boolean): string {
    const parameters = new URLSearchParams({
        diff: root,
        path,
        staged: staged ? '1' : '0'
    });
    return `/api/git?${parameters.toString()}`;
}

/**
 * The endpoint a worktree's diff against its repository's branch is read from. The repository is
 * named beside the worktree: a worktree of the hub is a root of its own on the `git` channel, so the
 * server never works the repository out from the path.
 */
export function worktreeDiffUrl(root: string, path: string): string {
    return `/api/git?${new URLSearchParams({ worktree: path, root }).toString()}`;
}

/** What one diff pane is over: a file under a root, staged or not, or a whole worktree. */
export type DiffSubject = { root: string; path: string; staged: boolean; worktree: boolean };

/** One diff pane's state, as the instance carries it. `id` is what makes two panes two instances. */
export type DiffState = DiffSubject & { id: string; label: string };

/**
 * The instance state a diff pane is opened with. The id names root, path and which side, so the same
 * file opened twice activates the pane that is already there and two files are two panes.
 */
export function diffState(subject: DiffSubject, label: string): DiffState {
    const side = subject.worktree ? 'worktree' : subject.staged ? 'staged' : 'changed';
    return { ...subject, id: `${side}:${subject.root}:${subject.path}`, label };
}

/** The address one diff pane reads, by what it is over. */
export function diffUrl(state: DiffSubject): string {
    if (state.worktree) return worktreeDiffUrl(state.root, state.path);
    return fileDiffUrl(state.root, state.path, state.staged);
}

/** The name a worktree is shown under: its folder name, which is the branch it was made on. */
export function worktreeLabel(root: string, path: string): string {
    const folder = `${worktreesDir(root)}/`;
    return path.startsWith(folder) ? path.slice(folder.length) : path;
}

/** Where the worktree of this name will go, which the view says before the write is made. */
export function plannedPath(root: string, name: string): string {
    return worktreePath(root, name.trim());
}
