// The Node entry. Run it with `node src/server.ts` after `npm run build`; Node 23 strips the
// types itself. O6 attaches the WebSocket to the http server created here.

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { engineDir, loadLocal } from './lib/data/sources/config.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

const engine = engineDir();
const local = loadLocal(engine);

// The specifier is built at run time because build/handler.js exists only after `npm run build`.
const built = new URL('../build/handler.js', import.meta.url).href;
const { handler } = (await import(built)) as { handler: Handler };

const server = createServer(handler);
server.listen(local.port, '127.0.0.1', () => {
  console.log(`oculus on http://127.0.0.1:${local.port} over hub ${local.hub}`);
});
