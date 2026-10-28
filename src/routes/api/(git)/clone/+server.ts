// The clone endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/git/clone/clone-routes.ts and this is the few lines that join them: the POST carries
// the token ServerContext minted, as with /api/write, /api/git and /api/deposit.

import { textCatalog } from '$lib/data/sources/config';
import { cloneGit } from '$lib/server/git/clone/clone-git';
import { handleClone } from '$lib/server/git/clone/clone-routes';
import { project } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    const config = locals.config().config;
    return handleClone(request, server.token, {
        text: textCatalog(config),
        busy: server.cloning,
        git: cloneGit(server.credentials),
        project: (id) => {
            const found = project(server.hub, id);
            return found === null ? null : { repository: found.repository };
        },
        rescan: () => server.rescan()
    });
};
