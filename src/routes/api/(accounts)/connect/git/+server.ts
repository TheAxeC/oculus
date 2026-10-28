// The git section of Account setup. A route module may export only its verbs, so everything it
// does lives in lib/server/accounts/connect/git/routes.ts and this joins it to the process's
// objects: the hub's `sign_in` rows as the merged configuration holds them now, the providers'
// folder, the engine folder the credential helper ships in, the running Sign ins and the write
// chain. POST only, behind the page's token: `status`, `client_id`, `sign_in`, `cancel` and
// `sign_out`.

import { gitSectionOf, handleGitSignIn } from '$lib/server/accounts/connect/git/routes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleGitSignIn(request, {
        token: server.token,
        section: () => gitSectionOf(locals.config().config, server.providerDir, server.engine),
        signIns: server.gitSignIns,
        writes: server.accounts.writes
    });
};
