// The git endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/git-routes.ts and this is the two lines that join them. The GET lists branches and is
// same-origin only; the POST writes and carries the token hooks.server.ts minted, as with
// /api/write and /api/terminal.

import { handleGit, handleGitBranches } from '$lib/server/git-routes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleGitBranches(request);

export const POST: RequestHandler = ({ request, locals }) => handleGit(request, locals.token);
