// Layer 3, view partial of Source.svelte. What a source tab says to the status bar and the palette
// and what it hears back. The tab's status is published to the editor status store whenever any of
// it changes, and taken back when the tab has nothing to say or is gone. An ask of the bar, the
// palette or Cmd+S is performed once by the tab, however many times the tab is drawn again: a tab
// replaced by a copy under the same id, as a keep or a walk does, does not perform the last ask a
// second time.
//
// What the bar draws for the tab, said again whenever any of it changes, is the caret the editor
// reports, the indentation in force, the line ending of the text, the language (the one chosen
// from the bar, or the file name's), whether the file may be written, and the editor's actions the
// palette lists. What the bar and the palette ask of the tab is performed once per ask
// (ask-perform.ts): an indentation, a language and a word wrap are kept with the draft and handed
// to the editor, and a line to go to, a conversion of the indentation, a line ending and an editor
// action are performed by the editor on its model (Editor.svelte's `perform`).

import { onDestroy, untrack } from 'svelte';
import type {
    EditorAsk,
    EditorStatus,
    EditorStatusStore
} from '$lib/state/workbench/navigation/editor-status.svelte';

/** What the tab reads of itself, and what it does with an ask. */
export type SourceStatusDeps = {
    store: Pick<EditorStatusStore, 'asked' | 'forget' | 'publish'>;
    id: () => string;
    /** What the tab says now, or null while it has no text to say anything about. */
    status: () => EditorStatus | null;
    perform: (ask: EditorAsk) => void;
};

/** Connect the tab to the status store for as long as the tab is mounted. */
export function connectSourceStatus(deps: SourceStatusDeps): void {
    const { store } = deps;
    let performed = untrack(() => store.asked(deps.id())?.seq ?? 0);

    $effect(() => {
        const id = deps.id();
        const said = deps.status();
        if (said === null) store.forget(id);
        else store.publish(id, said);
    });

    onDestroy(() => store.forget(deps.id()));

    $effect(() => {
        const ask = store.asked(deps.id());
        if (ask === null || ask.seq === performed) return;
        performed = ask.seq;
        untrack(() => deps.perform(ask));
    });
}
