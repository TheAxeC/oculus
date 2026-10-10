// Layer 3, view support. What an undo of a change-log record says to the reader: whether the value
// is back, and the sentence for each refusal of the endpoint. The History view and the Files view
// (Cmd+Z) say an undo the same way, so the words live once.

import { t } from '$lib/state/shared/words/text';

/** What one undo answered, as much of it as this fold reads. */
export type UndoAnswer = {
    ok: boolean;
    changed: string[];
    /** The fields the writer would not take, which a write that still changed something carries. */
    refused?: { field: string; reason: string }[];
    error?: string;
};

/**
 * Whether an undo put the value back, and the sentence the status region says about it.
 *
 * An answer that named no field wrote none of them, whatever its status was: the writer may refuse
 * a value the file will not take, and an undo that normalises back to what is already there writes
 * no byte. Either way the value is not back, so the row never says it is. A write that changed
 * something and still refused a field is back in part, and the sentence says how many fields it
 * left out rather than that the value is back whole.
 */
export function undoSaid(answer: UndoAnswer, name: string): { undone: boolean; said: string } {
    if (answer.ok && answer.changed.length > 0) {
        const left = answer.refused?.length ?? 0;
        if (left > 0) return { undone: true, said: t('history.undone_partly', name, left) };
        return { undone: true, said: t('history.undone', name) };
    }
    const word = answer.ok ? 'refused' : (answer.error ?? '');
    return { undone: false, said: sentenceFor(word) };
}

/** The sentence for what the endpoint answered, never its own word. */
export function sentenceFor(word: string): string {
    if (word === 'moved') return t('history.moved');
    if (word === 'gone') return t('history.gone');
    if (word === 'outside') return t('history.outside');
    if (word === 'unknown') return t('history.unknown');
    if (word === 'nothing') return t('history.nothing');
    if (word === 'copy-gone') return t('history.copy_gone');
    if (word === 'deck-gone') return t('history.deck_gone');
    if (word === 'unwritable') return t('history.unwritable');
    if (word === 'refused') return t('history.refused_write');
    return t('history.refused', word);
}
