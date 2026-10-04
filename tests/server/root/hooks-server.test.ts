// Layer 2, server tests. The configuration is read once a request that asks for it.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, vi } from 'vitest';
import { handle } from '../../../src/hooks.server.ts';
import * as config from '../../../src/lib/data/sources/config.ts';
import { carryingHandler, type OculusRequest } from '../../../src/lib/server/root/context.ts';
import { it } from '../../fixtures/scratch.ts';
import { contextFixture } from './context-fixture.ts';

afterEach(() => {
    vi.restoreAllMocks();
});

type Resolve = Parameters<typeof handle>[0]['resolve'];

/** This checkout, whose tracked config/ the hook reads; nothing here writes to it. */
const ENGINE = fileURLToPath(new URL('../../..', import.meta.url));

/** One request through the hook, answered by `resolve`, over a context the case closes. */
async function through(resolve: Resolve): Promise<App.Locals> {
    const context = contextFixture({ token: 'hook-token', engine: ENGINE });
    const request = {} as OculusRequest;
    carryingHandler(() => undefined, context)(request, {});
    const locals = {} as App.Locals;
    const event = {
        platform: { req: request },
        locals,
        url: new URL('http://127.0.0.1:8791/'),
        route: { id: '/' },
        request: new Request('http://127.0.0.1:8791/')
    } as unknown as Parameters<typeof handle>[0]['event'];
    await handle({ event, resolve });
    context.close();
    return locals;
}

describe('the server hook', () => {
    it('reads it once for a page, whose title and load function share the read', async () => {
        const read = vi.spyOn(config, 'loadConfig');
        let html: string | undefined;
        await through(async ({ locals }, options) => {
            locals.config();
            locals.config();
            const page = '<title>%oculus.title%</title>';
            html = await options?.transformPageChunk?.({ html: page, done: true });
            return new Response(html);
        });
        expect(read).toHaveBeenCalledOnce();
        expect(html).toMatch(/^<title>[^%]+<\/title>$/);
    });
});
