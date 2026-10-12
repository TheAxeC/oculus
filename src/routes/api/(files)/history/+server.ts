// Layer 2, server route. The local history of one file: its copies, or one copy's text. A route
// module may export only its verbs, so everything it does is in lib/server/files/fs/history.ts and
// this is the few lines that join Kit's request to it. The roots are the file browser's own list
// and the folder is local.yml's `history` key, read at the request.

import { handleHistory, defaultHistoryDir } from '$lib/server/files/fs/history';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) =>
    handleHistory(
        url,
        locals.server.workspace.open().roots,
        locals.server.local.history ?? defaultHistoryDir()
    );
