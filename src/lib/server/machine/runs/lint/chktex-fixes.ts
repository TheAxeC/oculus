// Layer 2, server. The fixes ChkTeX's warnings carry, as LaTeX Workshop's code actions make them: a
// warning's number picks an edit built from the warning's range, its message and the text around
// it. ChkTeX prints no fix of its own, so each is made here from the row, and a warning with no fix
// there gets none.
//
// An edit is in the editor's places (text.ts). The titles a reader sees are the page's
// (`lint.chktex_fix_<number>`), so a fix here carries none.

import type { LintEdit } from '../../../../data/model/index.ts';

/** The range of a warning, in the editor's places. */
type Range = { line: number; column: number; endLine: number; endColumn: number };

function edit(range: Range, text: string): LintEdit {
    return { ...range, text };
}

/** The edit that replaces the whitespace that ends the line before a column with `text`. */
function inPlaceOfSpaceBefore(
    lines: readonly string[],
    line: number,
    column: number,
    text: string
): LintEdit {
    const before = (lines[line - 1] ?? '').slice(0, column - 1);
    const spaces = /\s*$/.exec(before)?.[0].length ?? 0;
    return edit({ line, column: column - spaces, endLine: line, endColumn: column }, text);
}

/** Whether the warning's range opens a quotation: it starts the line or follows a space. */
function opensQuote(lines: readonly string[], range: Range): boolean {
    return range.column === 1 || (lines[range.line - 1] ?? '')[range.column - 2] === ' ';
}

/** The math delimiters of the warning's range changed to `open` and `close`, or null. */
function mathDelimiters(
    text: string,
    starts: readonly number[],
    range: Range,
    delimiter: string,
    open: string,
    close: string
): LintEdit[] | null {
    const place = (line: number, column: number): number | null => {
        return line < 1 || line > starts.length ? null : starts[line - 1] + column - 1;
    };
    const from = place(range.line, range.column);
    const to = place(range.endLine, range.endColumn);
    if (from === null || to === null) return null;
    const size = delimiter.length;
    let closing = to - size;
    if (closing < from + size || text.slice(closing, to) !== delimiter) {
        if (delimiter !== '$$') return null;
        const next = /(?<!\\)\$\$/g;
        next.lastIndex = from + size;
        const found = next.exec(text);
        if (found === null) return null;
        closing = found.index;
    }
    const pointOf = (offset: number): { line: number; column: number } => {
        let line = starts.length;
        while (starts[line - 1] > offset) line -= 1;
        return { line, column: offset - starts[line - 1] + 1 };
    };
    const first = pointOf(closing);
    const last = pointOf(closing + size);
    const head = pointOf(from + size);
    return [
        edit(
            { line: first.line, column: first.column, endLine: last.line, endColumn: last.column },
            close
        ),
        edit(
            {
                line: range.line,
                column: range.column,
                endLine: head.line,
                endColumn: head.column
            },
            open
        )
    ];
}

/**
 * The edits that fix warning `number` over `range`, or null when it has no fix or its text does not
 * allow one. `lines` and `starts` are the file's lines and their offsets, `text` the file.
 */
export function chktexFix(
    number: number,
    range: Range,
    message: string,
    file: { text: string; lines: readonly string[]; starts: readonly number[] }
): LintEdit[] | null {
    const { lines } = file;
    const end = { line: range.endLine, column: range.endColumn };
    const length = range.endColumn - range.column;
    switch (number) {
        case 24:
        case 26:
        case 39:
        case 42:
            return [inPlaceOfSpaceBefore(lines, end.line, end.column, '')];
        case 4:
        case 5:
        case 28:
            return [edit(range, '')];
        case 1:
            return [inPlaceOfSpaceBefore(lines, end.line, end.column - 1, '{}')];
        case 2:
            return [inPlaceOfSpaceBefore(lines, end.line, end.column, '~')];
        case 6:
            return [inPlaceOfSpaceBefore(lines, end.line, end.column - 1, '\\/')];
        case 13:
            return [inPlaceOfSpaceBefore(lines, end.line, end.column - 1, '\\@')];
        case 11: {
            const dots = /\\[cl]?dots/.exec(message)?.[0];
            return dots === undefined ? null : [edit(range, `${dots} `)];
        }
        case 12:
            return [edit(range, '\\ ')];
        case 18:
            return [edit(range, (opensQuote(lines, range) ? '``' : "''").repeat(length))];
        case 32:
            return [edit(range, '`'.repeat(length))];
        case 33:
            return [edit(range, "'".repeat(length))];
        case 34:
            return [edit(range, (opensQuote(lines, range) ? '`' : "'").repeat(length))];
        case 35: {
            const suggested = /`(.+)'/.exec(message)?.[1];
            return suggested === undefined ? null : [edit(range, suggested)];
        }
        case 45:
            return mathDelimiters(file.text, file.starts, range, '$$', '\\[', '\\]');
        case 46:
            return mathDelimiters(file.text, file.starts, range, '$', '\\(', '\\)');
        default:
            return null;
    }
}
