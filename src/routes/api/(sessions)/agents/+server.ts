// The agents endpoint: the composer's choices out of config/catalogs/agents.yml. A route module may
// export only its verbs, so everything it does lives in lib/server/machine/pty/compose.ts and this
// is the line that joins them.

import { handleAgents } from '$lib/server/machine/pty/compose';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleAgents(request, locals.server.engine, locals.server.local);
