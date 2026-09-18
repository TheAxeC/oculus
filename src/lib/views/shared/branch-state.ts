// Layer 3, view support. The sentence a branch line carries beside the branch name: detached, the
// distance from the upstream, or in step with it. Both git views draw a branch line, so the rule
// lives here once and neither view carries a copy of it that can drift from the other.
//
// In step is said only for a branch the state gives an upstream. A branch with none, a repository
// with no commit yet among them, has no distance to state at all, and the line saying there is
// nowhere to push is what tells the reader why.

import type { GitState } from '$lib/state/selectors.svelte';
import { t } from '$lib/state/text';

/** What the branch line says beside the name, its parts joined by the catalog's separator. */
export function branchState(state: GitState): string {
    const bits: string[] = [];
    if (state.detached) bits.push(t('sessions.ch_detached'));
    if (state.ahead > 0) bits.push(t('sessions.ch_ahead', state.ahead));
    if (state.behind > 0) bits.push(t('sessions.ch_behind', state.behind));
    if (bits.length === 0 && state.upstream === true) bits.push(t('sessions.ch_insync'));
    return bits.join(` ${t('sessions.meta_sep')} `);
}
