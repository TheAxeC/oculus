// Layer 2, server tests. The configuration is read by a request that asks for it, and the server
// context's cache parses the engine's config folder and the hub's `.oculus/config.yml` again only
// when a file of the folder or the settings file was written.

import { mkdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { handle } from '../../../../src/hooks.server.ts';
import * as config from '../../../../src/lib/data/sources/config.ts';
import type { LocalConfig } from '../../../../src/lib/data/sources/config.ts';
import { carryingHandler, type OculusRequest } from '../../../../src/lib/server/root/context.ts';
import { carriedOf, target } from '../../../../src/lib/server/edit/writes.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';
import { plantState, workspaceOf } from '../../../fixtures/hubs/workspace.ts';
import { writeState } from '../../../../src/lib/server/files/workspace/state.ts';
import { contextFixture } from '../context-fixture.ts';
import { createConfigCache } from '../../../../src/lib/server/root/process/config-cache.ts';
import type { Finding } from '../../../../src/lib/data/model/index.ts';

afterEach(() => {
    vi.restoreAllMocks();
});

/** The documents list a hub's settings file holds, one entry per path. */
function layoutOf(...paths: string[]): string {
    const entries = paths.map((path) => `  - { label: "${path}", path: ${path}, group: help }\n`);
    return `docs:\n${entries.join('')}`;
}

/**
 * A server context over a scratch engine and a scratch hub, and what one request through the hook
 * reads of it. The hub is the one folder of the open workspace and its primary when it holds
 * `.oculus/config.yml`, which the cache reads the hub's settings from.
 */
function serving(files: Record<string, string>, hubFiles: Record<string, string> = {}) {
    const engine = plantScratch('oculus-hook-config-', files, ['config/catalogs', 'config/text']);
    const hub = plantScratch('oculus-hook-hub-', hubFiles);
    const local: LocalConfig = {
        port: 8791,
        claudeBin: 'claude',
        riteDapBin: 'rite_dap',
        accounts: [],
        calendars: [],
        mail: [],
        downloads: []
    };
    const state = plantState([{ name: 'hub', dir: hub }], 'hub');
    const context = contextFixture({
        token: 'hook-token',
        engine,
        local,
        workspace: workspaceOf(state)
    });
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
    return { engine, hub, state, local, read, ask, close: () => context.close() };
}

/**
 * A server context over a scratch engine and a workspace of two hubs, the primary `hub` and `lab`,
 * each with its own `.oculus/config.yml`, and what one request that builds a write target reads of
 * the other hubs. `parsesOf` counts the parses made of a folder's settings since the context was
 * built.
 */
function servingHubs() {
    const engine = plantScratch(
        'oculus-hook-config-',
        { 'config/defaults/behavior.yml': 'one: 1\n' },
        ['config/catalogs', 'config/text']
    );
    const hub = plantScratch('oculus-hook-hub-', { '.oculus/config.yml': layoutOf('hub.md') });
    const lab = plantScratch('oculus-hook-lab-', { '.oculus/config.yml': layoutOf('lab.md') });
    const state = plantState(
        [
            { name: 'hub', dir: hub },
            { name: 'lab', dir: lab }
        ],
        'hub'
    );
    const context = contextFixture({ token: 'hook-token', engine, workspace: workspaceOf(state) });
    const read = vi.spyOn(config, 'loadConfig');
    const parsesOf = (dir: string): number =>
        read.mock.calls.filter(([, options]) => options?.hub === dir).length;
    const ask = (): Record<string, unknown>[] => {
        const into = target(engine, context.configCache.read().config, carriedOf(context));
        return (into.hubs ?? []).map((one) => one.config.merged);
    };
    return { engine, hub, lab, state, context, read, parsesOf, ask, close: () => context.close() };
}

describe('the config cache of the server context', () => {
    it('parses a config folder once for requests over it, and again once a file of it is written', async () => {
        const served = serving({ 'config/defaults/behavior.yml': 'one: 1\n' });
        const file = join(served.engine, 'config', 'defaults', 'behavior.yml');
        expect(await served.ask()).toMatchObject({ one: 1 });
        expect(await served.ask()).toMatchObject({ one: 1 });
        expect(served.read).toHaveBeenCalledTimes(1);
        writeFileSync(file, 'one: 2\n');
        utimesSync(file, new Date(), new Date(Date.now() + 5000));
        expect(await served.ask()).toMatchObject({ one: 2 });
        expect(served.read).toHaveBeenCalledTimes(2);
        writeFileSync(join(served.engine, 'config', 'defaults', 'more.yml'), 'two: 3\n');
        expect(await served.ask()).toMatchObject({ one: 2, two: 3 });
        expect(served.read).toHaveBeenCalledTimes(3);
        served.close();
    });

    it('parses again for every request while an entry of the folder cannot be stat-ed', async () => {
        const served = serving({ 'config/defaults/behavior.yml': 'one: 1\n' });
        symlinkSync(join(served.engine, 'missing'), join(served.engine, 'config', 'dangling.yml'));
        await served.ask();
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it('keeps the one read of a request for the rest of it, whatever is written meanwhile', async () => {
        const served = serving({ 'config/defaults/behavior.yml': 'one: 1\n' });
        const file = join(served.engine, 'config', 'defaults', 'behavior.yml');
        expect(await served.ask(() => writeFileSync(file, 'one: 22222\n'))).toMatchObject({
            one: 1
        });
        expect(served.read).toHaveBeenCalledTimes(1);
        expect(await served.ask()).toMatchObject({ one: 22222 });
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it("parses again once the hub's .oculus/config.yml is written", async () => {
        const served = serving(
            { 'config/defaults/behavior.yml': 'one: 1\n' },
            { '.oculus/config.yml': layoutOf('a.md') }
        );
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        expect(served.read).toHaveBeenCalledTimes(1);
        writeFileSync(join(served.hub, '.oculus/config.yml'), layoutOf('a.md', 'b.md'));
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }, { path: 'b.md' }] });
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it("keeps its read when a file of the hub's .oculus other than config.yml is written", async () => {
        const served = serving(
            { 'config/defaults/behavior.yml': 'one: 1\n' },
            { '.oculus/config.yml': layoutOf('a.md') }
        );
        await served.ask();
        writeFileSync(join(served.hub, '.oculus/bookmarks.yml'), 'entries: []\n');
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(1);
        served.close();
    });

    it('reads the settings file of the primary hub the open workspace names now', async () => {
        const served = serving(
            { 'config/defaults/behavior.yml': 'one: 1\n' },
            { '.oculus/config.yml': layoutOf('a.md') }
        );
        const other = plantScratch('oculus-hook-other-', {
            '.oculus/config.yml': layoutOf('other.md')
        });
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        writeState(served.state, {
            open: null,
            recent: [],
            unsaved: { folders: [{ name: 'other', path: other }], primary: 'other' }
        });
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'other.md' }] });
        expect(served.read).toHaveBeenCalledTimes(2);
        served.close();
    });

    it('parses once for requests over a folder with no .oculus/config.yml', async () => {
        const served = serving({ 'config/defaults/behavior.yml': 'one: 1\n' });
        await served.ask();
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(1);
        served.close();
    });

    it("parses again once the hub's .oculus/config.yml is made, and again once it is removed", async () => {
        const served = serving({ 'config/defaults/behavior.yml': 'one: 1\n' });
        const file = join(served.hub, '.oculus/config.yml');
        await served.ask();
        mkdirSync(join(served.hub, '.oculus'), { recursive: true });
        writeFileSync(file, layoutOf('a.md'));
        expect(await served.ask()).toMatchObject({ docs: [{ path: 'a.md' }] });
        expect(served.read).toHaveBeenCalledTimes(2);
        rmSync(file);
        expect((await served.ask()) as { docs?: unknown }).not.toHaveProperty('docs');
        expect(served.read).toHaveBeenCalledTimes(3);
        served.close();
    });

    it("parses another hub's settings once for requests over them, and again once its .oculus/config.yml is written", () => {
        const served = servingHubs();
        expect(served.ask()).toMatchObject([{ docs: [{ path: 'lab.md' }] }]);
        expect(served.ask()).toMatchObject([{ docs: [{ path: 'lab.md' }] }]);
        expect(served.parsesOf(served.lab)).toBe(1);
        writeFileSync(join(served.lab, '.oculus/config.yml'), layoutOf('lab.md', 'more.md'));
        expect(served.ask()).toMatchObject([{ docs: [{ path: 'lab.md' }, { path: 'more.md' }] }]);
        expect(served.parsesOf(served.lab)).toBe(2);
        served.close();
    });

    it('keeps no parse for a hub outside the open workspace', () => {
        const served = servingHubs();
        const outside = plantScratch('oculus-hook-outside-', {
            '.oculus/config.yml': layoutOf('outside.md')
        });
        served.ask();
        served.ask();
        expect(served.parsesOf(served.lab)).toBe(1);
        const settings = carriedOf(served.context).settings;
        expect(settings(outside).config).toMatchObject({ docs: [{ path: 'outside.md' }] });
        settings(outside);
        expect(served.parsesOf(outside)).toBe(2);
        writeState(served.state, {
            open: null,
            recent: [],
            unsaved: { folders: [{ name: 'hub', path: served.hub }], primary: 'hub' }
        });
        settings(served.lab);
        settings(served.lab);
        expect(served.parsesOf(served.lab)).toBe(3);
        served.close();
    });

    it('says the findings of a parse a server reader made once, at the next request', () => {
        const engine = plantScratch(
            'oculus-hook-config-',
            { 'config/defaults/behavior.yml': 'one: 1\n' },
            ['config/catalogs', 'config/text']
        );
        const finding: Finding = {
            file: join(engine, 'config/defaults/behavior.yml'),
            key: 'one',
            message: 'bad'
        };
        const said: Finding[][] = [];
        const cache = createConfigCache({
            engine,
            hub: () => null,
            workspace: () => null,
            load: () => ({ config: { one: 1 }, findings: [finding], from: {} }),
            loadHub: () => ({ config: {}, findings: [], from: {} }),
            report: (findings) => said.push(findings),
            primary: () => null,
            others: () => [],
            folders: () => [],
            vocabs: () => ({
                vocabs: { primary: null, lists: {}, order: [], own: {}, ownCollections: [] },
                files: []
            })
        });
        cache.quiet();
        expect(said).toEqual([]);
        cache.read();
        expect(said).toEqual([[finding]]);
        cache.read();
        cache.quiet();
        expect(said).toEqual([[finding]]);
        writeFileSync(join(engine, 'config/defaults/behavior.yml'), 'one: 2\n');
        utimesSync(
            join(engine, 'config/defaults/behavior.yml'),
            new Date(),
            new Date(Date.now() + 5000)
        );
        cache.read();
        expect(said).toEqual([[finding], [finding]]);
    });

    it("parses the engine's folder alone once for the writes that read it, and again once a file of it is written", () => {
        const served = servingHubs();
        const defaults = carriedOf(served.context).defaults;
        expect(defaults().config).toMatchObject({ one: 1 });
        expect(defaults().config).toMatchObject({ one: 1 });
        const alone = (): number =>
            served.read.mock.calls.filter(([, options]) => options?.hub === undefined).length;
        expect(alone()).toBe(1);
        writeFileSync(join(served.engine, 'config/defaults/behavior.yml'), 'one: 2\n');
        expect(defaults().config).toMatchObject({ one: 2 });
        expect(alone()).toBe(2);
        served.close();
    });

    it('keeps its read for a primary hub folder that does not exist', async () => {
        const served = serving({ 'config/defaults/behavior.yml': 'one: 1\n' });
        writeState(served.state, {
            open: null,
            recent: [],
            unsaved: {
                folders: [{ name: 'hub', path: join(served.hub, 'missing') }],
                primary: 'hub'
            }
        });
        await served.ask();
        await served.ask();
        expect(served.read).toHaveBeenCalledTimes(1);
        served.close();
    });
});
