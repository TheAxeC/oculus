// The Memories wall's endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/content/memories.ts and these are the two lines that join them: GET answers
// the pictures of every hub's photo wall, or streams the one a `file=<hub name>/<file name>` names,
// and POST adds one to the primary hub's photo wall (the first hub's with no primary).

import { textCatalog } from '$lib/data/sources/config';
import { picturesOf } from '$lib/server/content/images';
import { add, addFolder, listing, serve } from '$lib/server/content/memories';
import { allHubs } from '$lib/server/files/roots';
import type { RequestHandler } from './$types';

const hubsOf = (locals: App.Locals) =>
    picturesOf(
        allHubs(locals.server.engine, locals.config().config, locals.server.workspace.open())
    );

export const GET: RequestHandler = ({ url, locals }) => {
    const file = url.searchParams.get('file');
    return file === null ? listing(hubsOf(locals)) : serve(hubsOf(locals), file);
};

export const POST: RequestHandler = ({ request, locals }) =>
    add(
        addFolder(hubsOf(locals), locals.server.workspace.open().primary),
        request,
        locals.token,
        () => textCatalog(locals.config().config)
    );
