// The hook endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/root/hooks.ts and this is the one line that joins them. POST only: a hook never reads
// anything back beyond the { ok: true } every answer carries.

import { handleHookRequest } from '$lib/server/root/hooks';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleHookRequest(request, locals.server.hooks);
