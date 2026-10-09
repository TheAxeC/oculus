// Layer 2, client state, pure. What the Search view holds for one instance, and what it draws each
// hit as.
//
// The answer arrives grouped by file, so nothing here regroups it; what it does is read the saved
// instance state back safely, since a page restored from storage carries whatever was written
// there, and cut each hit's line into the three pieces a row draws: what is before the match, the
// match, and what follows. The view therefore emboldens without matching the pattern a second time,
// which is the only way a regular-expression hit can be drawn at all.
//
// A hit is one match, so a line holding two matches is two hits. It carries `at`, where the match
// starts in its whole line, which is what a replace names it by; a hit without `at` reads as no
// answer, so the tab runs again rather than drawing hits that cannot be replaced. `ran` is the
// query the answer was found by: a replace is made over what was searched, and not over what the
// boxes hold now. The replace row, the replace text, Preserve Case and the last texts each box ran
// are the tab's own state beside the query. A hit the reader dismissed is kept as a place
// (`Dismissed`) beside the answer, so a replace that reads the written files' hits again leaves out
// the ones the reader had taken out.

import { z } from 'zod';
import type { Reread, ReplaceQuery } from '../../../data/file-ops.ts';
import {
    ALL_ROOTS,
    clampMax,
    emptyQuery,
    type SearchQuery
} from '../../../data/helpers/search/query.ts';
import type {
    NamesAnswer,
    SearchAnswer,
    SearchFailure,
    SearchFile,
    SearchHit
} from '../../../data/model/index.ts';
import {
    anyNumberShape,
    mapOfShape,
    readAs,
    rowsShape,
    stringItemsShape
} from '../../../data/shapes/shapes.ts';

// The view layer reads the wire shapes and the all-roots key through this module: DESIGN.md's
// boundary table lets a view import `state/` and not `data/`, so the one place that names both is
// here.
export { ALL_ROOTS };
export type { NamesAnswer, ReplaceQuery, SearchAnswer, SearchFile, SearchHit };

/** A hit the reader took out of the results: its file, the place it had and the length it took. */
export type Dismissed = { root: string; path: string; line: number; at: number; length: number };

/** How many texts each box of a tab remembers. */
const HISTORY_KEPT = 20;

/** The toggles of a query. */
export type SearchMode = 'word' | 'case' | 'regex';

/** Everything one Search tab holds: its query, its toggles and the last answer it was given. */
export type SearchState = SearchQuery & {
    /** The last answer, and null for a tab that has not run one. */
    answer: SearchAnswer | null;
    /** What the last run failed with, or the empty string. */
    error: string;
    /** The query the answer was found by, and null while the tab holds no answer. */
    ran: ReplaceQuery | null;
    /** The hits of the answer the reader dismissed, which a replace's re-read leaves out. */
    dismissed: Dismissed[];
    /** Whether the replace row is shown. */
    replacing: boolean;
    /** The replace text as typed. */
    replace: string;
    /** Whether Preserve Case is on. */
    preserve: boolean;
    /** The last texts the query box ran, newest first. */
    queries: string[];
    /** The last texts the replace box ran, newest first. */
    replaces: string[];
};

/** The state a Search tab opens with. */
function emptySearchState(max: number): SearchState {
    return {
        ...emptyQuery(max),
        answer: null,
        error: '',
        ran: null,
        dismissed: [],
        replacing: false,
        replace: '',
        preserve: false,
        queries: [],
        replaces: []
    };
}

/** The fields every hit carries: a line and its text, the rest with its defaults. */
const hitFields = z.object({
    line: anyNumberShape,
    column: anyNumberShape.catch(1),
    length: anyNumberShape.catch(0),
    text: z.string()
});

/** One hit out of stored or fetched data: the fields of a hit, where it starts and its groups. */
const hitShape = hitFields.extend({
    at: anyNumberShape,
    groups: mapOfShape(z.string()).optional().catch(undefined)
}) satisfies z.ZodType<SearchHit>;

/** One file's hits out of stored or fetched data: a root and a path, and the hits it can read. */
const fileShape = z.object({
    root: z.string(),
    path: z.string(),
    hits: rowsShape(hitShape).catch([]),
    rereadFailed: z.boolean().optional().catch(undefined)
}) satisfies z.ZodType<SearchFile>;

/** One dismissed hit out of stored data. */
const dismissedShape = z.object({
    root: z.string(),
    path: z.string(),
    line: anyNumberShape,
    at: anyNumberShape,
    length: anyNumberShape.catch(0)
}) satisfies z.ZodType<Dismissed>;

