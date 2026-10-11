// The document endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/docs.ts and this is the one line that joins them. The hub it reads is the one
// every write lands in, which is why the target comes from lib/server/edit/writes.ts rather than a
// second reader of local.yml; the project it reads comes from the portfolio this request's
// server holds, so one document costs one file read.

import { handleDocs } from '$lib/server/content/docs';
import { project } from '$lib/server/sessions/stores/hooks';
import { target } from '$lib/server/edit/writes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const into = target(locals.server.engine, locals.config().config);
    return handleDocs(request, {
        hub: into.hub,
        engine: locals.server.engine,
        config: into.config,
        hubs: into.hubs,
        project: (id) => project(locals.server.hub, id)
    });
};
