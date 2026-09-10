// The Node entry. Run it with `node src/server.ts` after `npm run build`; Node 23 strips the
// types itself. The http server, the WebSocket on it, and the watcher that feeds the WebSocket
// are the whole process; vite.config.ts stands up the same three in development.

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { engineDir, loadLocal } from './lib/data/sources/config.ts';
import { Hub } from './lib/server/channels.ts';
import { attachSocket } from './lib/server/socket.ts';
import { watchPortfolio } from './lib/server/watch/portfolio.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

const engine = engineDir();
const local = loadLocal(engine);

// The specifier is built at run time because build/handler.js exists only after `npm run build`.
const built = new URL('../build/handler.js', import.meta.url).href;
const { handler } = (await import(built)) as { handler: Handler };

const server = createServer(handler);
const hub = new Hub();
attachSocket(server, hub, { path: '/ws' });
// The first build happens here, before the port is open, so the first page to connect is answered
// from memory rather than waiting for a read of the hub.
watchPortfolio(hub, { hub: local.hub, engine });

server.listen(local.port, '127.0.0.1', () => {
    console.log(`oculus on http://127.0.0.1:${local.port} over hub ${local.hub}`);
});
