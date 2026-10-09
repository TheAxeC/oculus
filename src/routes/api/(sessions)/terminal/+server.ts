// The terminal endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/pty/routes.ts and this is the two lines that join them. The token it checks is
// the one ServerContext minted and hooks.server.ts put on the event, as with /api/write.

import { browserRoots, repositoryRoots } from '$lib/server/files/roots';
import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { handleTerminal, handleTerminalList } from '$lib/server/machine/pty/routes';
import { datasetIds, ownerName, project, sessionRecord } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleTerminalList(request);

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleTerminal(request, server.token, {
        engine: server.engine,
        recordFor: (id) => sessionRecord(server.hub, id),
        datasetIdsFor: () => datasetIds(server.hub),
        hubFor: () => server.local.hub,
        servedRootsFor: () =>
            browserRoots({
                config: locals.config().config,
                engine: server.engine,
                local: server.local
            }),
        projectFor: (id) => project(server.hub, id),
        ownerFor: () => ownerName(server.hub),
        // The one read `locals.config` keeps for the request, for the actions that read the config
        // at the request: the chat launcher, the LaTeX words, the hub task seeds and the glyph
        // catalog.
        configFor: () => locals.config().config,
        localFor: () => server.local,
        // A project command runs in a repository under the roots the file browser serves, after the
        // approval kept in the file `approvals` of local.yml names.
        rootsFor: () =>
            repositoryRoots({
                config: locals.config().config,
                engine: server.engine,
                local: server.local
            }),
        approvalsFor: () => server.local.approvals ?? defaultApprovalsPath(),
        refresh: () => server.terminals.refresh(),
        turns: server.terminals.turns
    });
};
