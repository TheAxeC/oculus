// Layer 2, server route. The search endpoint only joins Kit's request, its roots, the token and the
// configured caps to the server module, because route modules may export only HTTP verbs.
//
// The roots are the file browser's own list, folded by lib/server/files/roots.ts and by nothing
// else, so a folder the reader added in the file browser is listed there, opened in a source tab,
// and searched here from one rule. The configuration and the hub come off the request's
// ServerContext, so one request reads the workspaces file once and no config file.

import { handleSearch } from '$lib/server/files/search-routes';
import { browserRoots } from '$lib/server/files/roots';
import { searchSettings } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const settings = searchSettings(locals.server.config);
    return handleSearch(request, locals.token, {
        roots: browserRoots(locals.server),
        cap: settings.maxHits,
        timeout: settings.timeoutS * 1000
    });
};
