// The host endpoint of the apps: a frame's request to its host, and the page's Stop, Restart and
// read of a host's output.
// A route module may export only its verbs, so everything the request does lives in
// lib/server/machine/apps/routes/host.ts and this is the line that joins them.

import { handleHostPost } from '$lib/server/machine/apps/routes/host';
import { routeOptions } from '$lib/server/machine/apps/routes/routes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleHostPost(
        request,
        locals.server.token,
        routeOptions(locals.server, () => locals.config().config)
    );
