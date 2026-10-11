// The icon theme endpoint of the apps. A route module may export only its verbs, so everything it
// does lives in lib/server/machine/apps/routes/icons.ts and this is the lines that join them. The
// GET answers a file icon theme of an approved, enabled app with the addresses of its files.

import { routeOptions } from '$lib/server/machine/apps/routes/routes';
import { handleIconsGet } from '$lib/server/machine/apps/routes/icons';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleIconsGet(
        request,
        routeOptions(locals.server, () => locals.config().config)
    );
