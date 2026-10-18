// Layer 3, view partial of sections/OpenEditors.svelte. What closing tabs from the Open Editors
// section does: the tabs the autosave mode saves on a close are saved first, the tabs close at once
// when none holds unsaved text after that, and otherwise the close waits for the question it asks.
// Over unsaved text the question asks whether to save it, and its Save saves the tabs holding it
// and closes every tab of the close but the ones left holding unsaved text. The tabs a close takes
// are put on the list Reopen Closed Tab reads, as one batch.

import { closeAsk, closeWords } from '$lib/state/workbench/navigation/pages';
import { t } from '$lib/state/shared/words/text';

export type ClosingDeps = {
    unsaved: (id: string) => boolean;
    /** Save the tabs among these that `editor.autosave` saves on a close; see the ui store. */
    saveBeforeClose: (ids: string[]) => Promise<string[]>;
    /** The Save of a close question; see the ui store. */
    saveForClose: (ids: string[]) => Promise<string[]>;
    nameOf: (id: string) => string;
    /** Close one tab of the page. */
    close: (id: string) => void;
    /** Put the tabs one close takes on the list of the tabs closed last, before they close. */
    remember: (ids: readonly string[]) => void;
};

/**
 * The close that waits on the dialog: the words it asks, what a yes does, and, for a question over
 * unsaved text, what its Save does (null for a question over none).
 */
export type Confirming = { message: string; act: () => void; save: (() => Promise<void>) | null };

/**
 * Close these tabs, asking first: a close that loses unsaved text asks whether to save it, naming
 * the tabs holding it when several close, and several tabs with none ask how many go. The tabs are
 * closed here and null is answered when nothing is asked; otherwise nothing is closed and the
 * question is answered.
 */
export async function closingEditors(ids: string[], deps: ClosingDeps): Promise<Confirming | null> {
    await deps.saveBeforeClose(ids);
    const closeAll = (going: string[]): void => {
        deps.remember(going);
        going.forEach((id) => deps.close(id));
    };
    const act = (): void => closeAll(ids);
    const asked = closeAsk({
        ids,
        unsaved: deps.unsaved,
        nameOf: deps.nameOf,
        many: t('files.editors_close_all_confirm', ids.length),
        busy: []
    });
    if (asked === null) {
        act();
        return null;
    }
    const save = async (): Promise<void> => {
        const left = await deps.saveForClose(asked.dirty);
        closeAll(ids.filter((id) => !left.includes(id)));
    };
    return { message: closeWords(asked), act, save: asked.dirty.length > 0 ? save : null };
}
