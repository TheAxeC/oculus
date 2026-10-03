// The terminal endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/pty/routes.ts and this is the two lines that join them. The token it checks is
// the one ServerContext minted and hooks.server.ts put on the event, as with /api/write.

import { browserRoots } from '$lib/server/files/roots';
import { handleTerminal, handleTerminalList } from '$lib/server/machine/pty/routes';
import { datasetIds, project, sessionRecord } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleTerminalList(request);

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleTerminal(request, server.token, {
        engine: server.engine,
        recordFor: (id) => sessionRecord(server.hub, id),
        datasetIdsFor: () => datasetIds(server.hub),
        hubFor: () => server.local.hub,
        rootsFor: () =>
            browserRoots({
                config: locals.config().config,
                engine: server.engine,
                local: server.local
            }),
        projectFor: (id) => project(server.hub, id),
        // The request's own read of the disk: `tasks.skip_permissions` decides both the argv here
        // and the confirmation the tray draws, and the tray reads the config channel, which
        // republishes on every save, so the two agree without a restart.
        configFor: () => locals.config().config,
        localFor: () => server.local,
        refresh: () => server.terminals.refresh()
    });
};
