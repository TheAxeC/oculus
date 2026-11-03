// Layer 3, view partial of Source.svelte. Markdown: Add Front Matter on a note tab: whether the tab
// offers it and the run that writes the note head (data/prose/markdown/front-matter.ts `NOTE_HEAD`)
// at the top of the text. The tab offers it while it may write a note of a hub
// (state/life/note-hooks.ts `isNoteFile`) in which the note scan's reading finds no header
// (front-matter.ts `readFrontMatter`), tested in that order, so the reading never runs over the
// text of a tab that is no note. `offered` is one derived boolean, so the tab's actions are made
// again only when it changes and not at each keystroke.
//
// A run sets `asked`, which holds the editor it was asked of; while it is set the command is not
// offered. The editor queues a command asked before it has loaded (ui/controls/editor/Editor.svelte
// `perform`), so a second run asked in that time finds no Add Front Matter. `asked` is cleared once
// the text has a header, which the run's edit gives it, or once the tab holds another editor, whose
// queue no longer holds the run. The edit itself does nothing on a text that has a header by the
// time it runs, as when the note was read again from disk with one while the editor loaded, so the
// note gets one head.

import { NOTE_HEAD, readFrontMatter } from '$lib/data/prose/markdown/front-matter';
import { isNoteFile } from '$lib/state/life/note-hooks';
import type { FsRoot } from '$lib/state/sources/explorer/view/place';
import type { EditorHandle } from '$lib/ui/controls/editor/types';

/** Whether the note scan's reading finds a header in the text. */
const hasHeader = (text: string): boolean => readFrontMatter(text).front !== null;

/** What the offer reads of the tab, each as a function. */
export type FrontMatterOfferDeps = {
    /** Whether the text may be written. */
    editing: () => boolean;
    roots: () => readonly FsRoot[];
    /** The tab's file as `root/path`. */
    file: () => string;
    text: () => string;
    editor: () => EditorHandle | undefined;
};

/** Add Front Matter of one tab, for as long as the tab is mounted. */
export function createFrontMatterOffer(deps: FrontMatterOfferDeps) {
    const text = $derived(deps.text());
    /**
     * The editor a run was asked of while its edit waits, null when none waits: set by a run, and
     * cleared once the text has a header or the tab holds another editor.
     */
    let asked = $state.raw<{ editor: EditorHandle | undefined } | null>(null);
    $effect(() => {
        if (asked === null) return;
        if (deps.editor() !== asked.editor || hasHeader(text)) asked = null;
    });
    const offered = $derived(
        deps.editing() &&
            asked === null &&
            isNoteFile(deps.roots(), deps.file()) &&
            !hasHeader(text)
    );
    return {
        /** Whether the tab offers Add Front Matter now. */
        get offered() {
            return offered;
        },
        /** Write the note head at the top of the text, as one edit through the editor. */
        add: (): void => {
            const editor = deps.editor();
            asked = { editor };
            editor?.perform({ kind: 'prepend', text: NOTE_HEAD, unless: hasHeader });
        }
    };
}
