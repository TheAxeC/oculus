// The wallpaper endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/wallpaper.ts and this is the one line that joins them.

import { serve, settings } from '$lib/server/wallpaper';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => serve(settings(), request.headers);
