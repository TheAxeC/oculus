// The Live HPC endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/hpc/routes.ts and this is the one POST that joins them. POST only: the page
// reads HPC state from the `hpc` channel, and this is the cancel, the refresh and the log search.

import { handleHpc } from '$lib/server/machine/hpc/routes';
import { log } from '$lib/server/machine/hpc/actions';
import { slurmSettings } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleHpc(request, {
        host: locals.server.local.hpcHost ?? slurmSettings(locals.config().config).host,
        token: locals.server.token,
        refresh: () => locals.server.hpc.refresh(),
        log: (host, id) => log(host, id, locals.server.hpcLogPaths)
    });