/** One hit of a written file read again: a hit, and the place it had before the write. */
const rereadHitShape = hitShape.extend({
    was: z
        .object({
            line: anyNumberShape,
            at: anyNumberShape,
            edited: z.literal(true).optional().catch(undefined)
        })
        .optional()
        .catch(undefined)
});

/** The files a replace read again, out of the answer it was sent in. */
const rereadsShape = rowsShape(
    z.object({
        root: z.string(),
        path: z.string(),
        hits: rowsShape(rereadHitShape).catch([]),
        failed: z.boolean().optional().catch(undefined)
    })
);

/** The files a replace answered with their hits read again, and none for anything else. */
export function rereadsOf(value: unknown): Reread[] {
    return readAs(rereadsShape, value) ?? [];
}

/** Whether some hit of the files holds the other fields of a hit and no `at`. */
function hasHitWithoutAt(value: unknown): boolean {
    const files = readAs(z.object({ files: z.array(z.unknown()) }), value)?.files ?? [];
    return files.some((file) => {
        const hits = readAs(z.object({ hits: z.array(z.unknown()) }), file)?.hits ?? [];
        return hits.some(
            (hit) => hitFields.safeParse(hit).success && !hitShape.safeParse(hit).success
        );
    });
}

/** One failed root out of stored or fetched data. */
const failureShape = z.object({
    root: z.string(),
    why: z.enum(['timed-out', 'failed']).catch('failed'),
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
    if (held === null || hasHitWithoutAt(value)) return null;
    return {
        files: held.files,
        total: held.total ?? countHits(held.files),
        truncated: held.truncated,
        ms: held.ms,
        failed: held.failed
    };
}

/** The names of one root out of a fetched answer: a root key, its paths and why it is not whole. */
const namesRootShape = z.object({
    root: z.string(),
    paths: stringItemsShape,
    error: z.enum(['timed_out', 'failed']).optional().catch(undefined)
});

/** A names answer out of a fetched value. */
const namesShape = z.object({
    roots: rowsShape(namesRootShape),
    cut: z.boolean().catch(false)
});

/** A names answer out of a fetched value, and null for anything that is not one. */
export function namesOf(value: unknown): NamesAnswer | null {
    const held = readAs(namesShape, value);
    if (held === null) return null;
    return {
        roots: held.roots.map((one) =>
            one.error === undefined
                ? { root: one.root, paths: one.paths }
                : { root: one.root, paths: one.paths, error: one.error }
        ),
        cut: held.cut
    };
}

/** How many hits a file list carries. */
function countHits(files: SearchFile[]): number {
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
    under: z.string().catch(''),
    dismissed: rowsShape(dismissedShape).catch([]),
    ran: z
        .object({
            q: z.string(),
            word: z.boolean().catch(false),
            case: z.boolean().catch(false),
            regex: z.boolean().catch(false),
            under: z.string().catch('')
        })
        .nullable()
        .catch(null),
    replacing: z.boolean().catch(false),
    replace: z.string().catch(''),
    preserve: z.boolean().catch(false),
    queries: z.array(z.string()).catch([]),
    replaces: z.array(z.string()).catch([])
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
        answer: held.ran === null ? null : answerOf(held.answer),
        error: held.error,
        ran: held.ran,
        dismissed: held.ran === null ? [] : held.dismissed,
        replacing: held.replacing,
        replace: held.replace,
        preserve: held.preserve,
        queries: held.queries.slice(0, HISTORY_KEPT),
        replaces: held.replaces.slice(0, HISTORY_KEPT)
    };
}

/**
 * The texts of a box after it ran `text`: the text first, any earlier copy of it taken out, and no
 * more than `HISTORY_KEPT` of them. An empty text is not remembered.
 */
export function remembered(texts: string[], text: string): string[] {
    if (text === '') return texts;
    return [text, ...texts.filter((one) => one !== text)].slice(0, HISTORY_KEPT);
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

/** The query a run was made with, which a replace and its preview name the matches by. */
export function ranOf(query: SearchQuery): ReplaceQuery {
    return {
        q: query.q,
        word: query.word,
        case: query.case,
        regex: query.regex,
        under: query.under
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

/**
 * The text a hit matched. The hit's line is cut to a window, so a match longer than the window is
 * read from group 0, which the run reports for it.
 */
export function matchOf(hit: SearchHit): string {
    return hit.groups?.['0'] ?? hitParts(hit).match;
}

/** The line a file heading opens at: its first hit's, and one for a file with no hit. */
export function firstLine(file: SearchFile): number {
    return file.hits.at(0)?.line ?? 1;
}
