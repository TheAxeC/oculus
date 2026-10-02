// Layer 2, client state. The patch the diff pane hands git for one hunk, or for the rows of it a
// reader chose: the file's head as git wrote it, then hunks cut from the two whole texts.
//
// A patch applied forwards (a stage, `apply --cached`) goes from the original text to the text it
// becomes with the chosen rows applied, so a removed line the reader did not choose stays and is
// written as context, and an added line they did not choose is left out. A patch applied in
// reverse (an unstage, `apply --cached --reverse`, and a revert, `apply --reverse`) goes from the
// modified text with the chosen rows taken back to the modified text, so the two are the other way
// round. Context comes from the text the patch is applied to, three lines each side, and hunks
// whose context would overlap are one. The server runs `apply --recount`.
//
// The rows are laid out by the line changes the pane drew, so a chosen row is the line the reader
// saw. Those are Monaco's model lines, where a text that ends with a newline has one more, empty,
// line; that line is not one of git's, and a change of it is the change of the newline before it.

import type { DiffSides } from '../../../../data/model/index.ts';
import { CONTEXT, type ChosenRows, type LineChange } from './diff-hunks.ts';

/** What a patch does, which is also the flags the server gives `apply`. */
export type PatchMode = 'stage' | 'unstage' | 'revert';

const NO_NEWLINE = '\\ No newline at end of file';

/** One model line: its text with its own line ending, and whether it is the empty line Monaco adds
 * after a final newline (or the one line of an empty text), which git does not count. */
type ModelLine = { text: string; extra: boolean };

/** A row of the two texts laid side by side: a line on both, or on one only. */
type Row = { old: number; new: number } | { old: number; new: null } | { old: null; new: number };

/** A written patch line: its mark and its text with its ending. */
type Out = { mark: ' ' | '-' | '+'; text: string };

/** The model lines of a text, each with the ending that follows it in the text. */
function modelLines(text: string): ModelLine[] {
    const lines: ModelLine[] = [];
    const pattern = /\r\n|\r|\n/g;
    let from = 0;
    for (let found = pattern.exec(text); found; found = pattern.exec(text)) {
        lines.push({ text: text.slice(from, pattern.lastIndex), extra: false });
        from = pattern.lastIndex;
    }
    lines.push({ text: text.slice(from), extra: from === text.length });
    return lines;
}

/**
 * The rows of the two texts in order, as the line changes align them (numbers from 1). Inside a
 * change the rows are placed so a patch of some of them keeps each line where the reader saw it: a
 * change of as many lines each side pairs each removed line with its added line, and any other
 * change puts its removed lines before the first added line chosen (before them all when none is).
 */
function rowsOf(
    changes: readonly LineChange[],
    oldCount: number,
    newCount: number,
    added: ReadonlySet<number>
): Row[] {
    const rows: Row[] = [];
    let old = 1;
    let fresh = 1;
    const same = (untilOld: number) => {
        while (old < untilOld && fresh <= newCount) rows.push({ old: old++, new: fresh++ });
    };
    for (const change of changes) {
        const oldEnd = change.originalEndLineNumber;
        const newEnd = change.modifiedEndLineNumber;
        same(oldEnd === 0 ? change.originalStartLineNumber + 1 : change.originalStartLineNumber);
        const removed: Row[] = [];
        const inserted: Row[] = [];
        if (oldEnd !== 0) while (old <= oldEnd) removed.push({ old: old++, new: null });
        if (newEnd !== 0) while (fresh <= newEnd) inserted.push({ old: null, new: fresh++ });
        if (removed.length === inserted.length) {
            removed.forEach((row, at) => rows.push(row, inserted[at]));
            continue;
        }
        const first = inserted.findIndex((row) => row.new !== null && added.has(row.new));
        const at = first === -1 ? 0 : first;
        rows.push(...inserted.slice(0, at), ...removed, ...inserted.slice(at));
    }
    same(oldCount + 1);
    while (old <= oldCount) rows.push({ old: old++, new: null });
    while (fresh <= newCount) rows.push({ old: null, new: fresh++ });
    return rows;
}

