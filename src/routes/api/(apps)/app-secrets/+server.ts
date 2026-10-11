// The secrets endpoint of the apps: a frame's get, store and delete of one secret of its app.
// A route module may export only its verbs, so everything the request does lives in
// lib/server/machine/apps/routes/host.ts and this is the line that joins them.

import { handleSecretsPost } from '$lib/server/machine/apps/routes/host';
import { routeOptions } from '$lib/server/machine/apps/routes/routes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleSecretsPost(
        request,
        locals.server.token,
        routeOptions(locals.server, () => locals.config().config)
    );
