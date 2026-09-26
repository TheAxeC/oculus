// Layer 3, view support. The words and the hue a row of the Repositories section carries for what
// one root's git state comes to; which of the six shapes a state is, is
// state/sources/repositories/repositories.ts's repoShape, since the Changes panel's branch listing
// decides on it too.

import type { RepoShape } from '$lib/state/sources/repositories/repositories';
import { t } from '$lib/state/shared/words/text';

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
