// The deposit endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/deposit-routes.ts and this is the two lines that join them. The GET answers one
// mirror's state and is same-origin only; the POST writes and carries the token ServerContext
// minted, as with /api/write, /api/git and /api/terminal.

import { handleDeposit, handleDepositState } from '$lib/server/deposit-routes';
import { knownIds } from '$lib/server/deposit-routes';
import { projectIds } from '$lib/server/sessions/hooks';
import type { RequestHandler } from './$types';

const options = (server: App.Locals['server']) => ({
    idsFor: () => knownIds(projectIds(server.hub)),
    deposit: { plans: server.depositPlans }
});

export const GET: RequestHandler = ({ request, locals }) =>
    handleDepositState(request, options(locals.server));

export const POST: RequestHandler = ({ request, locals }) =>
    handleDeposit(request, locals.server.token, options(locals.server));
