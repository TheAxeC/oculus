// Layer 2, client state. The three-way merge editor's model: the three versions of a conflicted
// file (the common ancestor, Current, which is ours, and Incoming, which is theirs, as git holds
// them at stages 1, 2 and 3) cut into the regions the result is made of, and the result itself.
//
// The regions come from comparing each side with the ancestor, line by line (diff-words.ts's
// common()). Where the two sides agree with the ancestor, or only one of them changed a stretch,
// or both changed it the same way, the region is settled and its lines are what the merge takes.
// Where both changed the same stretch differently, the region is a conflict, and the reader
// settles it: Incoming, Current, both in either order, or neither (the ancestor's lines, which is
// what Ignore leaves).
//
// The result is one text the reader may also type into. It is held as one piece per region, so an
// accept rewrites its conflict's piece wherever the reader's own typing has moved it, and typing
// that reaches into a conflict's piece counts that conflict as settled by hand.

import { common } from './diff-words.ts';

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

/**
 * For each line of the ancestor, the line of the other version it is matched with, or -1. Null
 * when the two are too different to compare, which reads as every line changed.
 */
function matchOf(base: readonly string[], other: readonly string[]): Int32Array {
    const matched = new Int32Array(base.length).fill(-1);
    for (const [from, to] of common(base, other) ?? []) matched[from] = to;
    return matched;
}

/** The regions of a three-way merge, in file order. */
export function regionsOf(baseText: string, oursText: string, theirsText: string): Region[] {
    const base = linesOf(baseText);
    const ours = linesOf(oursText);
    const theirs = linesOf(theirsText);
    const toOurs = matchOf(base, ours);
    const toTheirs = matchOf(base, theirs);
    const regions: Region[] = [];
    let b = 0;
    let o = 0;
    let t = 0;
    const settle = (
        lines: string[],
        ourStart: number,
        ourCount: number,
        theirStart: number,
        theirCount: number
    ): void => {
        if (lines.length === 0 && ourCount === 0 && theirCount === 0) return;
        const last = regions.at(-1);
        if (last?.kind === 'settled') {
            last.lines.push(...lines);
            last.ours.count += ourCount;
            last.theirs.count += theirCount;
            return;
        }
        regions.push({
            kind: 'settled',
            lines: [...lines],
            ours: { start: ourStart, count: ourCount },
            theirs: { start: theirStart, count: theirCount }
        });
    };
    while (b <= base.length) {
        // A stable line: the ancestor's line matched in both sides, exactly where each side is.
        if (b < base.length && toOurs[b] === o && toTheirs[b] === t) {
            settle([base[b]], o, 1, t, 1);
            b += 1;
            o += 1;
            t += 1;
            continue;
        }
        // An unstable stretch: up to the next ancestor line both sides still hold, in order.
        let nb = b;
        while (nb < base.length && !(toOurs[nb] >= o && toTheirs[nb] >= t)) nb += 1;
        const no = nb < base.length ? toOurs[nb] : ours.length;
        const nt = nb < base.length ? toTheirs[nb] : theirs.length;
        const baseLines = base.slice(b, nb);
        const ourLines = ours.slice(o, no);
        const theirLines = theirs.slice(t, nt);
        const same = (x: string[], y: string[]): boolean =>
            x.length === y.length && x.every((line, at) => line === y[at]);
        if (same(ourLines, baseLines)) settle(theirLines, o, ourLines.length, t, theirLines.length);
        else if (same(theirLines, baseLines) || same(ourLines, theirLines)) {
            settle(ourLines, o, ourLines.length, t, theirLines.length);
        } else {
            regions.push({
                kind: 'conflict',
                base: baseLines,
                ours: ourLines,
                theirs: theirLines,
                at: {
                    base: { start: b, count: baseLines.length },
                    ours: { start: o, count: ourLines.length },
                    theirs: { start: t, count: theirLines.length }
                }
            });
        }
        b = nb;
        o = no;
        t = nt;
        if (nb >= base.length) break;
    }
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
