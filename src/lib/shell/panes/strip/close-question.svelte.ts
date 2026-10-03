// Layer 3, shell. The question a close asks before tabs go: which tabs hold unsaved text or run a
// program in a terminal they own, and what the dialog says about them. One question serves the
// close control of a tab, Delete, the pane menu's Close and the tab menu's closes, so every way of
// closing takes the same guard over the same ids, and no view is scanned for what it holds. A
// second press of the same close while the read of the terminals is in flight does nothing.

import type { ClientState } from '$lib/state/client/context';
import { t } from '$lib/state/shared/words/text';
import type { Instance } from '$lib/state/workbench/layout';
import { closeAsk, closeOnce, closeWords } from '$lib/state/workbench/navigation/pages';

/** What the question reads of the pane it is asked for. */
export type CloseQuestionDeps = {
    client: ClientState;
    /** The instances of the pane. */
    instances: () => Instance[];
    /** The name a tab is drawn under in the strip. */
    labelOf: (id: string) => string;
    page: () => string;
};

/** The close question of one pane. */
export function createCloseQuestion(deps: CloseQuestionDeps) {
    const {
        layout: { closeInstance },
        ui: { busyTerminals, unsaved }
    } = deps.client;

    /**
     * The close that is waiting on the dialog: the words it asks and what a yes does. One dialog
     * serves every close, since all ask the same question about work that would be lost.
     */
    let confirming: { message: string; act: () => void } | null = $state(null);

    const once = closeOnce();

    /**
     * Close these tabs, asking first when one holds text no save has taken or runs a program in a
     * terminal it owns. `many` is the question for more than one tab; `act` runs when no question
     * is needed or the dialog is answered yes.
     */
    function askAndClose(key: string, ids: string[], many: string, act: () => void): Promise<void> {
        const owned = deps.instances().filter((one) => ids.includes(one.id));
        return once(
            key,
            () => busyTerminals(owned),
            (busy) => {
                const asked = closeAsk({ ids, unsaved, nameOf: deps.labelOf, many, busy });
                if (asked === null) act();
                else confirming = { message: closeWords(asked), act };
            }
        );
    }

    /** Close one tab, asking first when it holds unsaved text or runs a program. */
    function closeTab(id: string): void {
        void askAndClose(`tab:${id}`, [id], t('ui.tab_close_dirty'), () =>
            closeInstance(id, deps.page())
        );
    }

    /**
     * Perform the close the dialog was asking about. What to do is taken out of the state before
     * the dialog is taken away, since the markup reads the same state and would have nothing to
     * call.
     */
    function confirmed(): void {
        const act = confirming?.act;
        confirming = null;
        act?.();
    }

    return {
        askAndClose,
        closeTab,
        confirmed,
        cancel: () => (confirming = null),
        message: () => confirming?.message ?? null
    };
}
