// The open-check endpoint of the apps. A route module may export only its verbs, so everything it
// does lives in lib/server/machine/apps/routes.ts and this is the lines that join them. The GET
// answers whether an app may have a file of a root opened in oculus; it writes nothing, and only
// the page calls it.

import { handleOpenGet, routeOptions } from '$lib/server/machine/apps/routes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleOpenGet(
        request,
        routeOptions(locals.server, () => locals.config().config)
    );
