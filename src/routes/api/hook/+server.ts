// The hook endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/hooks.ts and this is the one line that joins them. POST only: a hook never reads
// anything back beyond the { ok: true } every answer carries.

import { handleHookRequest, hookTarget } from '$lib/server/hooks';
import { engineDir, loadConfig } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) =>
    handleHookRequest(request, hookTarget(loadConfig(engineDir()).config));
