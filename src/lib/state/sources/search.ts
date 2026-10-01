// Layer 2, client state, pure. What the Search view holds for one instance, and what it draws each
// hit as.
//
// The answer arrives grouped by file, so nothing here regroups it; what it does is read the saved
// instance state back safely, since a page restored from storage carries whatever was written
// there, and cut each hit's line into the three pieces a row draws: what is before the match, the
// match, and what follows. The view therefore emboldens without matching the pattern a second time,
// which is the only way a regular-expression hit can be drawn at all.

import { z } from 'zod';
import { ALL_ROOTS, clampMax, type SearchQuery } from '../../data/helpers/search.ts';
import type { SearchAnswer, SearchFailure, SearchFile, SearchHit } from '../../data/model/index.ts';
import { anyNumberShape, readAs, rowsShape } from '../../data/shapes/shapes.ts';

// The view layer reads the wire shapes and the all-roots key through this module: DESIGN.md's
// boundary table lets a view import `state/` and not `data/`, so the one place that names both is
// here.
export { ALL_ROOTS };
export type { SearchAnswer, SearchFailure, SearchFile, SearchHit };

/** Everything one Search tab holds: its query, its toggles and the last answer it was given. */
export type SearchState = SearchQuery & {
    /** The last answer, and null for a tab that has not run one. */
    answer: SearchAnswer | null;
    /** What the last run failed with, or the empty string. */
    error: string;
};

/** The state a Search tab opens with. */
export function emptySearchState(max: number): SearchState {
    return {
        q: '',
        root: ALL_ROOTS,
        word: false,
        case: false,
        regex: false,
        max,
        under: '',
        answer: null,
        error: ''
    };
}

/** One hit out of stored or fetched data: a line and its text, the rest with its defaults. */
const hitShape = z.object({
    line: anyNumberShape,
    column: anyNumberShape.catch(1),
    length: anyNumberShape.catch(0),
    text: z.string()
}) satisfies z.ZodType<SearchHit>;

/** One file's hits out of stored or fetched data: a root and a path, and the hits it can read. */
const fileShape = z.object({
    root: z.string(),
    path: z.string(),
    hits: rowsShape(hitShape).catch([])
}) satisfies z.ZodType<SearchFile>;

/** One failed root out of stored or fetched data. */
const failureShape = z.object({
    root: z.string(),
    reason: z.string().catch('')
}) satisfies z.ZodType<SearchFailure>;

/** One answer out of stored or fetched data; `total` is absent when it is not a number. */
const answerShape = z.object({
    files: rowsShape(fileShape),
    total: anyNumberShape.optional().catch(undefined),
    truncated: z.boolean().catch(false),
    ms: anyNumberShape.catch(0),
    failed: rowsShape(failureShape).catch([])
});

/** One answer out of stored or fetched data, and null for anything that is not one. */
export function answerOf(value: unknown): SearchAnswer | null {
    const held = readAs(answerShape, value);
    if (held === null) return null;
    return {
        files: held.files,
        total: held.total ?? countHits(held.files),
        truncated: held.truncated,
        ms: held.ms,
        failed: held.failed
    };
}

/** How many hits a file list carries. */
export function countHits(files: SearchFile[]): number {
    return files.reduce((sum, file) => sum + file.hits.length, 0);
}

/** What a tab's saved state is read for; the answer is read by `answerOf` and `max` by the cap. */
const searchStateShape = z.object({
    q: z.string().catch(''),
    root: z.string().optional().catch(''),
    word: z.boolean().catch(false),
    case: z.boolean().catch(false),
    regex: z.boolean().catch(false),
    max: anyNumberShape.optional().catch(undefined),
    answer: z.unknown().optional(),
    error: z.string().catch(''),
    under: z.string().catch('')
});

/** One instance's saved state, read back safely from whatever the store holds. */
export function parseSearchState(value: unknown, max: number): SearchState {
    const held = readAs(searchStateShape, value);
    if (held === null) return emptySearchState(max);
    return {
        q: held.q,
        root: held.root ?? ALL_ROOTS,
        word: held.word,
        case: held.case,
        regex: held.regex,
        max: clampMax(held.max ?? max, max),
        under: held.under,
        answer: answerOf(held.answer),
        error: held.error
    };
}

/** The query half of a tab's state, which is what a run sends. */
export function queryOf(state: SearchState): SearchQuery {
    return {
        q: state.q,
        root: state.root,
        word: state.word,
        case: state.case,
        regex: state.regex,
        max: state.max,
        under: state.under
    };
}

/** One hit's line cut into what precedes the match, the match, and what follows it. */
export function hitParts(hit: SearchHit): { before: string; match: string; after: string } {
    const start = Math.max(0, Math.min(hit.column - 1, hit.text.length));
    const end = Math.max(start, Math.min(start + hit.length, hit.text.length));
    return {
        before: hit.text.slice(0, start),
        match: hit.text.slice(start, end),
        after: hit.text.slice(end)
    };
}

/** The line a file heading opens at: its first hit's, and one for a file with no hit. */
export function firstLine(file: SearchFile): number {
    return file.hits.at(0)?.line ?? 1;
}
