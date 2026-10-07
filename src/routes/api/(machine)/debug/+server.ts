// The debug endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/debug/routes.ts and this is the lines that join them. The GET lists a
// repository's debug configurations, or reads the console of the current session whole, and is
// same-origin only; the POST carries the token ServerContext minted and starts, steps and stops
// the one session the server context holds.
//
// The repository and the program must lie under a root the file browser serves, so the roots are
// the browser's own fold, and an approval is written behind the process's write chain.

import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { repositoryRoots } from '$lib/server/files/roots';
import { handleDebugGet, handleDebugPost } from '$lib/server/machine/debug/routes';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals) => {
    const server = locals.server;
    return {
        rootsFor: () =>
            repositoryRoots({
                config: locals.config().config,
                engine: server.engine,
                local: server.local
            }),
        approvalsFor: () => server.local.approvals ?? defaultApprovalsPath(),
        configFor: () => locals.config().config,
        writes: server.fsWrites,
        client: server.debug
    };
};

export const GET: RequestHandler = ({ request, locals }) =>
    handleDebugGet(request, options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleDebugPost(request, locals.server.token, options(locals));
