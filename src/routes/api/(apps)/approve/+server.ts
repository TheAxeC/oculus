// The approval endpoint of the apps. A route module may export only its verbs, so everything it
// does lives in lib/server/machine/apps/routes/routes.ts and this is the lines that join them. The
// POST approves the hash the reader was shown, or revokes, behind the write token the ServerContext
// minted, and the origin guard in src/hooks.server.ts answers a request from another page first.

import { handleApprovePost, routeOptions } from '$lib/server/machine/apps/routes/routes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleApprovePost(
        request,
        locals.server.token,
        routeOptions(locals.server, () => locals.config().config)
    );
