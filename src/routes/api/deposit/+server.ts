// The deposit endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/deposit-routes.ts and this is the two lines that join them. The GET answers one
// mirror's state and is same-origin only; the POST writes and carries the token hooks.server.ts
// minted, as with /api/write, /api/git and /api/terminal.

import { handleDeposit, handleDepositState } from '$lib/server/deposit-routes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleDepositState(request);

export const POST: RequestHandler = ({ request, locals }) => handleDeposit(request, locals.token);
