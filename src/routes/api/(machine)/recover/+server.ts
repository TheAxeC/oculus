// The Recover endpoint. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/runs/recover/routes.ts and this joins them: the GET of a dataset's plan, run
// and log on this Mac or on a cluster of `slurm.resource`, and the POST of a fetch, a check, an
// unpack or a stop behind the write token. This Mac's runs and the `recover` channel are the server
// context's Recover watcher (`recover`), held for the server's life, which each press is told of.
// A dataset's sources are read by the rows of `recover.sources` of its own hub: the primary's
// merged settings, or the settings of another hub read under that hub's `.oculus/config.yml`. The
// reader rows are handed the machine's `downloads` rows without the ones the `deposit.zenodo.auth`
// of any hub of the workspace names, so the Zenodo token goes to the deposit's address alone.

import { homedir } from 'node:os';
import { nodeDownload } from '$lib/data/sources/config';
import { connectionFor } from '$lib/server/machine/hpc/clusters/connections';
import { run } from '$lib/server/machine/hpc/ssh';
import { copy } from '$lib/server/machine/hpc/transfer';
import {
    handleRecover,
    handleRecoverState,
    type RecoverTarget
} from '$lib/server/machine/runs/recover/routes';
import { sevenZipFolder } from '$lib/server/machine/runs/recover/unpack';
import { hubId } from '$lib/data/helpers/hub-names';
import { recoverRows } from '$lib/data/sources/config';
import { READER_AGENT } from '$lib/server/core/reader/agent';
import { readerAccounts } from '$lib/server/git/deposit/zenodo-api';
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
        downloads: () =>
            readerAccounts(server.local.downloads, [
                locals.config().config,
                ...open.hubs
                    .filter((one) => one.name !== open.primary)
                    .map((one) => server.configCache.hub(one.dir).config)
            ]),
        rows: (hub) => {
            const other = open.hubs.find((one) => one.name === hub && one.name !== open.primary);
            const config =
                other === undefined
                    ? locals.config().config
                    : server.configCache.hub(other.dir).config;
            return recoverRows(config);
        },
        agent: READER_AGENT,
        fetch,
        local: server.recover.local,
        cluster: (resource) => {
            const found = connectionFor(
                {
                    hub: server.hub,
                    primary: open.primary,
                    config: () => locals.config().config,
                    accounts: () => server.local.clusters
                },
                resource
            );
            if ('missing' in found) return found;
            return {
                resource,
                connection: found.connection,
                runner: run,
                copy,
                home: homedir(),
                nodeVersion: process.version,
                nodeDownload: nodeDownload(locals.config().config),
                sevenZip: sevenZipFolder
            };
        },
        live: server.recover
    };
};

export const GET: RequestHandler = ({ request, locals }) =>
    handleRecoverState(request, target(locals));

export const POST: RequestHandler = ({ request, locals }) => handleRecover(request, target(locals));
