// The per-project file endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/files/project-files.ts and this joins them: the request, the configuration
// and the lookup of a side project by its id, which the endpoint lists the files of as it lists a
// research project's.

import { filesTarget, handleProjectFiles } from '$lib/server/files/project-files';
import { sideAsProject } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleProjectFiles(
        request,
        filesTarget(locals.server.engine, locals.config().config, (id) =>
            sideAsProject(locals.server.hub, id)
        )
    );
