// The page state endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/files/workspace/page-state/routes.ts and this is the lines that join them. The GET
// reads the arrangements, the view states and the debugger's record of the state folder; the POST
// carries the token ServerContext minted and writes one of them behind the process's write chain.

import { textCatalog } from '$lib/data/sources/config';
import { handleStateGet, handleStatePost } from '$lib/server/files/workspace/page-state/routes';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals) => ({
    folder: locals.server.workspace.stateFolder,
    text: () => textCatalog(locals.config().config),
    writes: locals.server.fsWrites,
    hub: locals.server.hub
});

export const GET: RequestHandler = ({ locals }) => handleStateGet(options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleStatePost(request, locals.server.token, options(locals));
