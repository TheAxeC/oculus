// Layer 2, server route. The file operations of the Files view and the comparison of two files.
// A route module may export only its verbs, so everything the request does is in
// lib/server/files/fs/ops.ts and this is the few lines that join Kit's request to it. The POST
// creates, renames, trashes, deletes, pastes and uploads under the served roots and carries the
// token ServerContext minted; the GET reads two files as the diff pane reads a change.
//
// The roots are the file browser's own list, folded by lib/server/files/roots.ts, so a folder the
// reader added in the file browser is a folder these operations reach and no other is. The
// operations wait on the process's own write chain `opsWrites`, apart from the one the workspaces,
// bookmarks and notes wait on. The change log, the hub and the history folder come from the same
// target the write route uses, so a file operation is recorded where every other write is.

import { localFile } from '$lib/data/sources/config';
import { target } from '$lib/server/edit/writes';
import { defaultHistoryDir } from '$lib/server/files/fs/history';
import { handleCompare, handleOps } from '$lib/server/files/fs/ops';
import { browserRoots } from '$lib/server/files/roots';
import type { RequestHandler } from './$types';

/** The roots this request may name, over the configuration it read. */
const roots = (locals: App.Locals) =>
    browserRoots({
        config: locals.config().config,
        engine: locals.server.engine,
        local: locals.server.local
    });

export const GET: RequestHandler = ({ url, locals }) =>
    handleCompare(url, roots(locals), locals.server.local.history ?? defaultHistoryDir());

export const POST: RequestHandler = ({ request, locals }) => {
    const held = target(locals.server.engine, locals.config().config, locals.server);
    return handleOps(request, locals.token, {
        roots: roots(locals),
        writes: locals.server.opsWrites,
        local: localFile(locals.server.engine),
        changes: held.changes,
        hub: held.hub,
        history: locals.server.local.history ?? defaultHistoryDir()
    });
};
