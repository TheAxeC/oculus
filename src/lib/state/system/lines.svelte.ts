// Layer 2, client state. The Status view's line counts, as GET /api/lines answers them.
//
// The count is not in the snapshot: it runs cloc over oculus's own tracked files, which takes
// seconds, so it is asked for the first time the view reads it and again on Count again, and held
// for the page's life in between. The fetch is scheduled on a microtask rather than run inside the
// read, so reading this from a $derived never writes state while a derived is running, and it is
// only ever made in the browser: a server-rendered page holds nothing and asks for nothing.
//
// An answer the server could not have meant (no list of rows, a row that is not a folder's count,
// no total, no time) is held as a failed read naming what was wrong, never as a table with fewer
// rows.

import { isMap } from '../../data/helpers/guards.ts';
import type { FolderLines, LanguageLines, LineCount, LineTally } from '../../data/model/index.ts';
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

/** The five sums of a tally when every one is a whole count, or null. */
function tally(value: unknown): LineTally | null {
    if (!isMap(value)) return null;
    const read: Record<string, number> = {};
    for (const key of ['files', 'blank', 'comment', 'code', 'todo']) {
        const one = value[key];
        if (typeof one !== 'number' || !Number.isInteger(one) || one < 0) return null;
        read[key] = one;
    }
    return {
        files: read.files,
        blank: read.blank,
        comment: read.comment,
        code: read.code,
        todo: read.todo
    };
}

/** One language row, or null when it is not one. */
function language(value: unknown): LanguageLines | null {
    const sums = tally(value);
    if (sums === null || !isMap(value) || typeof value.language !== 'string') return null;
    return { language: value.language, ...sums };
}

/** One folder row with its languages, or null when it or any of its languages is not one. */
function folder(value: unknown): FolderLines | null {
    const sums = tally(value);
    if (sums === null || !isMap(value) || typeof value.folder !== 'string') return null;
    if (!Array.isArray(value.languages)) return null;
    const languages: LanguageLines[] = [];
    for (const item of value.languages as unknown[]) {
        const one = language(item);
        if (one === null) return null;
        languages.push(one);
    }
    return { folder: value.folder, ...sums, languages };
}

/**
 * The count an answer holds, or the sentence saying what makes it not one: the first row that is
 * not a folder's count is named by its place, counted from one.
 */
export function readCount(body: unknown): { count: LineCount } | { error: string } {
    if (!isMap(body) || !Array.isArray(body.rows)) return { error: t('status.lines_bad_rows') };
    const rows: FolderLines[] = [];
    for (const [at, item] of (body.rows as unknown[]).entries()) {
        const row = folder(item);
        if (row === null) return { error: t('status.lines_bad_row', at + 1) };
        rows.push(row);
    }
    const total = tally(body.total);
    if (total === null) return { error: t('status.lines_bad_total') };
    if (typeof body.counted !== 'string' || Number.isNaN(Date.parse(body.counted))) {
        return { error: t('status.lines_bad_counted') };
    }
    return { count: { rows, total, counted: body.counted } };
}

/** The line counts, held for one client. */
export type LinesStore = {
    lines: () => Lines;
    /** Count again: what the view's Count again control does. */
    recount: () => void;
};

export function createLines(): LinesStore {
    const held: { lines: Lines | null } = $state({ lines: null });

    /** Whether a request is out, so a second read or a second press does not send a second one. */
    let inflight = false;

    function lines(): Lines {
        if (held.lines === null) request();
        return held.lines ?? PENDING;
    }

    function recount(): void {
        if (request()) held.lines = { count: held.lines?.count ?? null, error: '', loading: true };
    }

    /**
     * Send the request on a microtask, unless one is out already. A server render has no fetch and
     * nothing to show a count on, so it asks for nothing and the browser asks on its first render.
     * Whether a request was sent.
     */
    function request(): boolean {
        if (inflight || typeof window === 'undefined' || typeof fetch !== 'function') return false;
        inflight = true;
        queueMicrotask(() => void load());
        return true;
    }

    /**
     * A failed count: the sentence, over the last table read, which stays on screen, since a count
     * that failed says nothing about the one before it.
     */
    function failed(error: string): void {
        held.lines = { count: held.lines?.count ?? null, error, loading: false };
    }

    /** The answer's body, or null when it is not JSON (a proxy's page, a crashed server). */
    async function bodyOf(response: Response): Promise<unknown> {
        try {
            return (await response.json()) as unknown;
        } catch {
            return null;
        }
    }

    async function load(): Promise<void> {
        try {
            const response = await fetch('/api/lines');
            const body = await bodyOf(response);
            if (body === null) {
                failed(t('status.lines_bad_body', response.status));
                return;
            }
            if (!response.ok) {
                const said = isMap(body) && typeof body.error === 'string' ? body.error : '';
                failed(said === '' ? t('status.lines_bad_status', response.status) : said);
                return;
            }
            const read = readCount(body);
            if ('error' in read) failed(read.error);
            else held.lines = { count: read.count, error: '', loading: false };
        } catch {
            failed(t('status.lines_unreachable'));
        } finally {
            inflight = false;
        }
    }

    return { lines, recount };
}
