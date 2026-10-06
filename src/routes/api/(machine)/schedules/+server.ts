// The schedules endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/schedules/routes.ts and this is the lines that join them. The POST carries the
// token ServerContext minted and writes the machine's schedules file behind the process's write
// chain; the paths are the ones the context built the schedule watcher over.

import { target } from '$lib/server/edit/writes';
import { repositoryRoots } from '$lib/server/files/roots';
import { handleSchedules } from '$lib/server/machine/schedules/routes';
import { defaultSchedulesPath } from '$lib/server/machine/schedules/file';
import { defaultRecordPath } from '$lib/server/machine/schedules/record';
import { savedPath } from '$lib/server/machine/commands/saved';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    return handleSchedules(request, server.token, {
        files: () => ({
            schedules: server.local.schedules ?? defaultSchedulesPath(),
            record: server.local.scheduleRecord ?? defaultRecordPath(),
            commands: savedPath()
        }),
        rootsFor: () =>
            repositoryRoots({
                config: locals.config().config,
                engine: server.engine,
                local: server.local
            }),
        hubFor: () => server.local.hub,
        writes: server.fsWrites,
        changes: target(server.engine, locals.config().config, server).changes,
        schedules: server.schedules
    });
};
