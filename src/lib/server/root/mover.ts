// Layer 2, server. The port the server listens on and its move to another port: the loopback
// address every listen uses, and the mover the entry that owns the HTTP server builds, which
// probes the new port, lets requests in flight finish and listens there with the same context.
// context.ts checks a requested port and calls the move; the entries build the mover.

import type { Server } from 'node:http';
import { createServer as createNetServer, type Server as NetServer } from 'node:net';

/** The interface the server listens on: the loopback alone, so no other machine reaches it. */
export const LISTEN_HOST = '127.0.0.1';

/**
 * How the process that owns the HTTP server moves it to another port. `announce` is called once
 * the server listens on `port`, so a page told the new address over a socket that stayed open finds
 * the server there. It resolves null when the server listens on `port`, or the reason the server
 * stays where it is, in which case `announce` was not called.
 */
export type PortMove = (port: number, announce: () => void) => Promise<string | null>;

/** What `serverMover` gives the entry that owns the server. */
export type ServerMover = {
    move: PortMove;
    /** Whether a move is stopping and starting the server, whose `close` event is then no stop. */
    moving: () => boolean;
};

/** The reason a probe or a listen gave for failing, in words a log line can carry. */
function listenReason(error: unknown): string {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EADDRINUSE') return 'the port is in use';
    return error instanceof Error ? error.message : String(error);
}

/** Listen on one port of the loopback and resolve null, or the reason the listen failed. */
function listenOn(server: NetServer, port: number): Promise<string | null> {
    return new Promise((resolve) => {
        const failed = (error: unknown): void => {
            resolve(listenReason(error));
        };
        server.once('error', failed);
        try {
            server.listen(port, LISTEN_HOST, () => {
                server.off('error', failed);
                resolve(null);
            });
        } catch (error) {
            server.off('error', failed);
            failed(error);
        }
    });
}

/** How long a request in flight may take to finish when the server moves, in milliseconds. */
const MOVE_GRACE_MS = 5000;

/** What a mover is given besides the server: the end of the process and the grace period. */
export type MoverOptions = {
    /** Ends the process with a status, which is the one way a server with no listener stops. */
    exit?: (code: number) => void;
    /** How long a request in flight may take before the move ends what remains. */
    graceMs?: number;
};

/**
 * The move of one HTTP server to another port, for the entry that created it. The new port is
 * probed with a server of its own that is closed at once; only a free port goes on. The server then
 * stops listening and ends its idle connections at once, lets a request in flight finish for up to
 * `graceMs`, ends what remains (an upgraded socket stays open, so a page keeps the socket it was
 * told the new address on) and listens on the new port, so the same context, token and sockets
 * serve on; only then are the pages told the new address. Its `close` event queued by the stop is
 * no stop of the process, which `moving` says until the server is listening again. A listen
 * that fails after the stop listens on the old port again, and when that fails too the reasons are
 * logged in one line and the process exits with status 1, since a server with no listener serves
 * nothing.
 */
export function serverMover(server: Server, options: MoverOptions = {}): ServerMover {
    const exit = options.exit ?? ((code: number): void => process.exit(code));
    const graceMs = options.graceMs ?? MOVE_GRACE_MS;
    let running = false;
    let moving = false;
    let inFlight = 0;
    let drained: (() => void) | null = null;
    server.on('request', (_request, response) => {
        inFlight += 1;
        response.once('close', () => {
            inFlight -= 1;
            if (inFlight === 0) drained?.();
        });
    });

    /** Resolve when no request is in flight, or after the grace period. */
    function finishRequests(): Promise<void> {
        if (inFlight === 0) return Promise.resolve();
        return new Promise((resolve) => {
            const done = (): void => {
                clearTimeout(timer);
                drained = null;
                resolve();
            };
            const timer = setTimeout(done, graceMs);
            drained = done;
        });
    }

    const move: PortMove = async (port, announce) => {
        if (running) return 'a move is in progress';
        const address = server.address();
        if (address === null || typeof address === 'string') return 'the server is not listening';
        running = true;
        try {
            const probe = createNetServer();
            const busy = await listenOn(probe, port);
            if (busy !== null) return busy;
            await new Promise<void>((resolve) => {
                probe.close(() => {
                    resolve();
                });
            });
            moving = true;
            try {
                server.close();
                await finishRequests();
                server.closeAllConnections();
                const refused = await listenOn(server, port);
                if (refused === null) {
                    announce();
                    return null;
                }
                const back = await listenOn(server, address.port);
                if (back !== null) {
                    console.error(
                        `the server could not listen on port ${port} (${refused}) and could not listen on port ${address.port} again (${back}); it stops`
                    );
                    exit(1);
                }
                return refused;
            } finally {
                moving = false;
            }
        } finally {
            running = false;
        }
    };
    return { move, moving: () => moving };
}
