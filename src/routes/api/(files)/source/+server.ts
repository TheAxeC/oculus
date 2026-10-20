// Layer 2, server route. The source endpoint only joins Kit's request, its roots and the token to
// the server module because route modules may export only HTTP verbs.
//
// The roots are the folders of the open workspace and no others: a folder the reader added in the
// file browser is read there and written here, so a file that opens for editing is a file that
// saves. The configuration is the one read `locals.config` keeps for the request, taken from the
// ServerContext's cache of the parse, and the roots are the open workspace the ServerContext holds,
// so a request reads no workspace file.

import { textCatalog } from '$lib/data/sources/config';
import { defaultHistoryDir } from '$lib/server/files/fs/history';
import { handleSource, handleSourceInfo } from '$lib/server/files/source/source';
import type { RequestHandler } from './$types';

/** The roots this request may name, over the configuration it read. */
const roots = (locals: App.Locals) => locals.server.workspace.open().roots;

export const GET: RequestHandler = ({ request, url, locals }) =>
    handleSourceInfo(request, url, roots(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleSource(
        request,
        locals.token,
        () => textCatalog(locals.config().config),
        roots(locals),
        locals.server.local.history ?? defaultHistoryDir()
    );
