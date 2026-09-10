import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { Server } from 'node:http';
import { defineConfig } from 'vitest/config';
import type { Plugin, ViteDevServer } from 'vite';
import { engineDir, loadLocal } from './src/lib/data/sources/config.ts';
import type { Snapshot } from './src/lib/data/model.ts';
import { Hub } from './src/lib/server/channels.ts';
import { projectFolders } from './src/lib/server/sessions/index.ts';
import type { ProjectFolder } from './src/lib/server/sessions/group.ts';
import { attachSocket } from './src/lib/server/socket.ts';
import { watchGit } from './src/lib/server/watch/git.ts';
import { watchPortfolio } from './src/lib/server/watch/portfolio.ts';
import { watchSessions } from './src/lib/server/watch/sessions.ts';

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
            const local = loadLocal(engine);
            const hub = new Hub();
            const socket = attachSocket(http, hub, { path: '/ws' });
            const watcher = watchPortfolio(hub, { hub: local.hub, engine });
            const folders = (): ProjectFolder[] => {
                const message = hub.latest('portfolio');
                return message === undefined
                    ? []
                    : projectFolders(local.hub, message.payload as Snapshot);
            };
            const sessions = watchSessions(hub, {
                cache: local.sessionsCache,
                overrides: local.sessionsOverrides,
                projectFolders: folders
            });
            // After the sessions watcher, so its subscription is answered with the first scan.
            const git = watchGit(hub);
            http.on('close', () => {
                git.close();
                sessions.close();
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
    // The dev server listens where the built server does, on 127.0.0.1 at the port from local.yml
    // (8790 by default), so the Claude Code hooks that post to that port reach whichever of the two
    // is running, and a page's `ws://127.0.0.1:<port>/ws` connects in development as in production.
    // Only one of the two can hold the port; strictPort makes a clash an error rather than a silent
    // move to another port the hooks do not know.
    server: {
        host: '127.0.0.1',
        port: loadLocal(engineDir()).port,
        strictPort: true
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        expect: { requireAssertions: true }
    }
});
