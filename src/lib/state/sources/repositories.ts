// Layer 2, client state. What the Repositories view computes rather than draws: the addresses of
// the two diff reads, the identity of a diff pane, the worktree rule the view and the write share,
// which repository one view shows with which of its sections closed, the rows its keyboard moves
// along, and the colour of a status letter both change lists draw.
//
// The worktree rule comes from data/helpers/worktrees.ts, the one place it lives, so the path the
// view shows before a worktree is made is the path the write makes. Nothing here fetches: the view
// owns its own requests, and these are the strings they are made from.

import type { GitEntry, GitState, GitWorktree } from '../../data/model/index.ts';
import { worktreePath, worktreesDir } from '../../data/helpers/worktrees.ts';

export { validName, worktreePath, worktreesDir } from '../../data/helpers/worktrees.ts';

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
 * named beside the worktree: a worktree of the hub is a root of its own on the `git` channel, so
 * the server never works the repository out from the path.
 */
export function worktreeDiffUrl(root: string, path: string): string {
    return `/api/git?${new URLSearchParams({ worktree: path, root }).toString()}`;
}

/** What one diff pane is over: a file under a root, staged or not, or a whole worktree. */
export type DiffSubject = { root: string; path: string; staged: boolean; worktree: boolean };

/**
 * One diff pane's state, as the instance carries it. `id` is what makes two panes two instances.
 */
export type DiffState = DiffSubject & { id: string; label: string };

/**
 * The instance state a diff pane is opened with. The id names root, path and which side, so the
 * same file opened twice activates the pane that is already there and two files are two panes.
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

/**
 * What one Repositories view keeps about itself across a tab switch and a saved page: the
 * repository it shows and the sections the reader closed.
 */
export type RepositoriesView = { root: string; collapsed: string[] };

/**
 * The Repositories view's instance state, every field defaulted, so a state from any source draws.
 */
export function repositoriesViewOf(state: unknown): RepositoriesView {
    const map =
        typeof state === 'object' && state !== null && !Array.isArray(state)
            ? (state as Record<string, unknown>)
            : {};
    return {
        root: typeof map.root === 'string' ? map.root : '',
        collapsed: Array.isArray(map.collapsed)
            ? map.collapsed.filter((one): one is string => typeof one === 'string')
            : []
    };
}

/**
 * The roots the picker offers: every root the `git` channel carries a state for, in the channel's
 * order. A folder of notes, a data folder, a repository whose read failed and a folder the reader
 * has deleted are all offered, each row saying what its state is, so a root never leaves the picker
 * for being quiet and the reader is told why rather than handed another repository. A root the
 * channel names with no state at all is the one thing dropped: there is nothing for a row to say.
 */
export function pickerRoots(roots: string[], stateOf: (root: string) => GitState | null): string[] {
    return roots.filter((root) => stateOf(root) !== null);
}

/**
 * The root the view draws: the one it keeps while the picker offers it, and the first one the
 * picker offers otherwise, so a root the channel has dropped hands the view to another one rather
 * than to nothing. A root whose folder was deleted and one whose read failed are both still
 * offered, so the reader's pick survives either. The empty string while there is none.
 */
export function shownRoot(roots: string[], kept: string): string {
    return roots.includes(kept) ? kept : (roots[0] ?? '');
}

/**
 * The name each root is picked by: its last folder, and the last two where two roots share the last
 * one, and the whole path where they share both.
 */
export function repositoryLabels(roots: string[]): Record<string, string> {
    const tail = (root: string, count: number): string =>
        root
            .split('/')
            .filter((part) => part !== '')
            .slice(-count)
            .join('/') || root;
    const labels: Record<string, string> = {};
    for (const root of roots) {
        const one = tail(root, 1);
        const two = tail(root, 2);
        const sameOne = roots.filter((other) => tail(other, 1) === one).length > 1;
        const sameTwo = roots.filter((other) => tail(other, 2) === two).length > 1;
        labels[root] = !sameOne ? one : !sameTwo ? two : root;
    }
    return labels;
}

/**
 * Whether the repository has no commit yet: a branch is checked out, git read it without an error,
 * and neither the log nor the branch listing names anything. Both are asked, since a listing that
 * failed also comes back empty on a repository with commits, while its log does not.
 */
