// Layer 2, route. The Usage view's refresh endpoint delegates its POST to the injectable server handler.
import type { RequestHandler } from './$types';
import { handleUsageRefresh, usageRefreshTarget } from '$lib/server/usage/routes';

export const POST: RequestHandler = ({ request }) =>
    handleUsageRefresh(request, usageRefreshTarget());
