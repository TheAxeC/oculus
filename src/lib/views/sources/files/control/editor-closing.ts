// Layer 3, view partial of sections/OpenEditors.svelte. What closing tabs from the Open Editors
// section does: the tabs close at once when none holds unsaved text, and otherwise the close waits
// for the question it asks.

import { closeAsk, closeWords } from '$lib/state/workbench/navigation/pages';
import { t } from '$lib/state/shared/words/text';

export type ClosingDeps = {
    unsaved: (id: string) => boolean;
    nameOf: (id: string) => string;
    /** Close one tab of the page. */
    close: (id: string) => void;
};

/** The close that waits on the dialog: the words it asks and what a yes does. */
export type Confirming = { message: string; act: () => void };

/**
 * Close these tabs, asking first: one tab asks when it holds unsaved text, and several ask how many
 * go, naming the tabs among them that hold unsaved text. The tabs are closed here and null is
 * answered when nothing is asked; otherwise nothing is closed and the question is answered.
 */
export function closingEditors(ids: string[], deps: ClosingDeps): Confirming | null {
    const act = (): void => ids.forEach((id) => deps.close(id));
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
