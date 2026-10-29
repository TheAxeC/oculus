// Layer 2, client state. The journal browser as the page uses it: what GET /api/venue-browser
// answers, read through zod before anything draws it; the address of each of its three requests;
// the search a browser view keeps; and the press of a venue card's Read from the browser.
//
// The page asks the route only on a press: the list of browsers when the view opens or the reader
// asks it again is a request to oculus alone, which asks no browser, and each search press and each
// Read press is the one request the browser is sent. Read from the browser asks by the venue's
// first ISSN, then by the next while no hit answers; one hit is what it writes, its fee and its
// open-access status, and an answer of no hit or of several writes nothing, the sentence saying
// which. A state other than `ok` ends the press with its sentence.

import { z } from 'zod';
import {
    BROWSER_REFUSALS,
    SOURCE_STATES,
    type BrowserHit,
    type BrowserInfo,
    type BrowserRefusal,
    type Venue
} from '../../../data/model/index.ts';
import { readAs } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';

export type { BrowserHit, BrowserInfo } from '../../../data/model/index.ts';

/** The route, which every request here is made to. */
const BROWSER_ROUTE = '/api/venue-browser';

/** The address of the list of the hubs' browsers. */
export const BROWSER_LIST_URL = `${BROWSER_ROUTE}?list`;

const infoShape = z.object({
    hub: z.string(),
    name: z.string(),
    filters: z.array(z.string()),
    sorts: z.array(z.string()),
    sizes: z.array(z.number())
}) satisfies z.ZodType<BrowserInfo>;

const listShape = z.object({ browsers: z.array(infoShape) });

/** The browsers a `?list` body names, or null when it is not a list. */
export function browserList(body: unknown): BrowserInfo[] | null {
    return readAs(listShape, body)?.browsers ?? null;
}

const hitShape = z.object({
    title: z.string().optional(),
    issn: z.array(z.string()),
    publisher: z.string().optional(),
    fee: z.string().optional(),
    open_access: z.string().optional()
}) satisfies z.ZodType<BrowserHit>;

const okShape = z.object({
    state: z.literal('ok'),
    hits: z.array(z.unknown()),
    total: z.number().nullable(),
    cursor: z.string().nullable()
});

/** The states a browser stops in, every state of a source but `ok` and `skipped`. */
const STOPS = SOURCE_STATES.filter((state) => state !== 'ok' && state !== 'skipped');

const stoppedShape = z.object({
    state: z.enum(STOPS),
    status: z.number().optional(),
    wait_s: z.number().optional()
});

/** One answer of a browser as the page uses it. */
export type BrowserRead =
    | { state: 'ok'; hits: BrowserHit[]; total: number | null; cursor: string | null }
    | { state: (typeof STOPS)[number]; wait?: number };

const refusalShape = z.object({ error: z.enum(BROWSER_REFUSALS) });

/** The answer a body holds, a refusal's word, or null when it is none of the route's answers. */
export function browserRead(body: unknown): BrowserRead | { refused: BrowserRefusal } | null {
    const ok = readAs(okShape, body);
    if (ok !== null) {
        const hits = ok.hits.flatMap((raw) => readAs(hitShape, raw) ?? []);
        return { state: 'ok', hits, total: ok.total, cursor: ok.cursor };
    }
    const stopped = readAs(stoppedShape, body);
    if (stopped !== null) {
        return {
            state: stopped.state,
            ...(stopped.wait_s === undefined ? {} : { wait: stopped.wait_s })
        };
    }
    const refused = readAs(refusalShape, body);
    return refused === null ? null : { refused: refused.error };
}

/** The sentence of an answer with no hits: its state's, a refusal's, or one it cannot read. */
export function stopWords(
    read: Exclude<BrowserRead, { state: 'ok' }> | { refused: BrowserRefusal } | null
): string {
    if (read === null) return t('venue_browser.state_unread');
    if ('refused' in read) return t('venue_browser.refused', read.refused);
    switch (read.state) {
        case 'limited':
            return read.wait === undefined
                ? t('venue_browser.state_limited')
                : t('venue_browser.state_limited_wait', read.wait);
        case 'timeout':
            return t('venue_browser.state_timeout');
        case 'refused':
            return t('venue_browser.state_refused');
        case 'no-key':
            return t('venue_browser.state_no_key');
        case 'failed':
            return t('venue_browser.state_failed');
    }
}

