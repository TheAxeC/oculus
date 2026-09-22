// Layer 2, route. The Usage view's refresh endpoint delegates its POST to the injectable server
// handler.
import type { RequestHandler } from './$types';
import { handleUsageRefresh } from '$lib/server/machine/usage/routes';

export const POST: RequestHandler = ({ request, locals }) =>
    handleUsageRefresh(request, {
        token: locals.server.token,
        refresh: (label) => locals.server.usageRefresh.refresh(label)
    });
