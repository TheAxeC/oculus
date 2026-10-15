// Layer 2, client state. The Status view's line counts, as GET /api/lines answers them.
//
// The count is not in the snapshot: it runs cloc over oculus's own tracked files, which takes
// seconds, so it is asked for the first time the view reads it and again on Count again, and held
// for the page's life in between. The answer is held in the client state's query client, and the
// fetch is scheduled on a microtask by state/client/queries/queries.svelte.ts rather than run
// inside the read, so reading this from a $derived never writes state while a derived is running.
// It is only ever made in the browser: a server-rendered page holds nothing and asks for nothing.
//
// An answer the server could not have meant (no list of rows, a row that is not a folder's count,
// no total, no time) is held as a failed read naming what was wrong, never as a table with fewer
// rows.
//
// underSource sums the rows of every folder under src, which the view draws as one row for
// everything under src/ at every depth. Every counted file is in exactly one folder's row, so the
// sum of those rows is exact.

import { z } from 'zod';
import type { FolderLines, LanguageLines, LineCount, LineTally } from '../../data/model/index.ts';
import { optionalTextShape, readAs, readJson } from '../../data/shapes/shapes.ts';
import type { Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';
import { t } from '../shared/words/text.ts';

export type { LineCount, LineTally };

/** What the view reads: the count, what a failed count failed with, and whether one is out. */
export type Lines = {
    count: LineCount | null;
    /** The sentence saying what failed, or the empty string. */
    error: string;
    /** True while a count is on its way. */
    loading: boolean;
};

/** What the view reads before its first answer arrives. */
const PENDING: Lines = { count: null, error: '', loading: true };

/** One sum of a tally: a whole count. */
const countShape = z.number().refine((one) => Number.isInteger(one) && one >= 0);

/** The five sums of a tally, which a row, a language and the total each carry. */
const tallyFields = {
    files: countShape,
    blank: countShape,
    comment: countShape,
    code: countShape,
    todo: countShape
};

const tallyShape = z.object(tallyFields) satisfies z.ZodType<LineTally>;

const languageShape = z.object({
    language: z.string(),
    ...tallyFields
}) satisfies z.ZodType<LanguageLines>;

const folderShape = z.object({
    folder: z.string(),
    ...tallyFields,
    languages: z.array(languageShape)
}) satisfies z.ZodType<FolderLines>;

/** The time of a count: a text that reads as a date. */
const countedShape = z.string().refine((one) => !Number.isNaN(Date.parse(one)));

/** The parts of an answer that are read one at a time, so each can name what is wrong. */
const countHeadShape = z.object({
    rows: z.array(z.unknown()),
    total: z.unknown().optional(),
    counted: z.unknown().optional()
});

/**
 * The count an answer holds, or the sentence saying what makes it not one: the first row that is
 * not a folder's count is named by its place, counted from one.
 */
export function readCount(body: unknown): { count: LineCount } | { error: string } {
    const head = readAs(countHeadShape, body);
    if (head === null) return { error: t('status.lines_bad_rows') };
    const rows: FolderLines[] = [];
    for (const [at, item] of head.rows.entries()) {
        const row = readAs(folderShape, item);
        if (row === null) return { error: t('status.lines_bad_row', at + 1) };
        rows.push(row);
    }
    const total = readAs(tallyShape, head.total);
    if (total === null) return { error: t('status.lines_bad_total') };
    const counted = readAs(countedShape, head.counted);
    if (counted === null) return { error: t('status.lines_bad_counted') };
    return { count: { rows, total, counted } };
}

/** The folder that holds the source: the count's row `src` and every row `src/<path>` under it. */
export const SOURCE_FOLDER = 'src';

/** Whether a folder of the count is `src` or starts with `src/`; `srcx` is not under `src`. */
export function isUnderSource(folder: string): boolean {
    return folder === SOURCE_FOLDER || folder.startsWith(`${SOURCE_FOLDER}/`);
}

/** The sum of every row whose folder is under `src`, or null when no row is. */
export function underSource(rows: readonly FolderLines[]): LineTally | null {
    let sum: LineTally | null = null;
    for (const row of rows) {
        if (!isUnderSource(row.folder)) continue;
        sum ??= { files: 0, blank: 0, comment: 0, code: 0, todo: 0 };
        sum.files += row.files;
        sum.blank += row.blank;
        sum.comment += row.comment;
        sum.code += row.code;
        sum.todo += row.todo;
    }
    return sum;
}

/** The line counts, held for one client. */
export type LinesStore = {
    lines: () => Lines;
    /** Count again: what the view's Count again control does. */
    recount: () => void;
};

/** The query key of the count. */
const KEY = ['lines'];

/** The sentence a refused answer carries, or nothing. */
const refusalShape = z.object({ error: optionalTextShape });

/**
 * Ask for the count. A failed count is the sentence over the last table read, which stays on
 * screen, since a count that failed says nothing about the one before it.
 */
async function count(held: Lines | undefined): Promise<Lines> {
    const failed = (error: string): Lines => ({
        count: held?.count ?? null,
        error,
        loading: false
    });
    try {
        const response = await fetch('/api/lines');
        const body = await readJson(response);
        if (body === undefined) return failed(t('status.lines_bad_body', response.status));
        if (!response.ok) {
            const said = readAs(refusalShape, body)?.error ?? '';
            return failed(said === '' ? t('status.lines_bad_status', response.status) : said);
        }
        const read = readCount(body);
        if ('error' in read) return failed(read.error);
        return { count: read.count, error: '', loading: false };
    } catch {
        return failed(t('status.lines_unreachable'));
    }
}

export function createLines(queries: Queries): LinesStore {
    function lines(): Lines {
        const { data, refreshing } = queries.read(KEY, count, { enabled: inBrowser() });
        if (data === undefined) return PENDING;
        return refreshing ? { count: data.count, error: '', loading: true } : data;
    }

    function recount(): void {
        if (inBrowser()) queries.refetch(KEY, count, 'drop');
    }

    return { lines, recount };
}
