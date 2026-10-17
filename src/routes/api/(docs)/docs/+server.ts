// The document endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/docs.ts and this is the one line that joins them. The hubs it reads are the
// hubs of the open workspace with the settings the server keeps parsed for each, the primary's
// settings are the ones every write lands under, and the project it reads comes from the portfolio
// this request's server holds, so one document costs one file read.

import { portfolioConfigFrom } from '$lib/data/index';
import { handleDocs } from '$lib/server/content/docs';
import { hubTargets } from '$lib/server/files/roots';
import { project } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    const open = server.workspace.open();
    return handleDocs(request, {
        primary:
            open.primary === null || open.primaryDir === null
                ? null
                : { key: open.primary, dir: open.primaryDir },
        engine: server.engine,
        config: portfolioConfigFrom(locals.config().config),
        hubs: hubTargets(open, server.configCache.hub),
        project: (id) => project(server.hub, id)
    });
};
