// Layer 3, view partial of Source.svelte. The Save of a source tab. A tab over a file saves the
// draft to it, formatting the document between the trim and the final newline when the language
// says so; a tab over an untitled text asks first (save/untitled-save.ts), and the question it asks
// is held here for the tab to draw. While the tab is mounted its format is registered with the
// source store, which an automatic save on a focus change runs, and the editor's blur reaches that
// save from here.

import type { PromptRequest } from '$lib/ui/forms/prompt';
import type { SourceStore } from '$lib/state/sessions/source/source.svelte';
import { useState } from '$lib/state/client/use';
import { askUntitledName, type UntitledDeps } from './untitled-save';

/** What the tab's Save reads of the tab and calls on it. */
export type TabSaveDeps = Omit<UntitledDeps, 'ask' | 'saveDraft'> & {
    saveDraft: SourceStore['saveSourceDraft'];
    untitled: () => boolean;
    root: () => string;
    path: () => string;
    /** Formats the document with a language server when the language's record says so. */
    prepare: () => Promise<void>;
};

/** The Save of one tab, and the question its first Save asks when the text is untitled. */
export function createTabSave(deps: TabSaveDeps) {
    const { autosave, source } = useState();
    /** The question an untitled text's first Save asks: the name of the file to make. */
    let asking: PromptRequest | null = $state(null);

    $effect(() => {
        const id = deps.id;
        return source.registerFormat(id, deps.prepare);
    });

    async function save(): Promise<void> {
        if (!deps.untitled()) {
            await deps.saveDraft(deps.id, deps.root(), deps.path(), { format: deps.prepare });
            return;
        }
        askUntitledName({ ...deps, ask: (request) => (asking = request) });
    }

    return {
        save,
        /** The tab's editor lost focus, which saves the tab when `editor.autosave` says so. */
        blurred: () => autosave.blurred(deps.id),
        get asking() {
            return asking;
        },
        release: () => (asking = null)
    };
}
