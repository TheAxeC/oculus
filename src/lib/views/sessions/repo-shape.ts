// Layer 3, view support. What the Changes panel's repository section draws for one workspace lives
// here because the markup and the branch listing both decide on it and it is read without a DOM.
//
// `repository` and `error` are separate facts on the `git` channel: a repository whose read failed
// carries both, so `error` alone does not say a root is no repository, and a workspace the channel
// has no state for yet says neither. A session with no workspace names no folder for git to be
// asked about, which is a fifth thing to say rather than one of the other four.

import type { GitState } from '$lib/state/selectors.svelte';

/**
 * The five drawings of the repository section. `readable` is the repository with its branch, its
 * groups and its commit box, a repository with no commit yet among them; the other four are one
 * sentence each. The branch listing is fetched for `readable` and for nothing else.
 */
export type RepoShape = 'unplaced' | 'reading' | 'none' | 'failed' | 'readable';

/** Which of the five a workspace and the state the channel carries for it come to. */
export function repoShape(workspace: string, state: GitState | null): RepoShape {
    if (workspace === '') return 'unplaced';
    if (state === null) return 'reading';
    if (!state.repository) return 'none';
    return state.error === null ? 'readable' : 'failed';
}
