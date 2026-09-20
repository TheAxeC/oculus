// Layer 3, view support. What one root's git state comes to on screen lives here because both git
// views draw it and the Changes panel's branch listing decides on it too, and it is read without a
// DOM.
//
// `present`, `repository` and `error` are separate facts on the `git` channel. `present` is false
// for a folder that is not there and for nothing else, so a workspace whose folder has gone is told
// from one that is no repository, which both carry `repository` false for. A repository whose read
// failed carries `error` with `repository` true, so `error` alone does not say a root is no
// repository, and a workspace the channel has no state for yet says none of it. A session with no
// workspace names no folder for git to be asked about, which is a sixth thing to say rather than
// one of the other five.

import type { GitState } from '$lib/state/selectors.svelte';
import { t } from '$lib/state/text';

/**
 * The six drawings of a root's git state. `readable` is the repository with its branch, its groups
 * and its commit box, a repository with no commit yet among them; the other five are one sentence
 * each. The branch listing is fetched for `readable` and for nothing else.
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

/**
 * The few words a root's row carries at its end in the repository picker, and the empty string for
 * a repository that reads, whose row says its name alone. The picker offers every root the channel
 * carries, so this is how a reader sees which of them is a repository without opening each one.
 * `unplaced` and `reading` answer with nothing: the picker is a list of roots the channel has a
 * state for, so neither reaches a row.
 */
export function shapeBadge(shape: RepoShape): string {
    if (shape === 'missing') return t('repositories.pick_missing');
    if (shape === 'none') return t('repositories.pick_norepo');
    if (shape === 'failed') return t('repositories.pick_failed');
    return '';
}

/**
 * The status hue for the few words at a repository picker's row end. A repository that reads has
 * no badge and therefore no tone; the two shapes the picker cannot receive answer none as well.
 */
export function shapeBadgeTone(shape: RepoShape): string | undefined {
    if (shape === 'missing') return 'red';
    if (shape === 'failed') return 'amber';
    if (shape === 'none') return 'blue';
    return undefined;
}
