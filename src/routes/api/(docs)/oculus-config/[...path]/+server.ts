// The endpoint that gives the Settings view oculus's own `config/` folder, read-only. A route
// module may export only its verbs, so everything it does lives in
// lib/server/files/workspace/oculus-config.ts and this is the few lines that join them. The listing
// is asked for with `?list=1` and the bytes of a file without it; the listing leaves out the
// folders the merged config's `files.hidden_folders` names unless `hidden=1` asks for them. The
// origin guard in src/hooks.server.ts answers a request from another page before anything is read.

import { hiddenFolders } from '$lib/data/sources/config';
import { handleOculusConfig } from '$lib/server/files/workspace/oculus-config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url, locals }) =>
    handleOculusConfig(
        locals.server.engine,
        params.path,
        url.searchParams,
        hiddenFolders(locals.config().config)
    );
