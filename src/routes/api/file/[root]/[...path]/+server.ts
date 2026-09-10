// The local-file endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/files.ts and this is the one line that joins them. The rest route gives the root's key
// and the whole path under it, so a manual's own relative links reach the same handler.

import { roots, serveFile } from '$lib/server/files';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request }) =>
    serveFile(request, roots(), params.root, params.path);
