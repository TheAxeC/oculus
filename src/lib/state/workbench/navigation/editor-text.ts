// Layer 2, client state. The rules the status bar's source items read a file's text by and rewrite
// it with: where the caret is, how the file indents, which line ending it uses, and the two
// conversions. They are pure functions over the text, so the source tab that applies them and the
// tests that hold them share one rule and no browser.
//
// A textarea hands back its value with every line ending as a line feed, whatever the file holds,
// so the caret is read over that value and a file's own ending is put back by withEnding before
// the text is kept.

import type { Indent } from '../../sessions/source.svelte.ts';

export type { Indent };

/** The two line endings a text file is written with. */
export type LineEnding = 'LF' | 'CRLF';

/** Where the caret is, lines and columns counted from one, and how many characters are selected. */
export type Caret = { line: number; column: number; selected: number };

/** The step sizes the indentation menu offers, VS Code's own three. */
export const INDENT_SIZES = [2, 4, 8] as const;

/** What a file with no indented line is read as, VS Code's default. */
export const DEFAULT_INDENT: Indent = { tabs: false, size: 4 };

/** The widest step a file's spaces are read as. */
const WIDEST = 8;

/** The caret at the start of a file, before the reader has moved it. */
export const START: Caret = { line: 1, column: 1, selected: 0 };

/**
 * How a file indents, read from its own lines. More lines opening with a tab than with a space make
 * it a tab file, and its step is the default width. A space file's step is the change in leading
 * spaces met most often between one indented line and the next, from one to eight; a file whose
 * lines never indent is read as the default.
 */
export function detectIndent(text: string): Indent {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    let tabbed = 0;
    let spaced = 0;
    const steps = new Map<number, number>();
    let previous = 0;
    for (const line of lines) {
        if (line.startsWith('\t')) {
            tabbed += 1;
            continue;
        }
        const spaces = line.length - line.trimStart().length;
        if (spaces > 0 && line.startsWith(' ')) spaced += 1;
        const step = Math.abs(spaces - previous);
        if (step > 0 && step <= WIDEST) steps.set(step, (steps.get(step) ?? 0) + 1);
        previous = spaces;
    }
    if (tabbed > spaced) return { tabs: true, size: DEFAULT_INDENT.size };
    let size = DEFAULT_INDENT.size;
    let seen = 0;
    for (const [step, count] of steps) {
        if (count > seen || (count === seen && step < size)) {
            size = step;
            seen = count;
        }
    }
    return { tabs: false, size };
}

/** The file's line ending: CRLF when any line ends so, and LF otherwise, an empty file included. */
export function lineEnding(text: string): LineEnding {
    return text.includes('\r\n') ? 'CRLF' : 'LF';
}

/** The text with every line ending made the one given, a lone carriage return left as it is. */
export function withEnding(text: string, ending: LineEnding): string {
    const lf = text.replace(/\r\n/g, '\n');
    return ending === 'LF' ? lf : lf.replace(/\n/g, '\r\n');
}

/** What one step of an indentation inserts: a tab, or the step's width of spaces. */
export function indentUnit(indent: Indent): string {
    return indent.tabs ? '\t' : ' '.repeat(indent.size);
}

/**
 * The text with every line's leading indentation rewritten in tabs or in spaces, a tab standing
 * for `size` spaces. Spaces short of a whole step stay spaces after the tabs, so no line moves.
 */
export function convertIndent(text: string, tabs: boolean, size: number): string {
    const width = Math.max(1, Math.floor(size));
    return text.replace(/^[ \t]+/gm, (lead) => {
        let columns = 0;
        for (const char of lead)
            columns = char === '\t' ? columns + width - (columns % width) : columns + 1;
        if (!tabs) return ' '.repeat(columns);
        return '\t'.repeat(Math.floor(columns / width)) + ' '.repeat(columns % width);
    });
}

/**
 * Where the caret is in a textarea's value: the line and the column of its active end, counted from
 * one, and how many characters lie between the two ends.
 */
export function caretOf(value: string, start: number, end: number, backward: boolean): Caret {
    const at = Math.max(0, Math.min(backward ? start : end, value.length));
    const before = value.slice(0, at);
    const line = before.split('\n').length;
    const column = at - (before.lastIndexOf('\n') + 1) + 1;
    return { line, column, selected: Math.abs(end - start) };
}

/** How many lines a text holds, one for an empty text, as the go-to-line range counts them. */
export function lineCount(text: string): number {
    return text.split('\n').length;
}
