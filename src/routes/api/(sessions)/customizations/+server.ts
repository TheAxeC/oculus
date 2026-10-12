// The customizations endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/sessions/stores/customizations.ts and this is the line that joins them. The
// accounts and the roots a walk upward stops at come off the request's ServerContext.

import { handleCustomizations } from '$lib/server/sessions/stores/customizations';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    const roots = server.workspace.open().roots.map((one) => one.dir);
    return handleCustomizations(request, server.machine().accounts, roots);
};
