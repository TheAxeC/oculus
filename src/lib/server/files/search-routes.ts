// Layer 2, server. The /api/search endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(files)/search/+server.ts is the few lines
// that join them, the pattern lib/server/git/git-routes.ts already holds.
//
// A search is a request with an answer rather than a state the server keeps, so it is a GET. It is
// same-origin only, as every read here is, and it carries the write token as well: a search reads
// every file of every served root, which is more than any other read of this server gives away, and
// DESIGN.md's "Auth" puts that behind the token minted at start and delivered to the page once.
//
// Nothing is searched outside a served root. The roots are the list the route composed, the same
// one the file route and the source route compose, and a `root` that is not one of their keys is
// refused before any process starts.

import { json } from '@sveltejs/kit';
import { hasToken } from '../core/auth.ts';
import { queryFrom } from '../../data/helpers/search.ts';
import { runSearch, type SearchOptions } from './search.ts';
import type { Root } from './files.ts';
import type { SearchRefusal } from '../../data/helpers/search.ts';

export type SearchRouteOptions = SearchOptions & {
    /** Every root this request may search. */
    roots: Root[];
    /** How many hits one answer carries, from config/behavior.yml. */
    cap: number;
};

/** The sentence each refusal is answered with. */
const REFUSALS: Record<SearchRefusal, string> = {
    empty: 'the search carries no pattern',
    too_long: 'the pattern is longer than a search takes',
    unknown_root: 'that root is not one oculus serves',
    outside: 'the folder is not inside the root',
    missing: 'the folder is not there'
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/**
 * GET /api/search: one query over one served root or over all of them. The order is the order of
 * the refusals: the token, the query's own bounds, and only then ripgrep.
 */
export async function handleSearch(
    request: Request,
    token: string,
    options: SearchRouteOptions
): Promise<Response> {
    if (!hasToken(request, token)) {
        return json(
            { error: 'the write token is missing or stale' },
            { status: 403, headers: NO_STORE }
        );
    }
    const query = queryFrom(new URL(request.url).searchParams, options.cap);
    const outcome = await runSearch(options.roots, query, options);
    if (!outcome.ok) {
        return json(
            'refused' in outcome
                ? { error: REFUSALS[outcome.refused], refused: outcome.refused }
                : { error: outcome.error },
            { status: 400, headers: NO_STORE }
        );
    }
    return json({ ok: true, ...outcome.answer }, { headers: NO_STORE });
}
