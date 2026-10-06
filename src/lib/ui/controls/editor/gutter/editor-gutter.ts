// Layer 3, primitive. What the text editor does with its gutter, taken out of Editor.svelte so the
// component keeps the editor's life (the model, the options, the effects) and this module holds the
// three things a gutter needs from it: the press in the gutter, the action over the quick diff
// marks from the caret's line, and the drawing of the marks, the breakpoints and the blame.
//
// Each takes the editor, the model and the values it reads as parameters, so none of them holds a
// state of its own: the decorations and the line numbers are Monaco's, and a press is mapped back
// to the mark or the blamed line it landed on by gutter.ts's rules.

import type * as Monaco from 'monaco-editor';
import {
    blameDecorations,
    blameNumbers,
    blameWidth,
    breakpointDecorations,
    markAction,
    markDecorations,
    type ChangeAction,
    type EditorBlame,
    type EditorMark
} from './gutter';

/** The values of the gutter the editor was handed: the marks, the blame and the breakpoints. */
export type GutterValues = {
    marks: readonly EditorMark[];
    blame: readonly EditorBlame[];
    breakpoints: readonly number[];
};

/** What the parent is told of a press in the gutter. */
export type GutterHandlers = {
    onmark?: (mark: EditorMark) => void;
    onblame?: (row: EditorBlame) => void;
    onglyph?: (line: number) => void;
};

/** The decoration collections the gutter is drawn through. */
export type GutterCollections = {
    marks: Monaco.editor.IEditorDecorationsCollection;
    blame: Monaco.editor.IEditorDecorationsCollection;
    breakpoints: Monaco.editor.IEditorDecorationsCollection;
};

/**
 * A press in the gutter: a quick diff mark opened, a blamed line number's commit, or the glyph
 * margin's line. `lines` is the text's line count, which a mark's lines are clamped to.
 */
export function pressInGutter(
    monaco: typeof Monaco,
    target: Monaco.editor.IMouseTarget,
    values: GutterValues,
    lines: number,
    handlers: GutterHandlers
): void {
    const line = target.position?.lineNumber;
    if (line === undefined) return;
    const { MouseTargetType } = monaco.editor;
    if (target.type === MouseTargetType.GUTTER_LINE_DECORATIONS) {
        const done = markAction('open', values.marks, line, lines);
        if (done?.mark !== undefined) handlers.onmark?.(done.mark);
    } else if (target.type === MouseTargetType.GUTTER_LINE_NUMBERS) {
        const row = values.blame.find((one) => one.line === line);
        if (row !== undefined && row.commit !== '') handlers.onblame?.(row);
    } else if (target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
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
    collections.blame.set(blameDecorations(values.blame));
    editor.updateOptions({
        lineNumbers: values.blame.length === 0 ? 'on' : blameNumbers(values.blame, lines),
        lineNumbersMinChars: blameWidth(values.blame, lines)
    });
}
