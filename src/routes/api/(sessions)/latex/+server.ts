// The LaTeX endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/latex/endpoint.ts and this is the few lines that join them. The hub is the one
// every write lands in, the project comes from the portfolio this request's server holds exactly
// as the document route reads both, and the roots are the ones the file browser serves.

import { handleLatex, handleLatexPost, type LatexTarget } from '$lib/server/content/latex/endpoint';
import { browserRoots } from '$lib/server/files/roots';
import { latexBuild, latexFormatting, textCatalog } from '$lib/data/sources/config';
import { buildOutcome } from '$lib/server/machine/pty/latex/latex';
import { project } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

const target = (locals: App.Locals): LatexTarget => {
    const server = locals.server;
    const config = locals.config().config;
    return {
        hub: server.local.hub,
        project: (id) => project(server.hub, id),
        roots: () => browserRoots({ config, engine: server.engine, local: server.local }),
        formatting: () => latexFormatting(config),
        building: () => latexBuild(config),
        text: () => textCatalog(config),
        outcome: (dir, label, main) =>
            buildOutcome(server.terminals.list() ?? [], config, dir, label, main)
    };
};

export const GET: RequestHandler = ({ request, locals }) => handleLatex(request, target(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleLatexPost(request, locals.server.token, target(locals));
