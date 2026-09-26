// Layer 2, client state. A unified diff read as the diff pane draws it: every file of it, each as
// one row per line with the line numbers of both sides, the runs of changed rows grouped into the
// hunks a reader stages or reverts, and the unchanged runs folded away.
//
// The server reads a file's diff with the whole file as context, so the rows are the whole file and
// the pane decides what to fold. The hunks are cut here with three lines of context each side,
// which is git's own default, so a hunk staged from the pane is the hunk `git add -p` would offer.

/** What one row of a diff is: a line both sides hold, one only the old side holds, or the new. */
export type DiffLineKind = 'context' | 'removed' | 'added';

/**
 * One line of a diff. `old` and `new` are its line numbers on each side, null on the side that
 * does not hold it; `eof` says the line has no newline at its end, which the patch must carry.
 */
export type DiffLine = {
    kind: DiffLineKind;
    old: number | null;
    new: number | null;
    text: string;
    eof: boolean;
};

/**
 * One file of a diff: the head lines git wrote before its first hunk, which a patch cut from it
 * repeats, the two paths, whether git called it binary, and its rows.
 */
export type DiffFile = {
    head: string[];
    oldPath: string;
    newPath: string;
    binary: boolean;
    lines: DiffLine[];
};

/**
 * One hunk a reader acts on: the rows it spans with their context, `start` to `end` exclusive, and
 * the first and last changed rows inside it.
 */
export type Hunk = { start: number; end: number; first: number; last: number };

/** One unchanged run folded away: the rows from `from` to `to` exclusive are hidden. */
export type Fold = { from: number; to: number };

/** The lines of context a hunk keeps each side and a fold leaves showing, git's and VS Code's. */
export const CONTEXT = 3;

/** An unchanged run is folded only when it is longer than this. */
export const FOLD_LONGER = 6;

