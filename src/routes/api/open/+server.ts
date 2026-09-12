// Layer 2, server route. One POST opens a folder on this machine, so it requires the page's write token and configured roots. The server module validates both before invoking the opener; no GET causes an operating-system action.

import { roots } from '$lib/server/files';
import { handleOpen } from '$lib/server/open';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handleOpen(request, locals.token, roots());
