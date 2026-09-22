// The wallpaper endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/wallpaper.ts and this is the one line that joins them.

import { serve, settings } from '$lib/server/content/wallpaper';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    serve(
        settings(locals.server.wallpaper, locals.server.engine),
        request.headers,
        locals.server.wallpaper
    );
