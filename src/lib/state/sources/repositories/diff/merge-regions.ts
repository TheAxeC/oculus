// Layer 2, client state. The three-way merge editor's model: the three versions of a conflicted
// file (the common ancestor, Current, which is ours, and Incoming, which is theirs, as git holds
// them at stages 1, 2 and 3) cut into the regions the result is made of, and the result itself.
//
// The regions come from node-diff3's three-way cut (`diff3MergeRegions`), each side compared with
// the ancestor line by line. Where the two sides agree with the ancestor, or only one of them
// changed a stretch, or both changed it the same way, the region is settled and its lines are what
// the merge takes. Where both changed the same stretch differently, the region is a conflict, and
// the reader settles it: Incoming, Current, both in either order, or neither (the ancestor's
// lines, which is what Ignore leaves).
//
// The result is one text the reader may also type into. It is held as one piece per region, so an
// accept rewrites its conflict's piece wherever the reader's own typing has moved it, and typing
// that reaches into a conflict's piece counts that conflict as settled by hand. A choice is one
// edit of the Result, which the editor's undo takes back and its redo puts again, the choice with
// it; the editor's change event says whether an edit was an undo, a redo or typing.

import { diff3MergeRegions } from 'node-diff3';

/** How a conflict is settled; `open` is not yet. */
export type Choice =
    'open' | 'incoming' | 'current' | 'both-current' | 'both-incoming' | 'base' | 'edited';

/** A stretch of lines of one version, by the line it starts at (from 0) and how many it holds. */
export type Span = { start: number; count: number };

/**
 * One region of the merge. A settled region carries the lines the merge takes; a conflict carries
 * each version's lines and where they sit in that version, so each pane marks its own.
 */
export type Region =
    | { kind: 'settled'; lines: string[]; ours: Span; theirs: Span }
    | {
          kind: 'conflict';
          base: string[];
          ours: string[];
          theirs: string[];
          at: { base: Span; ours: Span; theirs: Span };
      };

/** A text cut into lines, its final newline not making an empty last line. */
export function linesOf(text: string): string[] {
    if (text === '') return [];
    const lines = text.split('\n');
    if (lines.at(-1) === '') lines.pop();
    return lines;
}

/** Whether two runs of lines are the same lines. */
function same(x: readonly string[], y: readonly string[]): boolean {
    return x.length === y.length && x.every((line, at) => line === y[at]);
}

/** Whether a version holds the given lines from a line on. */
function holds(version: readonly string[], from: number, lines: readonly string[]): boolean {
    return same(version.slice(from, from + lines.length), lines);
}

/**
 * The regions of a three-way merge, in file order. node-diff3 answers each stretch both sides keep
 * from the ancestor with its place there, each stretch only one side changed with that side's lines
 * and their place in it, and each stretch both changed with every version's lines and places; the
 * places of the rest follow from the gaps between the ancestor places. A stretch one side deleted
 * leaves only such a gap, and the side that deleted it is the one that no longer holds its lines.
 */
