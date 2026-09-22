// Layer 2, server route. The source endpoint only joins Kit's request, its roots and the token to
// the server module because route modules may export only HTTP verbs.
//
// The roots are the file browser's own list, folded by lib/server/files/roots.ts and by nothing
// else: a folder the reader added in the file browser is read there and written here, so a file
// that opens for editing is a file that saves. The configuration and the hub come off the request's
// ServerContext, so one request reads the workspaces file once and no config file.

import { browserRoots } from '$lib/server/files/roots';
import { handleSource, handleSourceInfo } from '$lib/server/files/source';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, url, locals }) =>
    handleSourceInfo(request, url, browserRoots(locals.server));

export const POST: RequestHandler = ({ request, locals }) =>
    handleSource(request, locals.token, browserRoots(locals.server));
