// Layer 2, route. This indirection keeps the route export declarative while the target stays injectable in tests.
import type { RequestHandler } from './$types';
import { handleHpc } from '$lib/server/hpc/routes';
import { log } from '$lib/server/hpc/actions';
import { slurmSettings } from '$lib/data/sources/config';
export const POST: RequestHandler = ({ request, locals }) => {
    return handleHpc(request, {
        host: locals.server.local.hpcHost ?? slurmSettings(locals.server.config).host,
        token: locals.server.token,
        refresh: () => locals.server.hpc.refresh(),
        log: (host, id) => log(host, id, locals.server.hpcLogPaths)
    });
};
