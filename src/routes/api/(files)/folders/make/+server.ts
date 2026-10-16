// Layer 2, server route. Make Folder a Hub and Make Folder a Project of the Files view. A route
// module may export only its verbs, so everything the request does is in
// lib/server/files/project/make.ts and this is the line that joins Kit's request, the process
// token, the open workspace's folders and oculus's own folder, which holds the templates, to it.
// A make waits on the write chain of the file operations, `opsWrites`, and is recorded in the
// change log the write route and the file operations use, so History lists it beside New File.

import { carriedOf, target } from '$lib/server/edit/writes';
import { handleMake } from '$lib/server/files/project/make';
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
        changes: held.changes
    });
};
