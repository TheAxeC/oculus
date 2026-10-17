// Layer 3, view partial of Source.svelte. The draft of a source tab: read in when the tab names a
// file (or made empty for an untitled text), read again for a HEAD or index tab when the version
// git holds moves, and what the editor does to it: the text typed and the word wrap toggled.

import { untrack } from 'svelte';
import type { createSourceOptions } from '$lib/views/shared/prose/editor/source-options';
import type { HeadStage } from '$lib/state/sessions/source/draft';

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
    /** What git says that a HEAD or index tab shows, which moves when the version moves. */
    headSignature: () => string;
    /** Read the version a HEAD or index tab holds again. */
    reloadHead: (id: string, root: string, path: string, stage: HeadStage) => Promise<void>;
};

/**
 * Read the tab's draft in whenever the file it names changes, read a HEAD or index tab again when
 * the version git holds moves, and give the editor's calls.
 */
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

    // A HEAD or index tab follows git: when what git says of its file moves, the version is read
    // again. The first run for a tab only notes the signature, since the load above reads it.
    let seen: { id: string; stage: HeadStage; signature: string } | null = null;
    $effect(() => {
        const id = deps.id();
        const stage = deps.head();
        const signature = deps.headSignature();
        const before = seen;
        seen = stage === undefined ? null : { id, stage, signature };
        if (before === null || stage === undefined) return;
        if (before.id !== id || before.stage !== stage || before.signature === signature) return;
        untrack(() => void deps.reloadHead(id, deps.root(), deps.path(), stage));
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
