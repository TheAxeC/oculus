// Layer 2, server route. The folder panel of the Files view. A route module may export only its
// verbs, so everything the request does is in lib/server/files/fs/picker.ts and this is the line
// that joins Kit's request, the process token, the panel's open state and the connection the
// request came on to it. The POST opens macOS's folder panel and answers the folders the reader
// chose, and the panel ends when that connection closes; it lists and serves nothing.

import { handlePick } from '$lib/server/files/fs/picker';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals, platform }) =>
    handlePick(request, locals.token, locals.server.folderPicker, {
        connection: platform?.req.socket
    });