export function noCommitYet(git: GitState): boolean {
    return (
        git.error === null &&
        git.branch !== '' &&
        !git.detached &&
        git.log.length === 0 &&
        git.branches.length === 0
    );
}

/** The three change groups in the order they are drawn, with the entries each holds. */
export function changeGroups(git: GitState): { id: string; entries: GitEntry[] }[] {
    const groups = [
        { id: 'staged', entries: git.staged },
        { id: 'changed', entries: git.unstaged },
        { id: 'untracked', entries: git.untracked }
    ];
    // An empty staged group says nothing a reader acts on, so it is not drawn.
    return groups.filter((group) => group.id !== 'staged' || group.entries.length > 0);
}

/**
 * The rows of one repository as its keyboard reads them (ui/tree/tree-keys.ts's KeyRow), in the
 * order the view draws them: each section head, and under an open one its groups and rows. A line
 * that only says something (a section is empty, the .gitignore lacks the rule) and the lines a name
 * is typed into are not among them.
 */
export function repositoryKeyRows(
    git: GitState,
    collapsed: string[]
): { id: string; parent: string | null; open?: boolean }[] {
    const rows: { id: string; parent: string | null; open?: boolean }[] = [];
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
            if (open) {
                under(
                    `group:${group.id}`,
                    group.entries.map((entry) => `change:${group.id}:${entry.path}`)
                );
            }
        }
    }
    if (head('log'))
        under(
            'log',
            git.log.map((commit) => `commit:${commit.hash}`)
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

/** The hue each git status letter is drawn in, by the letter. */
const STATUS_TONES: Record<string, string> = {
    M: 'amber',
    A: 'green',
    D: 'red',
    R: 'violet',
    C: 'violet',
    '?': 'slate'
};

/** The word each git status letter stands for, the last part of its catalog key. */
const STATUS_WORDS: Record<string, string> = {
    M: 'modified',
    A: 'added',
    D: 'deleted',
    R: 'renamed',
    C: 'copied',
    '?': 'untracked'
};

/** The catalog key of the word one git status letter stands for, `changed` for any other letter. */
export function statusWordKey(status: string): string {
    return `repositories.status_${STATUS_WORDS[status] ?? 'changed'}`;
}

/** The inline style that colours one git status letter: its hue's text colour. */
export function statusStyle(status: string): string {
    return `--tone-txt: var(--c-${STATUS_TONES[status] ?? 'grey'}-txt)`;
}

/** The worktrees of a repository other than its main checkout, in the order git lists them. */
export function linkedWorktrees(git: GitState): GitWorktree[] {
    return git.worktrees.filter((one) => !one.main);
}

/** How many workspaces the `git` channel's payload names. */
export function workspaceCount(git: Record<string, GitState> | null | undefined): number {
    return Object.keys(git ?? {}).length;
}

/** How many files a repository's state lists as staged, changed or untracked together. */
export function changeCount(git: GitState): number {
    return git.staged.length + git.unstaged.length + git.untracked.length;
}

/**
 * The six things a root's git state comes to on screen, which both git views draw and the Changes
 * panel's branch listing decides on. `readable` is the repository with its branch, its groups and
 * its commit box, a repository with no commit yet among them; the other five are one sentence
 * each. The branch listing is fetched for `readable` and for nothing else.
 *
 * `present`, `repository` and `error` are separate facts on the `git` channel. `present` is false
 * for a folder that is not there and for nothing else, so a workspace whose folder has gone is told
 * from one that is no repository, which both carry `repository` false for. A repository whose read
 * failed carries `error` with `repository` true, so `error` alone does not say a root is no
 * repository, and a workspace the channel has no state for yet says none of it. A session with no
 * workspace names no folder for git to be asked about, which is a sixth thing to say.
 */
export type RepoShape = 'unplaced' | 'reading' | 'missing' | 'none' | 'failed' | 'readable';

/** Which of the six a root and the state the channel carries for it come to. */
export function repoShape(root: string, state: GitState | null): RepoShape {
    if (root === '') return 'unplaced';
    if (state === null) return 'reading';
    if (!state.present) return 'missing';
    if (!state.repository) return 'none';
    return state.error === null ? 'readable' : 'failed';
}

/** The branch a listing marks as checked out, or null where none is (a detached head). */
export function currentBranch<T extends { current: boolean }>(branches: readonly T[]): T | null {
    return branches.find((one) => one.current) ?? null;
}
