// Layer 2, server route. The literature endpoint only joins Kit's request, the process token, the
// keys of local.yml and the settings to the server module, because route modules may export only
// HTTP verbs.
//
// The keys are `locals.server.local.literature`, which the machine's file watcher keeps current, so
// a key set while the server runs is used by the next search. The pacing and the cache are the
// server context's own `literature` desk, and the settings are read from disk at this request.

import { handleLiterature } from '$lib/server/content/literature/handler';
import { literatureSettings } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleLiterature(request, {
        token: locals.token,
        keys: locals.server.local.literature ?? {},
        settings: literatureSettings(locals.config().config),
        desk: locals.server.literature,
        fetcher: fetch
    });
