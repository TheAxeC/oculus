// Layer 3, primitive. The completion kinds LaTeX Workshop gives that a LaTeX language server does
// not: `\envname`, where `\` and the name of an environment insert the environment with its
// closing line, and the sub- and superscripts the text already uses, offered after `_{` and `^{`.
// It is an EditorExtension (types.ts) added to a LaTeX model beside the others and taken away with
// it. A provider answers only for its own model, since Monaco calls every provider of a language
// for every model of it. The environments are the rows of `latex_editing.environments` in
// config/catalogs/latex.yml.

import type * as Monaco from 'monaco-editor';
import { scriptsOf } from './references';
import type { EditorExtension } from '../../types';

/** What the suggestions read of the page. */
export type SuggestDeps = {
    /**
     * The environments `\envname` offers, each with the arguments it takes after `\begin{name}`.
     */
    environments: { name: string; arguments: string }[];
    /** The words after an environment's name in the list: what the suggestion is. */
    detail: string;
};

/** The suggestions of one LaTeX model. */
export function latexSuggest(deps: SuggestDeps): EditorExtension {
    return (kit, _editor, model) => {
        const { monaco } = kit;
        const language = model.getLanguageId();
        const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
        const provider = monaco.languages.registerCompletionItemProvider(language, {
            triggerCharacters: ['\\', '{'],
            provideCompletionItems: (asked, at): Monaco.languages.CompletionList => {
                if (asked !== model) return { suggestions: [] };
                const before = asked.getLineContent(at.lineNumber).slice(0, at.column - 1);
                const typed = /\\([A-Za-z]*\*?)$/.exec(before);
                if (typed !== null) {
                    const range = new monaco.Range(
                        at.lineNumber,
                        at.column - typed[0].length,
                        at.lineNumber,
                        at.column
                    );
                    return {
                        suggestions: deps.environments.map((one) => ({
                            label: one.name,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            detail: deps.detail,
                            filterText: `\\${one.name}`,
                            insertText: `\\\\begin{${one.name}}${one.arguments}\n\t$0\n\\\\end{${one.name}}`,
                            insertTextRules: snippet,
                            range
                        }))
                    };
                }
                if (!/[_^]\{$/.test(before)) return { suggestions: [] };
                const range = new monaco.Range(at.lineNumber, at.column, at.lineNumber, at.column);
                return {
                    suggestions: scriptsOf(asked.getValue()).map((body) => ({
                        label: body,
                        kind: monaco.languages.CompletionItemKind.Text,
                        insertText: body,
                        range
                    }))
                };
            }
        });
        return () => provider.dispose();
    };
}
