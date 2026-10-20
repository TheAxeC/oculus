// The project commands endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/machine/runs/commands/routes.ts and this is the lines that join them. The GET
// lists a repository's commands and is same-origin only; the POST approves a chain and writes the
// command form into the repository's `.oculus/commands.yml`, and carries the token ServerContext
// minted.
//
// The repository must lie under a root the file browser serves, so the roots are the browser's own
// fold, and the writes wait on the process's write chain beside the workspace and bookmark writes.
// A new commands file is made from the template of oculus's own docs/templates.md.

import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { carriedOf, target } from '$lib/server/edit/writes';
import { repositoryRoots } from '$lib/server/files/roots';
import { handleCommandsGet, handleCommandsPost } from '$lib/server/machine/runs/commands/routes';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals) => {
    const server = locals.server;
    return {
        rootsFor: () => repositoryRoots(server.workspace.open()),
        approvalsFor: () => server.local.approvals ?? defaultApprovalsPath(),
        configFor: () => locals.config().config,
        engineFor: () => server.engine,
        writes: server.fsWrites,
        tasks: server.hosts.tools.tasks,
        changes: target(server.engine, locals.config().config, carriedOf(server), server).changes
    };
};

export const GET: RequestHandler = ({ request, locals }) =>
    handleCommandsGet(request, options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleCommandsPost(request, locals.server.token, options(locals));
