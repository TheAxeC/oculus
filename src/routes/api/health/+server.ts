// Layer 2, server route. Whether an oculus answers on a port. The desktop host asks it on a port
// that refused the server it started, to tell a port held by an oculus from a port held by another
// program. A route module may export only its verbs, so the body is a constant of
// lib/server/root/process/parent.ts, which the host imports too, and this is the line that joins
// it to the verb. The path admits a request with neither `Origin` nor `Sec-Fetch-Site`, since the
// host asks it with Node's fetch (HEADERLESS in src/hooks.server.ts).

import { json } from '@sveltejs/kit';
import { HEALTH_BODY } from '$lib/server/root/process/parent';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
    json(HEALTH_BODY, { headers: { 'cache-control': 'no-store' } });
