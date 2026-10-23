// The Recover endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/runs/recover/routes.ts and this joins them: the GET of a dataset's plan, run
// and log on this Mac or the cluster, and the POST of a fetch, a check, an unpack or a stop behind
// the write token. This Mac's runs and the `recover` channel are the server context's Recover
// watcher (`recover`), held for the server's life, which each press is told of.

import { homedir } from 'node:os';
import { hpcRouteHost } from '$lib/server/machine/hpc/host';
import { run } from '$lib/server/machine/hpc/ssh';
import { copy } from '$lib/server/machine/hpc/transfer';
import {
    handleRecover,
    handleRecoverState,
    type RecoverTarget
} from '$lib/server/machine/runs/recover/routes';
import { sevenZipFolder } from '$lib/server/machine/runs/recover/unpack';
import { hubId } from '$lib/data/helpers/hub-names';
import { dataset } from '$lib/server/sessions/stores/hooks';
import type { RequestHandler } from './$types';

const target = (locals: App.Locals): RecoverTarget => {
    const server = locals.server;
    const open = server.workspace.open();
    return {
        token: server.token,
        hubs: () => {
            const names = open.hubs.map((one) => one.name);
            return open.primary === null
                ? names
                : [open.primary, ...names.filter((name) => name !== open.primary)];
        },
        dataset: (hub, key) => dataset(server.hub, hubId(hub, key)),
        downloads: () => server.local.downloads,
        fetch,
        local: server.recover.local,
        cluster: () => {
            const where = hpcRouteHost({
                hpcHost: server.local.hpcHost,
                hub: server.hub,
                primary: open.primary,
                config: () => locals.config().config
            });
            if (where.host === '') return { missing: where.missing ?? '' };
            return {
                host: where.host,
                runner: run,
                copy,
                home: homedir(),
                nodeVersion: process.version,
                sevenZip: sevenZipFolder
            };
        },
        live: server.recover
    };
};

export const GET: RequestHandler = ({ request, locals }) =>
    handleRecoverState(request, target(locals));

export const POST: RequestHandler = ({ request, locals }) => handleRecover(request, target(locals));
