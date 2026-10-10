// The file browser's endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/files/fs.ts and this is the few lines that join them. The GET lists one
// directory, or the workspaces when it names no root, and is same-origin only; the POST writes the
// workspaces file and carries the token ServerContext minted, as with /api/write, /api/git and
// /api/deposit.
//
// The configuration is the one read `locals.config` keeps for the request, taken from the
// ServerContext's cache of the parse, and the hub and the write chain come off the ServerContext,
// so one request holds one configuration, reads local.yml no times, and reads one of the reader's
// own files once: the workspaces, the bookmarks, or a note.

import { configuredRootsOf, rootsFrom } from '$lib/server/files/files';
import {
    defaultWorkspacesPath,
    handleFs,
    handleFsWrite,
    type FsTarget
} from '$lib/server/files/fs';
import { defaultBookmarksPath } from '$lib/server/files/fs/bookmarks';
import { defaultNotesDir } from '$lib/server/files/fs/notes';
import type { RequestHandler } from './$types';

const target = (locals: App.Locals): FsTarget => {
    const server = locals.server;
    return {
        file: server.local.workspaces ?? defaultWorkspacesPath(server.local.hub),
        bookmarks: server.local.bookmarks ?? defaultBookmarksPath(server.local.hub),
        notes: server.local.notes ?? defaultNotesDir(server.local.hub),
        fixed: rootsFrom(
            configuredRootsOf(locals.config().config, server.engine, server.local.hub),
            server.local.hub,
            server.engine
        ),
        writes: server.fsWrites,
        ignored: server.ignoredCache
    };
};

export const GET: RequestHandler = ({ request, locals }) => handleFs(request, target(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleFsWrite(request, locals.server.token, target(locals));
