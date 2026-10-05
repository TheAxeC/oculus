// The Live HPC endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/hpc/routes.ts and this is the one POST that joins them. POST only: the page
// reads HPC state from the `hpc` channel, and this is the cancel, the refresh, the log search and
// Submit: the plan of what a job script would copy and run, and the run of the plan the reader
// confirmed.

import { textCatalog } from '$lib/data/sources/config';
import { browserRoots } from '$lib/server/files/roots';
import { keptFiles } from '$lib/server/core/git/files';
import { projects } from '$lib/server/sessions/stores/hooks';
import { log } from '$lib/server/machine/hpc/actions';
import { hpcRouteHost } from '$lib/server/machine/hpc/host';
import { handleHpc } from '$lib/server/machine/hpc/routes';
import { run } from '$lib/server/machine/hpc/ssh';
import { copy } from '$lib/server/machine/hpc/transfer';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleHpc(request, {
        where: () =>
            hpcRouteHost({
                hpcHost: locals.server.local.hpcHost,
                hub: locals.server.hub,
                config: () => locals.config().config
            }),
        token: locals.server.token,
        refresh: () => locals.server.hpc.refresh(),
        log: (host, id) => log(host, id, locals.server.hpcLogPaths),
        roots: () =>
            browserRoots({
                config: locals.config().config,
                engine: locals.server.engine,
                local: locals.server.local
            }),
        projects: () => projects(locals.server.hub),
        hub: locals.server.local.hub,
        catalog: () => textCatalog(locals.config().config),
        kept: keptFiles,
        copy,
        ssh: run,
        submits: locals.server.hpcSubmits,
        say: (line) => console.log(line)
    });
