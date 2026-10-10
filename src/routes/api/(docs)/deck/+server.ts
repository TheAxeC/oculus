// Layer 2, server route. The deck endpoint only joins Kit's request, the file browser's roots, the
// hub and the portfolio's projects to the server module, because route modules may export only HTTP
// verbs. The roots are the list lib/server/files/roots.ts folds and nothing else, so a folder the
// reader added in the file browser is a root a deck can be opened from. The projects are the ones
// this request's server last published, and the configuration is the one read `locals.config()`
// keeps for the request, taken from the ServerContext's cache of the parse. The POST reads the same
// deck over the drafts of the body.

import { portfolioConfigFrom } from '$lib/data/index';
import { handleDeck, handleDeckDrafts } from '$lib/server/content/deck/endpoint';
import type { DeckSource } from '$lib/server/content/deck/read';
import { browserRoots, hubTargets } from '$lib/server/files/roots';
import { projects } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

/** What a deck is read over at this request. */
function sourceOf(locals: App.Locals): DeckSource {
    const config = locals.config().config;
    const target = { config, engine: locals.server.engine, local: locals.server.local };
    return {
        roots: browserRoots(target),
        hub: locals.server.local.hub,
        config: portfolioConfigFrom(config),
        projects: projects(locals.server.hub),
        hubs: hubTargets(target)
    };
}

export const GET: RequestHandler = ({ request, locals }) =>
    handleDeck(request, locals.token, sourceOf(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleDeckDrafts(request, locals.token, sourceOf(locals));
