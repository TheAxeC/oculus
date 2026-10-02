// Layer 2, server. Compose the ServerContext, WebSocket and raw-request carrier used by Vite
// development and preview. The server is wired through `wireServer` (process/serve.ts), as the
// built entry is, so a port written to local.yml moves the server under development and preview as
// it does under the built entry, and the `close` event the move itself queues does not close the
// context.

import adapter from '@sveltejs/adapter-node';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Server } from 'node:http';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import {
    carryServerContext,
    createServerContext,
    type OculusRequest,
    type PortMove,
    type ServerContext
} from './context.ts';
import { attachAtWs, wireServer } from './process/serve.ts';
import type { Attached } from './socket.ts';

export type ViteServerDependencies = {
    createContext: (engine: string, portMove: PortMove) => ServerContext;
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
    createContext: (engine, portMove) => createServerContext(engine, {}, portMove),
    attachSocket: attachAtWs
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
        const { context } = wireServer(
            http,
            (portMove) => make.createContext(engine, portMove),
            make.attachSocket
        );

        server.middlewares.use((request, _response, next) => {
            const carried = request as OculusRequest;
            carryServerContext(carried, context);
            requests.run(carried, next);
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
