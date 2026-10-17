// The per-project file endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/files/project/project-files.ts and this joins them: the request, the
// configuration and the server's kept parse of each other hub's settings.

import { filesTarget, handleProjectFiles } from '$lib/server/files/project/project-files';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleProjectFiles(
        request,
        filesTarget(
            locals.config().config,
            locals.server.workspace.open(),
            locals.server.configCache.hub
        )
    );
