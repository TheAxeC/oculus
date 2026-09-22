// The hook endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/core/hooks.ts and this is the one line that joins them. POST only: a hook never reads
// anything back beyond the { ok: true } every answer carries.

import { handleHookRequest } from '$lib/server/core/hooks';
import { loadConfig, textCatalog } from '$lib/data/sources/config';
import { notifyConfig } from '$lib/server/core/hooks';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const config = loadConfig(locals.server.engine).config;
    return handleHookRequest(request, {
        ...locals.server.hooks,
        config: notifyConfig(config),
        stopMessage: textCatalog(config)['notify.stop']
    });
};