export function regionsOf(baseText: string, oursText: string, theirsText: string): Region[] {
    const base = linesOf(baseText);
    const ours = linesOf(oursText);
    const theirs = linesOf(theirsText);
    const regions: Region[] = [];
    let b = 0;
    let o = 0;
    let t = 0;
    const settle = (lines: string[], ourCount: number, theirCount: number): void => {
        if (lines.length === 0 && ourCount === 0 && theirCount === 0) return;
        const last = regions.at(-1);
        if (last?.kind === 'settled') {
            last.lines.push(...lines);
            last.ours.count += ourCount;
            last.theirs.count += theirCount;
        } else {
            regions.push({
                kind: 'settled',
                lines: [...lines],
                ours: { start: o, count: ourCount },
                theirs: { start: t, count: theirCount }
            });
        }
        o += ourCount;
        t += theirCount;
    };
    // The one stretch only one side changed since the last ancestor place, which node-diff3 gives
    // with that side's lines; the ancestor lines it replaced are the gap up to the next place.
    let changed: { side: 'a' | 'b'; lines: string[] } | null = null;
    const reach = (at: number): void => {
        const gap = base.slice(b, at);
        if (changed !== null) {
            const count = changed.lines.length;
            if (changed.side === 'a') settle(changed.lines, count, gap.length);
            else settle(changed.lines, gap.length, count);
        } else if (gap.length > 0) {
            // A deletion by one side: the side still holding the lines kept them.
            const oursKept = holds(ours, o, gap);
            const theirsKept = holds(theirs, t, gap);
            if (oursKept && !theirsKept) settle([], gap.length, 0);
            else settle([], 0, gap.length);
        }
        changed = null;
        b = at;
    };
    for (const region of diff3MergeRegions(ours, base, theirs)) {
        if (region.stable && region.buffer === 'o') {
            reach(region.bufferStart);
            settle(region.bufferContent, region.bufferLength, region.bufferLength);
            b += region.bufferLength;
        } else if (region.stable) {
            changed = { side: region.buffer === 'a' ? 'a' : 'b', lines: region.bufferContent };
        } else {
            reach(region.oStart);
            const [baseLines, ourLines, theirLines] = [
                region.oContent,
                region.aContent,
                region.bContent
            ];
            if (same(ourLines, baseLines)) settle(theirLines, ourLines.length, theirLines.length);
            else if (same(theirLines, baseLines) || same(ourLines, theirLines)) {
                settle(ourLines, ourLines.length, theirLines.length);
            } else {
                regions.push({
                    kind: 'conflict',
                    base: baseLines,
                    ours: ourLines,
                    theirs: theirLines,
                    at: {
                        base: { start: region.oStart, count: region.oLength },
                        ours: { start: region.aStart, count: region.aLength },
                        theirs: { start: region.bStart, count: region.bLength }
                    }
                });
                o = region.aStart + region.aLength;
                t = region.bStart + region.bLength;
            }
            b = region.oStart + region.oLength;
        }
    }
    reach(base.length);
    // Every version empty, or both sides emptied it, still leaves one region, so the result the
    // reader types into has a piece to hold the typing.
    if (regions.length === 0) {
        regions.push({
            kind: 'settled',
            lines: [],
            ours: { start: 0, count: 0 },
            theirs: { start: 0, count: 0 }
        });
    }
    return regions;
}

/** The lines a conflict comes to under a choice; an open conflict shows the ancestor's. */
export function chosenLines(
    region: Extract<Region, { kind: 'conflict' }>,
    choice: Choice
): string[] {
    if (choice === 'incoming') return region.theirs;
    if (choice === 'current') return region.ours;
    if (choice === 'both-current') return [...region.ours, ...region.theirs];
    if (choice === 'both-incoming') return [...region.theirs, ...region.ours];
    return region.base;
}

/** A region's piece of the result text: its lines, each with its newline. */
function pieceOf(lines: readonly string[]): string {
    return lines.map((line) => `${line}\n`).join('');
}

/** The result's pieces, one per region, before the reader has settled or typed anything. */
export function initialPieces(regions: readonly Region[]): string[] {
    return regions.map((region) =>
        pieceOf(region.kind === 'settled' ? region.lines : chosenLines(region, 'open'))
    );
}

/** The pieces after one conflict is settled one way: only that region's piece changes. */
export function settlePiece(
    pieces: readonly string[],
    regions: readonly Region[],
    at: number,
    choice: Choice
): string[] {
    const region = regions[at];
    if (region.kind !== 'conflict') return [...pieces];
    const next = [...pieces];
    next[at] = pieceOf(chosenLines(region, choice));
    return next;
}

/**
 * The pieces after the reader typed: the text the result held and the text it holds now are
 * compared from both ends, and the stretch between is put into the pieces it overlaps, the first of
 * them taking it and the rest emptied. The regions whose pieces it touched are returned, which is
 * what counts a conflict as settled by hand.
 */
