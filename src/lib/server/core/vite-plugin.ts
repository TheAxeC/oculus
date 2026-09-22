// Layer 2, server. Compose the ServerContext, WebSocket and raw-request carrier used by Vite development and preview.

import adapter from '@sveltejs/adapter-node';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Server } from 'node:http';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import {
    carryServerContext,
    createServerContext,
    type OculusRequest,
    type ServerContext
} from './context.ts';
import { attachSocket, type Attached } from './socket.ts';

export type ViteServerDependencies = {
    createContext: (engine: string) => ServerContext;
    attachSocket: (server: Server, context: ServerContext) => Attached;
};

export type OculusViteServer = {
    adapter: ReturnType<typeof adapter>;
    plugin: Plugin & {
        configureServer: (server: ViteDevServer) => void;
        configurePreviewServer: (server: PreviewServer) => void;
    };
};

type ServerSurface = Pick<ViteDevServer, 'httpServer' | 'middlewares'>;

const dependencies: ViteServerDependencies = {
    createContext: createServerContext,
    attachSocket: (server, context) =>
        attachSocket(server, context.hub, {
            path: '/ws',
            token: context.token,
            terminals: context.terminals
        })
};

/** Build the adapter emulator and the plugin that owns one context for either Vite serve mode. */
export function oculusViteServer(
    engine: string,
    replacements: Partial<ViteServerDependencies> = {}
): OculusViteServer {
    const make = { ...dependencies, ...replacements };
    const requests = new AsyncLocalStorage<OculusRequest>();
    const node = adapter();
    node.emulate = () => ({
        platform: () => {
            const request = requests.getStore();
            if (request === undefined) {
                throw new Error('oculus raw request is absent from the Vite request scope');
            }
            return { req: request };
        }
    });

    const configure = (server: ServerSurface): void => {
        const http = server.httpServer;
        if (!(http instanceof Server)) return;
        const context = make.createContext(engine);
        const socket = make.attachSocket(http, context);

        server.middlewares.use((request, _response, next) => {
            const carried = request as OculusRequest;
            carryServerContext(carried, context);
            requests.run(carried, next);
        });

        http.on('close', () => {
            socket.close();
            context.close();
        });
    };

    return {
        adapter: node,
        plugin: {
            name: 'oculus-server',
            apply: 'serve',
            configureServer: configure,
            configurePreviewServer: configure
        }
    };
}
