// Layer 3, primitive. What a parent asks the text editor to do through `perform` (types.ts's
// `EditorCommand`), done on the editor and its model: go to a line, go to a place and select the
// word at it, select a range, set or convert the indentation, set the line ending, set the language
// (and load its grammar when it has not loaded), insert a text or a snippet at the selections,
// replace the whole text as one edit, or run one of the editor's actions; and the first line the
// editor shows, which the parent keeps so that a copy of the tab opens at it; and the edits a text
// the parent handed in was reached by, made in the model as they are.

import type * as Monaco from 'monaco-editor';
import { eolOf, type EditorKit } from './kit/load';
import { shikiId } from './kit/languages/grammars';
import type { EditorCommand, EditorReach } from './types';

/** Do one ask of the parent's on a loaded editor and its model. */
export function runCommand(
    kit: Pick<EditorKit, 'monaco' | 'ensureLanguage'>,
    made: Monaco.editor.IStandaloneCodeEditor,
    held: Monaco.editor.ITextModel,
    command: EditorCommand
): void {
    if (command.kind === 'goto') {
        const line = Math.min(Math.max(1, command.line), held.getLineCount());
        const column = Math.min(Math.max(1, command.column ?? 1), held.getLineMaxColumn(line));
        made.setPosition({ lineNumber: line, column });
        made.revealLineInCenter(line);
        if (command.focus !== false) made.focus();
    } else if (command.kind === 'range') {
        const clamp = (line: number, column: number): Monaco.IPosition => {
            const at = Math.min(Math.max(1, Math.floor(line)), held.getLineCount());
            const to = Math.min(Math.max(1, Math.floor(column)), held.getLineMaxColumn(at));
            return { lineNumber: at, column: to };
        };
        const start = clamp(command.line, command.column);
        const end = clamp(command.endLine, command.endColumn);
        made.setSelection({
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column
        });
        made.revealRangeInCenter(made.getSelection() ?? held.getFullModelRange());
        if (command.focus !== false) made.focus();
    } else if (command.kind === 'word') {
        const line = Math.min(Math.max(1, Math.floor(command.line)), held.getLineCount());
        const end = held.getLineMaxColumn(line);
        const column = Math.min(Math.max(1, Math.floor(command.column)), end);
        // The word is selected only when the column names one of its characters. A column at or
        // past the line's end, or on a space or other character after a word, names none: the caret
        // goes there, and the word that ends just before it is not selected.
        const found = column < end ? held.getWordAtPosition({ lineNumber: line, column }) : null;
        const word = found !== null && column < found.endColumn ? found : null;
        if (word === null) made.setPosition({ lineNumber: line, column });
        else {
            made.setSelection({
                startLineNumber: line,
                startColumn: word.startColumn,
                endLineNumber: line,
                endColumn: word.endColumn
            });
        }
        made.revealLineInCenter(line);
        if (command.focus !== false) made.focus();
    } else if (command.kind === 'indent') {
        const { tabs, size } = command.indent;
        held.updateOptions({ tabSize: size, indentSize: size, insertSpaces: !tabs });
    } else if (command.kind === 'convert') {
        const id = command.tabs
            ? 'editor.action.indentationToTabs'
            : 'editor.action.indentationToSpaces';
        void made.getAction(id)?.run();
    } else if (command.kind === 'ending') {
        held.pushEOL(eolOf(kit.monaco, command.ending));
    } else if (command.kind === 'language') {
        kit.monaco.editor.setModelLanguage(held, shikiId(command.language));
        void kit.ensureLanguage(command.language);
    } else if (command.kind === 'insert') {
        made.focus();
        const snippets = made.getContribution('snippetController2') as unknown as {
            insert: (template: string) => void;
        } | null;
        if (command.snippet === true && snippets !== null) {
            snippets.insert(command.text);
        } else {
            made.pushUndoStop();
            made.executeEdits(
                'oculus-insert',
                (made.getSelections() ?? []).map((range) => ({
                    range,
                    text: command.text,
                    forceMoveMarkers: true
                }))
            );
            made.pushUndoStop();
        }
    } else if (command.kind === 'replace') {
        made.pushUndoStop();
        made.executeEdits('oculus-replace', [
            { range: held.getFullModelRange(), text: command.text }
        ]);
        made.pushUndoStop();
    } else {
        made.focus();
        void made.getAction(command.id)?.run();
    }
}

/** The line the top edge of the text is in, from one: the first line with a pixel shown. */
function lineAtTop(made: Monaco.editor.IStandaloneCodeEditor, scrollTop: number): number {
    let low = 1;
    let high = made.getModel()?.getLineCount() ?? 1;
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (made.getTopForLineNumber(mid) <= scrollTop) low = mid;
        else high = mid - 1;
    }
    return low;
}

/** What follows the first line an editor shows. */
export type FirstLine = {
    /** The scroll listener, to dispose with the editor's other listeners. */
    listener: Monaco.IDisposable;
    /** A model was set: put `start` at the top once it is laid out, then say every change. */
    settle: (
        monaco: Pick<EditorKit['monaco'], 'editor'>,
        held: Monaco.editor.ITextModel,
        start: number
    ) => void;
};

/** How long the scroll rests before the first line it rests on is said. */
const SCROLL_REST_MS = 200;

/**
 * Say the first line the editor shows once the scroll has rested on it, not on each line a scroll
 * passes: the line is written into the tab's saved state, which a fast scroll would write over
 * and over.
 */
export function followFirstLine(
    made: Monaco.editor.IStandaloneCodeEditor,
    say: (line: number) => void
): FirstLine {
    let reporting = false;
    let said = 0;
    let rest: ReturnType<typeof setTimeout> | undefined;
    const scrolled = made.onDidScrollChange((event) => {
        if (!reporting) return;
        const first = lineAtTop(made, event.scrollTop);
        clearTimeout(rest);
        rest = setTimeout(() => {
            if (first === said) return;
            said = first;
            say(first);
        }, SCROLL_REST_MS);
    });
    return {
        listener: {
            dispose: () => {
                clearTimeout(rest);
                scrolled.dispose();
            }
        },
        settle: (monaco, held, start) => {
            reporting = false;
            clearTimeout(rest);
            requestAnimationFrame(() => {
                if (made.getModel() !== held) return;
                if (start > 1) {
                    const top = made.getTopForLineNumber(Math.min(start, held.getLineCount()));
                    made.setScrollTop(top, monaco.editor.ScrollType.Immediate);
                }
                said = lineAtTop(made, made.getScrollTop());
                reporting = true;
            });
        }
    };
}

/**
 * Make the edits a text was reached by, each at its own range, as one undo stop. False when the
 * model does not hold the text they were made in or does not hold `wanted` after them.
 */
export function reachedBy(
    monaco: EditorKit['monaco'],
    held: Monaco.editor.ITextModel,
    reach: EditorReach | null,
    wanted: string
): boolean {
    const LF = monaco.editor.EndOfLinePreference.LF;
    const same = held.getValue(LF) === reach?.from.replace(/\r\n/g, '\n');
    if (reach === null || !same) return false;
    held.pushEditOperations(
        [],
        reach.edits.map(({ range, newText }) => ({
            range: new monaco.Range(
                range.start.line + 1,
                range.start.character + 1,
                range.end.line + 1,
                range.end.character + 1
            ),
            text: newText
        })),
        () => null
    );
    return held.getValue(LF) === wanted.replace(/\r\n/g, '\n');
}
