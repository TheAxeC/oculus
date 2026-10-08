// Layer 3, view partial of Source.svelte. The one function that picks what a source tab adds to its
// editor: the markers of the errors a project command printed for the file
// (`command-marks.svelte.ts`), added to every tab of a file on disk beside whatever its language
// adds, which is LaTeX's build markers, preview, formatter and editing commands
// (`latex-editor.ts`), the headings of a Markdown file as document symbols (`symbols.ts`), the
// debug hover of a rite file (kit/rite/rite-hover.ts), or the registration of a model a language
// server serves (`lsp.ts`). A language server's registration and LaTeX's extension are both added
// to a LaTeX file, so the markers, the hover, Format Document and the editing commands stay while
// a server serves it, and a rite file's debug hover is added beside the server's; a version of a
// file at a commit gets none of LaTeX's or rite's, since the build and the debugger read the
// file on disk.

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
    /** The debug hover of a rite file, made when it is asked for. */
    rite: () => EditorExtension;
    /** The registration with a language server, undefined for a language none serves. */
    served: EditorExtension | undefined;
    /** The markers of the errors a command printed, undefined for a tab with no file on disk. */
    commands?: EditorExtension;
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
    const language = languageOnly(choice);
    if (choice.commands === undefined) return language;
    return language === undefined ? choice.commands : together(language, choice.commands);
}

/** The extension the tab's language adds, without the command markers. */
function languageOnly(choice: ExtensionChoice): EditorExtension | undefined {
    const latex = choice.language === 'latex' && !choice.version;
    const rite = choice.language === 'rite' && !choice.version;
    if (choice.served !== undefined) {
        if (latex) return together(choice.latex(), choice.served);
        return rite ? together(choice.rite(), choice.served) : choice.served;
    }
    if (latex) return choice.latex();
    if (rite) return choice.rite();
    if (choice.language === 'markdown') return choice.markdown();
    return undefined;
}
