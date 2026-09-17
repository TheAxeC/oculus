// Layer 2, client state. What the Repositories view computes rather than draws: the addresses of
// the two diff reads, the identity of a diff pane, the worktree rule the view and the write share,
// which repository one view shows with which of its sections closed, the rows its keyboard moves
// along, and the colour of a status letter both change lists draw.
//
// The worktree rule comes from data/worktrees.ts, the one place it lives, so the path the view shows
// before a worktree is made is the path the write makes. Nothing here fetches: the view owns its own
// requests, and these are the strings they are made from.

import type { GitEntry, GitState } from '../data/model.ts';
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

/**
 * What one Repositories view keeps about itself across a tab switch and a saved page: the repository
 * it shows and the sections the reader closed.
 */
export type RepositoriesView = { root: string; collapsed: string[] };

/** The Repositories view's instance state, every field defaulted, so a state from any source draws. */
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
 * The roots the picker offers: the ones git answered for as repositories. A root the channel carries
 * because the file browser serves it but that is no repository (a folder of notes, a data folder)
 * is not a repository to pick.
 */
export function repositoryRoots(
    roots: string[],
    stateOf: (root: string) => GitState | null
): string[] {
    return roots.filter((root) => stateOf(root)?.error === null);
}

/**
 * The repository the view draws: the one it keeps while the picker offers it, and the first one the
 * picker offers otherwise, so a repository that went away hands the view to another one rather than
 * to nothing. The empty string while there is none.
 */
export function shownRoot(roots: string[], kept: string): string {
    return roots.includes(kept) ? kept : (roots[0] ?? '');
}

/**
 * The name each repository is picked by: its last folder, and the last two where two repositories
 * share the last one, and the whole path where they share both.
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
 * The rows of one repository as its keyboard reads them (ui/tree-keys.ts's KeyRow), in the order the
 * view draws them: each section head, and under an open one its groups and rows. A line that only
 * says something (a section is empty, the .gitignore lacks the rule) and the lines a name is typed
 * into are not among them.
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
