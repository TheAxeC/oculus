// Layer 3, primitive. The editor's gutter as Monaco draws VS Code's: the quick diff marks as line
// decorations in the lane between the line numbers and the text (a bar beside an added or a
// modified run, a wedge where lines were deleted, at the top of the line after them or at the foot
// of the last line for a deletion at the end), the breakpoints as glyph-margin decorations, and
// the blame written into the line-number column through Monaco's `lineNumbers` function, the
// commit and its subject on the number's hover.
//
// Each is built here from plain values the editor is handed, so the view that reads git decides
// what is marked and the editor draws it; a press is mapped back to the mark or the blamed line it
// landed on, and the caret stepped from mark to mark, by the same rules.

import type { IMarkdownString, editor } from 'monaco-editor';
import { chordHint, type KeyPress } from './chords';
import type { EditorAction, EditorChangeWords } from './types';

/** A quick diff mark: its kind, its first line, how many lines it spans and what it says. */
export type EditorMark = {
    kind: 'added' | 'modified' | 'deleted';
    /** The first line, counting from one; for a deletion, the line it sits before. */
    line: number;
    /** How many lines it spans; zero for a deletion. */
    count: number;
    /** The words its hover says. */
    words?: string;
};

/** One blamed line: the words its number carries, its hover, and its commit, empty for none. */
export type EditorBlame = { line: number; words: string; title: string; commit: string };

/** The width of the line-number column when no blame is drawn in it, Monaco's own. */
const PLAIN_WIDTH = 5;

/** The lines a mark is drawn on, and whether a deletion's wedge sits at the foot of its line. */
function drawnAt(mark: EditorMark, lines: number): { start: number; end: number; foot: boolean } {
    const last = Math.max(1, lines);
    if (mark.kind === 'deleted') {
        const line = Math.min(Math.max(1, mark.line), last);
        return { start: line, end: line, foot: mark.line > last };
    }
    const start = Math.min(Math.max(1, mark.line), last);
    return { start, end: Math.min(last, Math.max(start, mark.line + mark.count - 1)), foot: false };
}

/** One decoration over whole lines. */
function onLines(
    start: number,
    end: number,
    options: editor.IModelDecorationOptions
): editor.IModelDeltaDecoration {
    return {
        range: { startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: 1 },
        options: { isWholeLine: true, ...options }
    };
}

/** The quick diff marks as line decorations, one per mark, classed by its kind. */
export function markDecorations(
    marks: readonly EditorMark[],
    lines: number
): editor.IModelDeltaDecoration[] {
    return marks.map((mark) => {
        const { start, end, foot } = drawnAt(mark, lines);
        const kind = foot ? 'deleted-foot' : mark.kind;
        return onLines(start, end, {
            linesDecorationsClassName: `oculus-mark oculus-mark-${kind}`,
            ...(mark.words === undefined ? {} : { linesDecorationsTooltip: mark.words })
        });
    });
}

/** The mark drawn on a line, which a press there opens, or null for a line none is drawn on. */
export function markAt(
    marks: readonly EditorMark[],
    line: number,
    lines: number
): EditorMark | null {
    for (const mark of marks) {
        const { start, end } = drawnAt(mark, lines);
        if (line >= start && line <= end) return mark;
    }
    return null;
}

/**
 * The line Go to Next Change or Go to Previous Change puts the caret on from `line`: the first line
 * of the nearest mark drawn after the caret or before it, in the order the marks are drawn, going
 * round to the first mark after the last and to the last before the first, as VS Code's do. Null
 * when the text holds no mark.
 */
export function stepMark(
    marks: readonly EditorMark[],
    line: number,
    lines: number,
    forward: boolean
): number | null {
    const starts = marks.map((mark) => drawnAt(mark, lines).start).sort((a, b) => a - b);
    if (starts.length === 0) return null;
    if (forward) return starts.find((start) => start > line) ?? starts[0];
    return starts.findLast((start) => start < line) ?? starts[starts.length - 1];
}

/** One of the editor's actions over the marks: what it does, and the key it is bound to. */
export type ChangeAction = EditorAction & {
    does: 'next' | 'previous' | 'open';
    press: KeyPress | null;
};

/** VS Code's keys for the steps between the marks: Alt+F5, and Shift+Alt+F5 back. */
const NEXT_CHANGE: KeyPress = { code: 'F5', alt: true };
const PREVIOUS_CHANGE: KeyPress = { code: 'F5', alt: true, shift: true };