/** The patch lines of the rows for a choice: each row kept, written as context, or left out. */
function writtenOf(
    rows: readonly Row[],
    olds: readonly ModelLine[],
    news: readonly ModelLine[],
    chosen: ChosenRows,
    reverse: boolean
): Out[] {
    const removed = new Set(chosen.removed);
    const added = new Set(chosen.added);
    // The extra line changed means the newline before it changed: the one row with both lines whose
    // two endings differ becomes a removed and an added line, chosen with the extra line.
    const endingChosen = rows.some(
        (row) =>
            (row.new === null && olds[row.old - 1].extra && removed.has(row.old)) ||
            (row.old === null && news[row.new - 1].extra && added.has(row.new))
    );
    const out: Out[] = [];
    for (const row of rows) {
        if (row.old !== null && row.new !== null) {
            const was = olds[row.old - 1];
            const now = news[row.new - 1];
            if (was.extra && now.extra) continue;
            if (was.text !== now.text && endingChosen) {
                out.push({ mark: '-', text: was.text }, { mark: '+', text: now.text });
            } else {
                out.push({ mark: ' ', text: reverse ? now.text : was.text });
            }
        } else if (row.old !== null) {
            const line = olds[row.old - 1];
            if (line.extra) continue;
            if (removed.has(row.old)) out.push({ mark: '-', text: line.text });
            else if (!reverse) out.push({ mark: ' ', text: line.text });
        } else {
            const line = news[row.new - 1];
            if (line.extra) continue;
            if (added.has(row.new)) out.push({ mark: '+', text: line.text });
            else if (reverse) out.push({ mark: ' ', text: line.text });
        }
    }
    return out;
}

/** The hunks of written lines: each changed run with its context, overlapping ones joined. */
function hunksIn(out: readonly Out[]): string[] {
    const changed = out.flatMap((line, at) => (line.mark === ' ' ? [] : [at]));
    const spans: [number, number][] = [];
    for (const at of changed) {
        const from = Math.max(0, at - CONTEXT);
        const to = Math.min(out.length, at + CONTEXT + 1);
        const last = spans.at(-1);
        if (last && from <= last[1]) last[1] = to;
        else spans.push([from, to]);
    }
    const texts: string[] = [];
    let oldLine = 1;
    let newLine = 1;
    let walked = 0;
    for (const [from, to] of spans) {
        for (; walked < from; walked += 1) {
            oldLine += out[walked].mark === '+' ? 0 : 1;
            newLine += out[walked].mark === '-' ? 0 : 1;
        }
        const body = out.slice(from, to);
        const olds = body.filter((line) => line.mark !== '+').length;
        const news = body.filter((line) => line.mark !== '-').length;
        const head = `@@ -${olds === 0 ? oldLine - 1 : oldLine},${olds} +${news === 0 ? newLine - 1 : newLine},${news} @@\n`;
        const lines = body.map((line) =>
            /[\r\n]$/.test(line.text)
                ? `${line.mark}${line.text}`
                : `${line.mark}${line.text}\n${NO_NEWLINE}\n`
        );
        texts.push(head + lines.join(''));
    }
    return texts;
}

/** The patch that stages, unstages or reverts the chosen rows of a file, over the line changes the
 * pane drew; the empty string for a choice that changes nothing. */
export function sidesPatch(
    sides: DiffSides,
    changes: readonly LineChange[],
    chosen: ChosenRows,
    mode: PatchMode
): string {
    const olds = modelLines(sides.original);
    const news = modelLines(sides.modified);
    const rows = rowsOf(changes, olds.length, news.length, new Set(chosen.added));
    const out = writtenOf(rows, olds, news, chosen, mode !== 'stage');
    if (!out.some((line) => line.mark !== ' ')) return '';
    return [...sides.head, ''].join('\n') + hunksIn(out).join('');
}
