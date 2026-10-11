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
    type ServerContext
} from './context.ts';
import { type PortMove } from './mover.ts';
import { attachAtWs, wireServer } from './process/serve.ts';
import type { Attached } from './socket.ts';

export type ViteServerDependencies = {
    createContext: (engine: string, portMove: PortMove, ready: Promise<void>) => ServerContext;
    attachSocket: (server: Server, context: ServerContext) => Attached;
};

export type OculusViteServer = {
    adapter: ReturnType<typeof adapter>;
    plugin: Omit<Plugin, 'configureServer' | 'configurePreviewServer'> & {
        configureServer: (server: ViteDevServer) => void;
        configurePreviewServer: (server: PreviewServer) => void;
    };
};

type ServerSurface = Pick<ViteDevServer, 'httpServer' | 'middlewares'>;

const dependencies: ViteServerDependencies = {
    createContext: (engine, portMove, ready) => createServerContext(engine, {}, portMove, ready),
    attachSocket: attachAtWs
};

/**
 * Build the adapter emulator and the plugin that owns one context for either Vite serve mode. The
 * adapter writes the built server into `options.out`, the folder the build of this Vite mode owns.
 */
export function oculusViteServer(
    engine: string,
    options: { out: string },
    replacements: Partial<ViteServerDependencies> = {}
): OculusViteServer {
    const make = { ...dependencies, ...replacements };
    const requests = new AsyncLocalStorage<OculusRequest>();
    // A restart of the dev server loads the configuration again, so each server gets its own
    // plugin and this closure holds the one context of that server. Vite makes the next server
    // before it closes the old one, awaits the old plugin's `closeServer` hook, and only then
    // listens on the next: the hook waits for the old hosts to stop, and the next context starts
    // no host before its server listens, so no host of one app runs twice.
    let served: ServerContext | null = null;
    const node = adapter({ out: options.out });
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
            (portMove) => make.createContext(engine, portMove, listening(http)),
            make.attachSocket
        );
        served = context;

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
            configurePreviewServer: configure,
            closeServer: async () => {
                await served?.hosts.close();
            }
        }
    };
}

/** Settles once the server listens; Vite configures a server before it listens on it. */
function listening(http: Server): Promise<void> {
    return new Promise((resolve) => http.once('listening', () => resolve()));
}