/** What a search of the browser view asks: the words and the place of each choice picked. */
export type BrowserSearch = {
    hub: string;
    words: string;
    /** The place of the filter picked in the row's `filters`, null for none. */
    filter: number | null;
    /** The value the filter's `{value}` is filled with. */
    value: string;
    /** The place of the sort order picked in the row's `sorts`, null for the browser's own. */
    sort: number | null;
    /** The page size picked, one of the row's `paging.sizes`, null for the row's first. */
    size: number | null;
};

/** The address of one page of a search: the first, or the one its cursor names. */
export function searchUrl(search: BrowserSearch, cursor: string | null = null): string {
    const params = new URLSearchParams({ hub: search.hub, q: search.words.trim() });
    if (search.filter !== null && search.value.trim() !== '') {
        params.set('filter', String(search.filter));
        params.set('value', search.value.trim());
    }
    if (search.sort !== null) params.set('sort', String(search.sort));
    if (search.size !== null) params.set('size', String(search.size));
    if (cursor !== null) params.set('page', cursor);
    return `${BROWSER_ROUTE}?${params.toString()}`;
}

/** The address of the hits of one ISSN in a hub's browser. */
function issnUrl(hub: string, issn: string): string {
    return `${BROWSER_ROUTE}?${new URLSearchParams({ hub, issn }).toString()}`;
}

/** The fields of a hit that Read from the browser writes into a venue's entry. */
type ReadFields = { fee?: string; open_access?: string };

/** What one Read from the browser press came to: the fields to write, or why nothing is. */
export type ReadOutcome = { write: ReadFields; issn: string } | { none: string; asked: string[] };

/**
 * One Read from the browser press over a venue: its ISSNs asked in order through `ask` (which
 * answers the route's body for an address), until one answers with a hit or with a stop. One hit
 * holding a fee or an open-access status is written; several hits, a hit holding neither, no hit
 * for any ISSN and a stop each write nothing, with the sentence saying which.
 */
export async function readFromBrowser(
    venue: Venue,
    ask: (url: string) => Promise<unknown>
): Promise<ReadOutcome> {
    const issns = venue.issn ?? [];
    const asked: string[] = [];
    for (const issn of issns) {
        asked.push(issn);
        const read = browserRead(await ask(issnUrl(venue.root ?? '', issn)));
        if (read === null || 'refused' in read || read.state !== 'ok') {
            return { none: t('venue_browser.read_stopped', issn, stopWords(read)), asked };
        }
        if (read.hits.length === 0) continue;
        if (read.hits.length > 1) {
            return { none: t('venue_browser.read_several', issn, read.hits.length), asked };
        }
        const [hit] = read.hits;
        const write: ReadFields = {};
        if (hit.fee !== undefined) write.fee = hit.fee;
        if (hit.open_access !== undefined) write.open_access = hit.open_access;
        if (Object.keys(write).length === 0) {
            return { none: t('venue_browser.read_empty', issn), asked };
        }
        return { write, issn };
    }
    return { none: t('venue_browser.read_no_hit', asked.join(', ')), asked };
}

/** Why a venue's Read from the browser is off, or the empty text when it can be pressed. */
export function readBlocked(venue: Venue): string {
    if (venue.browsable !== true) return t('venue_browser.read_no_browser');
    if ((venue.issn ?? []).length === 0) return t('venue_browser.read_no_issn');
    return '';
}

/** The fields a Browser view instance keeps, each read as absent when wrong. */
const browserStateShape = z.object({
    hub: z.string().catch(''),
    words: z.string().catch(''),
    filter: z.number().int().min(0).nullable().catch(null),
    value: z.string().catch(''),
    sort: z.number().int().min(0).nullable().catch(null),
    size: z.number().int().min(1).nullable().catch(null)
});

/** The saved search of one browser view instance, with defaults for what is absent or wrong. */
export function parseBrowserState(raw: unknown): BrowserSearch {
    return (
        readAs(browserStateShape, raw) ?? {
            hub: '',
            words: '',
            filter: null,
            value: '',
            sort: null,
            size: null
        }
    );
}
