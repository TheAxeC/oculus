// The git endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/git/git-routes.ts and this is the few lines that join them. The GET reads (the branch
// listing, one file's diff, a worktree's diff) and is same-origin only; the POST writes and carries
// the token ServerContext minted, as with /api/write and /api/terminal.
//
// Discarding untracked files moves them to the Trash, so the request is joined to what the Files
// view's operations hold: the roots the file browser serves and the write chain `opsWrites`, so a
// discard and a Files operation over one file are ordered.

import { handleGit, handleGitGet } from '$lib/server/git/git-routes';
import { allowedRoots } from '$lib/server/git/git-write';
import { gitRoots } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals) => {
    const server = locals.server;
    return {
        config: locals.config().config,
        claudeBin: server.local.claudeBin,
        rootsFor: () =>
            allowedRoots([
                ...gitRoots(server.hub),
                ...server.workspace.open().roots.map((root) => root.dir)
            ]),
        refresh: (root: string) => server.git.refresh(root),
        writes: server.opsWrites,
        running: server.gitRunning
    };
};

export const GET: RequestHandler = ({ request, locals }) => handleGitGet(request, options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleGit(request, locals.server.token, options(locals));
