// The per-project file endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/files/project-files.ts and this is the one line that joins them.

import { filesTarget, handleProjectFiles } from '$lib/server/files/project-files';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleProjectFiles(request, filesTarget(locals.server.engine));
