// Layer 2, server. Vite development and preview use one plugin to carry ServerContext into Kit,
// and one more compiles a Svelte component before its style module is answered
// (src/lib/server/root/style-first.ts). Vitest runs started together share node_modules/.vite and
// .svelte-kit, so `noVitestDepsCache` below turns off the one folder in node_modules/.vite that two
// runs cannot write at once, and `syncTypesOnce` keeps a run from rewriting .svelte-kit/types while
// another run or svelte-check reads it. The development server is not touched by either.
//
// The config is a function of the Vite mode. Under the mode `app`, which the desktop host's build
// runs (`vite build --mode app`), SvelteKit writes `.svelte-kit-app/` and the adapter writes
// `build-app/`, and Vite reads that folder's tsconfig, so the build neither writes nor reads a
// folder `npm run build`, `npm run check` or the dev server use. Every other mode writes
// `.svelte-kit/` and `build/`.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import { engineDir, loadLocal } from './src/lib/data/sources/config.ts';
import { componentBeforeStyle } from './src/lib/server/root/style-first.ts';
import {
    APP_FOLDERS,
    APP_MODE,
    PLAIN_FOLDERS
} from './src/lib/server/root/process/build-folders.ts';
import { oculusViteServer } from './src/lib/server/root/vite-plugin.ts';

/**
 * Vite optimizes a server environment's dependencies into `<cacheDir>/deps_<environment>` by
 * building a temporary folder and renaming folders into place, and two processes that do it at
 * once in one folder fail on the rename. @sveltejs/vite-plugin-svelte lists Svelte's modules as
 * dependencies of every server environment, which includes the environment Vitest names
 * `__vitest__`, whose folder every run of a project shares. Emptying the list with no discovery
 * turns the optimizer off for that environment only (`isDepOptimizationDisabled` in Vite), so no
 * folder is written and a run killed halfway leaves none behind. A hook ordered `post` runs after
 * the Svelte plugin's.
 */
const noVitestDepsCache: Plugin = {
    name: 'oculus:no-vitest-deps-cache',
    configEnvironment: {
        order: 'post',
        handler(name, config) {
            if (name !== '__vitest__') return;
            config.optimizeDeps ??= {};
            config.optimizeDeps.noDiscovery = true;
            config.optimizeDeps.include = [];
        }
    }
};

const KIT_SERVER_PLUGIN = 'vite-plugin-sveltekit-compile';

/**
 * SvelteKit's `configureServer` (the plugin named above) runs `sync.init` and `sync.create`, which
 * rewrite .svelte-kit with truncating writes and delete the files of routes that are gone, and
 * every vitest start creates a Vite server and so runs it. Another vitest start or `svelte-check`
 * reading `.svelte-kit/types` meanwhile finds a file empty or missing. A server that has the
 * `__vitest__` environment skips that hook while `non-ambient.d.ts`, the last file `sync.create`
 * writes, exists in the kit folder `kitDir`, so a vitest run never writes the types once they
 * exist; `svelte-kit sync` (run by `npm run check`, which `npm run test:quick` and the landing run
 * before they start vitest), `vite build` and the development server write them. On a checkout
 * without them the hook runs once, which is how a lone `npx vitest run` gets its types;
 * `npx svelte-kit sync` refreshes them after the routes change. The development server and the
 * build do not have the environment and are not changed.
 */
async function syncTypesOnce(pending: Promise<Plugin[]>, kitDir: string): Promise<Plugin[]> {
    const plugins = await pending;
    const found = plugins.find((plugin) => plugin.name === KIT_SERVER_PLUGIN);
    const original = found?.configureServer;
    if (found === undefined || typeof original !== 'function') {
        throw new Error(`${KIT_SERVER_PLUGIN} has no configureServer function to wrap`);
    }
    const wrapped: Plugin = {
        ...found,
        configureServer(server) {
            const synced = join(server.config.root, kitDir, 'non-ambient.d.ts');
            if ('__vitest__' in server.environments && existsSync(synced)) return;
            return original.call(this, server);
        }
    };
    return plugins.map((plugin) => (plugin === found ? wrapped : plugin));
}

export default defineConfig(({ mode }) => {
    const app = mode === APP_MODE;
    const folders = app ? APP_FOLDERS : PLAIN_FOLDERS;
    // SvelteKit's analyse worker loads this config again with no mode of its own and takes the Vite
    // mode from `process.env.MODE` (node_modules/@sveltejs/kit/src/core/postbuild/analyse.js:42
    // calls load_config, which reads it at src/core/config/index.js:192), and the worker is
    // started with a copy of this process's environment. Setting it here is what lets the worker
    // find the output of the app's build.
    if (app) process.env.MODE = mode;
    const development = oculusViteServer(engineDir(), { out: folders.adapter });
    const kit = sveltekit({
        outDir: folders.kit,
        compilerOptions: {
            runes: ({ filename }) =>
                filename.split(/[/\\]/).includes('node_modules') ? undefined : true
        },
        adapter: development.adapter
    });

    return {
        // Vite reads the tsconfig SvelteKit generated for this build, so the app's build reads no
        // file under `.svelte-kit/`.
        ...(app ? { tsconfig: `${folders.kit}/tsconfig.json` } : {}),
        plugins: [
            componentBeforeStyle(),
            syncTypesOnce(kit, folders.kit),
            development.plugin,
            noVitestDepsCache
        ],
        server: {
            host: '127.0.0.1',
            port: loadLocal(engineDir()).port,
            strictPort: true
        },
        test: {
            // A test tagged slow starts a process, waits on a real timer, opens a socket or takes
            // 100 ms or more in a run of its own. `// @module-tag slow` in a file's head comment
            // tags the whole file, and `{ tags: ['slow'] }` tags a test or a describe. npm test
            // leaves tagged tests out and npm run test:slow runs them. The tree checks under
            // tests/checks, tagged or not, are left out of both and run by npm run test:checks with
            // no time limit, since a finding of theirs is a defect in the tree.
            tags: [
                {
                    name: 'slow',
                    description:
                        'Left out of npm test; npm run test:slow runs it, except under tests/checks.'
                }
            ],
            expect: { requireAssertions: true },
            // seti-ui's .less files are read as text (`?raw`) by ui/display/file-icons.ts. Vitest
            // empties every stylesheet it does not process, a file read as text included, so these
            // are listed.
            css: { include: [/seti-ui\/.*\.less/] },
            // Four workers, not one per core: two or three worktrees run this suite at once beside
            // the machine's own sessions, and a suite that takes every core makes the timed cases
            // of the others miss their limits under the load.
            maxWorkers: 4,
            // Two projects, each with its own files, so neither list is merged into the other's. A
            // file named *.client.test.ts runs in Svelte's client runtime, where effects and their
            // teardowns run (tests/ui/frame/client-runtime.ts), with Svelte inlined so it is
            // resolved with the browser's conditions rather than loaded as Node loads its server
            // build. Every other file runs in node against the server build, which renders a
            // component to a string.
            projects: [
                {
                    extends: true,
                    test: {
                        name: 'unit',
                        environment: 'node',
                        include: ['tests/**/*.test.ts', '!tests/**/*.client.test.ts']
                    }
                },
                {
                    extends: true,
                    resolve: { conditions: ['browser'] },
                    test: {
                        name: 'client',
                        environment: './tests/ui/frame/client-runtime.ts',
                        include: ['tests/**/*.client.test.ts'],
                        server: { deps: { inline: [/svelte/] } }
                    }
                }
            ]
        }
    };
});
