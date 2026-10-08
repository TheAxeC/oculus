// Layer 1, data. What a save does to the text of a source tab before it is sent, as VS Code's save
// participants do it: `trimText` takes the spaces and tabs off the end of each line, and `endText`
// ends the text with one line ending and takes off the empty lines after the last line that holds
// anything. The trim runs first, then the format when the tab formats on save, then the final
// newline (state/workbench/navigation/editor-text.ts, `saveRulesOf`), as VS Code orders its
// participants.
//
// Both work over the line endings the text has, `\r\n` or `\n`, and never change one. An automatic
// save is handed the places the carets are at: a caret in the whitespace at the end of its line
// keeps the whitespace before it, and the line a caret is on is not taken off by `endText`, so
// saving while typing does not eat what the reader is about to type next to.

/** A place in the text, the line and the column counted from one, as the editor reports a caret. */
export type KeptPlace = { line: number; column: number };

/** The line ending the text uses: `\r\n` when any line ends so, and `\n` otherwise. */
function endingOf(text: string): string {
    return text.includes('\r\n') ? '\r\n' : '\n';
}

/** Whether a line holds a character, a space or a tab included. */
function holds(line: string): boolean {
    return line.replace(/\r$/, '') !== '';
}

/**
 * The text with the spaces and tabs at the end of every line taken off. A line a `keep` place is on
 * keeps the whitespace before the column of that place.
 */
export function trimText(text: string, keep: readonly KeptPlace[] = []): string {
    const lines = text.split('\n');
    return lines
        .map((line, at) => {
            const closed = at < lines.length - 1 && line.endsWith('\r');
            const body = closed ? line.slice(0, -1) : line;
            const trimmed = body.replace(/[ \t]+$/, '');
            const kept = keep.filter((place) => place.line === at + 1);
            const floor = Math.max(0, ...kept.map((place) => place.column - 1));
            const whole =
                trimmed.length >= floor ? trimmed : body.slice(0, Math.min(floor, body.length));
            return closed ? `${whole}\r` : whole;
        })
        .join('\n');
}

/**
 * The text ending in one line ending: when the last line holds a character other than a space or a
 * tab, one line ending in the text's own form is added; then every line ending after the first one
 * that follows the last line holding anything is taken off. A text whose last line holds only
 * spaces or tabs keeps that line, an empty text stays empty, and a text of line endings only
 * becomes empty. A line a `keep` place is on is not taken off.
 */
export function endText(text: string, keep: readonly KeptPlace[] = []): string {
    const ending = endingOf(text);
    const lines = text.split('\n');
    const last = lines[lines.length - 1];
    if (/[^ \t]/.test(last)) {
        if (ending === '\r\n') lines[lines.length - 1] = `${last}\r`;
        lines.push('');
    }
    const held = lines.findLastIndex(holds);
    const cursor = Math.max(-1, ...keep.map((place) => place.line - 1));
    const end = Math.min(lines.length - 1, Math.max(held + 1, cursor));
    // The last line kept loses the line ending that followed it, the carriage return of a CRLF
    // included.
    const cut = end < lines.length - 1 && lines[end].endsWith('\r');
    if (cut) lines[end] = lines[end].slice(0, -1);
    return lines.slice(0, end + 1).join('\n');
}
