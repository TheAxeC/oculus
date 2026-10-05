// Layer 2, server. The /api/literature endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(docs)/literature/+server.ts is the few
// lines that join them, the pattern lib/server/files/search-routes.ts holds.
//
// A request carries the write token like every route that sends something out: a literature search
// puts the reader's query in a request to a third party, and it spends the keys of local.yml. The
// order of the refusals is the order of the checks: the token, then the request's own bounds
// (request.ts), and only then is a source asked.
//
// One request asks one source. The page sends one per source it has toggled on and merges the
// answers as they arrive, so a slow source never holds a fast one. A source that does not answer is
// that source's state in its answer (data/model/model-search.ts), never an error of the route.
//
// The keys of local.yml are read from the context at each request. A key is a header or a query
// parameter of the request to its source and is in no answer, no refusal word and no message: the
// answers carry the hits and a state, the messages carry a source, a status and a plain code.

import { json } from '@sveltejs/kit';
import {
    LITERATURE_SOURCES,
    type LiteratureRefusal,
    type SourceAnswer,
    type SourceInfo
} from '../../../data/model/index.ts';
import type { LiteratureSettings } from '../../../data/sources/config.ts';
import type { Fetcher } from '../../accounts/connect/oauth.ts';
import { hasToken } from '../../core/auth.ts';
import { callFor, SourceStop } from './ask.ts';
import { bibtexFor } from './bibtex.ts';
import type { LiteratureDesk } from './desk.ts';
import { bibtexOf, searchOf, type LiteratureQuery } from './request.ts';
import { ADAPTERS } from './sources/index.ts';
import type { Keys } from './sources/common.ts';

/** What the handler is given by the route. */
export type LiteratureOptions = {
    token: string;
    /** The keys and contact address of local.yml as of this request. */
    keys: Keys;
    settings: LiteratureSettings;
    desk: LiteratureDesk;
    fetcher: Fetcher;
    /** The current time in milliseconds. */
    now?: () => number;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** A refusal: 400 and its word. */
function refuse(word: LiteratureRefusal): Response {
    return json({ error: word }, { status: 400, headers: NO_STORE });
}

/** The values of the keys, which a message about a refusal must not hold. */
function secretsOf(keys: Keys): string[] {
    return Object.values(keys).filter((value): value is string => typeof value === 'string');
}

/** The sources in the route's order, with whether each can be asked. */
function sourceList(keys: Keys): SourceInfo[] {
    return LITERATURE_SOURCES.map((id) => {
        const key = ADAPTERS[id].key;
        return {
            id,
            keyed: key !== undefined,
            available: key === undefined || key.value(keys) !== undefined,
            key: key?.name ?? null
        };
    });
}

/** The key the cache holds an answer under: the source and every parameter, and no key. */
function cacheKey(query: LiteratureQuery): string {
    return JSON.stringify([
        query.source,
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

/** One source asked one question, answered as the source's state or its hits. */
async function askSource(
    query: LiteratureQuery,
    options: LiteratureOptions,
    signal: AbortSignal
): Promise<SourceAnswer> {
    const { source } = query;
    const adapter = ADAPTERS[source];
    const { keys, settings, desk } = options;
    if (adapter.key !== undefined && adapter.key.value(keys) === undefined) {
        return { ok: true, source, state: 'no-key' };
    }
    if (adapter.skips(query)) return { ok: true, source, state: 'skipped' };

    const key = cacheKey(query);
    const kept = desk.kept(key, settings.cacheMin);
    if (kept !== undefined) return { ...kept, cached: true };

    const fetchOne = callFor(
        source,
        options.fetcher,
        settings.timeoutS * 1000,
        signal,
        secretsOf(keys)
    );
    const gap = adapter.gap(keys);
    try {
        const page = await adapter.ask({
            query,
            size: settings.perSource,
            keys,
            call: (url, headers) => desk.run(source, gap, signal, () => fetchOne(url, headers)),
            now: (options.now ?? Date.now)()
        });
        const answer: SourceAnswer = { ok: true, source, state: 'ok', cached: false, ...page };
        desk.keep(key, answer, settings.cacheMin);
        return answer;
    } catch (error) {
        if (error instanceof SourceStop) {
            return {
                ok: true,
                source,
                state: error.state,
                ...(error.status === undefined ? {} : { status: error.status }),
                ...(error.wait === undefined ? {} : { wait_s: error.wait })
            };
        }
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
        return json({ ok: true, sources: sourceList(options.keys) }, { headers: NO_STORE });
    }
    if (params.has('bibtex')) {
        const read = bibtexOf(params);
        if ('refused' in read) return refuse(read.refused);
        try {
            const found = await bibtexFor(read.value, {
                fetcher: options.fetcher,
                desk: options.desk,
                keys: options.keys,
                timeoutMs: options.settings.timeoutS * 1000,
                signal: request.signal
            });
            return json({ ok: true, ...found }, { headers: NO_STORE });
        } catch {
            // A request the page gave up on has nobody to read it; any other failure is a source
            // with no entry, and carries no message.
            return json({ ok: true, bibtex: null }, { headers: NO_STORE });
        }
    }
    const read = searchOf(params, now);
    if ('refused' in read) return refuse(read.refused);
    const answer = await askSource(read.value, options, request.signal);
    return json(answer, { headers: NO_STORE });
}
