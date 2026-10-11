// Layer 2, server route. The search endpoint only joins Kit's request, its roots, the token and the
// configured caps to the server module, because route modules may export only HTTP verbs.
//
// The roots are the file browser's own list, folded by lib/server/files/roots.ts and by nothing
// else, so a folder the reader added in the file browser is listed there, opened in a source tab,
// and searched here from one rule. The configuration is the one read `locals.config()` keeps for
// the request, taken from the ServerContext's cache of the parse; the engine and the machine's own
// file come off the request's ServerContext; the roots are folded once, so one request reads the
// workspaces file once.

import { handleSearch } from '$lib/server/files/search/search-routes';
import { browserRoots } from '$lib/server/files/roots';
import { searchSettings } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const config = locals.config().config;
    const settings = searchSettings(config);
    return handleSearch(request, locals.token, {
        roots: browserRoots({ config, engine: locals.server.engine, local: locals.server.local }),
        cap: settings.maxHits,
        maxNames: settings.maxNames,
        hub: locals.server.local.hub,
        timeout: settings.timeoutS * 1000
    });
};
