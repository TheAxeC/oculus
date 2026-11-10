// Layer 2, server route. The search endpoint only joins Kit's request, its roots, the token and the
// configured caps to the server module, because route modules may export only HTTP verbs.
//
// The roots are the folders of the open workspace and no others, so a folder the reader added in
// the file browser is listed there, opened in a source tab, and searched here from one rule; each
// hub among them is marked with its `secrets_dir`, the folder a search leaves out, and its
// `notes_dir`, the notes folder a search reads beside the rest of the hub. The configuration is
// the one read `locals.config()` keeps for the request, taken from the ServerContext's cache of
// the parse; the engine and the machine's own file come off the request's ServerContext; the roots
// are folded once, and the ServerContext holds the workspace, so a request reads no workspace file.

import { handleSearch } from '$lib/server/files/search/search-routes';
import { searchSettings } from '$lib/data/sources/config';
import { withNotes, withSecrets } from '$lib/data/helpers/files/private-folders';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) => {
    const config = locals.config().config;
    const settings = searchSettings(config);
    return handleSearch(request, locals.token, {
        roots: withNotes(
            withSecrets(locals.server.workspace.open().roots, locals.server.secretsDir),
            locals.server.notesDir
        ),
        cap: settings.maxHits,
        maxNames: settings.maxNames,
        skipFolders: settings.skipFolders,
        repositories: locals.server.repositories(),
        credentials: locals.server.credentials,
        timeout: settings.timeoutS * 1000
    });
};
