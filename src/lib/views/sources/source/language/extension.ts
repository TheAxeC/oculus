// Layer 3, view partial of Source.svelte. The one function that picks what a source tab's language
// adds to its editor: LaTeX's build markers, preview and formatter (`latex-editor.ts`), the
// headings of a Markdown file as document symbols (`symbols.ts`), or the registration of a model a
// language server serves (`lsp.ts`). A version of a file at a commit gets none of LaTeX's, since
// the build reads the file on disk.

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

/**
 * The extension a tab's language adds to its editor, or undefined for a language that adds none.
 */
export function languageExtension(choice: ExtensionChoice): EditorExtension | undefined {
    if (choice.served !== undefined) return choice.served;
    if (choice.language === 'latex' && !choice.version) return choice.latex();
    if (choice.language === 'markdown') return choice.markdown();
    return undefined;
}
