// Layer 2, server tests. The Vite development and preview hooks carry their own context through the
// adapter emulator, and the server mover that gives them the move of their HTTP server to another
// port, on real servers listening on ports the system chose.

import {
    createServer,
    type IncomingMessage,
    type RequestListener,
    type Server,
    type ServerResponse
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import type { PreviewServer, ViteDevServer } from 'vite';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import {
    LISTEN_HOST,
    serverContext,
    serverMover,
    type PortMove,
    type ServerMover
} from '../../../src/lib/server/root/context.ts';
import { attachSocket } from '../../../src/lib/server/root/socket.ts';
import { oculusViteServer } from '../../../src/lib/server/root/vite-plugin.ts';
import { contextFixture } from './context-fixture.ts';
import { closeAll, freePort, listening } from './process/server-fixture.ts';

type Middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => void;

describe('the Oculus Vite plugin', () => {
    it.each(['configureServer', 'configurePreviewServer'] as const)(
        '%s carries ServerContext through the emulated platform',
        async (hook) => {
            const context = contextFixture({ token: `${hook}-token` });
            const closeContext = vi.spyOn(context, 'close');
            const closeSocket = vi.fn();
            const createContext = vi.fn(() => context);
            const attach = vi.fn(() => ({ close: closeSocket }));
            const configured = oculusViteServer('/engine', {
                createContext,
                attachSocket: attach
            });
            const http = createServer();
            let middleware: Middleware | undefined;
            const server = {
                httpServer: http,
                middlewares: {
                    use: (next: Middleware) => {
                        middleware = next;
                    }
                }
            } as unknown as ViteDevServer & PreviewServer;

            const configure = configured.plugin[hook] as unknown as (
                target: ViteDevServer & PreviewServer
            ) => void;
            configure(server);
            expect(createContext).toHaveBeenCalledExactlyOnceWith('/engine', expect.any(Function));
            expect(attach).toHaveBeenCalledWith(http, context);
            expect(middleware).toBeDefined();

            const emulator = await configured.adapter.emulate?.();
            const request = {} as IncomingMessage;
            await new Promise<void>((resolve, reject) => {
                const rejectError = (reason: unknown): void => {
                    reject(reason instanceof Error ? reason : new Error(String(reason)));
                };
                middleware?.(request, {} as ServerResponse, () => {
                    Promise.resolve(emulator?.platform?.({ config: {}, prerender: false })).then(
                        (platform) => {
                            try {
                                expect(serverContext(platform)).toBe(context);
                                resolve();
                            } catch (error) {
                                rejectError(error);
                            }
                        },
                        rejectError
                    );
                });
            });

            http.emit('close');
            expect(closeSocket).toHaveBeenCalledOnce();
            expect(closeContext).toHaveBeenCalledOnce();
        }
    );
});

describe('the Oculus Vite plugin on a server that moves', () => {
    it('keeps the context and the socket through a move and closes them when the server closes', async () => {
        const context = contextFixture();
        const closeContext = vi.spyOn(context, 'close');
        const closeSocket = vi.fn();
        let move: PortMove | undefined;
        const configured = oculusViteServer('/engine', {
            createContext: (_engine, given) => {
                move = given;
                return context;
            },
            attachSocket: () => ({ close: closeSocket })
        });
        const http = createServer();
        await new Promise<void>((resolve) => http.listen(0, LISTEN_HOST, resolve));
        const server = {
            httpServer: http,
            middlewares: { use: () => undefined }
        } as unknown as ViteDevServer & PreviewServer;
        const configure = configured.plugin.configureServer as unknown as (
            target: ViteDevServer & PreviewServer
        ) => void;
        configure(server);

        const probe = createServer();
        await new Promise<void>((resolve) => probe.listen(0, LISTEN_HOST, resolve));
        const next = (probe.address() as AddressInfo).port;
        await new Promise<void>((resolve) => probe.close(() => resolve()));
        const refusal = await move?.(next, () => undefined);

        expect(refusal).toBeNull();
        expect((http.address() as AddressInfo).port).toBe(next);
        expect(closeContext).not.toHaveBeenCalled();
        expect(closeSocket).not.toHaveBeenCalled();

        await new Promise<void>((resolve) => http.close(() => resolve()));
        expect(closeContext).toHaveBeenCalledOnce();
        expect(closeSocket).toHaveBeenCalledOnce();
    });
});

describe('serverMover on a real server', () => {
    const open: Server[] = [];
    const clients: WebSocket[] = [];

    afterEach(async () => {
        for (const client of clients.splice(0)) client.terminate();
        await closeAll(open);
    });

    const listen = (handler?: RequestListener) => listening(open, handler);

    async function answer(port: number): Promise<string> {
        const response = await fetch(`http://${LISTEN_HOST}:${port}/`);
        return response.text();
    }

    it('answers on the new port and no longer on the old, and tells the page once it listens there', async () => {
        const { server, port } = await listen();
        const mover = serverMover(server);
        const target = await freePort();
        let listeningWhenTold = 0;
        let closes = 0;
        server.on('close', () => {
            if (!mover.moving()) closes += 1;
        });

        const refusal = await mover.move(target, () => {
            listeningWhenTold = (server.address() as AddressInfo).port;
        });

        expect(refusal).toBeNull();
        expect(listeningWhenTold).toBe(target);
        expect((server.address() as AddressInfo).port).toBe(target);
        expect(await answer(target)).toBe('answer');
        await expect(answer(port)).rejects.toThrow();
        expect(mover.moving()).toBe(false);
        expect(closes).toBe(0);
    });

    it('keeps a socket that was open, which carries the push made when the move is announced and the one after', async () => {
        const { server, port } = await listen();
        const hub = new Hub();
        const attached = attachSocket(server, hub, { path: '/ws', token: 'move-token' });
        const client = new WebSocket(`ws://${LISTEN_HOST}:${port}/ws`, {
            headers: { Origin: `http://${LISTEN_HOST}:${port}` }
        });
        clients.push(client);
        await new Promise<void>((resolve) => client.once('open', () => resolve()));
        const heardAt = (marker: 'replayed' | 'announced' | 'after'): Promise<string> =>
            new Promise<string>((resolve) => {
                client.on('message', (data: unknown) => {
                    const message = JSON.parse(String(data)) as {
                        channel: string;
                        payload: { config: Record<string, boolean> };
                    };
                    if (message.channel === 'config' && message.payload.config[marker]) {
                        resolve(String(data));
                    }
                });
            });
        const subscribed = heardAt('replayed');
        const heardAnnounced = heardAt('announced');
        const heardAfter = heardAt('after');
        client.send(
            JSON.stringify({ type: 'subscribe', channels: ['config'], token: 'move-token' })
        );
        hub.publish('config', { config: { replayed: true }, findings: [] });
        await subscribed;
        const mover = serverMover(server);

        const refusal = await mover.move(await freePort(), () => {
            hub.publish('config', { config: { announced: true }, findings: [] });
        });
        hub.publish('config', { config: { after: true }, findings: [] });

        expect(refusal).toBeNull();
        expect(client.readyState).toBe(WebSocket.OPEN);
        expect(JSON.parse(await heardAnnounced)).toMatchObject({
            channel: 'config',
            payload: { config: { announced: true } }
        });
        expect(JSON.parse(await heardAfter)).toMatchObject({
            channel: 'config',
            payload: { config: { after: true } }
        });
        attached.close();
    });

    /** A server whose handler answers `late` after `ms`, or never when `ms` is null. */
    const slow = (ms: number | null) =>
        listen((_request, response) => {
            if (ms !== null) setTimeout(() => response.end('late'), ms);
        });

    it('lets a request in flight finish, and tells the page only once the new port is served', async () => {
        const { server, port } = await slow(300);
        const mover = serverMover(server);
        const target = await freePort();
        let finished = false;
        let finishedWhenTold: boolean | null = null;
        let listeningWhenTold = 0;

        server.on('request', (_request, response) => {
            response.once('finish', () => {
                finished = true;
            });
        });
        const pending = fetch(`http://${LISTEN_HOST}:${port}/`);
        await new Promise((resolve) => setTimeout(resolve, 50));
        const refusal = await mover.move(target, () => {
            finishedWhenTold = finished;
            listeningWhenTold = (server.address() as AddressInfo).port;
        });
        const response = await pending;

        expect(listeningWhenTold).toBe(target);
        expect(finishedWhenTold).toBe(true);
        expect(response.status).toBe(200);
        expect(await response.text()).toBe('late');
        expect(refusal).toBeNull();
        expect((server.address() as AddressInfo).port).toBe(target);
    });

    it('ends a request still in flight when the grace period is over, and still moves', async () => {
        const { server, port } = await slow(null);
        const mover = serverMover(server, { graceMs: 100 });
        const target = await freePort();

        const pending = fetch(`http://${LISTEN_HOST}:${port}/`);
        const failed = expect(pending).rejects.toThrow();
        await new Promise((resolve) => setTimeout(resolve, 50));
        const refusal = await mover.move(target, () => undefined);
        await failed;

        expect(refusal).toBeNull();
        expect((server.address() as AddressInfo).port).toBe(target);
    });

    it('answers the request that started the move, and then serves the new port', async () => {
        const target = await freePort();
        const held: { mover: ServerMover | null } = { mover: null };
        let moved: Promise<string | null> = Promise.resolve('not started');
        const { server, port } = await listen((_request, response) => {
            if (held.mover !== null) moved = held.mover.move(target, () => undefined);
            response.end('started');
        });
        held.mover = serverMover(server);

        const response = await fetch(`http://${LISTEN_HOST}:${port}/`);

        expect(await response.text()).toBe('started');
        expect(await moved).toBeNull();
        expect(await answer(target)).toBe('started');
    });

    it('logs both reasons in one line and exits with status 1 when neither port can be listened on', async () => {
        const { server, port } = await listen();
        const exit = vi.fn();
        const mover = serverMover(server, { exit });
        const target = await freePort();
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const real = server.listen.bind(server);
        vi.spyOn(server, 'listen').mockImplementation(((...args: unknown[]) => {
            if (args[0] === target || args[0] === port) {
                queueMicrotask(() => {
                    server.emit('error', Object.assign(new Error('no'), { code: 'EADDRINUSE' }));
                });
                return server;
            }
            return real(...(args as Parameters<typeof real>));
        }) as typeof server.listen);

        const refusal = await mover.move(target, () => undefined);

        expect(refusal).toBe('the port is in use');
        expect(exit).toHaveBeenCalledExactlyOnceWith(1);
        expect(said).toHaveBeenCalledExactlyOnceWith(
            `the server could not listen on port ${target} (the port is in use) and could not listen on port ${port} again (the port is in use); it stops`
        );
        said.mockRestore();
    });

    it('refuses a port in use without telling the page or stopping the server', async () => {
        const { server, port } = await listen();
        const other = await listen();
        const mover = serverMover(server);
        let told = 0;

        const refusal = await mover.move(other.port, () => {
            told += 1;
        });

        expect(refusal).toBe('the port is in use');
        expect(told).toBe(0);
        expect((server.address() as AddressInfo).port).toBe(port);
        expect(await answer(port)).toBe('answer');
    });

    it('listens on the old port again, and tells the page nothing, when the listen on the new one fails', async () => {
        const { server, port } = await listen();
        const mover = serverMover(server);
        const target = await freePort();
        const real = server.listen.bind(server);
        let failed = false;
        vi.spyOn(server, 'listen').mockImplementation(((...args: unknown[]) => {
            if (!failed && args[0] === target) {
                failed = true;
                queueMicrotask(() => {
                    server.emit('error', Object.assign(new Error('no'), { code: 'EADDRINUSE' }));
                });
                return server;
            }
            return real(...(args as Parameters<typeof real>));
        }) as typeof server.listen);
        let told = 0;

        const refusal = await mover.move(target, () => {
            told += 1;
        });

        expect(refusal).toBe('the port is in use');
        expect(told).toBe(0);
        expect((server.address() as AddressInfo).port).toBe(port);
        expect(await answer(port)).toBe('answer');
        expect(mover.moving()).toBe(false);
    });

    it('refuses a second move while one is in progress, and a server that does not listen', async () => {
        const { server } = await listen();
        const mover = serverMover(server);
        const first = mover.move(await freePort(), () => undefined);
        expect(await mover.move(await freePort(), () => undefined)).toBe('a move is in progress');
        expect(await first).toBeNull();

        const idle = createServer();
        expect(await serverMover(idle).move(await freePort(), () => undefined)).toBe(
            'the server is not listening'
        );
    });
});
