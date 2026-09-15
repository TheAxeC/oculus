// The local-file endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/files.ts and this is the few lines that join them. The rest route gives the root's key
// and the whole path under it, so a manual's own relative links reach the same handler.
//
// The origin is checked before anything is read from disk, since a request from another page is
// answered with nothing whatever the roots turn out to be. The roots are then the configured ones
// with the current workspace's after them, so a folder the reader added in the file browser is
// served exactly as a configured one is; the configuration and the hub come off the request's
// ServerContext, so one request reads the workspaces file once and no config file at all.

import { sameOrigin } from '$lib/server/auth';
import { configuredRootsOf, rootsFrom, serveFile } from '$lib/server/files';
import { addedRoots, defaultWorkspacesPath, readSaved } from '$lib/server/fs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request, locals }) => {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return new Response(null, { status: 403 });
    }
    const { server } = locals;
    const fixed = rootsFrom(configuredRootsOf(server.config, server.engine), server.local.hub);
    const file = server.local.workspaces ?? defaultWorkspacesPath();
    const saved = readSaved(
        file,
        fixed.map((one) => one.key)
    );
    return serveFile(request, [...fixed, ...addedRoots(fixed, saved)], params.root, params.path);
};
