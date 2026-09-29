// Layer 2, client state. The one fuzzy matcher for what a reader types to find a row: the palette,
// its language list and the documents card's filter. fuzzysort answers whether every typed word
// matches the letters of a row in their order, how well, and which letters matched; this module
// fixes the options the three share and turns a result into the parts a row draws.

import fuzzysort, { type KeysResult, type Result } from 'fuzzysort';

/** One run of a row's text: a run the query matched, drawn marked, or a run between them. */
export type TextPart = { text: string; hit: boolean };

/** One row that matched: the row, where it stood, its score, and each key's own result. */
export type FuzzyMatch<T> = { row: T; order: number; score: number; keys: readonly Result[] };

/**
 * The rows every word of the query matches, over the keys given, each with its score and its place
 * in the input. Every match is kept, however weak, and none is cut off by count: the caller
 * decides how many it draws. The order is the input's; the caller ranks.
 */
export function fuzzyMatches<T>(
    query: string,
    rows: readonly T[],
    keys: readonly ((row: T) => string)[]
): FuzzyMatch<T>[] {
    const wanted = query.trim();
    if (wanted === '') return [];
    // Each row is searched with its place beside it, so two equal rows keep two places.
    const placed = rows.map((row, at) => ({ row, at }));
    const found: readonly KeysResult<{ row: T; at: number }>[] = fuzzysort.go(wanted, placed, {
        keys: keys.map((key) => (one: { row: T; at: number }) => key(one.row)),
        threshold: 0,
        limit: 0
    });
    return found
        .map((result) => ({
            row: result.obj.row,
            order: result.obj.at,
            score: result.score,
            keys: [...result]
        }))
        .sort((left, right) => left.order - right.order);
}

/** Best score first, and matches of the same score in the order they came in. */
export function byScore<T>(left: FuzzyMatch<T>, right: FuzzyMatch<T>): number {
    return right.score - left.score || left.order - right.order;
}

/** Whether one key of a match matched the query itself, rather than only another key did. */
export function keyMatched(result: Result | undefined): boolean {
    return result !== undefined && result.indexes.length > 0;
}

/**
 * A key's text split into the runs the query matched and the runs between, from fuzzysort's own
 * highlight, for a row to draw the matched letters marked. A text the key did not match is one
 * unmarked run.
 */
export function textParts(result: Result | undefined, text: string): TextPart[] {
    if (result?.target !== text) return [{ text, hit: false }];
    const parts: TextPart[] = [];
    for (const piece of result.highlight((match) => ({ text: match, hit: true }))) {
        const part = typeof piece === 'string' ? { text: piece, hit: false } : piece;
        if (part.text !== '') parts.push(part);
    }
    return parts.length === 0 ? [{ text, hit: false }] : parts;
}
