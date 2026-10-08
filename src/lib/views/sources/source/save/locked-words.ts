// Layer 3, view partial of Source.svelte. Why a file is read-only, and which window shows it: the
// line saying why, or the empty string for a file the tab may write, and whether the code window
// draws the text. A version at HEAD or in the index, a file too long to have been read whole, and a
// file whose bytes are not UTF-8 text throughout (its decoded text is not the file on disk) are
// drawn by the code window; a file this machine's mode alone locks is drawn by the editor in
// its read-only form, so a language server serves it and a mode change while the tab is open
// changes the editor's option and never remounts it. A tab over a library file a language server
// named is drawn the same way: the editor in its read-only form under a line saying what the file
// is.

import type { HeadStage } from '$lib/state/sessions/source/draft';
import { t } from '$lib/state/shared/words/text';

/** The line a lock says, and whether the code window (and not the editor) draws the file. */
export type Locked = { words: string; window: boolean };

/** What a tab that may write its file is under. */
const UNLOCKED: Locked = { words: '', window: false };

export function lockedWords(
    head: HeadStage | undefined,
    draft: { readonly: boolean; truncated: boolean; notText: boolean },
    library = false
): Locked {
    if (library) return { words: t('source.library_locked'), window: false };
    if (head !== undefined) {
        return {
            words: head === 'head' ? t('source.head_locked') : t('source.index_locked'),
            window: true
        };
    }
    if (draft.notText) return { words: t('source.not_text'), window: true };
    if (draft.truncated) {
        return {
            words: draft.readonly ? t('source.readonly') : t('source.truncated'),
            window: true
        };
    }
    return draft.readonly ? { words: t('source.readonly'), window: false } : UNLOCKED;
}
