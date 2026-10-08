// Layer 3, primitive. The Unicode math symbols after a backslash: `\alpha` with its glyph in the
// list, from the rows of config/catalogs/unimath.yml (`latex_unimath`). It is an EditorExtension
// (types.ts) added to a LaTeX model beside the others and taken away with it, and it offers
// nothing while `latex.unimath_symbols` is off. A provider answers only for its own model, since
// Monaco calls every provider of a language for every model of it. The label is the command, the
// filter text and the inserted text are the command with its backslash, the detail is the row's
// detail as given (the glyph and, in some rows, the package that defines the command), and the
// documentation is the row's words.

import type * as Monaco from 'monaco-editor';
import type { EditorExtension } from '../../types';

/** One symbol: the command without its backslash, the glyph line and the words. */
type UnimathRow = { command: string; detail: string; documentation: string };

/** What the symbols read of the page. */
export type UnimathDeps = {
    /** The rows of the catalog. */
    symbols: () => readonly UnimathRow[];
    /** Whether `latex.unimath_symbols` is on now. */
    enabled: () => boolean;
};

/** The symbols as completion items over one range. */
function unimathItems(
    monaco: Pick<typeof Monaco, 'languages'>,
    rows: readonly UnimathRow[],
    range: Monaco.IRange
): Monaco.languages.CompletionItem[] {
    return rows.map((row) => ({
        label: row.command,
        kind: monaco.languages.CompletionItemKind.Constant,
        detail: row.detail,
        documentation: row.documentation,
        filterText: `\\${row.command}`,
        insertText: `\\${row.command}`,
        range
    }));
}

/** The completion of the Unicode math symbols of one LaTeX model. */
export function latexUnimath(deps: UnimathDeps): EditorExtension {
    return (kit, _editor, model) => {
        const { monaco } = kit;
        const provider = monaco.languages.registerCompletionItemProvider(model.getLanguageId(), {
            triggerCharacters: ['\\'],
            provideCompletionItems: (asked, at): Monaco.languages.CompletionList => {
                if (asked !== model || !deps.enabled()) return { suggestions: [] };
                const before = asked.getLineContent(at.lineNumber).slice(0, at.column - 1);
                const typed = /\\[A-Za-z]*$/.exec(before);
                if (typed === null) return { suggestions: [] };
                const range = new monaco.Range(
                    at.lineNumber,
                    at.column - typed[0].length,
                    at.lineNumber,
                    at.column
                );
                return { suggestions: unimathItems(monaco, deps.symbols(), range) };
            }
        });
        return () => provider.dispose();
    };
}
