// Layer 3, view partial of Source.svelte. The Save of a source tab. A tab over a file saves the
// draft to it; a tab over an untitled text asks first (save/untitled-save.ts), and the question it
// asks is held here for the tab to draw.

import type { PromptRequest } from '$lib/ui/forms/prompt';
import { askUntitledName, type UntitledDeps } from './untitled-save';

/** What the tab's Save reads of the tab and calls on it. */
export type TabSaveDeps = Omit<UntitledDeps, 'ask'> & {
    untitled: () => boolean;
    root: () => string;
    path: () => string;
};

/** The Save of one tab, and the question its first Save asks when the text is untitled. */
export function createTabSave(deps: TabSaveDeps) {
    /** The question an untitled text's first Save asks: the name of the file to make. */
    let asking: PromptRequest | null = $state(null);

    async function save(): Promise<void> {
        if (!deps.untitled()) {
            await deps.saveDraft(deps.id, deps.root(), deps.path());
            return;
        }
        askUntitledName({ ...deps, ask: (request) => (asking = request) });
    }

    return {
        save,
        get asking() {
            return asking;
        },
        release: () => (asking = null)
    };
}
