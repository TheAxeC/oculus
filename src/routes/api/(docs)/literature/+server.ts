// Layer 2, server route. The literature endpoint only joins Kit's request, the process token, the
// rows of the primary hub, the machine's `downloads` rows and contact address, and the settings to
// the server module, because route modules may export only HTTP verbs.
//
// The rows `literature.sources` and `links` come from the one read `locals.config()` keeps for the
// request, which reads them from the primary hub alone. The `downloads` rows and
// `literature.mailto` are `locals.server.local`, which the machine's file watcher keeps current, so
// a secret set while the server runs is used by the next search. The pacing and the cache are the
// server context's own `literature` desk.

import { handleLiterature } from '$lib/server/content/literature/handler';
import { READER_AGENT } from '$lib/server/core/reader/agent';
import { linkRows, literatureRows, literatureSettings } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const { config } = locals.config();
    const local = locals.server.local;
    const mailto = local.literature?.mailto;
    return handleLiterature(request, {
        token: locals.token,
        rows: literatureRows(config),
        links: linkRows(config),
        downloads: local.downloads,
        ...(mailto === undefined ? {} : { mailto }),
        settings: literatureSettings(config),
        desk: locals.server.literature,
        fetcher: fetch,
        agent: READER_AGENT
    });
};
