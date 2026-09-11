// The terminal endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/pty/routes.ts and this is the two lines that join them. The token it checks is the one
// hooks.server.ts minted and put on the event, as with /api/write.

import { handleTerminal, handleTerminalList } from '$lib/server/pty/routes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleTerminalList(request);

export const POST: RequestHandler = ({ request, locals }) => handleTerminal(request, locals.token);
