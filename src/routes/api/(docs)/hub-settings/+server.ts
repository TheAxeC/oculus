// The settings of one hub for the Settings view. A route module may export only its verbs, so
// everything it does lives in lib/server/files/source/hub-settings.ts and these are the lines that
// join them: `?hub=<hub name>` answers the slice of that hub's merged settings the Settings rows of
// the keys each hub's own file is read for draw, and refuses a name no hub of the open workspace
// has.

import { json } from '@sveltejs/kit';
import { textCatalog } from '$lib/data/sources/config';
import { hubSettingsAnswer } from '$lib/server/files/source/hub-settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
    const answer = hubSettingsAnswer(
        url.searchParams.get('hub'),
        locals.server.workspace.open(),
        locals.server.configCache.hub,
        textCatalog(locals.config().config)
    );
    return json(answer.body, { status: answer.status });
};
