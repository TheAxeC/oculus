// The wallpaper endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/wallpaper.ts and this is the one line that joins them.

import { serve, settings } from '$lib/server/content/wallpaper';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
    serve(
        settings(locals.server.wallpaper, locals.config().config, locals.server.engine),
        locals.server.wallpaper
    );
