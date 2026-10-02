// Layer 4, test helper. Real HTTP servers on ports the system chose, for the cases over the move
// of a server to another port: a server that listens, a port nothing listens on, and the close of
// every server a case opened.

import { createServer, type RequestListener, type Server } from 'node:http';
import { createServer as createNetServer, type AddressInfo } from 'node:net';
import { LISTEN_HOST } from '../../../../src/lib/server/root/mover.ts';

/** A port nothing listens on at the time of the call. */
export async function freePort(): Promise<number> {
    const probe = createNetServer();
    await new Promise<void>((resolve) => probe.listen(0, LISTEN_HOST, resolve));
    const { port } = probe.address() as AddressInfo;
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    return port;
}

/**
 * A server listening on a port the system chose, answering `answer` unless a handler is given, and
 * remembered in `open` for `closeAll`.
 */
export async function listening(
    open: Server[],
    handler: RequestListener = (_request, response) => response.end('answer')
): Promise<{ server: Server; port: number }> {
    const server = createServer(handler);
    open.push(server);
    await new Promise<void>((resolve) => server.listen(0, LISTEN_HOST, resolve));
    return { server, port: (server.address() as AddressInfo).port };
}

/** Close every server of `open`, its connections first, and forget them. */
export async function closeAll(open: Server[]): Promise<void> {
    for (const server of open.splice(0)) {
        server.closeAllConnections();
        await new Promise<void>((resolve) => {
            if (!server.listening) resolve();
            else server.close(() => resolve());
        });
    }
}
