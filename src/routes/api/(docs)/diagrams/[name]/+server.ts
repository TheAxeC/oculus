// The diagram endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/diagrams.ts and this is the one line that joins them: one `.svg` file of the
// engine directory's docs/diagrams/, by name.

import { serveDiagram } from '$lib/server/content/diagrams';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request, locals }) =>
    serveDiagram(locals.server.engine, params.name, request.headers);
