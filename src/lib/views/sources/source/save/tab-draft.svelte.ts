// Layer 3, view partial of Source.svelte. The draft of a source tab: read in when the tab names a
// file (or made empty for an untitled text), and what the editor does to it: the text typed and
// the word wrap toggled.

import { untrack } from 'svelte';
import type { createSourceOptions } from '$lib/views/shared/prose/source-options';
import type { HeadStage } from '$lib/state/sessions/source.svelte';

/** The word wrap the tab's options say the next toggle sets. */
type Wrap = ReturnType<typeof createSourceOptions>['toggled'];

/** What the tab's draft reads of the tab and calls on the page's source state. */
export type TabDraftDeps = {
    id: () => string;
    root: () => string;
    path: () => string;
    /** The version the tab holds when it is the file at HEAD or in the index. */
    head: () => HeadStage | undefined;
    blocked: () => boolean;
    untitled: () => boolean;
    /** The word wrap the tab's next toggle sets. */
    toggled: () => Wrap;
    load: (id: string, root: string, path: string, stage?: HeadStage) => Promise<unknown>;
    loadUntitled: (id: string) => void;
    edit: (id: string, text: string) => void;
    wrap: (id: string, wrap: Wrap) => void;
    /** Typing keeps a preview tab. */
    keepPreview: (id: string) => void;
};

/** Read the tab's draft in whenever the file it names changes, and give the editor's calls. */
export function createTabDraft(deps: TabDraftDeps) {
    $effect(() => {
        const id = deps.id();
        if (deps.untitled()) untrack(() => deps.loadUntitled(id));
        if (deps.blocked()) return;
        const root = deps.root();
        const path = deps.path();
        const stage = deps.head();
        untrack(() => void deps.load(id, root, path, stage));
    });

    return {
        /**
         * Typing is the reader working in this tab, so a preview tab becomes one that is kept. The
         * editor hands the text back in the line ending it holds it in.
         */
        typed: (value: string): void => {
            deps.keepPreview(deps.id());
            deps.edit(deps.id(), value);
        },
        /** Alt+Z in the editor: the tab's word wrap toggled, kept with the draft. */
        toggleWrap: (): void => {
            deps.wrap(deps.id(), deps.toggled());
        }
    };
}
