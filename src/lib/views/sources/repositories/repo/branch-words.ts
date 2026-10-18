// Layer 3, view support. The words a repository's branch is drawn with, read by the list's row
// (RepoList.svelte, its Branch control) and the header of the repository shown (Repo.svelte), so
// the two say one branch in one form.

import type { GitState } from '$lib/state/client/selectors.svelte';
import { t } from '$lib/state/shared/words/text';

/**
 * The branch a row names: the first 8 characters of HEAD's commit for a detached HEAD (the
 * detached sentence when the log is not read), else the branch.
 */
export function branchOf(git: GitState): string {
    if (!git.detached) return git.branch;
    const head = git.log.at(0)?.hash;
    return head === undefined ? t('sessions.ch_detached') : head.slice(0, 8);
}

/** What the branch control says when pointed at: the detached sentence for a detached HEAD. */
export function branchTitle(git: GitState): string {
    return git.detached ? t('sessions.ch_detached') : git.branch;
}
