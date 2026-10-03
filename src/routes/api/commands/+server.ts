// The project commands endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/machine/commands/routes.ts and this is the lines that join them. The GET
// lists a repository's commands and is same-origin only; the POST approves, saves and removes and
// carries the token ServerContext minted.
//
// The repository must lie under a root the file browser serves, so the roots are the browser's own
// fold, and the saves wait on the process's write chain beside the workspace and bookmark writes.

import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { target } from '$lib/server/edit/writes';
import { repositoryRoots } from '$lib/server/files/roots';
import { handleCommandsGet, handleCommandsPost } from '$lib/server/machine/commands/routes';
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
        changes: target(server.engine, locals.config().config, server).changes
    };
};

export const GET: RequestHandler = ({ request, locals }) =>
    handleCommandsGet(request, options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleCommandsPost(request, locals.server.token, options(locals));
