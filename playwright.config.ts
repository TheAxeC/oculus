// The browser layer. Every view test under tests/views/ renders a component to a string; these open
// the served application in Chrome and press the controls, which is the only way the two HTML5 drags
// (a Focus card onto a lane, a collection card onto another) can be checked at all.
//
// It does not build, and it does not have to be told to: tests/browser/serve.ts refuses to serve a
// build that is older than src/ or config/, since src/server.ts imports build/handler.js.
//
// Only `*.spec.ts` is collected. tests/browser/ also holds the vitest file over the layer's own
// helpers, and a suite that started a server to read a mtime would be the wrong kind of check.
//
// The browser is the installed Google Chrome through `channel: 'chrome'`, so nothing downloads one.
// The specs write to one hub, so they run one at a time and in one worker.

import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/browser',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: 'list',
    webServer: {
        command: 'node tests/browser/serve.ts',
        url: 'http://127.0.0.1:8792/',
        reuseExistingServer: false,
        timeout: 60000,
        // The layer takes its copy of the hub away when it is signalled. Without this the server is
        // killed, no handler of it runs, and the copy and tests/browser/.hub stay behind.
        gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 }
    },
    projects: [
        {
            name: 'chrome',
            use: { channel: 'chrome', headless: true, baseURL: 'http://127.0.0.1:8792' }
        }
    ]
});
