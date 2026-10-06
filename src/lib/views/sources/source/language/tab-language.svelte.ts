// Layer 3, view partial of Source.svelte. What a source tab's language adds to its editor, made
// once per tab: the language server wiring (`lsp.ts`) and the extension the editor is handed, which
// is LaTeX's build markers and preview (`latex-editor.ts`), a Markdown file's headings as document
// symbols (`symbols.ts`), or the registration with a server. The extension is a new function
// whenever the language, the root or the path changes, so the editor ends the old one and makes
// the new one.

import type { ClientState } from '$lib/state/client/context';
import { markdownOutline } from '$lib/state/sources/explorer/sections/outline';
import type { EditorExtension } from '$lib/ui/controls/editor/types';
import { languageExtension } from './extension';
import { latexEditor } from './latex-editor';
import { createLspTab, type LspTab } from './lsp';
import { symbolsExtension } from './symbols';

/** What the tab says of itself, each as a function. */
export type TabLanguageInput = {
    client: ClientState;
    instance: () => string;
    language: () => string;
    /** The language the editor draws the text in: plaintext past the paint limit. */
    shown: () => string;
    root: () => string;
    path: () => string;
    /** Whether the tab shows a version of the file at a commit. */
    version: () => boolean;
    say: (words: string) => void;
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
    const language = $derived(input.language());
    const shown = $derived(input.shown());
    const root = $derived(input.root());
    const path = $derived(input.path());
    const version = $derived(input.version());
    const extension = $derived(
        languageExtension({
            language,
            version,
            latex: () => latexEditor(input.client, { root, path }, input.say),
            markdown: () => symbolsExtension(markdownOutline),
            served: lsp.extension(shown, { root, path }, version)
        })
    );
    return {
        lsp,
        get extension() {
            return extension;
        }
    };
}
