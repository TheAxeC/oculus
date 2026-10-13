// Layer 3, view partial of sections/OpenEditors.svelte. What closing tabs from the Open Editors
// section does: the tabs the autosave mode saves on a close are saved first, the tabs close at once
// when none holds unsaved text after that, and otherwise the close waits for the question it asks.
// The tabs a close takes are put on the list Reopen Closed Tab reads, as one batch.

import { closeAsk, closeWords } from '$lib/state/workbench/navigation/pages';
import { t } from '$lib/state/shared/words/text';

export type ClosingDeps = {
    unsaved: (id: string) => boolean;
    /** Save the tabs among these that `editor.autosave` saves on a close; see the ui store. */
    saveBeforeClose: (ids: string[]) => Promise<string[]>;
    nameOf: (id: string) => string;
    /** Close one tab of the page. */
    close: (id: string) => void;
    /** Put the tabs one close takes on the list of the tabs closed last, before they close. */
    remember: (ids: readonly string[]) => void;
};

/** The close that waits on the dialog: the words it asks and what a yes does. */
export type Confirming = { message: string; act: () => void };

/**
 * Close these tabs, asking first: one tab asks when it holds unsaved text, and several ask how many
 * go, naming the tabs among them that hold unsaved text once the saves are done. The tabs are
 * closed here and null is answered when nothing is asked; otherwise nothing is closed and the
 * question is answered.
 */
export async function closingEditors(ids: string[], deps: ClosingDeps): Promise<Confirming | null> {
    await deps.saveBeforeClose(ids);
    const act = (): void => {
        deps.remember(ids);
        ids.forEach((id) => deps.close(id));
    };
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
    const lost = ids.filter(deps.unsaved).map(deps.nameOf);
    const detail =
        ids.length > 1 && lost.length > 0
            ? t('ui.terminal_close_unsaved', lost.join(', '))
            : asked.detail;
    return { message: closeWords({ message: asked.message, detail }), act };
}
