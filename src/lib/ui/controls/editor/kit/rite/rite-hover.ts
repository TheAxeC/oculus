// Layer 3, primitive. The hover of a rite source tab while a debug session is paused: the word
// under the pointer, in rite's own word characters (the language configuration's word pattern,
// kit/rite/rite.ts), is handed to `evaluate`, and what it answers is shown as code. The extension
// answers for the model it was added to alone, since a provider is registered per language and a
// page holds many editors of one language, and it answers nothing for a word `evaluate` answers
// null for, so a special form, a comment word or a name out of scope shows no hover.

import type * as Monaco from 'monaco-editor';
import type { EditorExtension } from '../../types';

/** What a hover asks of the debug state: the text a word is worth, or null for none. */
export type HoverEvaluate = (word: string) => string | null | Promise<string | null>;

/** The text as a Markdown code fence that no run of backticks in it can close. */
function fenced(text: string): string {
    const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
    const fence = '`'.repeat(Math.max(3, longest + 1));
    return `${fence}\n${text}\n${fence}`;
}

/** The hover over the model's rite words, answered by `evaluate`. */
export function riteHover(evaluate: HoverEvaluate): EditorExtension {
    return (kit, _editor, model) => {
        let alive = true;
        const registered = kit.monaco.languages.registerHoverProvider(model.getLanguageId(), {
            provideHover: async (
                asked: Monaco.editor.ITextModel,
                position: Monaco.Position,
                token: Monaco.CancellationToken
            ) => {
                if (!alive || asked !== model) return null;
                const word = model.getWordAtPosition(position);
                if (word === null) return null;
                const version = model.getVersionId();
                const answer = await evaluate(word.word);
                if (
                    answer === null ||
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the teardown below clears the flag while the evaluation is awaited, which the checker does not see
                    !alive ||
                    token.isCancellationRequested ||
                    model.getVersionId() !== version
                ) {
                    return null;
                }
                return {
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endLineNumber: position.lineNumber,
                        endColumn: word.endColumn
                    },
                    contents: [{ value: fenced(`${word.word} = ${answer}`) }]
                };
            }
        });
        return () => {
            alive = false;
            registered.dispose();
        };
    };
}
