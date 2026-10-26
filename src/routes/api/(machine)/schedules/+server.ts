// The schedules endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/runs/schedules/routes.ts and this is the lines that join them. The POST
// carries the token ServerContext minted and writes the machine's schedules file behind the
// process's write chain; the paths are the ones the context built the schedule watcher over, and
// the approvals file a saved command's chain is approved in is the one a command's start checks.

import { textCatalog } from '$lib/data/sources/config';
import { carriedOf, target } from '$lib/server/edit/writes';
import { repositoryRoots } from '$lib/server/files/roots';
import { perOculus } from '$lib/server/files/workspace/paths';
import { defaultApprovalsPath } from '$lib/server/machine/approvals/approvals';
import { handleSchedules } from '$lib/server/machine/runs/schedules/routes';
import { defaultRecordPath } from '$lib/server/machine/runs/schedules/record';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleSchedules(request, server.token, {
        files: () => ({
            schedules: perOculus(server.workspace.open().primaryDir, locals.config().config)
                .schedules,
            record: server.local.scheduleRecord ?? defaultRecordPath()
        }),
        rootsFor: () => repositoryRoots(server.workspace.open()),
        hubsFor: () => server.workspace.open(),
        text: () => textCatalog(locals.config().config),
        approvalsFor: () => server.local.approvals ?? defaultApprovalsPath(),
        writes: server.fsWrites,
        changes: target(server.engine, locals.config().config, carriedOf(server), server).changes,
        schedules: server.schedules
    });
};
