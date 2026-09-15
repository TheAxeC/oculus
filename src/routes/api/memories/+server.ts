// The Memories wall's endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/memories.ts and these are the two lines that join them: GET answers the list
// of pictures, or streams the one a `file=` names, and POST adds one.

import { add, folder, listing, serve } from '$lib/server/memories';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, url, locals }) => {
    const dir = folder(locals.server.memories, locals.server.engine);
    const file = url.searchParams.get('file');
    return file === null ? listing(dir, request.headers) : serve(dir, file, request.headers);
};

export const POST: RequestHandler = ({ request, locals }) =>
    add(folder(locals.server.memories, locals.server.engine), request, locals.token);
