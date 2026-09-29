// Layer 2, client state. The diff pane's hunks and the rows a reader chooses in them, over the line
// changes Monaco's diff editor answers: the hunks by git's own grouping, so a hunk staged is the
// hunk `git add -p` offers; the rows a selection chooses by VS Code's rule; the step from hunk to
// hunk and from file to file; the hunk a pane opens at; and which actions a file allows.
//
// Line numbers are Monaco's, from 1. A change with an empty side names that side by the line
// before where it would be, with an end of 0, as `getLineChanges()` answers it.

import type { DiffAttributes, DiffSides } from '../../../data/model/index.ts';

/** The lines of unchanged context a hunk keeps each side, as git's default. */
export const CONTEXT = 3;

/** One line change as the diff editor answers it. */
export type LineChange = {
    originalStartLineNumber: number;
    originalEndLineNumber: number;
    modifiedStartLineNumber: number;
    modifiedEndLineNumber: number;
};

/** A run of lines, from its first to the line after its last; an empty run has `from === to`. */
export type LineSpan = { from: number; to: number };

/** A run of changes git would show as one hunk, with the span of its changes on each side. */
export type Hunk = { changes: LineChange[]; original: LineSpan; modified: LineSpan };

/** A hunk head's four numbers, as `@@ -oldStart,oldCount +newStart,newCount @@` writes them. */
export type HunkHead = { oldStart: number; oldCount: number; newStart: number; newCount: number };

/** A selection as Monaco holds one, which may run backwards. */
export type LineSelection = {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
};

/** The removed lines (original side) and added lines (modified side) a patch takes. */
export type ChosenRows = { removed: number[]; added: number[] };

/** Where Previous and Next Change stand in a diff of several files. */
export type ChangeAt = { file: number; hunk: number };

/** The actions a file allows: by line and block, only the whole file, or none. */
export type DiffActions = 'lines' | 'whole' | 'none';

/** One side of a change as a span; an empty side sits after its start line. */
function spanOf(start: number, end: number): LineSpan {
    return end === 0 ? { from: start + 1, to: start + 1 } : { from: start, to: end + 1 };
}

/** The original side of a change. */
function originalOf(change: LineChange): LineSpan {
    return spanOf(change.originalStartLineNumber, change.originalEndLineNumber);
}

/** The modified side of a change. */
function modifiedOf(change: LineChange): LineSpan {
    return spanOf(change.modifiedStartLineNumber, change.modifiedEndLineNumber);
}

/** The number of lines git counts in a text: a final newline ends the last line, adds none. */
export function gitLineCount(text: string): number {
    if (text === '') return 0;
    const breaks = text.match(/\r\n|\r|\n/g)?.length ?? 0;
    return /[\r\n]$/.test(text) ? breaks : breaks + 1;
}

/** The changes grouped as git groups them: a gap of at most twice the context joins two. */
export function hunksOf(changes: readonly LineChange[], context = CONTEXT): Hunk[] {
    const hunks: Hunk[] = [];
    for (const change of changes) {
        const original = originalOf(change);
        const modified = modifiedOf(change);
        const last = hunks.at(-1);
        if (last && modified.from - last.modified.to <= 2 * context) {
            last.changes.push(change);
            last.original.to = original.to;
            last.modified.to = modified.to;
        } else {
            hunks.push({ changes: [change], original, modified });
        }
    }
    return hunks;
}

/** One side of a head: the span widened by the context, kept inside the side's lines. */
function headSide(span: LineSpan, lines: number, context: number): [number, number] {
    const start = Math.max(1, span.from - context);
    const count = Math.min(lines + 1, span.to + context) - start;
    return [count === 0 ? start - 1 : start, count];
}

/** A hunk's head as git writes it over texts of the given numbers of lines (git's count). */
export function hunkHead(
    hunk: Hunk,
    oldLines: number,
    newLines: number,
    context = CONTEXT
): HunkHead {
    const [oldStart, oldCount] = headSide(hunk.original, oldLines, context);
    const [newStart, newCount] = headSide(hunk.modified, newLines, context);
    return { oldStart, oldCount, newStart, newCount };
}

/** The lines a selection holds; one that ends at column 1 does not hold its last line. */
function heldLines(selection: LineSelection): LineSpan | null {
    const first = Math.min(selection.startLineNumber, selection.endLineNumber);
    const forwards =
        selection.startLineNumber < selection.endLineNumber ||
        (selection.startLineNumber === selection.endLineNumber &&
            selection.startColumn <= selection.endColumn);
    const endLine = forwards ? selection.endLineNumber : selection.startLineNumber;
    const endColumn = forwards ? selection.endColumn : selection.startColumn;
    const startColumn = forwards ? selection.startColumn : selection.endColumn;
    if (first === endLine && startColumn === endColumn) return null;
    const last = endColumn === 1 && endLine > first ? endLine - 1 : endLine;
    return { from: first, to: last + 1 };
}

/** Whether two spans share a line. */
function overlaps(a: LineSpan, b: LineSpan): boolean {
    return a.from < b.to && b.from < a.to;
}

/** The numbers of a span, in order. */
function numbersOf(span: LineSpan): number[] {
    return Array.from({ length: span.to - span.from }, (_, at) => span.from + at);
}

