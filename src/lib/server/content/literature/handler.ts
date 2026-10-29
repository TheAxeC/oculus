// Layer 2, server. The /api/literature endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(docs)/literature/+server.ts is the few
// lines that join them, the pattern lib/server/files/search/search-routes.ts holds.
//
// A request carries the write token like every route that sends something out: a literature search
// puts the reader's query in a request to a third party, and it spends the secrets of the machine's
// `downloads` rows. The order of the refusals is the order of the checks: the token, then the
// request's own bounds (request.ts), and only then is a source asked.
//
// The sources are the rows of `literature.sources` of the primary hub, asked through the one reader
// (server/core/reader/). One request asks one row. The page sends one per row it has toggled on and
// merges the answers as they arrive, so a slow source never holds a fast one. A source that does
// not answer is that source's state in its answer (data/model/model-search.ts), never an error of
// the route. A row whose required `auth` entry has no `downloads` row is `no-key`, asked nothing.
//
// A secret is a header or a parameter of the request to its row's addresses and is in no answer,
// no refusal word and no message: the answers carry the hits and a state, and a stop's message
// carries the row's name, the state and the status.

import { json } from '@sveltejs/kit';
import type { LiteratureRefusal, SourceAnswer, SourceInfo } from '../../../data/model/index.ts';
import type { LiteratureSettings } from '../../../data/sources/config.ts';
import type { LinkRow, ReaderRow } from '../../../data/sources/config/settings/rows/grammar.ts';
import type { Fetcher } from '../../accounts/connect/oauth.ts';
import { hasToken } from '../../core/auth.ts';
import { ReaderStop, type Sender } from '../../core/reader/call.ts';
import { pageOfToken, sizeOf, tokenOf } from '../../core/reader/paging.ts';
import { readLookup, readPage, type Item, type Setup } from '../../core/reader/reader.ts';
import { applyAuth, askedOf, type Account } from '../../core/reader/request.ts';
import { bibtexFor } from './bibtex.ts';
import type { LiteratureDesk } from './desk.ts';
import { hitsOf } from './hits.ts';
import { bibtexOf, searchOf, termsOf, type LiteratureQuery } from './request.ts';

