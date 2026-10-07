// Layer 3, primitive, pure. The sectioning commands of a LaTeX text as an editing command reads
// them: promote or demote the levels used in a stretch of text (`\subsection` becomes `\section`,
// and the other way), and the extent of the section a position is in, from its heading to the line
// before the next heading of the same or a higher level, `\appendix` or `\end{document}`.
//
// A heading is `\part` to `\subparagraph`, starred or not, with an optional short title and a
// braced title on the line. A line's `%` comment is not read. Promoting `\part` and demoting
// `\subparagraph` leave the command as it is, since there is no level beyond them.

import type { Edit } from './edit';

/** The sectioning commands from the outermost to the innermost. */
const LEVELS = [
    'part',
    'chapter',
    'section',
    'subsection',
    'subsubsection',
    'paragraph',
    'subparagraph'
] as const;

/** A sectioning command and what follows its name: the star, the short title, the braces. */
function heading(): RegExp {
    return new RegExp(`\\\\(${LEVELS.join('|')})(\\*)?(\\[.+?\\])?(\\{.*?\\})`, 'g');
}

/** The offset the `%` comment of the line holding `at` starts at, or the text's length. */
function commentStart(line: string): number {
    for (let at = 0; at < line.length; at += 1) {
        if (line[at] === '\\') at += 1;
        else if (line[at] === '%') return at;
    }
    return line.length;
}

/** One line of a text: its offset, and what is left of it once its `%` comment is cut off. */
type Line = { at: number; code: string };

/** The lines of a text. */
function linesOf(text: string): Line[] {
    const lines: Line[] = [];
    let at = 0;
    for (const raw of text.split('\n')) {
        lines.push({ at, code: raw.slice(0, commentStart(raw)) });
        at += raw.length + 1;
    }
    return lines;
}

/**
 * The edits that move every sectioning command that starts in `[from, to)` one level up (`-1`) or
 * down (`+1`). A text that holds no heading there gives no edit.
 */
export function shiftSections(text: string, from: number, to: number, delta: -1 | 1): Edit[] {
    const edits: Edit[] = [];
    const found = heading();
    for (const { at, code } of linesOf(text)) {
        found.lastIndex = 0;
        let match = found.exec(code);
        while (match !== null) {
            const start = at + match.index;
            const level = LEVELS.indexOf(match[1] as (typeof LEVELS)[number]);
            const next = LEVELS[Math.min(Math.max(level + delta, 0), LEVELS.length - 1)];
            if (start >= from && start < to && next !== match[1]) {
                edits.push({ start: start + 1, end: start + 1 + match[1].length, text: next });
            }
            match = found.exec(code);
        }
    }
    return edits;
}

/**
 * The section a position is in: from the start of the line of the nearest heading at or above the
 * line of `from`, to the end of the line before the next heading of that level or higher, an
 * `\appendix` or `\end{document}` after `to`, or to the end of the text. Null when no heading is
 * above.
 */
export function sectionAt(
    text: string,
    from: number,
    to: number
): { start: number; end: number } | null {
    const lines = linesOf(text);
    const lineOf = (offset: number): number => {
        const after = lines.findIndex((one) => one.at > offset);
        return after < 0 ? lines.length - 1 : Math.max(after - 1, 0);
    };
    const found = heading();
    let top = -1;
    let level = 0;
    for (let index = lineOf(from); index >= 0 && top < 0; index -= 1) {
        found.lastIndex = 0;
        const match = found.exec(lines[index].code);
        if (match !== null) {
            top = index;
            level = LEVELS.indexOf(match[1] as (typeof LEVELS)[number]);
        }
    }
    if (top < 0) return null;
    const names = LEVELS.slice(0, level + 1).join('|');
    const ends = new RegExp(
        `\\\\(?:(?:${names})\\*?(?:\\[.+?\\])?\\{.*?\\})|\\\\appendix|\\\\end\\{document\\}`
    );
    for (let index = Math.max(lineOf(to), top) + 1; index < lines.length; index += 1) {
        if (ends.test(lines[index].code)) {
            return { start: lines[top].at, end: Math.max(lines[index].at - 1, lines[top].at) };
        }
    }
    return { start: lines[top].at, end: text.length };
}
