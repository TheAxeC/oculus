// The write endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/edit/writes.ts and this is the one line that joins them. POST only: there is nothing
// to read here, and the token it checks is the one ServerContext minted and hooks.server.ts put on
// the event.
//
// The one write that needs more than the hub is the deck's, which checks the slide keys it was sent
// against the projects this request's server last published, so target() is handed this request's
// server rather than reaching for one, and this request's configuration read, which is read before
// the write it makes.

import { carriedOf, handleWrite, target } from '$lib/server/edit/writes';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    const answer = await handleWrite(
        request,
        locals.token,
        target(
            locals.server.engine,
            locals.config().config,
            carriedOf(locals.server),
            locals.server
        )
    );
    // A write may have changed the workspace file or the state; the held workspace is read again.
    locals.server.workspace.changed();
    return answer;
};
