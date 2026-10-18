// Layer 3, primitive. What a parent asks the text editor to do through `perform` (types.ts's
// `EditorCommand`), done on the editor and its model: go to a line, go to a place and select the
// word at it, select a range, set or convert the indentation, set the line ending, set the language
// (and load its grammar when it has not loaded), insert a text or a snippet at the selections,
// replace the whole text as one edit, or run one of the editor's actions; and the first line the
// editor shows, which the parent keeps so that a copy of the tab opens at it; and the edits a text
// the parent handed in was reached by, made in the model as they are, or the whole text when the
// model refuses them.
//
// A place is revealed by Monaco's own reveal, which keeps it clear of the sticky scroll lines. An
// ask run before the editor has its height (a tab opened at a problem, its editor made a moment
// before, or a hidden tab shown for it, whose editor is laid out again at the sizes its pane passes
// through) is revealed again at each height the editor is laid out at for a second after it first
// has one, until the reader presses, types or turns the wheel in it: Monaco reveals into a viewport
// of no height, or of a few lines, by putting the place's line at its top, which the full height
// then leaves under the sticky lines.

import type * as Monaco from 'monaco-editor';
import { eolOf, type EditorKit } from './kit/load';
import { shikiId } from './kit/languages/grammars';
import type { EditorCommand, EditorEnding, EditorReach } from './types';

/** How long after the editor first has a height a new height reveals the place again. */
const SETTLING_MS = 1000;

/**
 * Reveal a place now and again at each new height the editor is laid out at, from the first one
 * with a height for SETTLING_MS, until the reader presses, types or turns the wheel in it.
 */
function revealLaidOut(
    made: Pick<
        Monaco.editor.IStandaloneCodeEditor,
        'getLayoutInfo' | 'onDidLayoutChange' | 'onMouseDown' | 'onKeyDown' | 'getDomNode'
    >,
    reveal: () => void
): void {
    reveal();
    let height = made.getLayoutInfo().height;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settling = (): void => {
        timer ??= setTimeout(stop, SETTLING_MS);
    };
    const node = made.getDomNode();
    const held = [
        made.onDidLayoutChange((info) => {
            if (info.height <= 0 || info.height === height) return;
            height = info.height;
            settling();
            reveal();
        }),
        made.onMouseDown(stop),
        made.onKeyDown(stop)
    ];
    node?.addEventListener('wheel', stop, { capture: true, passive: true });
    if (height > 0) settling();
    function stop(): void {
        clearTimeout(timer);
        for (const one of held) one.dispose();
        node?.removeEventListener('wheel', stop, { capture: true });
    }
}

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
        revealLaidOut(made, () => made.revealLineInCenter(line));
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
        revealLaidOut(made, () =>
            made.revealRangeInCenter(made.getSelection() ?? held.getFullModelRange())
        );
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
        revealLaidOut(made, () => made.revealLineInCenter(line));
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
 * model does not hold the text they were made in, refuses them, or does not hold `wanted` after
 * them, so the caller replaces the whole text: an edit the model refuses (Monaco throws for ranges
 * it will not take) must not leave the model on the old text while the tab's draft holds the new.
 */
function reachedBy(
    monaco: EditorKit['monaco'],
    held: Monaco.editor.ITextModel,
    reach: EditorReach | null,
    wanted: string
): boolean {
    const LF = monaco.editor.EndOfLinePreference.LF;
    const same = held.getValue(LF) === reach?.from.replace(/\r\n/g, '\n');
    if (reach === null || !same) return false;
    try {
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
    } catch {
        return false;
    }
    return held.getValue(LF) === wanted.replace(/\r\n/g, '\n');
}

/**
 * Bring a model to a text the parent handed in: by the edits the text was reached by when the
 * model takes them, else as one replacement of the whole text, and then in the line ending asked
 * for.
 */
export function reachText(
    monaco: EditorKit['monaco'],
    held: Monaco.editor.ITextModel,
    reach: EditorReach | null,
    wanted: string,
    ending: EditorEnding
): void {
    if (!reachedBy(monaco, held, reach, wanted)) {
        held.pushEditOperations(
            [],
            [{ range: held.getFullModelRange(), text: wanted }],
            () => null
        );
    }
    held.pushEOL(eolOf(monaco, ending));
}
