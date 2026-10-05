// Layer 3, view partial of Source.svelte. What one ask of the status bar or the palette does to a
// source tab: a language and an indentation are kept with the draft, the caret line's commit opens
// in the Repositories view, and a line to go to, a conversion of the indentation, a line ending
// and an editor action are performed by the editor on its model. The editor is asked only while
// the text may be written.

import type { EditorAsk } from '$lib/state/workbench/navigation/editor-status.svelte';
import type { Indent } from '$lib/state/workbench/navigation/editor-text';
import type { EditorHandle } from '$lib/ui/controls/editor/types';

/** What performing an ask reads of the tab and calls on it. */
export type AskDeps = {
    /** Whether the text may be written, which is when the editor is asked anything. */
    editing: boolean;
    /**
     * The indentation the text is shown in, whose size a conversion keeps; null before it is known.
     */
    indent: Indent | null;
    editor: EditorHandle | undefined;
    openCommit: () => void;
    setLanguage: (language: string) => void;
    setIndent: (indent: Indent) => void;
};

/** Perform one ask on the tab. */
export function performAsk(ask: EditorAsk, deps: AskDeps): void {
    if (ask.kind === 'commit') {
        deps.openCommit();
    } else if (ask.kind === 'language') {
        deps.setLanguage(ask.language);
    } else if (ask.kind === 'indent') {
        deps.setIndent(ask.indent);
    } else if (!deps.editing) {
        return;
    } else if (ask.kind === 'convert') {
        if (deps.indent === null) return;
        deps.setIndent({ tabs: ask.tabs, size: deps.indent.size });
        deps.editor?.perform(ask);
    } else {
        deps.editor?.perform(ask);
    }
}
