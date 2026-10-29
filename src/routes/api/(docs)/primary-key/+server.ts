// The endpoint of the choice of a data file's primary key, which the finding of a file that has
// none offers. A route module may export only its verbs, so everything it does lives in
// lib/server/edit/primary-key.ts and this is the lines that join them. The POST carries the
// token ServerContext minted and names the hub, the collection and the field.
//
// The hub is one of the open workspace's, read with its own settings, and each file is written by
// the Files view's writer, which the History lists.

import { carriedOf, target } from '$lib/server/edit/writes';
import { hubTarget } from '$lib/server/edit/writes/hubs';
import { handlePrimaryKeyPost, type PrimaryKeyOptions } from '$lib/server/edit/primary-key';
import { defaultHistoryDir } from '$lib/server/files/fs/history';
import type { OpsTarget } from '$lib/server/files/fs/ops';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals): PrimaryKeyOptions => {
    const server = locals.server;
    const into = (): ReturnType<typeof target> =>
        target(server.engine, locals.config().config, carriedOf(server), server);
    return {
        hubFor: (root) => {
            const hub = hubTarget(into(), root, null);
            return hub === null ? null : { dir: hub.hub, config: hub.config };
        },
        files: (): OpsTarget => ({
            roots: server.workspace.open().roots,
            writes: server.opsWrites,
            changes: into().changes,
            history: server.local.history ?? defaultHistoryDir()
        }),
        text: () => into().config.text
    };
};

export const POST: RequestHandler = ({ request, locals }) =>
    handlePrimaryKeyPost(request, locals.server.token, options(locals));
