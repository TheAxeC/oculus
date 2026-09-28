// The deposit endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/git/deposit-routes.ts and this is the two lines that join them. The GET answers one
// mirror's state and is same-origin only; the POST writes and carries the token ServerContext
// minted, as with /api/write, /api/git and /api/terminal.

import { handleDeposit, handleDepositState } from '$lib/server/git/deposit-routes';
import { knownIds } from '$lib/server/git/deposit-routes';
import { projectIds } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals) => {
    const server = locals.server;
    const config = locals.config().config;
    return {
        idsFor: () => knownIds(projectIds(server.hub), server.engine, config),
        deposit: { plans: server.depositPlans, engine: server.engine, config }
    };
};

export const GET: RequestHandler = ({ request, locals }) =>
    handleDepositState(request, options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleDeposit(request, locals.server.token, options(locals));
