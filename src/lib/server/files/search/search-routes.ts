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
//
// The same route lists names: `?list=names` answers the paths of the files of one served root or of
// all of them (server/files/search/search.ts `runNames`), behind the same origin check and token,
// since a list of every file name of every root is as much as a search gives away. A `list` that is
// empty, repeated or any other value is refused as the word `list`, and a root that is not served
// as `unknown_root`, both before any process starts. The folders no name is listed from are the
// machine's private ones (`privateFolders`: the `secrets` folder of every hub and `~/.oculus`),
// which the language server relay and the writing rules leave out too.
//
// A refusal is answered as a word (data/helpers/search/query.ts SearchRefusal) and the page says it
// in the catalog's sentence for that word. A pattern ripgrep could not read is the word `pattern`
// with ripgrep's own one-line reason beside it, which the sentence carries.

import { homedir } from 'node:os';
import { json } from '@sveltejs/kit';
import { hasToken } from '../../core/auth.ts';
import { hubDirs, privateFolders } from '../../../data/helpers/files/private-folders.ts';
import { requestFrom } from '../../../data/helpers/search/query.ts';
import { runNames, runSearch, type SearchOptions } from './search.ts';
import type { Root } from '../files.ts';

export type SearchRouteOptions = SearchOptions & {
    /** Every root this request may search. */
    roots: Root[];
    /** How many hits one answer carries, from config/behavior.yml. */
    cap: number;
    /** How many names one list carries, from config/behavior.yml. */
    maxNames: number;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/**
 * GET /api/search: one query over one served root or over all of them, or with `list=names` the
 * names of the files of one root or all of them. The order is the order of the refusals: the
 * token, the request's own bounds, and only then ripgrep.
 */
export async function handleSearch(
    request: Request,
    token: string,
    options: SearchRouteOptions
): Promise<Response> {
    if (!hasToken(request, token)) {
        return json({ error: 'token' }, { status: 403, headers: NO_STORE });
    }
    const asked = requestFrom(new URL(request.url).searchParams, options.cap);
    if (asked.kind === 'refused') {
        return json({ error: asked.refused }, { status: 400, headers: NO_STORE });
    }
    if (asked.kind === 'names') {
        const listed = await runNames(options.roots, asked.root, {
            ...(options.run === undefined ? {} : { run: options.run }),
            timeout: options.timeout,
            max: options.maxNames,
            withheld: privateFolders(hubDirs(options.roots), homedir())
        });
        if (!listed.ok) {
            return json({ error: listed.refused }, { status: 400, headers: NO_STORE });
        }
        return json({ ok: true, ...listed.answer }, { headers: NO_STORE });
    }
    const query = asked.query;
    const outcome = await runSearch(options.roots, query, options);
    if (!outcome.ok) {
        const body =
            'refused' in outcome
                ? { error: outcome.refused }
                : outcome.timedOut
                  ? { error: 'timed_out' }
                  : { error: 'pattern', reason: outcome.error };
        return json(body, { status: 400, headers: NO_STORE });
    }
    return json({ ok: true, ...outcome.answer }, { headers: NO_STORE });
}
