// Layer 2, server route. One POST opens a file in the application `open.program_ext` names for it,
// or reveals a folder in Finder, so it requires the page's write token and a path under the roots
// the file browser serves, the saved workspaces' own among them. The map is the one read
// `locals.config` keeps for the request, of the engine's configuration on disk, so an edit applies
// without a restart, and the opener is the context's own, so a test hands in one that opens
// nothing. The server module validates all of it before invoking the opener; no GET causes an
// operating-system action.

import { openSettings, textCatalog } from '$lib/data/sources/config';
import { handleOpen } from '$lib/server/files/open';
import { browserRoots } from '$lib/server/files/roots';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const config = locals.config().config;
    return handleOpen(
        request,
        locals.token,
        () => textCatalog(config),
        browserRoots({ config, engine: locals.server.engine, local: locals.server.local }),
        () => openSettings(config).programApps,
        locals.server.openPath
    );
};
