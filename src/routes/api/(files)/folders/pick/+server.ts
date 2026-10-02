// Layer 2, server route. The folder panel of the Files view. A route module may export only its
// verbs, so everything the request does is in lib/server/files/fs/picker.ts and this is the line
// that joins Kit's request, the process token and the panel's open state to it. The POST opens
// macOS's folder panel and answers the folders the reader chose; it lists and serves nothing.

import { handlePick } from '$lib/server/files/fs/picker';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
    handlePick(request, locals.token, locals.server.folderPicker);
