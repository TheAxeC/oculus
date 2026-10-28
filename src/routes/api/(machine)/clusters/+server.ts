// The cluster setup endpoint of Account setup's cluster section and of Settings' clusters rows. A
// route module may export only its verbs, so everything it does lives in
// lib/server/machine/hpc/clusters/setup.ts and this joins it to the process's objects: the hub,
// the primary, the merged configuration, this machine's `clusters:` rows, the primary hub's folder,
// the one writer of a `clusters:` row and the write chain. POST only, behind the page's token.

import { writeClusterRow } from '$lib/server/edit/writes/config/config-key';
import { handleClusterSetup } from '$lib/server/machine/hpc/clusters/setup';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleClusterSetup(request, {
        token: server.token,
        writeRow: writeClusterRow,
        sources: {
            hub: server.hub,
            primary: server.workspace.open().primary,
            config: () => locals.config().config,
            accounts: () => server.local.clusters
        },
        hubDir: () => server.workspace.open().primaryDir,
        writes: server.accounts.writes
    });
};
