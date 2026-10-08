// Layer 2, server. Places in a file's text, as the editor counts them: lines break at `\r\n`, `\n`
// and `\r`, a line and a column count from one, and a column counts UTF-16 units. A linter counts
// otherwise (ChkTeX bytes and tabs, ruff and ShellCheck code points, ESLint offsets into a text
// without its byte order mark), so each reader converts through these.

/** A place in a text: a line and a column, both from one, the column in UTF-16 units. */
export type Point = { line: number; column: number };

const BREAK = /\r\n|\r|\n/g;

/** The text without a leading byte order mark, which the editor's text never holds. */
export function withoutMark(text: string): string {
    return text.startsWith('\uFEFF') ? text.slice(1) : text;
}

/** The lines of a text, each without its break. */
export function linesOf(text: string): string[] {
    return text.split(BREAK);
}

/** The offset each line of a text starts at. */
export function lineStarts(text: string): number[] {
    const starts = [0];
    for (const found of text.matchAll(BREAK)) starts.push(found.index + found[0].length);
    return starts;
}

/** The place an offset into the text is at; an offset past the text is the end of its last line. */
export function pointAt(starts: readonly number[], offset: number): Point {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (starts[middle] <= offset) low = middle;
        else high = middle - 1;
    }
    return { line: low + 1, column: offset - starts[low] + 1 };
}

/** A column counted in code points, from one, as a column counted in UTF-16 units. */
export function utf16Column(line: string, column: number): number {
    let units = 0;
    for (let seen = 1; seen < column && units < line.length; seen += 1) {
        units += (line.codePointAt(units) ?? 0) > 0xffff ? 2 : 1;
    }
    return units + 1;
}
