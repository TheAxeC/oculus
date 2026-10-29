// Layer 2, server route. The journal browser endpoint only joins Kit's request, the process token,
// each hub's `venues.browser` row, the machine's `downloads` rows and the settings to the server
// module, because route modules may export only HTTP verbs.
//
// A hub's row is read from its own settings: the primary's from the one read `locals.config()`
// keeps for the request, another hub's from the settings read under that hub's
// `.oculus/config.yml`. The `downloads` rows are `locals.server.local`, kept current by the
// machine's file watcher. The pacing is the server context's `literature` desk.

import { handleBrowser, type HubBrowser } from '$lib/server/content/literature/browser';
import { READER_AGENT } from '$lib/server/core/reader/agent';
import { browserRow, literatureSettings } from '$lib/data/sources/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const server = locals.server;
    const open = server.workspace.open();
    const primary = locals.config().config;
    const browsers = (): HubBrowser[] => {
        const hubs = [...open.hubs].sort(
            (left, right) =>
                Number(right.name === open.primary) - Number(left.name === open.primary)
        );
        return hubs.flatMap((hub) => {
            const config =
                hub.name === open.primary ? primary : server.configCache.hub(hub.dir).config;
            const row = browserRow(config);
            return row === null ? [] : [{ hub: hub.name, row }];
        });
    };
    return handleBrowser(request, {
        token: locals.token,
        browsers,
        downloads: server.local.downloads,
        timeoutS: literatureSettings(primary).timeoutS,
        desk: server.literature,
        fetcher: fetch,
        agent: READER_AGENT
    });
};
