// Layer 3, primitive. The snippets of the acting apps, offered by the editor's completion for the
// language of their file. Monaco takes a snippet's body in VS Code's syntax (tab stops,
// placeholders, choices, variables), so the body is handed over as it is with the rule that makes
// the completion insert it as a snippet. One provider is registered for each language that has
// snippets, replaced whenever the apps' snippets change. A snippet file's `scope` key is not read.

import type * as Monaco from 'monaco-editor';
import type { AppEditorSnippets } from '$lib/data/helpers/files/apps/tools/language-kit';
import { shikiId } from './grammars';

/** Register the completion of each language's snippets; the call it answers takes them away. */
export function registerSnippets(
    monaco: typeof Monaco,
    groups: readonly AppEditorSnippets[]
): { dispose(): void } {
    const owned = new Map<string, AppEditorSnippets['snippets']>();
    for (const group of groups) {
        const id = shikiId(group.language);
        owned.set(id, [...(owned.get(id) ?? []), ...group.snippets]);
    }
    const providers = [...owned].map(([id, snippets]) =>
        monaco.languages.registerCompletionItemProvider(id, {
            provideCompletionItems(model, position) {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                return {
                    suggestions: snippets.flatMap((snippet) =>
                        snippet.prefix.map((prefix) => ({
                            label: prefix,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: snippet.body,
                            insertTextRules:
                                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: snippet.name,
                            documentation: snippet.description,
                            range
                        }))
                    )
                };
            }
        })
    );
    return { dispose: () => providers.forEach((one) => one.dispose()) };
}
