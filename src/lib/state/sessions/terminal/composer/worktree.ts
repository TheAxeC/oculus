// Layer 2, client state, pure. The composer's New worktree: where a session started in a new
// worktree of the repository its folder lies in starts, and the write that makes the worktree
// before the start, which is the Repositories view's own (`makeWorktree` of
// state/sources/repositories/repositories.svelte.ts, the write `createWorktree` with `{ name }`).
//
// A folder that is the repository's root starts in the new worktree's folder; a folder below the
// root starts in the same subfolder of the new worktree, so a project's session starts in that
// project's folder there. A name `validName` refuses is refused here, before anything is sent.

import { validName, worktreePath } from '../../../../data/helpers/worktrees.ts';
import { t } from '../../../shared/words/text.ts';

/** The New worktree choice as the composer holds it: the repository's root and the name typed. */
export type WorktreeChoice = { root: string; name: string };

/** What the write answers: whether the worktree was made, and the sentence a refusal gave. */
export type WorktreeWrite = (root: string, name: string) => Promise<{ ok: boolean; error: string }>;

/**
 * The folder a session started in the new worktree starts in: the worktree's folder for a folder
 * that is the root, and the same subfolder of it for a folder below the root. With no choice, or a
 * name `validName` refuses, it is the folder itself.
 */
export function plannedFolder(choice: WorktreeChoice | null, folder: string): string {
    if (choice === null || !validName(choice.name.trim())) return folder;
    const made = worktreePath(choice.root, choice.name.trim());
    const below = folder.startsWith(`${choice.root}/`) ? folder.slice(choice.root.length) : '';
    return `${made}${below}`;
}

/**
 * Make the worktree a choice names, through `write`: the folder to start in when it was made, or
 * the sentence to show when it was not, the server's own when it gave one.
 */
export async function makeChosen(
    choice: WorktreeChoice,
    folder: string,
    write: WorktreeWrite
): Promise<{ cwd: string; error: string }> {
    const name = choice.name.trim();
    if (!validName(name)) return { cwd: '', error: t('composer.worktree_invalid') };
    const answer = await write(choice.root, name);
    if (answer.ok) return { cwd: plannedFolder(choice, folder), error: '' };
    return { cwd: '', error: answer.error === '' ? t('composer.worktree_failed') : answer.error };
}
