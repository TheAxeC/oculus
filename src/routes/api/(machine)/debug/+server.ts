// The debug endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/debug/routes.ts and this is the lines that join them. The GET lists a
// repository's debug configurations, or reads the console of the current session whole, and is
// same-origin only; the POST carries the token ServerContext minted and starts, steps and stops
// the one session the server context holds.
//
// The repository and the program must lie under a root the file browser serves, so the roots are
// the browser's own fold, and an approval is written behind the process's write chain.

import { carriedOf, target } from '$lib/server/edit/writes';
import { defaultHistoryDir } from '$lib/server/files/fs/history';
import type { OpsTarget } from '$lib/server/files/fs/ops';
import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { repositoryRoots } from '$lib/server/files/roots';
import { handleDebugGet, handleDebugPost } from '$lib/server/machine/debug/routes';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals) => {
    const server = locals.server;
    return {
        rootsFor: () => repositoryRoots(server.workspace.open()),
        approvalsFor: () => server.local.approvals ?? defaultApprovalsPath(),
        configFor: () => locals.config().config,
        writes: server.fsWrites,
        files: (): OpsTarget => ({
            roots: server.workspace.open().roots,
            writes: server.opsWrites,
            changes: target(server.engine, locals.config().config, carriedOf(server), server)
                .changes,
            history: server.local.history ?? defaultHistoryDir()
        }),
        client: server.debug
    };
};

export const GET: RequestHandler = ({ request, locals }) =>
    handleDebugGet(request, options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleDebugPost(request, locals.server.token, options(locals));
