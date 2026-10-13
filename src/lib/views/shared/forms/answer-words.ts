// Layer 3, shared view support. The line a form or a card draws for one write's answer, in one
// place, so every surface that writes tells the reader the same thing in the same words.

import type { WriteAnswer } from '$lib/state/client/writes.svelte';
import { t } from '$lib/state/shared/words/text';

/** What a write's answer says: the error it carried, the fields it refused, or what it changed. */
export function answerWords(answer: WriteAnswer): string {
    if (!answer.ok) return t('editor.failed', answer.error ?? '');
    // A refused field answers ok with nothing changed; the reader is told why, not "saved".
    if (answer.refused.length > 0) {
        const refused = answer.refused.map((one) => `${one.field}: ${one.reason}`).join('; ');
        return t('editor.failed', refused);
    }
    return t('editor.saved', answer.changed.join(', '));
}

/**
 * Why a write that adds or removes an entry did not go through, in the server's own words, or the
 * empty text when it did: the refusals it named, else the error it carried.
 */
export function refusalWords(answer: WriteAnswer): string {
    if (!answer.ok) return answer.error ?? t('editor.failed', '');
    return answer.refused.map((one) => one.reason).join('; ');
}
