// The account setup endpoint. A route module may export only its verbs, so everything it does lives
// in lib/server/accounts/connect/setup.ts and this joins it to the process's objects. GET is what
// the Account setup view draws: which providers this machine holds the client half of, and the
// redirect addresses and scopes the connect flow uses on the port this server listens on. POST is
// the Save of one provider's client half, behind the token and the write chain.
//
// Neither answer carries a client id, a secret or a tenant.

import {
    handleSetupRead,
    handleSetupWrite,
    type SetupTarget
} from '$lib/server/accounts/connect/setup';
import type { RequestHandler } from './$types';
import type { ServerContext } from '$lib/server/root/context';

/** What both verbs are handed of the process: its folder, its port, its chain and its pollers. */
function target(server: ServerContext): SetupTarget {
    return {
        token: server.token,
        providerDir: server.providerDir,
        port: server.local.port,
        writes: server.accounts.writes,
        refresh: async () => {
            await Promise.all([server.calendar.refresh(), server.mail.refresh()]);
        }
    };
}

export const GET: RequestHandler = ({ request, locals }) =>
    handleSetupRead(request, target(locals.server));

export const POST: RequestHandler = ({ request, locals }) =>
    handleSetupWrite(request, target(locals.server));
