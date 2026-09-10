// The write endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/writes.ts and this is the one line that joins them. POST only: there is nothing to read
// here, and the token it checks is the one hooks.server.ts minted and put on the event.

import { handleWrite, target } from '$lib/server/writes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleWrite(request, locals.token, target());
