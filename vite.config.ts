// Layer 2, server. Vite development and preview use one plugin to carry ServerContext into Kit,
// and one more compiles a Svelte component before its style module is answered
// (src/lib/server/root/style-first.ts).

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { engineDir, loadLocal } from './src/lib/data/sources/config.ts';
import { componentBeforeStyle } from './src/lib/server/root/style-first.ts';
import { oculusViteServer } from './src/lib/server/root/vite-plugin.ts';

const development = oculusViteServer(engineDir());

export default defineConfig({
    plugins: [
        componentBeforeStyle(),
        sveltekit({
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
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        // A file tagged slow (`// @module-tag slow` in its head comment) has cases that time out or
        // fail on a loaded machine, so npm test and npm run test:checks leave it out and npm run
        // test:slow runs it. The tree checks under tests/checks are left out of npm test and run by
        // npm run test:checks with no time limit, since a finding of theirs is a defect in the tree.
        tags: [{ name: 'slow', description: 'Left out of npm test; npm run test:slow runs it.' }],
        expect: { requireAssertions: true },
        // Four workers, not one per core: two or three worktrees run this suite at once beside the
        // machine's own sessions, and a suite that takes every core makes the timed cases of the
        // others miss their limits under the load.
        maxWorkers: 4
    }
});
