// Layer 3, view partial of Source.svelte. What a source tab shows of its text: the sentence that
// replaces the editor when the file cannot be shown, the line saying why it may not be written,
// whether the tab holds the file's text, whether that text may be written and whether the editor
// draws it, and whether the row under the editor has anything to say: a save outcome, a sentence
// the tab said, or the disk line (save/DiskNote.svelte) of a file that changed or is gone.

import type { HeadStage, SourceDraft } from '$lib/state/sessions/source/draft';
import { t } from '$lib/state/shared/words/text';
import { lockedWords, type Locked } from '../save/locked-words';

/** What the tab reads to decide what it shows. */
export type TabShownInput = {
    /** The version of the file the tab holds, when it is the file at HEAD or in the index. */
    head: HeadStage | undefined;
    draft: SourceDraft;
    /** Whether the tab is over a library file, and whether the connection no longer holds it. */
    library: boolean;
    gone: boolean;
    /** Whether the tab names no file: an untitled text, or a state that lost its address. */
    blocked: boolean;
    untitled: boolean;
    path: string;
    /** The words the tab said under the editor, empty for none. */
    said: string;
};

/** What the tab shows. */
export type TabShown = {
    /** The sentence that stands in for the editor, or the empty string. */
    error: string;
    /** The line a tab that may not write its file draws, and the empty string for one that may. */
    lock: Locked;
    /**
     * Whether the tab holds the file's text: read, and not refused since. A draft read once keeps
     * its text when a later read fails, so `draft.loaded` alone stays true for a file now gone.
     */
    read: boolean;
    /** Whether the text may be written, which is when the text controls have text to act on. */
    editing: boolean;
    /** Whether the editor is drawn: the text may be written, or only the mode locks it. */
    drawn: boolean;
    /** The save outcome the row under the editor shows, only while the text may be written. */
    saveMessage: string;
    /**
     * Whether the row under the editor draws the disk line: the file changed under unsaved text,
     * it is gone, or a save of it was refused because it changed.
     */
    disked: boolean;
    /** Whether the row under the editor is drawn: a save outcome, a sentence or the disk line. */
    noted: boolean;
};

export function tabShown(input: TabShownInput): TabShown {
    const { draft } = input;
    const error = input.gone
        ? t('source.library_gone')
        : input.blocked && !input.untitled && !input.library
          ? t('source.cannot_open', input.path)
          : draft.error;
    const lock = lockedWords(input.head, draft, input.library);
    const read = error === '' && draft.loaded;
    const editing = read && lock.words === '';
    // The conflict's sentence is the disk line's, with its three actions.
    const saveMessage = editing && !draft.conflict ? draft.message : '';
    const disked =
        editing &&
        (draft.conflict ||
            draft.disk === 'gone' ||
            draft.disk === 'unserved' ||
            (draft.disk === 'changed' && draft.text !== draft.saved));
    return {
        error,
        lock,
        read,
        editing,
        drawn: read && !lock.window,
        saveMessage,
        disked,
        noted: saveMessage !== '' || input.said !== '' || disked
    };
}
