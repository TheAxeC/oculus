// Layer 2, client state, pure. What the Repositories view says and does about a repository's
// worktrees: the name a worktree row carries, where a new one will go, which of the repository's
// worktrees are linked ones, and Open Worktree, which adds a worktree's folder to the workspace
// and shows it in Files. The path rule is data/helpers/worktrees.ts's, the one place it lives, so
// the path the view shows before a worktree is made is the path the write makes.

import type { GitState, GitWorktree } from '../../../data/model/index.ts';
import { worktreePath } from '../../../data/helpers/worktrees.ts';

/** The name a worktree is shown under: the last name of its folder; its tooltip has the path. */
export function worktreeLabel(path: string): string {
    return (
        path
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? path
    );
}

/** Where the worktree of this name will go, which the view says before the write is made. */
export function plannedPath(root: string, name: string): string {
    return worktreePath(root, name.trim());
}

/** The worktrees of a repository other than its main checkout, in the order git lists them. */
export function linkedWorktrees(git: GitState): GitWorktree[] {
    return git.worktrees.filter((one) => !one.main);
}

/**
 * What Open Worktree needs: the write that adds a folder to the workspace's roots, the key of the
 * served root whose folder is the one given (read after the add, from the workspaces as the server
 * holds them), Files showing a root, the window opener, and the address of this page.
 */
export type WorktreeOpening = {
    addRoot: (dir: string) => Promise<{ ok: boolean; error?: string }>;
    rootOf: (dir: string) => Promise<string | null>;
    showInFiles: (path: string, root?: string) => string;
    openWindow: (address: string) => void;
    address: () => string;
};

/**
 * Open a worktree as a root of the workspace and show it in Files; in a new window as well, when
 * asked, which is this page's own address opened again. A folder that is a root already is opened
 * as it stands. The answer is the reason the root was refused (`no-such-root` when no root of the
 * workspace holds the folder after the add), and the empty string for an opened worktree; a refused
 * root opens nothing.
 */
export async function openWorktree(
    dir: string,
    newWindow: boolean,
    opening: WorktreeOpening
): Promise<string> {
    const added = await opening.addRoot(dir);
    if (!added.ok && added.error !== 'root-held') return added.error ?? '';
    const key = await opening.rootOf(dir);
    if (key === null) return 'no-such-root';
    opening.showInFiles('', key);
    if (newWindow) opening.openWindow(opening.address());
    return '';
}
