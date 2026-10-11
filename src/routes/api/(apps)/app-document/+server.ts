// The document endpoint of the apps. A route module may export only its verbs, so everything it
// does lives in lib/server/machine/apps/routes/document.ts and this is the lines that join them.
// The GET reads the bytes of the file a custom editor was opened on and the POST replaces them.

import { handleDocumentGet, handleDocumentPost } from '$lib/server/machine/apps/routes/document';
import { routeOptions } from '$lib/server/machine/apps/routes/routes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, locals }) =>
    handleDocumentGet(
        request,
        routeOptions(locals.server, () => locals.config().config)
    );

export const POST: RequestHandler = ({ request, locals }) =>
    handleDocumentPost(
        request,
        locals.server.token,
        routeOptions(locals.server, () => locals.config().config)
    );
