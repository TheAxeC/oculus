// The agents endpoint: the composer's choices out of the merged config's `agents` value, the one
// read `locals.config` keeps for the request. A route module may export only its verbs, so
// everything it does lives in lib/server/machine/pty/start/compose.ts and this is the line that
// joins them.

import { handleAgents } from '$lib/server/machine/pty/start/compose';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleAgents(request, locals.server.engine, locals.server.local, locals.config().config);
