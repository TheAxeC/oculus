// Layer 2, server route. The deck endpoint only joins Kit's request, the open workspace's folders,
// its primary hub and the portfolio's projects to the server module, because route modules may
// export only HTTP verbs. The roots are the workspace's folders and nothing else, so a folder the
// reader added in the file browser is a root a deck can be opened from. The projects are the ones
// this request's server last published, and the configuration is the one read `locals.config()`
// keeps for the request, taken from the ServerContext's cache of the parse. The POST reads the same
// deck over the drafts of the body.

import { portfolioConfigFrom } from '$lib/data/index';
import { handleDeck, handleDeckDrafts } from '$lib/server/content/deck/endpoint';
import type { DeckSource } from '$lib/server/content/deck/read';
import { hubTargets } from '$lib/server/files/roots';
import { projects } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

/** What a deck is read over at this request. */
function sourceOf(locals: App.Locals): DeckSource {
    const { config, from } = locals.config();
    const open = locals.server.workspace.open();
    return {
        roots: open.roots,
        primary:
            open.primary === null || open.primaryDir === null
                ? null
                : { key: open.primary, dir: open.primaryDir },
        config: portfolioConfigFrom(config, from),
        projects: projects(locals.server.hub),
        hubs: hubTargets(locals.server.engine, open)
    };
}

export const GET: RequestHandler = ({ request, locals }) =>
    handleDeck(request, locals.token, sourceOf(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleDeckDrafts(request, locals.token, sourceOf(locals));
