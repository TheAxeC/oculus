// Layer 2, server tests. The Vite development and preview hooks carry their own context through the adapter emulator.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import type { PreviewServer, ViteDevServer } from 'vite';
import { serverContext } from '../../../src/lib/server/core/context.ts';
import { oculusViteServer } from '../../../src/lib/server/core/vite-plugin.ts';
import { contextFixture } from './context-fixture.ts';

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
            expect(createContext).toHaveBeenCalledOnce();
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
