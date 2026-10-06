// Layer 2, server route. The deck endpoint only joins Kit's request, the file browser's roots, the
// hub and the portfolio's projects to the server module, because route modules may export only HTTP
// verbs. The roots are the list lib/server/files/roots.ts folds and nothing else, so a folder the
// reader added in the file browser is a root a deck can be opened from. The projects are the ones
// this request's server last published, and the configuration is `locals.config()`, read from disk
// at this request.

import { portfolioConfigFrom } from '$lib/data/index';
import { handleDeck } from '$lib/server/content/deck/endpoint';
import { browserRoots } from '$lib/server/files/roots';
import { projects } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const config = locals.config().config;
    return handleDeck(request, locals.token, {
        roots: browserRoots({ config, engine: locals.server.engine, local: locals.server.local }),
        hub: locals.server.local.hub,
        config: portfolioConfigFrom(config),
        projects: projects(locals.server.hub)
    });
};
