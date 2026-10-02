// Layer 2, server route. The source endpoint only joins Kit's request, its roots and the token to
// the server module because route modules may export only HTTP verbs.
//
// The roots are the file browser's own list, folded by lib/server/files/roots.ts and by nothing
// else: a folder the reader added in the file browser is read there and written here, so a file
// that opens for editing is a file that saves. The configuration is the request's own read and the
// hub comes off its ServerContext, so one request reads the workspaces file once.

import { browserRoots } from '$lib/server/files/roots';
import { defaultHistoryDir } from '$lib/server/files/fs/history';
import { handleSource, handleSourceInfo } from '$lib/server/files/source';
import type { RequestHandler } from './$types';

/** The roots this request may name, over the configuration it read. */
const roots = (locals: App.Locals) =>
    browserRoots({
        config: locals.config().config,
        engine: locals.server.engine,
        local: locals.server.local
    });

export const GET: RequestHandler = ({ request, url, locals }) =>
    handleSourceInfo(request, url, roots(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleSource(
        request,
        locals.token,
        roots(locals),
        locals.server.local.history ?? defaultHistoryDir()
    );
