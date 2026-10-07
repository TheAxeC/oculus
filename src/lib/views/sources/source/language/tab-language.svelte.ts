// Layer 3, view partial of Source.svelte. What a source tab's language adds to its editor, made
// once per tab: the language server wiring (`lsp.ts`) and the extension the editor is handed, which
// is LaTeX's build markers, preview, completions and editing commands (`latex-editor.ts`), a
// Markdown file's headings as document symbols (`symbols.ts`), or the registration with a server.
// The extension follows the language the editor paints, so a text past the paint limit gets none
// of them; a LaTeX file's build, keys and bar follow its language by name (source/latex/). The
// extension is a new function whenever the painted language, the root or the path changes, so the
// editor ends the old one and makes the new one.

import type { ClientState } from '$lib/state/client/context';
import { markdownOutline } from '$lib/state/sources/explorer/sections/outline';
import type { LatexCommands } from '$lib/ui/controls/editor/kit/latex/latex-editing';
import type { EditorExtension } from '$lib/ui/controls/editor/types';
import { languageExtension } from './extension';
import { latexEditor } from './latex-editor';
import { createLspTab, type LspTab } from './lsp';
import { symbolsExtension } from './symbols';

/** What the tab says of itself, each as a function. */
export type TabLanguageInput = {
    client: ClientState;
    instance: () => string;
    /** The language the editor draws the text in: plaintext past the paint limit. */
    shown: () => string;
    root: () => string;
    path: () => string;
    /** The library address of a tab over a library file, the empty string for any other. */
    library: () => string;
    /** Whether the tab shows a version of the file at a commit. */
    version: () => boolean;
    say: (words: string) => void;
    /**
     * Receives the editing commands of a LaTeX model when its editor has them, null when it ends.
     */
    commands: (commands: LatexCommands | null) => void;
};

/** The wiring of one tab. */
export type TabLanguage = {
    readonly lsp: LspTab;
    readonly extension: EditorExtension | undefined;
};

/** Make the language wiring of one tab. */
export function createTabLanguage(input: TabLanguageInput): TabLanguage {
    const lsp = createLspTab({ client: input.client, instance: input.instance, say: input.say });
    // Each value is held on its own, so what an input reads to find it (the shown language reads
    // the draft's text) makes the extension again only when the value itself changes: a new
    // extension ends the old one, which takes the file off its server and puts it back.
    const shown = $derived(input.shown());
    const root = $derived(input.root());
    const path = $derived(input.path());
    const library = $derived(input.library());
    const version = $derived(input.version());
    const extension = $derived(
        languageExtension({
            language: shown,
            version,
            latex: () =>
                latexEditor(
                    input.client,
                    { root, path },
                    input.instance,
                    input.say,
                    input.commands
                ),
            markdown: () => symbolsExtension(markdownOutline),
            // A tab over a file of a served root has no library address, and its file names none.
            served: lsp.extension(
                shown,
                library === '' ? { root, path } : { root, path, library },
                version
            )
        })
    );
    return {
        lsp,
        get extension() {
            return extension;
        }
    };
}