export function typedPieces(
    pieces: readonly string[],
    next: string
): { pieces: string[]; touched: number[] } {
    const before = pieces.join('');
    let head = 0;
    const most = Math.min(before.length, next.length);
    while (head < most && before[head] === next[head]) head += 1;
    let tail = 0;
    while (
        tail < most - head &&
        before[before.length - 1 - tail] === next[next.length - 1 - tail]
    ) {
        tail += 1;
    }
    const cutEnd = before.length - tail;
    const inserted = next.slice(head, next.length - tail);
    const starts: number[] = [];
    let offset = 0;
    for (const piece of pieces) {
        starts.push(offset);
        offset += piece.length;
    }
    // The piece the edit starts in: the one holding its first character, or, for an insertion at a
    // boundary, the one before it, so typing at a piece's end grows that piece.
    const holds = (at: number, position: number): boolean =>
        position > starts[at] && position <= starts[at] + pieces[at].length;
    let first = pieces.findIndex((_, at) => holds(at, head === cutEnd ? head : head + 1));
    if (first < 0) first = 0;
    let last = first;
    for (let at = first; at < pieces.length; at += 1) {
        if (starts[at] < cutEnd) last = at;
    }
    const out = [...pieces];
    const kept = pieces[first].slice(0, head - starts[first]);
    const rest = pieces[last].slice(cutEnd - starts[last]);
    out[first] = kept + inserted + rest;
    for (let at = first + 1; at <= last; at += 1) out[at] = '';
    const touched: number[] = [];
    for (let at = first; at <= last; at += 1) touched.push(at);
    return { pieces: out, touched };
}

/** The merge's state at one moment: the Result's pieces and each region's choice. */
export type MergeHeld = { pieces: string[]; choices: Choice[] };

/** One choice made: the Result's text before and after it, and the state either side. */
export type MergeMade = { before: string; after: string; was: MergeHeld; now: MergeHeld };

/** The merge's state, the choices undo can take back (the last on top), and those it took back. */
export type MergeHistory = { held: MergeHeld; undoable: MergeMade[]; redoable: MergeMade[] };

/** How an edit of the Result came about, as the editor's change event says. */
export type EditKind = 'type' | 'undo' | 'redo';

/** A merge's history before anything was chosen. */
export function historyOf(held: MergeHeld): MergeHistory {
    return { held, undoable: [], redoable: [] };
}

/** The history after one conflict is settled one way, which undo can take back. */
export function chooseIn(
    history: MergeHistory,
    regions: readonly Region[],
    region: number,
    choice: Choice
): MergeHistory {
    const was = history.held;
    const pieces = settlePiece(was.pieces, regions, region, choice);
    const choices = was.choices.map((held, at) => (at === region ? choice : held));
    const made = {
        before: was.pieces.join(''),
        after: pieces.join(''),
        was,
        now: { pieces, choices }
    };
    return { held: made.now, undoable: [...history.undoable, made], redoable: [] };
}

/**
 * The history after an edit of the Result, `next` its whole text. An undo that lands on the text
 * before the last choice takes that choice back, and a redo that lands on the text after the choice
 * last taken back puts it again; the editor's own flag says which an edit is, since typing can land
 * on the same text. Any other edit is typing, which settles by hand the conflicts it reaches into;
 * new typing ends what redo could put back.
 */
export function editIn(
    history: MergeHistory,
    regions: readonly Region[],
    next: string,
    kind: EditKind
): MergeHistory {
    const current = history.held.pieces.join('');
    const last = history.undoable.at(-1);
    if (kind === 'undo' && last?.after === current && next === last.before) {
        return {
            held: last.was,
            undoable: history.undoable.slice(0, -1),
            redoable: [...history.redoable, last]
        };
    }
    const again = history.redoable.at(-1);
    if (kind === 'redo' && again?.before === current && next === again.after) {
        return {
            held: again.now,
            undoable: [...history.undoable, again],
            redoable: history.redoable.slice(0, -1)
        };
    }
    const edit = typedPieces(history.held.pieces, next);
    const choices = history.held.choices.map((held, at) =>
        edit.touched.includes(at) && regions[at].kind === 'conflict' ? 'edited' : held
    );
    return {
        held: { pieces: edit.pieces, choices },
        undoable: history.undoable,
        redoable: kind === 'type' ? [] : history.redoable
    };
}

/** How many conflicts are still open. */
export function openCount(regions: readonly Region[], choices: readonly Choice[]): number {
    return regions.filter((region, at) => region.kind === 'conflict' && choices[at] === 'open')
        .length;
}

/**
 * Whether Complete Merge takes the path's deletion rather than writing the Result: a side deleted
 * the path and the Result is empty, which is what that side's version of the file is.
 */
export function takesDeletion(deleted: string, result: string): boolean {
    return deleted !== '' && result === '';
}
