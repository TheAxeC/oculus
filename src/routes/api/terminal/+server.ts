// The terminal endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/pty/routes.ts and this is the two lines that join them. The token it checks is the one
// ServerContext minted and hooks.server.ts put on the event, as with /api/write.

import { handleTerminal, handleTerminalList } from '$lib/server/pty/routes';
import { datasetIds, project, sessionRecord } from '$lib/server/sessions/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleTerminalList(request);

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleTerminal(request, server.token, {
        engine: server.engine,
        recordFor: (id) => sessionRecord(server.hub, id),
        datasetIdsFor: () => datasetIds(server.hub),
        hubFor: () => server.local.hub,
        projectFor: (id) => project(server.hub, id),
        localFor: () => server.local,
        refresh: () => server.terminals.refresh()
    });
};
