// Layer 2, server route. The lint endpoint only joins Kit's request, its roots, the settings and
// the token to lib/server/machine/runs/lint/routes.ts because route modules may export only HTTP
// verbs.
//
// The roots are the file browser's own list, so a file that opens for editing is a file that is
// linted. The settings are the ones the request's configuration read holds, so a key changed in
// behavior.yml applies to the next lint. The runs in flight and the held ESLint children come off
// the ServerContext, which ends them with the server.

import { lintSettings } from '$lib/data/sources/config';
import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { browserRoots } from '$lib/server/files/roots';
import { handleLint } from '$lib/server/machine/runs/lint/routes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleLint(
        request,
        locals.token,
        browserRoots({
            config: locals.config().config,
            engine: server.engine,
            local: server.local
        }),
        {
            settings: () => lintSettings(locals.config().config),
            approvals: () => server.local.approvals ?? defaultApprovalsPath(),
            writes: server.fsWrites,
            runs: server.lintRuns,
            eslint: server.eslint
        }
    );
};
