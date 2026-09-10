import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { Server } from 'node:http';
import { defineConfig } from 'vitest/config';
import type { Plugin, ViteDevServer } from 'vite';
import { engineDir, loadLocal } from './src/lib/data/sources/config.ts';
import { Hub } from './src/lib/server/channels.ts';
import { attachSocket } from './src/lib/server/socket.ts';
import { watchPortfolio } from './src/lib/server/watch/portfolio.ts';

// The socket and the watcher in development. They are the same three lines as src/server.ts, on
// Vite's own http server, so `npm run dev` pushes data exactly as the built server does and all
// three rows of DESIGN.md's "Hot reload" hold at once. Vite has no http server in middleware mode,
// which is how vitest loads this file, and there is nothing to attach to then.
function oculusSocket(): Plugin {
    return {
        name: 'oculus-socket',
        apply: 'serve',
        configureServer(server: ViteDevServer) {
            const http = server.httpServer;
            // Vite types its server as http or http2-secure. oculus's dev server is plain http,
            // and the check is what says so rather than a cast that assumes it.
            if (!(http instanceof Server)) return;
            const engine = engineDir();
            const hub = new Hub();
            const socket = attachSocket(http, hub, { path: '/ws' });
            const watcher = watchPortfolio(hub, { hub: loadLocal(engine).hub, engine });
            http.on('close', () => {
                watcher.close();
                socket.close();
            });
        }
    };
}

export default defineConfig({
    plugins: [
        sveltekit({
            // Runes everywhere except in dependencies. Can go in svelte 6.
            compilerOptions: {
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes('node_modules') ? undefined : true
            },
            adapter: adapter()
        }),
        oculusSocket()
    ],
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        expect: { requireAssertions: true }
    }
});
