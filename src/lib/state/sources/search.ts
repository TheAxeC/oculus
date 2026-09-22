// Layer 2, client state, pure. What the Search view holds for one instance, and what it draws each
// hit as.
//
// The answer arrives grouped by file, so nothing here regroups it; what it does is read the saved
// instance state back safely, since a page restored from storage carries whatever was written there,
// and cut each hit's line into the three pieces a row draws: what is before the match, the match,
// and what follows. The view therefore emboldens without matching the pattern a second time, which
// is the only way a regular-expression hit can be drawn at all.

import { ALL_ROOTS, clampMax, type SearchQuery } from '../../data/helpers/search.ts';
import type { SearchAnswer, SearchFailure, SearchFile, SearchHit } from '../../data/model.ts';

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
        answer: null,
        error: ''
    };
}

function flag(value: unknown): boolean {
    return value === true;
}

function words(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** One hit out of stored or fetched data, and null for anything that is not one. */
function hitOf(value: unknown): SearchHit | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const held = value as Record<string, unknown>;
    if (typeof held.line !== 'number' || typeof held.text !== 'string') return null;
    return {
        line: held.line,
        column: typeof held.column === 'number' ? held.column : 1,
        length: typeof held.length === 'number' ? held.length : 0,
        text: held.text
    };
}

/** One file's hits out of stored or fetched data, and null for anything that is not one. */
function fileOf(value: unknown): SearchFile | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const held = value as Record<string, unknown>;
    if (typeof held.root !== 'string' || typeof held.path !== 'string') return null;
    const hits = Array.isArray(held.hits)
        ? held.hits.map(hitOf).filter((hit): hit is SearchHit => hit !== null)
        : [];
    return { root: held.root, path: held.path, hits };
}

/** One failed root out of stored or fetched data, and null for anything that is not one. */
function failureOf(value: unknown): SearchFailure | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const held = value as Record<string, unknown>;
    if (typeof held.root !== 'string') return null;
    return { root: held.root, reason: typeof held.reason === 'string' ? held.reason : '' };
}

/** One answer out of stored or fetched data, and null for anything that is not one. */
export function answerOf(value: unknown): SearchAnswer | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const held = value as Record<string, unknown>;
    if (!Array.isArray(held.files)) return null;
    const files = held.files.map(fileOf).filter((file): file is SearchFile => file !== null);
    const failed = Array.isArray(held.failed)
        ? held.failed.map(failureOf).filter((one): one is SearchFailure => one !== null)
        : [];
    return {
        files,
        total: typeof held.total === 'number' ? held.total : countHits(files),
        truncated: held.truncated === true,
        ms: typeof held.ms === 'number' ? held.ms : 0,
        failed
    };
}

/** How many hits a file list carries. */
export function countHits(files: SearchFile[]): number {
    return files.reduce((sum, file) => sum + file.hits.length, 0);
}

/** One instance's saved state, read back safely from whatever the store holds. */
export function parseSearchState(value: unknown, max: number): SearchState {
    const empty = emptySearchState(max);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return empty;
    const held = value as Record<string, unknown>;
    return {
        q: words(held.q),
        root: held.root === undefined ? ALL_ROOTS : words(held.root),
        word: flag(held.word),
        case: flag(held.case),
        regex: flag(held.regex),
        max: clampMax(typeof held.max === 'number' ? held.max : max, max),
        answer: answerOf(held.answer),
        error: words(held.error)
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
        max: state.max
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
