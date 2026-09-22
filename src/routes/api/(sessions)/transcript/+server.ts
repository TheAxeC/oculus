// The transcript endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/sessions/transcript-routes.ts and this is the one line that joins them. It takes no
// target: the session it reads comes from the last published payload, not from a hub scan.

import { handleTranscript } from '$lib/server/sessions/transcript-routes';
import { sessionRecord } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleTranscript(request, { recordFor: (id) => sessionRecord(locals.server.hub, id) });
