// Layer 2, server tests. The configuration is read by a request that asks for it, and the server
// context's cache parses the config folder again only when a file of it was written.

import { symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { handle } from '../../../src/hooks.server.ts';
import * as config from '../../../src/lib/data/sources/config.ts';
import { carryingHandler, type OculusRequest } from '../../../src/lib/server/root/context.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { contextFixture } from './context-fixture.ts';

afterEach(() => {
    vi.restoreAllMocks();
});

/** A server context over a scratch engine, and what one request through the hook reads of it. */
function serving(files: Record<string, string>) {
    const engine = plantScratch('oculus-hook-config-', files, ['config/catalogs', 'config/text']);
    const context = contextFixture({ token: 'hook-token', engine });
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
    return { engine, read, ask, close: () => context.close() };
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
});
