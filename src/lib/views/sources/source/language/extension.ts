// Layer 3, view partial of Source.svelte. The one function that picks what a source tab's language
// adds to its editor: LaTeX's build markers, preview, formatter and editing commands
// (`latex-editor.ts`), the headings of a Markdown file as document symbols (`symbols.ts`), or the
// registration of a model a language server serves (`lsp.ts`). A language server's registration
// and LaTeX's extension are both added to a LaTeX file, so the markers, the hover, Format Document
// and the editing commands stay while a server serves it; a version of a file at a commit gets
// none of LaTeX's, since the build reads the file on disk.

import type { EditorExtension } from '$lib/ui/controls/editor/types';

/** What the choice reads: the tab's language and the extension each kind of language would add. */
export type ExtensionChoice = {
    language: string;
    /** Whether the tab shows a version of the file at a commit. */
    version: boolean;
    /** The LaTeX extension, made when it is asked for. */
    latex: () => EditorExtension;
    /** The Markdown headings' extension, made when it is asked for. */
    markdown: () => EditorExtension;
    /** The registration with a language server, undefined for a language none serves. */
    served: EditorExtension | undefined;
};

/** Both extensions as one: each is added in turn and both are taken away with it. */
function together(first: EditorExtension, second: EditorExtension): EditorExtension {
    return (kit, editor, model) => {
        const stops = [first(kit, editor, model), second(kit, editor, model)];
        return () => {
            for (const stop of stops) stop();
        };
    };
}

/**
 * The extension a tab's language adds to its editor, or undefined for a language that adds none.
 */
export function languageExtension(choice: ExtensionChoice): EditorExtension | undefined {
    const latex = choice.language === 'latex' && !choice.version;
    if (choice.served !== undefined) {
        return latex ? together(choice.latex(), choice.served) : choice.served;
    }
    if (latex) return choice.latex();
    if (choice.language === 'markdown') return choice.markdown();
    return undefined;
}
