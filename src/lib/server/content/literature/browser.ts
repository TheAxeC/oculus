// Layer 2, server. The /api/venue-browser endpoint: the journal browser of a hub, the one reader
// row of its `venues.browser`, asked through the one reader (server/core/reader/). A route module
// may export only its verbs, so everything the request does is here and
// src/routes/api/(docs)/venue-browser/+server.ts joins it to the hubs' rows.
//
// A request is one of three forms: `?list`, the hubs that name a browser with the labels of their
// filters and sort orders and their page sizes, which asks no browser; `?hub=<name>&q=...`, one
// page of a search by words with the filter, the sort order and the page size picked; and
// `?hub=<name>&issn=...`, the hits of one ISSN, asked by the row's `query.issn` and refused for a
// row with none. Each of the last two is one press of the reader and sends what its row describes,
// nothing more, so no request runs at start, on a refresh or in the background. A request carries
// the write token, since it puts the reader's words in a request to a third party, and the order
// of the refusals is the order of the checks below.
//
// A browser that does not answer is the state of its answer, as a literature source's is
// (data/model/model-search.ts), never an error of the route. A hit's fields are plain text, its
// ISSNs each in the `1234-567X` form, and a hit with none of the fields is no hit.

import { json } from '@sveltejs/kit';
import {
    FIELD_MAX,
    QUERY_MAX,
    type BrowserAnswer,
    type BrowserHit,
    type BrowserInfo,
    type BrowserRefusal
} from '../../../data/model/index.ts';
import type { ReaderRow } from '../../../data/sources/config/settings/rows/grammar.ts';
import { fillText } from '../../../data/sources/config/settings/rows/holes.ts';
import { plainText } from '../../../data/prose/literature.ts';
import type { Fetcher } from '../../accounts/connect/oauth.ts';
import { hasToken } from '../../core/auth.ts';
import { ReaderStop } from '../../core/reader/call.ts';
import { FIRST, pageOfToken, sizeOf, tokenOf } from '../../core/reader/paging.ts';
import { readLookup, readPage, type Item, type Setup } from '../../core/reader/reader.ts';
import { applyAuth, askedOf, type Account, type Asked } from '../../core/reader/request.ts';
import type { LiteratureDesk } from './desk.ts';

/** One hub's journal browser: the hub's name and the row of its `venues.browser`. */
export type HubBrowser = { hub: string; row: ReaderRow };

