// Layer 2, server test. A restart of the dev server never runs a host of one app twice
// (lib/server/root/vite-plugin.ts). Vite loads the configuration again, so the next server gets a
// plugin of its own; it makes that server before it closes the old one, awaits the old plugin's
// `closeServer` hook, and only then listens on the next server. The old plugin's hook waits for the
// old context's hosts to stop, and the next context starts no host before its server listens.
//
// The two plugins are the real `oculusViteServer`, in the order Vite's `restartServer` calls them,
// each over a real HTTP server; the contexts are stand-ins that hold only what the plugin reaches,
// the hosts' close a promise the test settles. What this does NOT cover: Vite itself, whose order
// is read from `restartServer` in node_modules/vite/dist/node/chunks/node.js.

import { createServer, type Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import type { ServerContext } from '../../../src/lib/server/root/process/server-context.ts';
import { oculusViteServer } from '../../../src/lib/server/root/vite-plugin.ts';

/** A context that holds only the hosts' close and its own close, which the plugin reaches. */
function standIn(close: () => Promise<void>): ServerContext {
    const context: Pick<ServerContext, 'hosts' | 'close'> = {
        hosts: { close } as Pick<ServerContext['hosts'], 'close'> as ServerContext['hosts'],
        close: () => undefined
    };
    return context as ServerContext;
}

/** One server of the dev server's life: its HTTP server, its plugin and its context's `ready`. */
function serverOf(close: () => Promise<void>): {
    http: Server;
    plugin: ReturnType<typeof oculusViteServer>['plugin'];
    ready: () => Promise<void>;
} {
    const http = createServer();
    let given: Promise<void> | null = null;
    const { plugin } = oculusViteServer(
        'engine',
        { out: 'out' },
        {
            createContext: (_engine, _portMove, ready) => {
                given = ready;
                return standIn(close);
            },
            attachSocket: () => ({ close: () => undefined })
        }
    );
    plugin.configureServer({
        httpServer: http,
        middlewares: { use: () => undefined }
    } as unknown as Parameters<typeof plugin.configureServer>[0]);
    return {
        http,
        plugin,
        ready: () => {
            if (given === null) throw new Error('the plugin made no context');
            return given;
        }
    };
}

describe('a restart of the dev server', () => {
    it('starts the next hosts only after the old hosts stopped and the next server listens', async () => {
        const order: string[] = [];
        let stopOld: () => void = () => undefined;
        const oldStopped = new Promise<void>((resolve) => {
            stopOld = resolve;
        });
        const old = serverOf(() =>
            oldStopped.then(() => {
                order.push('old hosts stopped');
            })
        );
        const next = serverOf(() => Promise.resolve());
        void next.ready().then(() => order.push('next hosts may start'));

        const hook = next.plugin.closeServer;
        const closing = old.plugin.closeServer;
        if (typeof closing !== 'function' || typeof hook !== 'function') {
            throw new Error('the plugin has no closeServer hook');
        }
        const closed = (closing as () => Promise<void>)();
        stopOld();
        await closed;
        order.push('old server closed');
        await new Promise<void>((resolve) => next.http.listen(0, '127.0.0.1', () => resolve()));
        await next.ready();
        expect(order).toEqual(['old hosts stopped', 'old server closed', 'next hosts may start']);
        await new Promise<void>((resolve) => next.http.close(() => resolve()));
        old.http.close();
    });
});
