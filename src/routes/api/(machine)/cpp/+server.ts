// The endpoint of a repository's `.oculus/cpp.yml` form. A route module may export only its verbs,
// so everything it does lives in lib/server/machine/lsp/adapters/clangd/cpp-write.ts and this is
// the lines that join them. The GET answers the form of the file and is same-origin only; the POST
// carries the token ServerContext minted and writes one configuration.
//
// The repository must lie under a root the file browser serves, so the roots are the browser's own
// fold, and the write is one of the Files view's writer, which the History lists.

import { carriedOf, target } from '$lib/server/edit/writes';
import { defaultHistoryDir } from '$lib/server/files/fs/history';
import type { OpsTarget } from '$lib/server/files/fs/ops';
import { repositoryRoots } from '$lib/server/files/roots';
import {
    handleCppGet,
    handleCppPost,
    type CppRouteOptions
} from '$lib/server/machine/lsp/adapters/clangd/cpp-write';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals): CppRouteOptions => {
    const server = locals.server;
    return {
        rootsFor: () => repositoryRoots(server.workspace.open()),
        configFor: () => locals.config().config,
        files: (): OpsTarget => ({
            roots: server.workspace.open().roots,
            writes: server.opsWrites,
            changes: target(server.engine, locals.config().config, carriedOf(server), server)
                .changes,
            history: server.local.history ?? defaultHistoryDir()
        })
    };
};

export const GET: RequestHandler = ({ request, locals }) => handleCppGet(request, options(locals));

export const POST: RequestHandler = ({ request, locals }) =>
    handleCppPost(request, locals.server.token, options(locals));
