// Layer 2, server route. The make items of the Files view: Make Folder a Hub..., Make Folder a
// Project, Make Folder a Git Repository and Add Repository Configuration.... A route module may
// export only its verbs, so everything the request does is in lib/server/files/project/make.ts
// and this is the line that joins Kit's request, the process token, the open workspace's folders,
// oculus's own folder, which holds the templates, and the real git, which Make Folder a Git
// Repository runs `git init -q` with, to it. A make waits on the write chain of the file
// operations, `opsWrites`, and is recorded in the change log the write route and the file
// operations use, so History lists it beside New File.

import { carriedOf, target } from '$lib/server/edit/writes';
import { handleMake } from '$lib/server/files/project/make';
import { cloneGit, LOCAL_TIMEOUT_MS } from '$lib/server/git/clone/clone-git';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const held = target(
        locals.server.engine,
        locals.config().config,
        carriedOf(locals.server),
        locals.server
    );
    return handleMake(request, locals.token, {
        roots: locals.server.workspace.open().roots,
        engine: locals.server.engine,
        writes: locals.server.opsWrites,
        changes: held.changes,
        initGit: (folder) => cloneGit(['-C', folder, 'init', '-q'], LOCAL_TIMEOUT_MS)
    });
};