/** The rows of one change a modified selection chooses, by VS Code's rule. */
function chosenByModified(change: LineChange, held: LineSpan, rows: ChosenRows): void {
    const original = originalOf(change);
    const modified = modifiedOf(change);
    if (modified.from === modified.to) {
        // A pure deletion after line N is touched by a selection holding N or N + 1.
        const after = Math.max(1, change.modifiedStartLineNumber);
        if (overlaps(held, { from: after, to: change.modifiedStartLineNumber + 2 })) {
            rows.removed.push(...numbersOf(original));
        }
        return;
    }
    const added = numbersOf(modified).filter((number) => held.from <= number && number < held.to);
    if (added.length === 0) return;
    rows.added.push(...added);
    if (original.to - original.from === modified.to - modified.from) {
        rows.removed.push(...added.map((number) => original.from + number - modified.from));
    } else {
        rows.removed.push(...numbersOf(original));
    }
}

/** The rows the selections choose in a hunk: modified selections by VS Code's rule, original
 * selections the removed lines they hold. Only a selection that holds text chooses. */
export function chosenRows(
    hunk: Hunk,
    modified: readonly LineSelection[],
    original: readonly LineSelection[]
): ChosenRows {
    const rows: ChosenRows = { removed: [], added: [] };
    for (const selection of modified) {
        const held = heldLines(selection);
        if (held) for (const change of hunk.changes) chosenByModified(change, held, rows);
    }
    for (const selection of original) {
        const held = heldLines(selection);
        if (!held) continue;
        for (const change of hunk.changes) {
            const span = originalOf(change);
            rows.removed.push(...numbersOf(span).filter((n) => held.from <= n && n < held.to));
        }
    }
    const sorted = (numbers: number[]) => [...new Set(numbers)].sort((a, b) => a - b);
    return { removed: sorted(rows.removed), added: sorted(rows.added) };
}

/** Every row of a hunk, which its block actions take. */
export function hunkRows(hunk: Hunk): ChosenRows {
    return {
        removed: hunk.changes.flatMap((change) => numbersOf(originalOf(change))),
        added: hunk.changes.flatMap((change) => numbersOf(modifiedOf(change)))
    };
}

/** The change after (1) or before (-1) the current one, round the ends; -1 when none is current
 * starts from the first (Next) or the last (Previous). */
export function stepChange(current: number, count: number, direction: 1 | -1): number {
    if (count === 0) return -1;
    if (current < 0) return direction === 1 ? 0 : count - 1;
    return (current + direction + count) % count;
}

/** The step across the files of a diff, each file's hunk count given, `null` for a file not drawn
 * yet (one stop, its hunks unknown), round the ends; null when no file has a change. */
export function stepFiles(
    counts: readonly (number | null)[],
    at: ChangeAt | null,
    direction: 1 | -1
): ChangeAt | null {
    const stops: ChangeAt[] = counts.flatMap((count, file) =>
        count === null
            ? [{ file, hunk: -1 }]
            : Array.from({ length: count }, (_, hunk) => ({ file, hunk }))
    );
    if (stops.length === 0) return null;
    const current = at
        ? stops.findIndex((stop) => stop.file === at.file && stop.hunk === at.hunk)
        : -1;
    return stops[stepChange(current, stops.length, direction)];
}

/** Whether a file's two texts differ only in their line endings, which Monaco does not draw as a
 * change: the pane says so at the file's head. */
export function endingsOnly(sides: DiffSides): boolean {
    if (sides.binary || sides.original === sides.modified) return false;
    const plain = (text: string): string => text.replace(/\r\n?/g, '\n');
    return plain(sides.original) === plain(sides.modified);
}

/** The hunk counts of a diff's files before they are drawn: 0 for a file that has no change to
 * step to (a binary file, two equal texts, or line endings alone), null for one whose hunks its
 * editor reports once drawn. */
export function countsOf(files: readonly DiffSides[]): (number | null)[] {
    return files.map((file) =>
        file.binary || file.original === file.modified || endingsOnly(file) ? 0 : null
    );
}

/** The hunk a pane opened at a modified line goes to: the hunk holding it, else the first after
 * it, else the last; -1 for no hunk. A hunk is the span of its changes, with no context. */
export function hunkNear(hunks: readonly Hunk[], line: number): number {
    if (hunks.length === 0) return -1;
    const at = hunks.findIndex((hunk) => hunk.modified.to > line);
    return at === -1 ? hunks.length - 1 : at;
}

/** Whether git converts a file's text on its way in or out, so a patch cut from the texts the
 * pane holds would not apply to what git compares. */
function converted(attributes: DiffAttributes): boolean {
    const given = (value: string): boolean => value !== 'unspecified' && value !== 'unset';
    if (given(attributes.filter)) return true;
    if (given(attributes.workingTreeEncoding) || given(attributes.ident)) return true;
    if (attributes.text === 'unset') return false;
    return (
        attributes.eol === 'crlf' ||
        attributes.autocrlf === 'true' ||
        attributes.autocrlf === 'input'
    );
}

/** The actions a file allows: none where the pane cannot build a patch git applies (a side whose
 * bytes are not UTF-8, a carriage return in either text, or git converting the text) and on a path
 * in conflict, whose patch would stage or revert against Current's version while the file stays
 * unmerged; the whole file alone for a new or deleted file, else block and line actions. */
export function diffActions(
    sides: DiffSides,
    attributes: DiffAttributes,
    conflicted = false
): DiffActions {
    if (conflicted || !sides.encoded) return 'none';
    if (sides.original.includes('\r') || sides.modified.includes('\r')) return 'none';
    if (converted(attributes)) return 'none';
    const whole = sides.head.some(
        (line) => line.startsWith('new file mode') || line.startsWith('deleted file mode')
    );
    return whole ? 'whole' : 'lines';
}
