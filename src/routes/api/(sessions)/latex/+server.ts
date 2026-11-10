// The LaTeX endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/content/latex/endpoint.ts and this is the few lines that join them. The hub is the one
// every write lands in, the project comes from the portfolio this request's server holds exactly as
// the document route reads both, and the roots are the open workspace's folders. The folder of a
// project's main files is the one the `.tex` row of its hub's `project_docs` names.

import { handleLatex, handleLatexPost, type LatexTarget } from '$lib/server/content/latex/endpoint';
import { latexBuild, latexFormatting, textCatalog } from '$lib/data/sources/config';
import { projectDocList } from '$lib/data/sources/config/settings/hub-rows';
import { manuscriptFolder } from '$lib/data/prose/latex';
import { buildOutcome } from '$lib/server/machine/pty/latex/latex';
import { project } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

const target = (locals: App.Locals): LatexTarget => {
    const server = locals.server;
    const config = locals.config().config;
    return {
        project: (id) => project(server.hub, id),
        roots: () => server.workspace.open().roots,
        manuscript: (hub) => manuscriptFolder(projectDocList(server.configCache.hub(hub).config)),
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
