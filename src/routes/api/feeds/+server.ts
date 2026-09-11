// Layer 4, route. The feed endpoint exports its verb and delegates all work to the server module.

import { feedsTarget, handleFeeds } from '$lib/server/feeds';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleFeeds(request, feedsTarget());
