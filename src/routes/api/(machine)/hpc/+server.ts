// The Live HPC endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/hpc/routes.ts and this is the one POST that joins them. POST only: the page
// reads HPC state from the `hpc` channel, and this is the cancel, the refresh, the log search and
// Submit: the plan of what a job script would copy and run on the cluster the reader picked, and
// the run of the plan the reader confirmed. Each acts on the connection of the cluster of
// `slurm.resource` it names (clusters/connections.ts).

import { textCatalog } from '$lib/data/sources/config';
import { keptFiles } from '$lib/server/core/git/files';
import { projects } from '$lib/server/sessions/stores/hooks';
import { log, logPathsOf } from '$lib/server/machine/hpc/actions';
import { clusterChoices, connectionFor } from '$lib/server/machine/hpc/clusters/connections';
import { handleHpc } from '$lib/server/machine/hpc/routes';
import { run } from '$lib/server/machine/hpc/ssh';
import { copy } from '$lib/server/machine/hpc/transfer';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    const sources = {
        hub: server.hub,
        primary: server.workspace.open().primary,
        config: () => locals.config().config,
        accounts: () => server.local.clusters
    };
    return handleHpc(request, {
        connection: (resource) => connectionFor(sources, resource),
        clusters: () => clusterChoices(sources),
        token: server.token,
        refresh: async (resource) => {
            await server.hpc.watcher(resource)?.refresh();
        },
        refreshAll: () => server.hpc.refresh(),
        log: (connection, id) =>
            log(connection, id, logPathsOf(server.hpcLogPaths, connection.resource)),
        roots: () => server.workspace.open().roots,
        projects: () => projects(server.hub),
        catalog: () => textCatalog(locals.config().config),
        kept: (code, text) => keptFiles(server.credentials, code, text),
        copy,
        ssh: run,
        submits: server.hpcSubmits,
        say: (line) => console.log(line)
    });
};
