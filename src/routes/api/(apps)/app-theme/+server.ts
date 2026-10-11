// The theme endpoint of the apps. A route module may export only its verbs, so everything it does
// lives in lib/server/machine/apps/routes/theme.ts and this is the lines that join them. The GET
// answers a colour theme of an approved, enabled app with its include chain resolved.

import { routeOptions } from '$lib/server/machine/apps/routes/routes';
import { handleThemeGet } from '$lib/server/machine/apps/routes/theme';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleThemeGet(
        request,
        routeOptions(locals.server, () => locals.config().config)
    );
