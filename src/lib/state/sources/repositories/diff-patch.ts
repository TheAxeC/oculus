// Layer 2, client state. The patch the diff pane hands git for one hunk, or for the lines of it a
// reader chose: the file's head as git wrote it, one hunk head, and the hunk's rows.
//
// A patch applied forwards (a stage, `apply --cached`) goes from the old side of the diff to the
// new, so a removed line the reader did not choose stays where it is and is written as context,
// and an added line they did not choose is left out. A patch applied in reverse (an unstage,
// `apply --cached --reverse`, and a revert, `apply --reverse`) goes from the new side back, so the
// two are the other way round. The server runs `apply --recount`, so the counts written here are a
// hint git checks again, and the start lines are where it looks first.

import type { DiffFile, DiffLine, Hunk } from './diff-rows.ts';

/** What a patch does, which is also the flags the server gives `apply`. */
export type PatchMode = 'stage' | 'unstage' | 'revert';

const NO_NEWLINE = '\\ No newline at end of file';

/** The line numbers a hunk head names: the first of each side, or the line before an empty side. */
function startOf(lines: readonly DiffLine[], from: number, side: 'old' | 'new'): number {
    for (let at = from; at < lines.length; at += 1) {
        const number = lines[at][side];
        if (number !== null) return number;
    }
    for (let at = from - 1; at >= 0; at -= 1) {
        const number = lines[at][side];
        if (number !== null) return number;
    }
    return 0;
}

/**
 * The patch for one hunk of a file, or for the chosen rows of it when `chosen` names any, and the
 * empty string when the choice leaves nothing to change.
 */
export function hunkPatch(
    file: DiffFile,
    hunk: Hunk,
    mode: PatchMode,
    chosen: ReadonlySet<number> | null = null
): string {
    const forward = mode === 'stage';
    const body: string[] = [];
    let olds = 0;
    let news = 0;
    let changes = 0;
    for (let at = hunk.start; at < hunk.end; at += 1) {
        const line = file.lines[at];
        const taken = chosen === null || chosen.has(at);
        let mark: string | null;
        if (line.kind === 'context') mark = ' ';
        else if (line.kind === 'removed') mark = taken ? '-' : forward ? ' ' : null;
        else mark = taken ? '+' : forward ? null : ' ';
        if (mark === null) continue;
        if (mark !== ' ') changes += 1;
        if (mark !== '+') olds += 1;
        if (mark !== '-') news += 1;
        body.push(`${mark}${line.text}`);
        if (line.eof) body.push(NO_NEWLINE);
    }
    if (changes === 0) return '';
    const oldStart =
        olds === 0
            ? startOf(file.lines, hunk.start, 'old') - 1
            : startOf(file.lines, hunk.start, 'old');
    const newStart =
        news === 0
            ? startOf(file.lines, hunk.start, 'new') - 1
            : startOf(file.lines, hunk.start, 'new');
    const head = `@@ -${Math.max(0, oldStart)},${olds} +${Math.max(0, newStart)},${news} @@`;
    return [...file.head, head, ...body, ''].join('\n');
}

/** The changed rows of a hunk a choice names, for the count a hunk's line actions say. */
export function chosenIn(hunk: Hunk, chosen: ReadonlySet<number>): number[] {
    return [...chosen].filter((at) => at >= hunk.first && at <= hunk.last).sort((a, b) => a - b);
}