/**
 * The editor's actions over the marks under the parent's labels, while the text holds a mark: Go
 * to Next Change on Alt+F5 and Go to Previous Change on Shift+Alt+F5, VS Code's keys, and Open
 * Change on none, each hint written from its key. With no mark there are none, as VS Code offers
 * neither step on a file with no change.
 */
export function changeActions(
    words: EditorChangeWords,
    mac: boolean,
    marked: boolean
): ChangeAction[] {
    if (!marked) return [];
    const id = (name: string) => `oculus.editor.${name}`;
    const hint = (press: KeyPress) => chordHint([press], mac);
    return [
        {
            id: id('nextChange'),
            label: words.next,
            hint: hint(NEXT_CHANGE),
            does: 'next',
            press: NEXT_CHANGE
        },
        {
            id: id('previousChange'),
            label: words.previous,
            hint: hint(PREVIOUS_CHANGE),
            does: 'previous',
            press: PREVIOUS_CHANGE
        },
        { id: id('openChange'), label: words.open, hint: '', does: 'open', press: null }
    ];
}

/**
 * What an action over the marks does from the caret's line: Open Change the mark drawn there,
 * as a press on it opens it, and a step the line the caret goes to. Null when it does nothing.
 */
export function markAction(
    does: ChangeAction['does'],
    marks: readonly EditorMark[],
    line: number,
    lines: number
): { mark?: EditorMark; line?: number } | null {
    if (does === 'open') {
        const mark = markAt(marks, line, lines);
        return mark === null ? null : { mark };
    }
    const to = stepMark(marks, line, lines, does === 'next');
    return to === null ? null : { line: to };
}

/** The breakpoints as glyph-margin decorations, one on each line handed in. */
export function breakpointDecorations(lines: readonly number[]): editor.IModelDeltaDecoration[] {
    return lines.map((line) => onLines(line, line, { glyphMarginClassName: 'oculus-breakpoint' }));
}

/**
 * A text as Markdown that renders it as written: a commit subject is the author's text, and a star
 * or a bracket in it is a character, not emphasis or a link.
 */
function literal(text: string): IMarkdownString {
    return { value: text.replace(/[\\`*_{}[\]()#+\-.!|<>~]/g, (char) => `\\${char}`) };
}

/**
 * The blame as line-number decorations: the commit and its subject on the number's hover, and the
 * first line of each run and a line no commit holds classed apart.
 */
export function blameDecorations(blame: readonly EditorBlame[]): editor.IModelDeltaDecoration[] {
    return blame.map((row) =>
        onLines(row.line, row.line, {
            lineNumberHoverMessage: literal(row.title),
            lineNumberClassName:
                row.commit === '' ? 'oculus-blame oculus-blame-uncommitted' : 'oculus-blame'
        })
    );
}

/** How many digits the widest line number of the text takes. */
function digitsOf(blame: readonly EditorBlame[], lines: number): number {
    const widest = Math.max(lines, ...blame.map((row) => row.line));
    return String(Math.max(1, widest)).length;
}

/** The five characters HTML reads as markup, as the entities that draw them as text. */
const ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

/** A text as HTML that draws it as written. */
function escaped(text: string): string {
    return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

/**
 * The line-number column's text while blame is on, as written: a run's first line says its author
 * and how long ago with the number, the others the number alone, padded so every number sits at
 * one column.
 */
function blameText(blame: readonly EditorBlame[], lines: number): (line: number) => string {
    const words = new Map(blame.map((row) => [row.line, row.words]));
    const width = Math.max(0, ...blame.map((row) => row.words.length));
    const digits = digitsOf(blame, lines);
    return (line: number) =>
        `${(words.get(line) ?? '').padEnd(width)} ${String(line).padStart(digits)}`;
}

/**
 * The line-number column's text while blame is on, as Monaco's `lineNumbers` function hands it.
 * Monaco writes that string into the margin's HTML as it is, and an author's name is text from
 * any repository's history, so each character HTML reads as markup is handed as its entity; the
 * spaces of the padding are kept on screen by the editor's `white-space: pre` on the column.
 */
export function blameNumbers(blame: readonly EditorBlame[], lines = 0): (line: number) => string {
    const text = blameText(blame, lines);
    return (line: number) => escaped(text(line));
}

/** How many characters the line-number column holds: the blame and the number, or Monaco's own. */
export function blameWidth(blame: readonly EditorBlame[], lines: number): number {
    if (blame.length === 0) return PLAIN_WIDTH;
    return blameText(blame, lines)(1).length;
}
