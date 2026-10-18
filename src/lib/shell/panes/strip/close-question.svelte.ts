// Layer 3, shell. The question a close asks before tabs go: which tabs hold unsaved text or run a
// program in a terminal they own, and what the dialog says about them. One question serves the
// close control of a tab, Delete, the pane menu's Close and the tab menu's closes, so every way of
// closing takes the same guard over the same ids, and no view is scanned for what it holds. A
// second press of the same close while the saves and the read of the terminals are in flight does
// nothing. The tabs `editor.autosave` saves on a close are saved before the question is put, so the
// question names only the tabs left holding unsaved text. A question over unsaved text asks whether
// to save it (pages.ts): Don't Save closes every tab of the close, Cancel none, and Save runs each
// unsaved tab's save and closes every tab of the close but the ones left holding unsaved text,
// whose save failed or that have no save. A close that goes ahead puts its tabs on the list Reopen
// Closed Tab reads, as one batch, before they close; Cmd+W on a pinned tab closes nothing and shows
// the first tab of the pane that is not pinned, as Delete does.

import type { ClientState } from '$lib/state/client/context';
import { t } from '$lib/state/shared/words/text';
import type { Instance } from '$lib/state/workbench/layout';
import { closeAsk, closeOnce, closeWords } from '$lib/state/workbench/navigation/pages';
import { afterDelete } from '$lib/ui/tabs/tab-strip';

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
        layout: { activateInstance, closeInstance, rememberClosed },
        ui: { busyTerminals, saveBeforeClose, saveForClose, unsaved }
    } = deps.client;

    /**
     * The close that is waiting on the dialog: the words it asks, what a yes does, and the tabs it
     * closes and those among them holding unsaved text, which its Save saves. One dialog serves
     * every close, since all ask the same question about work that would be lost.
     */
    let confirming: { message: string; act: () => void; ids: string[]; dirty: string[] } | null =
        $state(null);

    const once = closeOnce();

    /**
     * Close these tabs, asking first when one holds text no save has taken or runs a program in a
     * terminal it owns. `many` is the question for more than one tab; `act` runs when no question
     * is needed or the dialog is answered yes.
     */
    function askAndClose(
        key: string,
        ids: string[],
        many: string,
        close: () => void
    ): Promise<void> {
        const owned = deps.instances().filter((one) => ids.includes(one.id));
        const act = (): void => {
            rememberClosed(ids);
            close();
        };
        return once(
            key,
            async () => {
                await saveBeforeClose(ids);
                return busyTerminals(owned);
            },
            (busy) => {
                const asked = closeAsk({ ids, unsaved, nameOf: deps.labelOf, many, busy });
                if (asked === null) act();
                else confirming = { message: closeWords(asked), act, ids, dirty: asked.dirty };
            }
        );
    }

    /**
     * Close one tab, asking first when it holds unsaved text or runs a program. Settles once the
     * tab is closed or the question is put.
     */
    function closeTab(id: string): Promise<void> {
        return askAndClose(`tab:${id}`, [id], t('ui.tab_close_dirty'), () =>
            closeInstance(id, deps.page())
        );
    }

    /**
     * Cmd+W on a tab: an unpinned tab closes as its close control closes it; a pinned tab stays
     * open and the first tab of the pane that is not pinned is shown, and a pane of pinned tabs
     * alone changes nothing.
     */
    function closeByKey(id: string): Promise<void> {
        const after = afterDelete(deps.instances(), id);
        if (after.kind === 'close') return closeTab(id);
        if (after.kind === 'activate') activateInstance(after.id, deps.page());
        return Promise.resolve();
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

    /**
     * The Save of a question over unsaved text: save the tabs holding it, then close every tab of
     * the close when each save took, else every one but the tabs left holding unsaved text.
     */
    async function save(): Promise<void> {
        const held = confirming;
        confirming = null;
        if (held === null) return;
        const left = await saveForClose(held.dirty);
        if (left.length === 0) {
            held.act();
            return;
        }
        const going = held.ids.filter((id) => !left.includes(id));
        rememberClosed(going);
        for (const id of going) closeInstance(id, deps.page());
    }

    return {
        askAndClose,
        closeTab,
        closeByKey,
        confirmed,
        save,
        cancel: () => (confirming = null),
        message: () => confirming?.message ?? null,
        /** Whether the question held is over unsaved text, which draws its Save. */
        saves: () => (confirming?.dirty.length ?? 0) > 0
    };
}
