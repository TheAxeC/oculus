// Layer 4, server test. What the Svelte language server runs before the reader approves the code of
// a repository: the server's own process starts, answers, and never imports the repository's
// `svelte.config.js` or `vite.config.js`. The fixture repository's two configs each write a marker
// file beside themselves when they are imported, so a marker is the proof that code of the
// repository ran.
//
// The server is the real `svelte-language-server` of oculus's own `node_modules`, started through
// the relay as the page starts it; the page is a recording sink.
//
// After the page's `approve` message for the configuration, the server restarts trusted and imports
// `svelte.config.js`, so its marker appears. The server imports `vite.config.js` only through the
// Svelte config's own preprocessor, which the fixture's config does not use, so the Vite marker is
// absent in both cases and the approval over the Vite file's text is the unit tests'.
//
// What this does not cover: the approval confirm dialog and the palette rows of the page, and the
// server's features. Those are checked by hand in the browser.
// @module-tag slow: starts the real Svelte language server.

import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { ownFolder } from '../../../../src/lib/server/machine/lsp/servers.ts';
import { spawnChild } from '../../../../src/lib/server/machine/lsp/held/process.ts';
import type { Relay } from '../../../../src/lib/server/machine/lsp/relay/relay.ts';
import { frame, makeRelay, open, pageFile, recordingSink } from './lsp-fixture.ts';

/** The config file's text: it writes `<name>.marker` beside itself when it is imported. */
const config = (name: string): string =>
    `import { writeFileSync } from 'node:fs';\n` +
    `writeFileSync(new URL('./${name}.marker', import.meta.url), 'ran');\n` +
    `export default {};\n`;

/** A repository with a Svelte file and the two configs the server looks for. */
function repository(): string {
    const dir = realpathSync(scratchDir('oculus-svelte-trust-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
        join(dir, 'src', 'App.svelte'),
        '<script lang="ts">\n  let n = 1;\n</script>\n{n}\n'
    );
    writeFileSync(join(dir, 'svelte.config.js'), config('svelte'));
    writeFileSync(join(dir, 'vite.config.js'), config('vite'));
    writeFileSync(join(dir, 'package.json'), '{ "type": "module" }\n');
    return dir;
}

let live: Relay | null = null;

afterEach(async () => {
    await live?.close();
    live = null;
});

/** Wait until a condition holds, polling in real time up to `ms`. */
async function until(condition: () => boolean, ms: number): Promise<boolean> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (condition()) return true;
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return condition();
}

/** The relay and the recording page, with the Svelte file of the repository open and ready. */
async function started(): Promise<{
    dir: string;
    relay: Relay;
    page: ReturnType<typeof recordingSink>;
}> {
    const dir = repository();
    const relay = makeRelay({
        roots: () => [{ key: 'repo', dir }],
        spawn: spawnChild,
        own: { oculus: ownFolder(), node: process.execPath }
    });
    live = relay;
    const page = recordingSink();
    open(relay, page.sink, 'lsp:svelte', pageFile('repo', 'src/App.svelte'), 'svelte');
    const ready = await until(
        () => page.frames.some((one) => one.payload.state === 'ready'),
        20_000
    );
    expect(ready).toBe(true);
    return { dir, relay, page };
}

/** Ask the server for the symbols of the Svelte file, as request `id`, and wait for the answer. */
async function askSymbols(
    relay: Relay,
    page: ReturnType<typeof recordingSink>,
    id: number
): Promise<boolean> {
    relay.inbound(
        page.sink,
        frame('lsp:svelte', {
            jsonrpc: '2.0',
            id,
            method: 'textDocument/documentSymbol',
            params: { textDocument: { uri: pageFile('repo', 'src/App.svelte') } }
        })
    );
    return until(
        () => page.frames.some((one) => one.payload.id === id && one.payload.error === undefined),
        20_000
    );
}

/** The key of the configuration the last `choices` message held, or null for none yet. */
function keyShown(page: ReturnType<typeof recordingSink>): string | null {
    const held = page.frames
        .map((one) => one.payload as { oculus?: string; config?: { key?: string } })
        .filter((one) => one.oculus === 'choices' && one.config?.key !== undefined);
    return held.at(-1)?.config?.key ?? null;
}

describe('the Svelte server and the approval of the repository configuration', () => {
    it('imports the Svelte config of the repository once the configuration is approved', async () => {
        const { dir, relay, page } = await started();
        // The approval names the key of the configuration the list showed.
        relay.inbound(page.sink, frame('lsp:svelte', { oculus: 'choices', root: 'repo' }));
        const shown = await until(() => keyShown(page) !== null, 10_000);
        expect(shown).toBe(true);
        relay.inbound(
            page.sink,
            frame('lsp:svelte', {
                oculus: 'approve',
                root: 'repo',
                approval: { kind: 'config', key: keyShown(page) }
            })
        );
        const restarted = await until(
            () => page.frames.filter((one) => one.payload.state === 'ready').length >= 2,
            30_000
        );
        expect(restarted).toBe(true);
        expect(await askSymbols(relay, page, 8)).toBe(true);
        const imported = await until(() => existsSync(join(dir, 'svelte.marker')), 20_000);
        expect(imported).toBe(true);
    }, 90_000);

    it('answers a request and leaves no marker of the repository config it would import', async () => {
        const { dir, relay, page } = await started();
        expect(await askSymbols(relay, page, 7)).toBe(true);
        expect([
            existsSync(join(dir, 'svelte.marker')),
            existsSync(join(dir, 'vite.marker'))
        ]).toEqual([false, false]);
    }, 60_000);
});
