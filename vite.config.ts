// Layer 2, server. Vite development and preview use one plugin to carry ServerContext into Kit.

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { engineDir, loadLocal } from './src/lib/data/sources/config.ts';
import { oculusViteServer } from './src/lib/server/vite-plugin.ts';

const development = oculusViteServer(engineDir());

export default defineConfig({
    plugins: [
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
        expect: { requireAssertions: true }
    }
});
