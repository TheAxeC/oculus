// Layer 3, view partial of Source.svelte. The line that says why a file is read-only, or the empty
// string for a file the tab may write: a version at HEAD or in the index, a file this machine's
// mode locks, and a file too long to have been read whole.

import type { HeadStage } from '$lib/state/sessions/source.svelte';
import { t } from '$lib/state/shared/words/text';

export function lockedWords(
    head: HeadStage | undefined,
    draft: { readonly: boolean; truncated: boolean }
): string {
    if (head !== undefined) {
        return head === 'head' ? t('source.head_locked') : t('source.index_locked');
    }
    if (draft.readonly) return t('source.readonly');
    return draft.truncated ? t('source.truncated') : '';
}
