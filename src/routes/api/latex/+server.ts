// The LaTeX endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/latex.ts and this is the two lines that join them. The hub is the one every write
// lands in and the project comes from the portfolio this request's server holds, exactly as the
// document route reads both.

import { handleLatex } from '$lib/server/latex';
import { project } from '$lib/server/sessions/hooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleLatex(request, {
        hub: locals.server.local.hub,
        project: (id) => project(locals.server.hub, id)
    });
