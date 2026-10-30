// The endpoint of Write the website, the Career view's button. A route module may export only its
// verbs, so everything it does lives in lib/server/machine/runs/website.ts and this is the lines
// that join them. The POST carries the token ServerContext minted.
//
// The files are built from the portfolio this server published last, for the open workspace's
// primary hub, and written by the Files view's writer, which the History lists; the command runs as
// a task terminal after the approval kept in the file `approvals` of local.yml names it.

import { carriedOf, target } from '$lib/server/edit/writes';
import { defaultHistoryDir } from '$lib/server/files/fs/history';
import type { OpsTarget } from '$lib/server/files/fs/ops';
import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { handleWebsitePost, type WebsiteWriteOptions } from '$lib/server/machine/runs/website';
import type { Snapshot } from '$lib/data/model';
import type { RequestHandler } from './$types';

const options = (locals: App.Locals): WebsiteWriteOptions => {
    const server = locals.server;
    const into = (): ReturnType<typeof target> =>
        target(server.engine, locals.config().config, carriedOf(server), server);
    return {
        primary: () => {
            const open = server.workspace.open();
            const hub = open.hubs.find((one) => one.name === open.primary);
            return hub === undefined ? null : { key: hub.name, dir: hub.dir };
        },
        config: () => locals.config().config,
        snapshot: () => (server.hub.latest('portfolio')?.payload as Snapshot | undefined) ?? null,
        files: (): OpsTarget => ({
            roots: server.workspace.open().roots,
            writes: server.opsWrites,
            changes: into().changes,
            history: server.local.history ?? defaultHistoryDir()
        }),
        approvalsFor: () => server.local.approvals ?? defaultApprovalsPath(),
        refresh: () => server.terminals.refresh(),
        credentials: server.credentials
    };
};

export const POST: RequestHandler = ({ request, locals }) =>
    handleWebsitePost(request, locals.server.token, options(locals));
