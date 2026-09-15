// Layer 2, server. The built Node entry composes one ServerContext, carries it on every request,
// and attaches the process's WebSocket to the same Hub, token and terminal manager.

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { engineDir } from './lib/data/sources/config.ts';
import { carryingHandler, createServerContext } from './lib/server/context.ts';
import { BODY_LIMIT_BYTES } from './lib/server/memories.ts';
import { onShutdown } from './lib/server/shutdown.ts';
import { attachSocket } from './lib/server/socket.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

// How large a request body the built handler's parser accepts. It is a knob of the adapter this
// process loads, read once when that module is evaluated and only from the environment, so this
// process sets it before the import below; it is not a setting the reader has, which is why it is
// not in config/. Left alone the parser refuses a body over 512K, which is any photograph the
// Memories wall's own control sends, and the page would meet a refused request rather than a
// sentence. server/memories.ts holds the size and enforces the picture's own half of it.
process.env.BODY_SIZE_LIMIT = String(BODY_LIMIT_BYTES);

const built = new URL('../build/handler.js', import.meta.url).href;
const { handler } = (await import(built)) as { handler: Handler };
const context = createServerContext(engineDir());
const server = createServer(carryingHandler(handler, context));
const socket = attachSocket(server, context.hub, {
    path: '/ws',
    token: context.token,
    terminals: context.terminals
});

server.on('close', () => {
    socket.close();
    context.close();
});

// A stop signal closes the same things the `close` event closes, then the http server, and exits
// when it has let go of its handles.
onShutdown(
    {
        on: (signal, handler) => void process.on(signal, handler),
        exit: (code) => process.exit(code)
    },
    (done) => {
        socket.close();
        context.close();
        server.close(() => done());
    }
);

server.listen(context.local.port, '127.0.0.1', () => {
    console.log(`oculus on http://127.0.0.1:${context.local.port} over hub ${context.local.hub}`);
});
