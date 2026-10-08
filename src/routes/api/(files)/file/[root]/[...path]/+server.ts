// The local-file endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/files/files.ts and this is the few lines that join them. The rest route gives the
// root's key and the whole path under it, so a manual's own relative links reach the same handler.
//
// The origin guard in src/hooks.server.ts answers a request from another page before anything is
// read from disk, whatever the roots turn out to be. The roots are the configured ones with the
// current workspace's after them, so a folder the reader added in the file browser is served
// exactly as a configured one is; the configuration is the one read `locals.config` keeps for the
// request and the hub comes off the ServerContext, so one request reads the workspaces file once.
// A file inside an apps folder is sent as plain text, since it is app code and a page that opens
// it shows its source.

import { serveFile } from '$lib/server/files/files';
import { browserRoots } from '$lib/server/files/roots';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, locals }) => {
    const roots = browserRoots({
        config: locals.config().config,
        engine: locals.server.engine,
        local: locals.server.local
    });
    return serveFile(roots, params.root, params.path, locals.server.apps.held().folders);
};
