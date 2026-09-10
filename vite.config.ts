import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        sveltekit({
            // Runes everywhere except in dependencies. Can go in svelte 6.
            compilerOptions: {
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes('node_modules') ? undefined : true
            },
            adapter: adapter()
        })
    ],
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        expect: { requireAssertions: true }
    }
});
