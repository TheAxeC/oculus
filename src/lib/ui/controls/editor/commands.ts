// Layer 3, primitive. What a parent asks the text editor to do through `perform` (types.ts's
// `EditorCommand`), done on the editor and its model: go to a line, set or convert the
// indentation, set the line ending, set the language, or run one of the editor's actions.

import type * as Monaco from 'monaco-editor';
import { eolOf } from './kit/load';
import { shikiId } from './kit/grammars';
import type { EditorCommand } from './types';

/** Do one ask of the parent's on a loaded editor and its model. */
export function runCommand(
    monaco: typeof Monaco,
    made: Monaco.editor.IStandaloneCodeEditor,
    held: Monaco.editor.ITextModel,
    command: EditorCommand
): void {
    if (command.kind === 'goto') {
        const line = Math.min(Math.max(1, command.line), held.getLineCount());
        made.setPosition({ lineNumber: line, column: 1 });
        made.revealLineInCenter(line);
        made.focus();
    } else if (command.kind === 'indent') {
        const { tabs, size } = command.indent;
        held.updateOptions({ tabSize: size, indentSize: size, insertSpaces: !tabs });
    } else if (command.kind === 'convert') {
        const id = command.tabs
            ? 'editor.action.indentationToTabs'
            : 'editor.action.indentationToSpaces';
        void made.getAction(id)?.run();
    } else if (command.kind === 'ending') {
        held.pushEOL(eolOf(monaco, command.ending));
    } else if (command.kind === 'language') {
        monaco.editor.setModelLanguage(held, shikiId(command.language));
    } else {
        made.focus();
        void made.getAction(command.id)?.run();
    }
}
