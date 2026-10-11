// The store endpoint of the apps. A route module may export only its verbs, so everything it does
// lives in lib/server/machine/apps/routes/routes.ts and this is the lines that join them. The GET
// is the page's own read of one app's store; the frame cannot call it, since its opaque origin
// fails the origin guard in src/hooks.server.ts.

import { handleStoreGet, routeOptions } from '$lib/server/machine/apps/routes/routes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleStoreGet(
        request,
        routeOptions(locals.server, () => locals.config().config)
    );
