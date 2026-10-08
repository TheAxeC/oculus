// Layer 2, server. The wiring around one HTTP server: the move of the server to another port, the
// WebSocket on the context's hub, and the server's `close` event that closes them, shared by the
// built entry and by Vite's (vite-plugin.ts); and, for the built entry, the context carried on
// every request. It is a function of the server, the built handler and the context's factory, so
// a test drives it over a real server on an ephemeral port while src/server.ts only calls it with
// the process's own.

import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { carryingHandler, type ServerContext } from '../context.ts';
import { serverMover, type MoverOptions, type PortMove } from '../mover.ts';
import { attachSocket, type Attached } from '../socket.ts';

/** The request handler the SvelteKit adapter builds. */
export type Handler = (req: IncomingMessage, res: ServerResponse) => void;

/** What the wiring made: the context every request carries and the socket on its hub. */
export type Served = { context: ServerContext; socket: Attached };

/** How the socket is attached on the context's hub; `attachAtWs` when absent. */
export type AttachSocket = (server: Server, context: ServerContext) => Attached;

export const attachAtWs: AttachSocket = (server, context) =>
    attachSocket(server, context.hub, {
        path: '/ws',
        token: context.token,
        terminals: context.terminals,
        relay: context.relay,
        openFiles: context.openFiles
    });

/**
 * The wiring both entries share, the built one and Vite's: the context `makeContext` builds, given
 * the server's move, a WebSocket attached on its hub, token and terminals, and the server's
 * `close`, which closes the socket and the context unless a move of the server queued it. How a
 * request carries the context is the entry's own.
 */
export function wireServer(
    server: Server,
    makeContext: (portMove: PortMove) => ServerContext,
    attach: AttachSocket = attachAtWs,
    options: MoverOptions = {}
): Served {
    const mover = serverMover(server, options);
    const context = makeContext(mover.move);
    const socket = attach(server, context);
    server.on('close', () => {
        if (mover.moving()) return;
        socket.close();
        context.close();
    });
    return { context, socket };
}

/**
 * Wire `server` for the built entry: `wireServer`, with the context carried on every request
 * before `handler` sees it.
 */
export function serveContext(
    server: Server,
    handler: Handler,
    makeContext: (portMove: PortMove) => ServerContext,
    options: MoverOptions = {}
): Served {
    const served = wireServer(server, makeContext, attachAtWs, options);
    server.on('request', carryingHandler(handler, served.context));
    return served;
}
