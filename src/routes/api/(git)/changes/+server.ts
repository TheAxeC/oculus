// The change log's endpoint. A route module may export only its verbs, so everything it does lives
// in lib/server/core/changes.ts and this is the one line that joins them. GET only: what writes the
// log is /api/write, and taking a change back is a write of that route rather than a verb here.
//
// The log's path, its cap and the process's write chain come off the same target every write lands
// in, so the file this reads is the file the write endpoint appends to and no second reader of
// local.yml decides where it is.

import { handleChanges } from '$lib/server/core/changes';
import { carriedOf, target } from '$lib/server/edit/writes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleChanges(
        request,
        target(
            locals.server.engine,
            locals.config().config,
            carriedOf(locals.server),
            locals.server
        ).changes
    );
