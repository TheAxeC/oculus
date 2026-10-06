// Layer 2, server. Vite development and preview use one plugin to carry ServerContext into Kit,
// and one more compiles a Svelte component before its style module is answered
// (src/lib/server/root/style-first.ts).
//
// The config is a function of the Vite mode. Under the mode `app`, which the desktop host's build
// runs (`vite build --mode app`), SvelteKit writes `.svelte-kit-app/` and the adapter writes
// `build-app/`, and Vite reads that folder's tsconfig, so the build neither writes nor reads a
// folder `npm run build`, `npm run check` or the dev server use. Every other mode writes
// `.svelte-kit/` and `build/`.

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { engineDir, loadLocal } from './src/lib/data/sources/config.ts';
import { componentBeforeStyle } from './src/lib/server/root/style-first.ts';
import {
    APP_FOLDERS,
    APP_MODE,
    PLAIN_FOLDERS
} from './src/lib/server/root/process/build-folders.ts';
import { oculusViteServer } from './src/lib/server/root/vite-plugin.ts';

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

    return {
        // Vite reads the tsconfig SvelteKit generated for this build, so the app's build reads no
        // file under `.svelte-kit/`.
        ...(app ? { tsconfig: `${folders.kit}/tsconfig.json` } : {}),
        plugins: [
            componentBeforeStyle(),
            sveltekit({
                outDir: folders.kit,
                compilerOptions: {
                    runes: ({ filename }) =>
                        filename.split(/[/\\]/).includes('node_modules') ? undefined : true
                },
                adapter: development.adapter
            }),
            development.plugin
        ],
        server: {
            host: '127.0.0.1',
            port: loadLocal(engineDir()).port,
            strictPort: true
        },
        test: {
            // A test tagged slow starts a process, waits on a real timer, opens a socket or takes
            // 100 ms or more in a run of its own. `// @module-tag slow` in a file's head comment
            // tags the whole file, and `{ tags: ['slow'] }` tags a test or a describe. npm test and
            // npm run test:checks leave tagged tests out and npm run test:slow runs them. The tree
            // checks under tests/checks are left out of npm test and run by npm run test:checks
            // with no time limit, since a finding of theirs is a defect in the tree.
            tags: [
                { name: 'slow', description: 'Left out of npm test; npm run test:slow runs it.' }
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
