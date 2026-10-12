// The terminal endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/pty/routes.ts and this is the two lines that join them. The token it checks is
// the one ServerContext minted and hooks.server.ts put on the event, as with /api/write.

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
        openFor: () => server.workspace.open(),
        projectFor: (id) => project(server.hub, id),
        ownerFor: () => ownerName(server.hub),
        // The one read `locals.config` keeps for the request, for the actions that read the config
        // at the request: the chat launcher, the LaTeX words, the hub task seeds and the glyph
        // catalog.
        configFor: () => locals.config().config,
        localFor: () => server.machine(),
        // A project command runs in a repository under the folders of the open workspace, after the
        // approval kept in the file `approvals` of local.yml names.
        approvalsFor: () => server.local.approvals ?? defaultApprovalsPath(),
        refresh: () => server.terminals.refresh(),
        turns: server.terminals.turns
    });
};
