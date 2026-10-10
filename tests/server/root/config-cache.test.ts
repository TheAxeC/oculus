// Layer 2, server tests. The configuration is read by a request that asks for it, and the server
// context's cache parses the engine's config folder and the hub's `.oculus/config` folder again
// only when a file of either was written.

import { mkdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { handle } from '../../../src/hooks.server.ts';
import * as config from '../../../src/lib/data/sources/config.ts';
import type { LocalConfig } from '../../../src/lib/data/sources/config.ts';
import { carryingHandler, type OculusRequest } from '../../../src/lib/server/root/context.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { contextFixture } from './context-fixture.ts';

afterEach(() => {
    vi.restoreAllMocks();
});

/** The documents list a hub's layer of `layout.yml` holds, one entry per path. */
function layoutOf(...paths: string[]): string {
    const entries = paths.map((path) => `  - { label: "${path}", path: ${path}, group: help }\n`);
    return `docs:\n${entries.join('')}`;
}

/**
 * A server context over a scratch engine and a scratch hub, and what one request through the hook
 * reads of it. `local` is the context's own machine settings, which the cache reads the hub from.
 */
function serving(files: Record<string, string>, hubFiles: Record<string, string> = {}) {
    const engine = plantScratch('oculus-hook-config-', files, ['config/catalogs', 'config/text']);
    const hub = plantScratch('oculus-hook-hub-', hubFiles);
    const local: LocalConfig = {
        hub,
        port: 8791,
        claudeBin: 'claude',
        riteDapBin: 'rite_dap',
        accounts: [],
        calendars: [],
        mail: []
    };
    const context = contextFixture({ token: 'hook-token', engine, local });
    const request = {} as OculusRequest;
    carryingHandler(() => undefined, context)(request, {});
    const read = vi.spyOn(config, 'loadConfig');
    const ask = async (between?: () => void): Promise<unknown> => {
        let answer: unknown;
        const event = {
            platform: { req: request },
            locals: {} as App.Locals,
            url: new URL('http://127.0.0.1:8791/'),
            route: { id: '/' },
            request: new Request('http://127.0.0.1:8791/')
        } as unknown as Parameters<typeof handle>[0]['event'];
        await handle({
            event,
            resolve: () => {
                answer = event.locals.config().config;
                between?.();
                expect(event.locals.config().config).toBe(answer);
                return Promise.resolve(new Response(''));
            }
        });
        return answer;
    };
    return { engine, hub, local, read, ask, close: () => context.close() };
}

describe('the config cache of the server context', () => {
    it('parses a config folder once for requests over it, and again once a file of it is written', async () => {
        const served = serving({ 'config/behavior.yml': 'one: 1\n' });
        const file = join(served.engine, 'config', 'behavior.yml');
        expect(await served.ask()).toMatchObject({ one: 1 });
        expect(await served.ask()).toMatchObject({ one: 1 });
        expect(served.read).toHaveBeenCalledTimes(1);
        writeFileSync(file, 'one: 2\n');
        utimesSync(file, new Date(), new Date(Date.now() + 5000));
        expect(await served.ask()).toMatchObject({ one: 2 });
        expect(served.read).toHaveBeenCalledTimes(2);
        writeFileSync(join(served.engine, 'config', 'more.yml'), 'two: 3\n');
        expect(await served.ask()).toMatchObject({ one: 2, two: 3 });
        expect(served.read).toHaveBeenCalledTimes(3);
        served.close();
    });

    it('parses again for every request while an entry of the folder cannot be stat-ed', async () => {
        const served = serving({ 'config/behavior.yml': 'one: 1\n' });
        symlinkSync(join(served.engine, 'missing'), join(served.engine, 'config', 'dangling.yml'));
        await served.ask();
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it('keeps the one read of a request for the rest of it, whatever is written meanwhile', async () => {
        const served = serving({ 'config/behavior.yml': 'one: 1\n' });
        const file = join(served.engine, 'config', 'behavior.yml');
        expect(await served.ask(() => writeFileSync(file, 'one: 22222\n'))).toMatchObject({
            one: 1
        });
        expect(served.read).toHaveBeenCalledTimes(1);
        expect(await served.ask()).toMatchObject({ one: 22222 });
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it("parses again once a file of the hub's .oculus/config is written", async () => {
        const served = serving(
            { 'config/behavior.yml': 'one: 1\n' },
            { '.oculus/config/layout.yml': layoutOf('a.md') }
        );
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        expect(served.read).toHaveBeenCalledTimes(1);
        writeFileSync(join(served.hub, '.oculus/config/layout.yml'), layoutOf('a.md', 'b.md'));
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }, { path: 'b.md' }] });
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it("keeps its read when a file of the hub's .oculus outside config is written", async () => {
        const served = serving(
            { 'config/behavior.yml': 'one: 1\n' },
            { '.oculus/config/layout.yml': layoutOf('a.md') }
        );
        await served.ask();
        writeFileSync(join(served.hub, '.oculus/bookmarks.yml'), 'entries: []\n');
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(1);
        served.close();
    });

    it('reads the layer of the hub that local.yml names now', async () => {
        const served = serving(
            { 'config/behavior.yml': 'one: 1\n' },
            { '.oculus/config/layout.yml': layoutOf('a.md') }
        );
        const other = plantScratch('oculus-hook-other-', {
            '.oculus/config/layout.yml': layoutOf('other.md')
        });
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        served.local.hub = other;
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'other.md' }] });
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it('parses once for requests over a hub with no .oculus/config folder', async () => {
        const served = serving({ 'config/behavior.yml': 'one: 1\n' });
        await served.ask();
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(1);
        served.close();
    });

    it("parses again once the hub's .oculus/config folder is made, and again once it is removed", async () => {
        const served = serving({ 'config/behavior.yml': 'one: 1\n' });
        const folder = join(served.hub, '.oculus/config');
        await served.ask();
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, 'layout.yml'), layoutOf('a.md'));
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        expect(served.read).toHaveBeenCalledTimes(2);
        rmSync(folder, { recursive: true });
        expect((await served.ask()) as { docs?: unknown }).not.toHaveProperty('docs');
        expect(served.read).toHaveBeenCalledTimes(3);
        served.close();
    });

    it('keeps its read for a hub folder that does not exist', async () => {
        const served = serving({ 'config/behavior.yml': 'one: 1\n' });
        served.local.hub = join(served.hub, 'missing');
        await served.ask();
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(1);
        served.close();
    });
});