/** What the handler is given by the route. */
export type LiteratureOptions = {
    token: string;
    /** The rows of `literature.sources` of the primary hub, in their order. */
    rows: readonly ReaderRow[];
    /** The rows of `links` of the primary hub. */
    links: readonly LinkRow[];
    /** The machine's `downloads` rows, which the rows' `auth` entries read. */
    downloads: readonly Account[];
    /** `literature.mailto` of local.yml, sent as each row's `contact` parameter. */
    mailto?: string;
    settings: LiteratureSettings;
    desk: LiteratureDesk;
    fetcher: Fetcher;
    /** The User-Agent of every request, `oculus/<version>`. */
    agent: string;
    /** The current time in milliseconds. */
    now?: () => number;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The most bytes of one answer that are read. */
const ANSWER_MAX = 5 * 1024 * 1024;

/** A refusal: 400 and its word. */
function refuse(word: LiteratureRefusal): Response {
    return json({ error: word }, { status: 400, headers: NO_STORE });
}

/** One row in the route's list: whether it needs a secret, whether it can be asked, and which. */
function sourceInfo(row: ReaderRow, downloads: readonly Account[]): SourceInfo {
    const required = (row.auth ?? []).filter((entry) => entry.required === true);
    const missing = applyAuth(row.auth, downloads).missing;
    const named = missing ?? required.at(0);
    const term = row.query?.id;
    return {
        id: row.key,
        name: row.name,
        keyed: required.length > 0,
        available: missing === undefined,
        key: named?.row ?? null,
        help: named?.help ?? null,
        bibtex: term?.address === undefined ? null : (term.by ?? 'id')
    };
}

/** The key the cache holds an answer under: the row and every parameter, and no secret. */
function cacheKey(query: LiteratureQuery): string {
    return JSON.stringify([
        query.row.key,
        query.q,
        query.doi !== undefined,
        query.years,
        query.type,
        query.oa,
        query.venue,
        query.author,
        query.minCites,
        query.page
    ]);
}

/** The sender every request of one route request goes out with. */
function senderOf(options: LiteratureOptions, signal: AbortSignal): Sender {
    return {
        fetcher: options.fetcher,
        agent: options.agent,
        timeoutMs: options.settings.timeoutS * 1000,
        maxBytes: ANSWER_MAX,
        signal
    };
}

/** The gap a row keeps between two of its requests: with a held secret its `gap_with_key`. */
function gapOf(row: ReaderRow, keyed: boolean): number {
    if (keyed && row.pace?.gap_with_key !== undefined) return row.pace.gap_with_key;
    return row.pace?.gap ?? 0;
}

/** The answer of a stop: the state, the status and the wait the reader read. */
function stopped(source: string, stop: ReaderStop): SourceAnswer {
    const state =
        stop.state === 'timeout'
            ? 'timeout'
            : stop.state === 'limited'
              ? 'limited'
              : stop.state === 'refused'
                ? 'refused'
                : 'failed';
    return {
        ok: true,
        source,
        state,
        ...(stop.status === undefined ? {} : { status: stop.status }),
        ...(stop.wait === undefined ? {} : { wait_s: stop.wait })
    };
}

/** One row asked one question, answered as the source's state or its hits. */
async function askSource(
    query: LiteratureQuery,
    options: LiteratureOptions,
    signal: AbortSignal
): Promise<SourceAnswer> {
    const { row } = query;
    const source = row.key;
    const { settings, desk } = options;
    const applied = applyAuth(row.auth, options.downloads);
    if (applied.missing !== undefined) return { ok: true, source, state: 'no-key' };
    const asked = askedOf(row, termsOf(query));
    if ('skipped' in asked) return { ok: true, source, state: 'skipped' };

    const key = cacheKey(query);
    const kept = desk.kept(key, settings.cacheMin);
    if (kept !== undefined) return { ...kept, cached: true };

    const gap = gapOf(row, applied.keyed);
    const setup: Setup = {
        sender: senderOf(options, signal),
        downloads: options.downloads,
        links: options.links,
        ...(options.mailto === undefined ? {} : { contact: options.mailto }),
        run: (task) => desk.run(source, gap, signal, task)
    };
    const now = (options.now ?? Date.now)();
    try {
        let items: Item[];
        let page: { total: number | null; more: boolean; cursor: string | null };
        if ('lookup' in asked) {
            const value = asked.value;
            const holes = (name: string): unknown => (name === asked.lookup ? value : undefined);
            items = await readLookup(row, asked.term, holes, setup);
            page = { total: items.length, more: false, cursor: null };
        } else {
            const size = sizeOf(row.paging, settings.perSource) ?? settings.perSource;
            const state = pageOfToken(row, query.page, size);
            if (state === null) return { ok: true, source, state: 'failed' };
            const read = await readPage(row, { state, size, params: asked.params }, setup);
            items = read.items;
            const next = read.next;
            page = {
                total: read.total,
                more: next !== null,
                cursor: next === null ? null : tokenOf(row.paging, next)
            };
        }
        const hits = hitsOf(row, items, now);
        if (hits === null) return { ok: true, source, state: 'failed' };
        const answer: SourceAnswer = {
            ok: true,
            source,
            state: 'ok',
            cached: false,
            ...page,
            hits
        };
        desk.keep(key, answer, settings.cacheMin);
        return answer;
    } catch (error) {
        if (error instanceof ReaderStop) return stopped(source, error);
        // A request the page gave up on has nobody to read an answer; any other failure is the
        // source's, whatever it was, and carries no message.
        return { ok: true, source, state: 'failed' };
    }
}

/**
 * GET /api/literature: the list of sources, one source's search, or one BibTeX entry.
 */
export async function handleLiterature(
    request: Request,
    options: LiteratureOptions
): Promise<Response> {
    if (!hasToken(request, options.token)) {
        return json({ error: 'token' }, { status: 403, headers: NO_STORE });
    }
    const params = new URL(request.url).searchParams;
    const now = (options.now ?? Date.now)();
    if (params.has('sources')) {
        const sources = options.rows.map((row) => sourceInfo(row, options.downloads));
        return json({ ok: true, sources }, { headers: NO_STORE });
    }
    if (params.has('bibtex')) {
        const read = bibtexOf(params, options.rows);
        if ('refused' in read) return refuse(read.refused);
        try {
            const found = await bibtexFor(read.value, {
                sender: senderOf(options, request.signal),
                desk: options.desk,
                links: options.links,
                downloads: options.downloads,
                ...(options.mailto === undefined ? {} : { contact: options.mailto }),
                signal: request.signal
            });
            return json({ ok: true, ...found }, { headers: NO_STORE });
        } catch {
            // A request the page gave up on has nobody to read it; any other failure is a source
            // with no entry, and carries no message.
            return json({ ok: true, bibtex: null }, { headers: NO_STORE });
        }
    }
    const read = searchOf(params, options.rows, now);
    if ('refused' in read) return refuse(read.refused);
    const answer = await askSource(read.value, options, request.signal);
    return json(answer, { headers: NO_STORE });
}
