// The add endpoint of the apps: copy a folder into the machine's apps folder as a new app.
// A route module may export only its verbs, so everything the request does lives in
// lib/server/machine/apps/routes/manage.ts and this is the line that joins them.

import { handleAddPost } from '$lib/server/machine/apps/routes/manage';
import { routeOptions } from '$lib/server/machine/apps/routes/routes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleAddPost(
        request,
        locals.server.token,
        routeOptions(locals.server, () => locals.config().config)
    );
