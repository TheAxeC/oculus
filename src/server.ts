// Layer 2, server. The built Node entry composes one ServerContext, carries it on every request,
// and attaches the process's WebSocket to the same Hub, token and terminal manager.

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { engineDir } from './lib/data/sources/config.ts';
import { carryingHandler, createServerContext } from './lib/server/context.ts';
import { onShutdown } from './lib/server/shutdown.ts';
import { attachSocket } from './lib/server/socket.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

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
