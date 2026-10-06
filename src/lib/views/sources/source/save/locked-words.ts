// Layer 3, view partial of Source.svelte. Why a file is read-only, and which window shows it: the
// line saying why, or the empty string for a file the tab may write, and whether the code window
// draws the text. A version at HEAD or in the index, and a file too long to have been read whole,
// are drawn by the code window; a file this machine's mode alone locks is drawn by the editor in
// its read-only form, so a language server serves it and a mode change while the tab is open
// changes the editor's option and never remounts it.

import type { HeadStage } from '$lib/state/sessions/source.svelte';
import { t } from '$lib/state/shared/words/text';

/** The line a lock says, and whether the code window (and not the editor) draws the file. */
export type Locked = { words: string; window: boolean };

/** What a tab that may write its file is under. */
const UNLOCKED: Locked = { words: '', window: false };

export function lockedWords(
    head: HeadStage | undefined,
    draft: { readonly: boolean; truncated: boolean }
): Locked {
    if (head !== undefined) {
        return {
            words: head === 'head' ? t('source.head_locked') : t('source.index_locked'),
            window: true
        };
    }
    if (draft.truncated) {
        return {
            words: draft.readonly ? t('source.readonly') : t('source.truncated'),
            window: true
        };
    }
    return draft.readonly ? { words: t('source.readonly'), window: false } : UNLOCKED;
}
