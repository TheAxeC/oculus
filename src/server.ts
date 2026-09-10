// The Node entry. Run it with `node src/server.ts` after `npm run build`; Node 23 strips the
// types itself. The http server, the WebSocket on it, and the watcher that feeds the WebSocket
// are the whole process; vite.config.ts stands up the same three in development.

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { engineDir, loadLocal } from './lib/data/sources/config.ts';
import type { Snapshot } from './lib/data/model.ts';
import { Hub } from './lib/server/channels.ts';
import { projectFolders } from './lib/server/sessions/index.ts';
import type { ProjectFolder } from './lib/server/sessions/group.ts';
import { attachSocket } from './lib/server/socket.ts';
import { watchGit } from './lib/server/watch/git.ts';
import { watchPortfolio } from './lib/server/watch/portfolio.ts';
import { watchSessions } from './lib/server/watch/sessions.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

const engine = engineDir();
const local = loadLocal(engine);

// The specifier is built at run time because build/handler.js exists only after `npm run build`.
const built = new URL('../build/handler.js', import.meta.url).href;
const { handler } = (await import(built)) as { handler: Handler };

const server = createServer(handler);
const hub = new Hub();
attachSocket(server, hub, { path: '/ws' });
// The first build and the first scan happen here, before the port is open, so the first page to
// connect is answered from memory rather than waiting for a read of the hub or of the transcripts.
const portfolio = watchPortfolio(hub, { hub: local.hub, engine });

/** The project folders of the newest snapshot the portfolio watcher published. */
function folders(): ProjectFolder[] {
    const message = hub.latest('portfolio');
    return message === undefined ? [] : projectFolders(local.hub, message.payload as Snapshot);
}

const sessions = watchSessions(hub, {
    cache: local.sessionsCache,
    overrides: local.sessionsOverrides,
    projectFolders: folders
});
// Started after the sessions watcher, so its subscription is answered with the first scan at once.
const git = watchGit(hub);

server.on('close', () => {
    git.close();
    sessions.close();
    portfolio.close();
});

server.listen(local.port, '127.0.0.1', () => {
    console.log(`oculus on http://127.0.0.1:${local.port} over hub ${local.hub}`);
});
