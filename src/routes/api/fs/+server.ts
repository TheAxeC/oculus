// The file browser's endpoint. A route module may export only its verbs, so everything it does lives
// in lib/server/fs.ts and this is the few lines that join them. The GET lists one directory, or the
// workspaces when it names no root, and is same-origin only; the POST writes the workspaces file and
// carries the token ServerContext minted, as with /api/write, /api/git and /api/deposit.
//
// The configuration, the hub and the write chain all come off the request's ServerContext, so one
// request reads config/sources.yml no times, local.yml no times, and one of the reader's own files
// once: the workspaces, the bookmarks, or a note.

import { configuredRootsOf, rootsFrom } from '$lib/server/files';
import { defaultWorkspacesPath, handleFs, handleFsWrite, type FsTarget } from '$lib/server/fs';
import { defaultBookmarksPath } from '$lib/server/fs/bookmarks';
import { defaultNotesDir } from '$lib/server/fs/notes';
import type { RequestHandler } from './$types';

const target = (server: App.Locals['server']): FsTarget => ({
    file: server.local.workspaces ?? defaultWorkspacesPath(),
    bookmarks: server.local.bookmarks ?? defaultBookmarksPath(),
    notes: server.local.notes ?? defaultNotesDir(),
    fixed: rootsFrom(
        configuredRootsOf(server.config, server.engine),
        server.local.hub,
        server.engine
    ),
    writes: server.fsWrites
});

export const GET: RequestHandler = ({ request, locals }) =>
    handleFs(request, target(locals.server));

export const POST: RequestHandler = ({ request, locals }) =>
    handleFsWrite(request, locals.server.token, target(locals.server));
