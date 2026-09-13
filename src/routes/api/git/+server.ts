// The git endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/git-routes.ts and this is the two lines that join them. The GET lists branches and is
// same-origin only; the POST writes and carries the token ServerContext minted, as with
// /api/write and /api/terminal.

import { handleGit, handleGitBranches } from '$lib/server/git-routes';
import { allowedRoots } from '$lib/server/git-write';
import { gitRoots } from '$lib/server/sessions/hooks';
import type { RequestHandler } from './$types';

const options = (server: App.Locals['server']) => ({
    rootsFor: () => allowedRoots(gitRoots(server.hub), server.local.hub),
    refresh: (root: string) => server.git.refresh(root)
});

export const GET: RequestHandler = ({ request, locals }) =>
    handleGitBranches(request, options(locals.server));

export const POST: RequestHandler = ({ request, locals }) =>
    handleGit(request, locals.server.token, options(locals.server));
