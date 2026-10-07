// Layer 3, primitive. What the text editor does with its gutter, taken out of Editor.svelte so the
// component keeps the editor's life (the model, the options, the effects) and this module holds
// what a gutter needs from it: the press in the gutter, the action over the quick diff marks from
// the caret's line, the drawing of the marks, the breakpoints, the paused line and the blame, and
// the listeners that keep the breakpoints on their lines and show the hint dot.
//
// Each takes the editor, the model and the values it reads as parameters, so none of them holds a
// state of its own: the decorations and the line numbers are Monaco's, and a press is mapped back
// to the mark or the blamed line it landed on by gutter.ts's rules. The breakpoint decorations are
// tracked by Monaco as the text changes, so after an edit the lines they sit on are read back
// and handed to `onbreakpoints` when they differ from the lines handed in.

import type * as Monaco from 'monaco-editor';
import {
    blameDecorations,
    blameNumbers,
    blameWidth,
    breakpointDecorations,
    hintDecorations,
    markAction,
    markDecorations,
    pausedDecorations,
    type ChangeAction,
    type EditorBlame,
    type EditorBreakpoint,
    type EditorMark
} from './gutter';

/** The values of the gutter the editor was handed: the marks, the blame, the breakpoints. */
export type GutterValues = {
    marks: readonly EditorMark[];
    blame: readonly EditorBlame[];
    breakpoints: readonly EditorBreakpoint[];
    /** The line a paused program is on, or null. */
    paused: number | null;
};

/** What the parent is told of a press in the gutter. */
export type GutterHandlers = {
    onmark?: (mark: EditorMark) => void;
    onblame?: (row: EditorBlame) => void;
    onglyph?: (line: number) => void;
    /** The lines the breakpoints sit on after an edit moved them, in the order they were given. */
    onbreakpoints?: (lines: number[]) => void;
};

/** The decoration collections the gutter is drawn through. */
export type GutterCollections = {
    marks: Monaco.editor.IEditorDecorationsCollection;
    blame: Monaco.editor.IEditorDecorationsCollection;
    breakpoints: Monaco.editor.IEditorDecorationsCollection;
    paused: Monaco.editor.IEditorDecorationsCollection;
    hint: Monaco.editor.IEditorDecorationsCollection;
    highlights: Monaco.editor.IEditorDecorationsCollection;
};

/** Make the editor's decoration collections, each empty. */
export function gutterCollections(editor: Monaco.editor.IStandaloneCodeEditor): GutterCollections {
    const make = (): Monaco.editor.IEditorDecorationsCollection =>
        editor.createDecorationsCollection();
    return {
        marks: make(),
        blame: make(),
        breakpoints: make(),
        paused: make(),
        hint: make(),
        highlights: make()
    };
}

/**
 * A press in the gutter: a quick diff mark opened, a blamed line number's commit, or the glyph
 * margin's line, which only a left press gives. `lines` is the text's line count, which a mark's
 * lines are clamped to.
 */
function pressInGutter(
    monaco: typeof Monaco,
    event: Monaco.editor.IEditorMouseEvent,
    values: GutterValues,
    lines: number,
    handlers: GutterHandlers
): void {
    const target = event.target;
    const line = target.position?.lineNumber;
    if (line === undefined) return;
    const { MouseTargetType } = monaco.editor;
    if (target.type === MouseTargetType.GUTTER_LINE_DECORATIONS) {
        const done = markAction('open', values.marks, line, lines);
        if (done?.mark !== undefined) handlers.onmark?.(done.mark);
    } else if (target.type === MouseTargetType.GUTTER_LINE_NUMBERS) {
        const row = values.blame.find((one) => one.line === line);
        if (row !== undefined && row.commit !== '') handlers.onblame?.(row);
    } else if (
        target.type === MouseTargetType.GUTTER_GLYPH_MARGIN &&
        event.event.leftButton &&
        // A Control press is macOS's context click, which also reports the left button.
        !event.event.ctrlKey
    ) {
        handlers.onglyph?.(line);
    }
}

/** An action over the marks, from the caret's line: the mark opened, or the caret moved. */
export function actOnMarks(
    editor: Monaco.editor.IStandaloneCodeEditor,
    does: ChangeAction['does'],
    marks: readonly EditorMark[],
    lines: number,
    onmark?: (mark: EditorMark) => void
): void {
    const line = editor.getPosition()?.lineNumber ?? 1;
    const done = markAction(does, marks, line, lines);
    if (done?.mark !== undefined) onmark?.(done.mark);
    if (done?.line === undefined) return;
    editor.setPosition({ lineNumber: done.line, column: 1 });
    editor.revealLineInCenterIfOutsideViewport(done.line);
}

/**
 * Draw the marks and the breakpoints as decorations and the blame in the number column, for a text
 * of `lines` lines.
 */
export function drawGutter(
    editor: Monaco.editor.IStandaloneCodeEditor,
    model: Monaco.editor.ITextModel,
    collections: GutterCollections,
    values: GutterValues,
    lines: number
): void {
    collections.marks.set(markDecorations(values.marks, model.getLineCount()));
    collections.breakpoints.set(breakpointDecorations(values.breakpoints));
    collections.paused.set(pausedDecorations(values.paused));
    collections.blame.set(blameDecorations(values.blame));
    editor.updateOptions({
        lineNumbers: values.blame.length === 0 ? 'on' : blameNumbers(values.blame, lines),
        lineNumbersMinChars: blameWidth(values.blame, lines)
    });
}

/**
 * The gutter's listeners: a press in it, the hint dot under the pointer in the glyph margin, and
 * the breakpoints' lines read back after the text changed. The values are read at each event, so
 * what the editor holds then is what is read.
 */
export function followGutter(
    monaco: typeof Monaco,
    editor: Monaco.editor.IStandaloneCodeEditor,
    collections: GutterCollections,
    read: () => {
        values: GutterValues;
        lines: number;
        handlers: GutterHandlers;
        /** Whether the text is being replaced from the parent's, which moves no breakpoint. */
        applying: boolean;
    }
): Monaco.IDisposable[] {
    const { MouseTargetType } = monaco.editor;
    // A line that holds a breakpoint keeps its own mark under the pointer.
    const hint = (line: number | null): void => {
        const { values, handlers } = read();
        const held = values.breakpoints.some((one) => one.line === line);
        collections.hint.set(handlers.onglyph === undefined || held ? [] : hintDecorations(line));
    };
    return [
        editor.onMouseDown((event) => {
            const { values, lines, handlers } = read();
            pressInGutter(monaco, event, values, lines, handlers);
        }),
        editor.onMouseMove((event) => {
            const over = event.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN;
            hint(over ? event.target.position.lineNumber : null);
        }),
        editor.onMouseLeave(() => hint(null)),
        editor.onDidChangeModelContent(() => {
            const { values, handlers, applying } = read();
            if (applying || handlers.onbreakpoints === undefined) return;
            const lines = collections.breakpoints.getRanges().map((range) => range.startLineNumber);
            const held = values.breakpoints.map((one) => one.line);
            if (lines.length === held.length && lines.every((line, at) => line === held[at]))
                return;
            handlers.onbreakpoints(lines);
        })
    ];
}

/** Tint runs of lines, each from its first line (counting from one) for its count of lines. */
export function drawHighlights(
    collections: GutterCollections,
    runs: readonly { line: number; count: number }[]
): void {
    collections.highlights.set(
        runs.map(({ line, count }) => ({
            range: {
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line + count - 1,
                endColumn: 1
            },
            options: { isWholeLine: true, className: 'oculus-highlight' }
        }))
    );
}