const HUNK_HEAD = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** A path of a `---` or `+++` line, its `a/` or `b/` prefix taken off, and quotes undone. */
function headPath(raw: string): string {
    let name = raw.replace(/\t.*$/, '');
    if (name.startsWith('"') && name.endsWith('"') && name.length >= 2) {
        try {
            name = JSON.parse(name) as string;
        } catch {
            name = name.slice(1, -1);
        }
    }
    if (name === '/dev/null') return '';
    return name.replace(/^[ab]\//, '');
}

/** The two paths of a `diff --git a/x b/x` line, for a file whose head has no `---` line. */
function gitPaths(line: string): [string, string] {
    const match = /^diff --git a\/(.*) b\/(.*)$/.exec(line);
    return match === null ? ['', ''] : [match[1], match[2]];
}

/** Every file of a unified diff, in the order git wrote them. */
export function parseDiff(text: string): DiffFile[] {
    const files: DiffFile[] = [];
    let file: DiffFile | null = null;
    let inHunk = false;
    let old = 0;
    let fresh = 0;
    const lines = text.split('\n');
    // A diff ends with a newline, which leaves one empty string after the last line.
    if (lines.at(-1) === '') lines.pop();
    for (const line of lines) {
        if (line.startsWith('diff --git ')) {
            const [from, to] = gitPaths(line);
            file = { head: [line], oldPath: from, newPath: to, binary: false, lines: [] };
            files.push(file);
            inHunk = false;
            continue;
        }
        if (file === null) continue;
        const hunk = HUNK_HEAD.exec(line);
        if (hunk !== null) {
            inHunk = true;
            old = Number(hunk[1]);
            fresh = Number(hunk[3]);
            // A side with no lines names the line before where it would be.
            if (hunk[2] === '0') old += 1;
            if (hunk[4] === '0') fresh += 1;
            continue;
        }
        if (!inHunk) {
            file.head.push(line);
            if (line.startsWith('--- ')) file.oldPath = headPath(line.slice(4));
            if (line.startsWith('+++ ')) file.newPath = headPath(line.slice(4));
            if (line.startsWith('Binary files ')) file.binary = true;
            continue;
        }
        const mark = line[0];
        const body = line.slice(1);
        if (mark === '\\') {
            const last = file.lines.at(-1);
            if (last !== undefined) last.eof = true;
        } else if (mark === '-') {
            file.lines.push({ kind: 'removed', old, new: null, text: body, eof: false });
            old += 1;
        } else if (mark === '+') {
            file.lines.push({ kind: 'added', old: null, new: fresh, text: body, eof: false });
            fresh += 1;
        } else {
            file.lines.push({ kind: 'context', old, new: fresh, text: body, eof: false });
            old += 1;
            fresh += 1;
        }
    }
    return files;
}

/** The indexes of the changed rows, in order. */
function changed(lines: readonly DiffLine[]): number[] {
    const found: number[] = [];
    lines.forEach((line, at) => {
        if (line.kind !== 'context') found.push(at);
    });
    return found;
}

/**
 * The hunks of a file's rows: changed rows closer than twice the context apart are one hunk, as
 * git joins them, and each hunk keeps up to `context` unchanged rows each side.
 */
export function hunksOf(lines: readonly DiffLine[], context: number = CONTEXT): Hunk[] {
    const rows = changed(lines);
    const hunks: Hunk[] = [];
    for (const at of rows) {
        const last = hunks.at(-1);
        if (last !== undefined && at - last.last - 1 <= 2 * context) {
            last.last = at;
            last.end = Math.min(lines.length, at + 1 + context);
            continue;
        }
        hunks.push({
            start: Math.max(0, at - context),
            end: Math.min(lines.length, at + 1 + context),
            first: at,
            last: at
        });
    }
    return hunks;
}

/**
 * The unchanged runs folded away: a run longer than `longer` rows keeps `context` rows beside each
 * change it touches, and the rest of it is one fold. A run at the start or the end of the file
 * touches a change on one side only, so it keeps its context on that side alone.
 */
export function foldsOf(
    lines: readonly DiffLine[],
    context: number = CONTEXT,
    longer: number = FOLD_LONGER
): Fold[] {
    const folds: Fold[] = [];
    let at = 0;
    while (at < lines.length) {
        if (lines[at].kind !== 'context') {
            at += 1;
            continue;
        }
        let end = at;
        while (end < lines.length && lines[end].kind === 'context') end += 1;
        if (end - at > longer) {
            const from = at === 0 ? 0 : at + context;
            const to = end === lines.length ? end : end - context;
            if (to > from) folds.push({ from, to });
        }
        at = end;
    }
    return folds;
}

/** One stretch of rows as the pane draws it: rows shown, or a fold with its expander. */
export type DiffPiece = { kind: 'rows'; from: number; to: number } | ({ kind: 'fold' } & Fold);

/**
 * The stretches the pane draws, in order: the rows between folds, and each fold not opened. A fold
 * is opened by its first row, which is what the view keeps.
 */
export function piecesOf(
    total: number,
    folds: readonly Fold[],
    opened: readonly number[]
): DiffPiece[] {
    const pieces: DiffPiece[] = [];
    let at = 0;
    for (const fold of folds) {
        if (opened.includes(fold.from)) continue;
        if (fold.from > at) pieces.push({ kind: 'rows', from: at, to: fold.from });
        pieces.push({ kind: 'fold', ...fold });
        at = fold.to;
    }
    if (at < total) pieces.push({ kind: 'rows', from: at, to: total });
    return pieces;
}

/**
 * The partner of each changed row: in a run of removed rows followed by added rows, the n-th
 * removed row and the n-th added row are one line changed, which the side-by-side view draws on one
 * row and whose words both views compare.
 */
export function partnersOf(lines: readonly DiffLine[]): Map<number, number> {
    const partners = new Map<number, number>();
    let at = 0;
    while (at < lines.length) {
        if (lines[at].kind !== 'removed') {
            at += 1;
            continue;
        }
        const removed: number[] = [];
        while (at < lines.length && lines[at].kind === 'removed') removed.push(at++);
        const added: number[] = [];
        while (at < lines.length && lines[at].kind === 'added') added.push(at++);
        for (let n = 0; n < Math.min(removed.length, added.length); n += 1) {
            partners.set(removed[n], added[n]);
            partners.set(added[n], removed[n]);
        }
    }
    return partners;
}

/** One row of the side-by-side view: the row drawn on each side, or null for an empty side. */
export type SideRow = { left: number | null; right: number | null };

/**
 * The side-by-side rows of a stretch: an unchanged row on both sides, and a run of changes as its
 * removed rows on the left beside its added rows on the right, the shorter side padded.
 */
export function sideRows(lines: readonly DiffLine[], from: number, to: number): SideRow[] {
    const rows: SideRow[] = [];
    let at = from;
    while (at < to) {
        if (lines[at].kind === 'context') {
            rows.push({ left: at, right: at });
            at += 1;
            continue;
        }
        const removed: number[] = [];
        while (at < to && lines[at].kind === 'removed') removed.push(at++);
        const added: number[] = [];
        while (at < to && lines[at].kind === 'added') added.push(at++);
        for (let n = 0; n < Math.max(removed.length, added.length); n += 1) {
            rows.push({ left: removed.at(n) ?? null, right: added.at(n) ?? null });
        }
    }
    return rows;
}

/** The hunk a row belongs to, by index, or -1 for a row outside every hunk. */
export function hunkAt(hunks: readonly Hunk[], row: number): number {
    return hunks.findIndex((hunk) => row >= hunk.start && row < hunk.end);
}

/**
 * The hunk nearest a line of the new side, for a pane opened at a line from the source tab's
 * gutter: the one holding it, or the first one after it, or the last one.
 */
export function hunkNear(lines: readonly DiffLine[], hunks: readonly Hunk[], line: number): number {
    if (hunks.length === 0) return -1;
    for (let at = 0; at < hunks.length; at += 1) {
        const hunk = hunks[at];
        const numbers = lines.slice(hunk.start, hunk.end).map((one) => one.new ?? one.old ?? 0);
        if (numbers.some((number) => number >= line)) return at;
    }
    return hunks.length - 1;
}

/**
 * The change Previous Change (`by` -1) or Next Change (`by` 1) moves to, among `count` changes,
 * from the one at `at`, round from the last to the first and back. With no change current (`at`
 * -1), Next goes to the first change and Previous to the last, as VS Code's diff editor does.
 */
export function stepChange(at: number, count: number, by: 1 | -1): number {
    if (count === 0) return -1;
    if (at < 0) return by === 1 ? 0 : count - 1;
    return (at + by + count) % count;
}
