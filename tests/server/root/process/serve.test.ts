// Layer 2, server tests. The built entry's wiring around its HTTP server (process/serve.ts), on a
// real server listening on a port the system chose: the context every request carries, the move of
// the server that leaves the context and the socket open, and the close that ends both.
// @module-tag slow: its cases listen on a loopback socket, so npm test leaves it out.

import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type OculusRequest, type ServerContext } from '../../../../src/lib/server/root/context.ts';
import { LISTEN_HOST, type PortMove } from '../../../../src/lib/server/root/mover.ts';
import { serveContext } from '../../../../src/lib/server/root/process/serve.ts';
import { contextFixture } from '../context-fixture.ts';
import { closeAll, freePort } from './server-fixture.ts';

describe('the wiring of the built entry', () => {
    const open: Server[] = [];

    afterEach(async () => {
        await closeAll(open);
    });

    /** A served context: a server listening on a port the system chose, wired by serveContext. */
    async function served() {
        const server = createServer();
        open.push(server);
        const context = contextFixture();
        const closeContext = vi.spyOn(context, 'close');
        const seen: (ServerContext | undefined)[] = [];
        const moves: PortMove[] = [];
        const wired = serveContext(
            server,
            (request, response) => {
                seen.push((request as OculusRequest).oculus);
                response.end('answer');
            },
            (portMove) => {
                moves.push(portMove);
                return context;
            }
        );
        const closeSocket = vi.spyOn(wired.socket, 'close');
        await new Promise<void>((resolve) => server.listen(0, LISTEN_HOST, resolve));
        return { server, context, closeContext, closeSocket, seen, move: moves[0], wired };
    }

    it('hands the handler every request with the context on it', async () => {
        const run = await served();
        const { port } = run.server.address() as AddressInfo;

        const response = await fetch(`http://${LISTEN_HOST}:${port}/`);

        expect(await response.text()).toBe('answer');
        expect(run.seen).toEqual([run.context]);
        expect(run.wired.context).toBe(run.context);
    });

    it('hands the context the move of its own server', async () => {
        const run = await served();
        const target = await freePort();

        const refusal = await run.move(target, () => undefined);

        expect(refusal).toBeNull();
        expect((run.server.address() as AddressInfo).port).toBe(target);
    });

    it('leaves the context and the socket open when a move stops the server', async () => {
        const run = await served();

        await run.move(await freePort(), () => undefined);

        expect(run.closeContext).not.toHaveBeenCalled();
        expect(run.closeSocket).not.toHaveBeenCalled();
    });

    it('closes the context and the socket once when the server closes outside a move', async () => {
        const run = await served();

        await new Promise<void>((resolve) => run.server.close(() => resolve()));

        expect(run.closeContext).toHaveBeenCalledOnce();
        expect(run.closeSocket).toHaveBeenCalledOnce();
    });
});
