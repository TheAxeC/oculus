// Layer 2, client state. The one fuzzy matcher for what a reader types to find a row: the palette,
// its language list, its file mode and the documents card's filter. fuzzysort answers whether
// every typed word matches the letters of a row in their order, how well, and which letters
// matched; this module fixes the options they share and turns a result into the parts a row draws.
//
// A list that is searched again at every keystroke (the file mode's names, which can be a hundred
// thousand) is prepared once as an index (`fuzzyIndex`): fuzzysort prepares each text and keeps the
// letters each holds, so a search reads the rows that can match instead of every row. The index
// searches its keys in order and a row that matched an earlier key is not listed again for a later
// one, so the first key outranks the rest, as VS Code's quick open ranks a file name above its
// folder.

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

/**
 * The runs of `parts` between two offsets of the text they spell, cut at the offsets, so a match
 * found in a whole path can be drawn as the file name's part and the folder's part.
 */
export function partsBetween(parts: readonly TextPart[], from: number, to: number): TextPart[] {
    const found: TextPart[] = [];
    let at = 0;
    for (const part of parts) {
        const start = Math.max(from, at);
        const end = Math.min(to, at + part.text.length);
        if (end > start) found.push({ text: part.text.slice(start - at, end - at), hit: part.hit });
        at += part.text.length;
    }
    return found;
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

/** One row an index search found: the key it matched first, and that key's text in runs. */
type FuzzyHit<T> = { row: T; key: number; parts: TextPart[] };

/** Rows prepared once for repeated searches. */
export type FuzzyIndex<T> = {
    /**
     * The best `limit` rows every word of the query matches. Rows that match the first key come
     * first, best score first, then rows that match only the second, and so on.
     */
    search: (query: string, limit: number) => FuzzyHit<T>[];
};

/** A text cut into the runs of the letters at these places and the runs between them. */
function partsAt(text: string, indexes: readonly number[]): TextPart[] {
    const marked = new Set(indexes);
    const parts: TextPart[] = [];
    for (let at = 0; at < text.length; at += 1) {
        const hit = marked.has(at);
        const last = parts.at(-1);
        if (last?.hit === hit) last.text += text.charAt(at);
        else parts.push({ text: text.charAt(at), hit });
    }
    return parts;
}

/**
 * Prepare `rows` for searching by each of `keys`. Every key's texts are prepared here, by a first
 * search over them, so no later search pays for it. A row listed once under the earliest key it
 * matched. For a query of several words a match scoring under `threshold` (0 keeps every match,
 * 1 only an exact one) is left out: the words found far apart in a long text are no result, and
 * leaving them out gives the next keystroke fewer rows to start from. A query of one word is
 * searched without it, since fuzzysort reads the rows of one word slower with a threshold, and the
 * weak matches of one word come after the strong ones.
 */
export function fuzzyIndex<T>(
    rows: readonly T[],
    keys: readonly ((row: T) => string)[],
    threshold = 0
): FuzzyIndex<T> {
    const snapshots = keys.map((key) => fuzzysort.snapshot(rows, { key }));
    for (const snapshot of snapshots) fuzzysort.go('a', snapshot, { limit: 1, threshold: 0 });
    return {
        search(query, limit) {
            const wanted = query.trim();
            if (wanted === '' || limit < 1) return [];
            const found: FuzzyHit<T>[] = [];
            const listed = new Set<T>();
            for (const [key, snapshot] of snapshots.entries()) {
                if (found.length >= limit) break;
                // Rows listed under an earlier key come back here too, so the key is asked for as
                // many as the caller wants, which leaves that many new ones whatever the repeats.
                const results = fuzzysort.go(wanted, snapshot, {
                    limit,
                    threshold: /\s/.test(wanted) ? threshold : 0
                });
                for (const result of results) {
                    if (listed.has(result.obj) || found.length >= limit) continue;
                    listed.add(result.obj);
                    found.push({
                        row: result.obj,
                        key,
                        parts: partsAt(keys[key](result.obj), result.indexes)
                    });
                }
            }
            return found;
        }
    };
}
