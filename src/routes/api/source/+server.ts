// Layer 2, server route. The source endpoint only joins Kit's request, its roots and the token to the
// server module because route modules may export only HTTP verbs.
//
// The roots are the configured ones with the current workspace's after them, composed exactly as the
// file route composes them: a folder the reader added in the file browser is read there and written
// here, so a file that opens for editing is a file that saves. The configuration and the hub come off
// the request's ServerContext, so one request reads the workspaces file once and no config file.

import { configuredRootsOf, rootsFrom } from '$lib/server/files';
import { addedRoots, defaultWorkspacesPath, readSaved } from '$lib/server/fs';
import { handleSource, handleSourceInfo } from '$lib/server/source';
import type { RequestHandler } from './$types';
import type { Root } from '$lib/server/files';

/** Every root this request may address: the configured ones, then the reader's own. */
function rootList(server: App.Locals['server']): Root[] {
    const fixed = rootsFrom(
        configuredRootsOf(server.config, server.engine),
        server.local.hub,
        server.engine
    );
    const saved = readSaved(
        server.local.workspaces ?? defaultWorkspacesPath(),
        fixed.map((one) => one.key)
    );
    return [...fixed, ...addedRoots(fixed, saved)];
}

export const GET: RequestHandler = ({ request, url, locals }) =>
    handleSourceInfo(request, url, rootList(locals.server));

export const POST: RequestHandler = ({ request, locals }) =>
    handleSource(request, locals.token, rootList(locals.server));
