// The git endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/git-routes.ts and this is the two lines that join them. The GET reads (the branch
// listing, one file's diff, a worktree's diff) and is same-origin only; the POST writes and carries
// the token ServerContext minted, as with /api/write and /api/terminal.

import { handleGit, handleGitGet } from '$lib/server/git-routes';
import { allowedRoots } from '$lib/server/git-write';
import { gitRoots } from '$lib/server/sessions/hooks';
import type { RequestHandler } from './$types';

const options = (server: App.Locals['server']) => ({
    rootsFor: () => allowedRoots(gitRoots(server.hub), server.local.hub),
    refresh: (root: string) => server.git.refresh(root)
});

export const GET: RequestHandler = ({ request, locals }) =>
    handleGitGet(request, options(locals.server));

export const POST: RequestHandler = ({ request, locals }) =>
    handleGit(request, locals.server.token, options(locals.server));
