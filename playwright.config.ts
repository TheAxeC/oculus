// The browser layer. Every view test under tests/views/ renders a component to a string; these open
// the served application in Chrome and press the controls, which is the only way the two HTML5 drags
// (a Focus card onto a lane, a collection card onto another) can be checked at all.
//
// It does not build. Run `npm run build` first, since src/server.ts imports build/handler.js.
//
// The browser is the installed Google Chrome through `channel: 'chrome'`, so nothing downloads one.
// The specs write to one hub, so they run one at a time and in one worker.

import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/browser',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: 'list',
    webServer: {
        command: 'node tests/browser/serve.ts',
        url: 'http://127.0.0.1:8792/',
        reuseExistingServer: false,
        timeout: 60000
    },
    projects: [
        {
            name: 'chrome',
            use: { channel: 'chrome', headless: true, baseURL: 'http://127.0.0.1:8792' }
        }
    ]
});
