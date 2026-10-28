// Layer 2, route. The Status view's line counts. A route module may export only its verbs, so the
// count lives in lib/server/machine/lines.ts and this is the one GET that joins it over the engine
// folder this request's server runs from, with the request's signal so a closed request stops the
// count.

import { textCatalog } from '$lib/data/sources/config';
import { countLines, handleLines } from '$lib/server/machine/lines';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleLines(request, (signal) =>
        countLines(locals.server.engine, textCatalog(locals.config().config), {
            signal,
            credentials: locals.server.credentials
        })
    );
