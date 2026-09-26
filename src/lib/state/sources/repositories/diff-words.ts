// Layer 2, client state. The one sequence diff the Source Control views run in the page: which
// items of two lists are the same, by Myers' algorithm. The diff pane runs it over the words of a
// changed line, to mark the words that changed within it, and the merge editor runs it over the
// lines of the three versions of a conflicted file.
//
// Myers' algorithm finds a shortest edit script in time proportional to the lengths times the
// number of edits, so two versions of a long file that differ in a few places cost little. A
// comparison past MAX_EDITS edits is given up and every item is taken as changed, which is what a
// line rewritten end to end looks like anyway.

/** Edits past which a comparison is given up, so a pathological pair never holds the page. */
export const MAX_EDITS = 2000;

/**
 * The pairs of indexes, one into each list, of the items the two lists share, in order. Null when
 * the lists differ in more than MAX_EDITS places.
 */
export function common<T>(a: readonly T[], b: readonly T[]): [number, number][] | null {
    const n = a.length;
    const m = b.length;
    const max = n + m;
    const offset = max + 1;
    let v = new Int32Array(2 * max + 3);
    // Step d reads only the diagonals -d-1 to d+1 of the step before, so that window is all a
    // step keeps, which holds the trace to the square of the edits rather than their product with
    // the lengths.
    const trace: Int32Array[] = [];
    let found = -1;
    for (let d = 0; d <= Math.min(max, MAX_EDITS); d += 1) {
        trace.push(v.slice(offset - d - 1, offset + d + 2));
        const next = v.slice();
        for (let k = -d; k <= d; k += 2) {
            const down = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]);
            let x = down ? v[offset + k + 1] : v[offset + k - 1] + 1;
            let y = x - k;
            while (x < n && y < m && a[x] === b[y]) {
                x += 1;
                y += 1;
            }
            next[offset + k] = x;
            if (x >= n && y >= m) {
                found = d;
                break;
            }
        }
        v = next;
        if (found >= 0) break;
    }
    if (found < 0) return null;
    // Walk the trace back from the end, collecting the diagonal steps, which are the shared items.
    const pairs: [number, number][] = [];
    let x = n;
    let y = m;
    for (let d = found; d > 0; d -= 1) {
        const prior = trace[d];
        // The window of step d starts at diagonal -d-1.
        const at = (diagonal: number): number => prior[diagonal + d + 1];
        const k = x - y;
        const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
        const before = down ? k + 1 : k - 1;
        const px = at(before);
        const py = px - before;
        while (x > px + (down ? 0 : 1) && y > py + (down ? 1 : 0)) {
            x -= 1;
            y -= 1;
            pairs.push([x, y]);
        }
        x = px;
        y = py;
    }
    while (x > 0 && y > 0) {
        x -= 1;
        y -= 1;
        pairs.push([x, y]);
    }
    return pairs.reverse();
}

/** One stretch of a line's text, marked when it is not in the line it is compared with. */
export type WordPiece = { text: string; changed: boolean };

/** A line cut into words, runs of space and single marks, which is what a change is marked on. */
export function wordsOf(text: string): string[] {
    return text.match(/\w+|\s+|[^\w\s]/g) ?? [];
}

/** The pieces of a line, the runs of its words in or out of the shared set joined. */
function piecesFrom(words: readonly string[], kept: ReadonlySet<number>): WordPiece[] {
    const pieces: WordPiece[] = [];
    words.forEach((word, at) => {
        const changed = !kept.has(at);
        const last = pieces.at(-1);
        if (last?.changed === changed) last.text += word;
        else pieces.push({ text: word, changed });
    });
    return pieces;
}

/**
 * Two lines compared word by word: the old line's pieces and the new line's, each piece marked
 * when its words are not in the other line. A pair too different to compare is marked whole.
 */
export function wordDiff(before: string, after: string): [WordPiece[], WordPiece[]] {
    const left = wordsOf(before);
    const right = wordsOf(after);
    const pairs = common(left, right);
    if (pairs === null) {
        return [[{ text: before, changed: true }], [{ text: after, changed: true }]];
    }
    return [
        piecesFrom(left, new Set(pairs.map(([at]) => at))),
        piecesFrom(right, new Set(pairs.map(([, at]) => at)))
    ];
}

/**
 * The marked words of every paired row of a diff, by row: a removed row and the added row that
 * replaced it are compared once, and each gets its own side's pieces.
 */
export function pairedWords(
    lines: readonly { kind: string; text: string }[],
    partners: ReadonlyMap<number, number>
): Map<number, WordPiece[]> {
    const held = new Map<number, WordPiece[]>();
    for (const [row, other] of partners) {
        if (lines[row].kind !== 'removed') continue;
        const [before, after] = wordDiff(lines[row].text, lines[other].text);
        held.set(row, before);
        held.set(other, after);
    }
    return held;
}