/** What the handler is given by the route. */
export type BrowserOptions = {
    token: string;
    /** The hubs that name a browser, the primary first. */
    browsers: () => HubBrowser[];
    /** The machine's `downloads` rows, which the row's `auth` entries read. */
    downloads: readonly Account[];
    /** The seconds one request may take. */
    timeoutS: number;
    /** The lanes that pace each browser's requests, the literature sources' desk. */
    desk: LiteratureDesk;
    fetcher: Fetcher;
    /** The User-Agent of every request, `oculus/<version>`. */
    agent: string;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The most bytes of one answer that are read. */
const ANSWER_MAX = 5 * 1024 * 1024;

/** An ISSN as the route takes it: four digits, a hyphen, three digits and a check digit or X. */
const ISSN = /^\d{4}-\d{3}[\dX]$/;

/** One request read: the hub's browser, and the ISSN or the parameters of a page by words. */
type BrowserQuery =
    | { browser: HubBrowser; issn: string; asked: Exclude<Asked, { skipped: true }> }
    | {
          browser: HubBrowser;
          params: [string, string][];
          size: number | undefined;
          page: string | null;
      };

/** A refusal: its word, 403 for the token and 400 for the rest. */
function refuse(word: BrowserRefusal): Response {
    const status = word === 'token' ? 403 : 400;
    return json({ error: word }, { status, headers: NO_STORE });
}

/** One hub's browser as the list gives it. */
function infoOf({ hub, row }: HubBrowser): BrowserInfo {
    return {
        hub,
        name: row.name,
        filters: (row.filters ?? []).map((one) => one.label),
        sorts: (row.sorts ?? []).map((one) => one.label),
        sizes: row.paging?.sizes ?? []
    };
}

/** The place a choice is picked by in its list, or undefined when the text names none. */
function placeOf(text: string | null, count: number): number | undefined | 'wrong' {
    if (text === null || text === '') return undefined;
    if (!/^\d{1,3}$/.test(text)) return 'wrong';
    const at = Number(text);
    return at < count ? at : 'wrong';
}

/** The parameters of the filter picked, its `{value}` the value typed; none when none is picked. */
function filterParams(
    row: ReaderRow,
    params: URLSearchParams
): [string, string][] | BrowserRefusal {
    const filters = row.filters ?? [];
    const at = placeOf(params.get('filter'), filters.length);
    if (at === 'wrong') return 'filter';
    if (at === undefined) return [];
    const value = (params.get('value') ?? '').trim();
    if (value === '' || value.length > FIELD_MAX) return 'filter';
    const out: [string, string][] = [];
    for (const [name, text] of Object.entries(filters[at].params)) {
        const filled = fillText(text, (hole) => (hole === 'value' ? value : undefined));
        if (filled === undefined) return 'filter';
        out.push([name, filled]);
    }
    return out;
}

/** The parameters of the sort order picked; none when none is picked. */
function sortParams(row: ReaderRow, params: URLSearchParams): [string, string][] | BrowserRefusal {
    const sorts = row.sorts ?? [];
    const at = placeOf(params.get('sort'), sorts.length);
    if (at === 'wrong') return 'sort';
    return at === undefined ? [] : Object.entries(sorts[at].params);
}

/** The page size asked, one of the row's sizes; the row's first when none is asked. */
function sizeAsked(row: ReaderRow, params: URLSearchParams): number | undefined | 'wrong' {
    const text = params.get('size');
    if (text === null || text === '') return sizeOf(row.paging);
    const size = Number(text);
    if (!(row.paging?.sizes ?? []).includes(size)) return 'wrong';
    return sizeOf(row.paging, size);
}

/** Read a search or a lookup of the route, or the word that refuses it. */
function queryOf(
    params: URLSearchParams,
    browsers: HubBrowser[]
): { refused: BrowserRefusal } | { value: BrowserQuery } {
    const hubs = params.getAll('hub');
    const browser = hubs.length === 1 ? browsers.find((one) => one.hub === hubs[0]) : undefined;
    if (browser === undefined) return { refused: 'hub' };
    const { row } = browser;
    const issn = params.get('issn');
    if (issn !== null) {
        const text = issn.trim().toUpperCase();
        const asked = ISSN.test(text) ? askedOf(row, { issn: text }) : { skipped: true as const };
        return 'skipped' in asked ? { refused: 'issn' } : { value: { browser, issn: text, asked } };
    }
    const q = (params.get('q') ?? '').trim();
    if (q === '') return { refused: 'query_empty' };
    if (q.length > QUERY_MAX) return { refused: 'query_long' };
    const filter = filterParams(row, params);
    if (typeof filter === 'string') return { refused: filter };
    const sort = sortParams(row, params);
    if (typeof sort === 'string') return { refused: sort };
    const size = sizeAsked(row, params);
    if (size === 'wrong') return { refused: 'size' };
    const page = params.get('page');
    if (page !== null && pageOfToken(row, page, size ?? 1) === null) return { refused: 'page' };
    const asked = askedOf(row, { words: q });
    if (!('params' in asked)) return { refused: 'query_empty' };
    return { value: { browser, params: [...asked.params, ...filter, ...sort], size, page } };
}

/** A field as plain text, its runs of white space one space, or undefined when nothing is left. */
function plainOf(value: unknown): string | undefined {
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;
    const text = plainText(String(value)).replace(/\s+/g, ' ').trim();
    return text === '' ? undefined : text;
}

/** The ISSNs of a field, each once, in the `1234-567X` form. */
function issnsOf(value: unknown): string[] {
    const values = Array.isArray(value) ? (value as unknown[]) : [value];
    const found = values.flatMap((one) => {
        const text = plainOf(one)?.toUpperCase();
        return text !== undefined && ISSN.test(text) ? [text] : [];
    });
    return [...new Set(found)];
}

/** The hits of a page's items, a hit with none of the fields left out. */
function browserHits(items: readonly Item[]): BrowserHit[] {
    return items.flatMap((item): BrowserHit[] => {
        const hit: BrowserHit = { issn: issnsOf(item.fields.issn) };
        for (const field of ['title', 'publisher', 'fee', 'open_access'] as const) {
            const text = plainOf(item.fields[field]);
            if (text !== undefined) hit[field] = text;
        }
        return Object.keys(hit).length > 1 || hit.issn.length > 0 ? [hit] : [];
    });
}

/** The answer of a stop: the state, the status and the wait the reader read. */
function stopped(stop: ReaderStop): BrowserAnswer {
    const state =
        stop.state === 'timeout' || stop.state === 'limited' || stop.state === 'refused'
            ? stop.state
            : 'failed';
    return {
        ok: true,
        state,
        ...(stop.status === undefined ? {} : { status: stop.status }),
        ...(stop.wait === undefined ? {} : { wait_s: stop.wait })
    };
}

/** One query asked of its browser, answered as the browser's state or its hits. */
async function askBrowser(
    query: BrowserQuery,
    options: BrowserOptions,
    signal: AbortSignal
): Promise<BrowserAnswer> {
    const { hub, row } = query.browser;
    const applied = applyAuth(row.auth, options.downloads);
    if (applied.missing !== undefined) return { ok: true, state: 'no-key' };
    const gap =
        applied.keyed && row.pace?.gap_with_key !== undefined
            ? row.pace.gap_with_key
            : (row.pace?.gap ?? 0);
    const setup: Setup = {
        sender: {
            fetcher: options.fetcher,
            agent: options.agent,
            timeoutMs: options.timeoutS * 1000,
            maxBytes: ANSWER_MAX,
            signal
        },
        downloads: options.downloads,
        links: [],
        run: (task) => options.desk.run(`venues.browser:${hub}`, gap, signal, task)
    };
    try {
        if ('issn' in query) {
            const asked = query.asked;
            if ('lookup' in asked) {
                const value = asked.value;
                const holes = (name: string): unknown => (name === 'issn' ? value : undefined);
                const items = await readLookup(row, asked.term, holes, setup);
                const hits = browserHits(items);
                return { ok: true, state: 'ok', hits, total: null, cursor: null };
            }
            const ask = { state: FIRST, size: sizeOf(row.paging), params: asked.params };
            const page = await readPage(row, ask, setup);
            const hits = browserHits(page.items);
            return { ok: true, state: 'ok', hits, total: page.total, cursor: null };
        }
        const state = pageOfToken(row, query.page, query.size ?? 1);
        if (state === null) return { ok: true, state: 'failed' };
        const page = await readPage(row, { state, size: query.size, params: query.params }, setup);
        return {
            ok: true,
            state: 'ok',
            hits: browserHits(page.items),
            total: page.total,
            cursor: page.next === null ? null : tokenOf(row.paging, page.next)
        };
    } catch (error) {
        if (error instanceof ReaderStop) return stopped(error);
        // A request the page gave up on has nobody to read an answer; any other failure is the
        // browser's, whatever it was, and carries no message.
        return { ok: true, state: 'failed' };
    }
}

/** GET /api/venue-browser: the hubs' browsers, one page of a search, or the hits of one ISSN. */
export async function handleBrowser(request: Request, options: BrowserOptions): Promise<Response> {
    if (!hasToken(request, options.token)) return refuse('token');
    const params = new URL(request.url).searchParams;
    const browsers = options.browsers();
    if (params.has('list')) {
        return json({ ok: true, browsers: browsers.map(infoOf) }, { headers: NO_STORE });
    }
    const read = queryOf(params, browsers);
    if ('refused' in read) return refuse(read.refused);
    return json(await askBrowser(read.value, options, request.signal), { headers: NO_STORE });
}
