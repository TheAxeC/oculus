// Layer 2, server tests. Kit's handle reads the ServerContext off the raw request and puts it,
// with its token, on the event's locals; the built entry's wrapper is what puts it on the request.
// The configuration is read once a request that asks for it, and not at all by one that does not.

import type { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handle } from '../../../src/hooks.server.ts';
import * as config from '../../../src/lib/data/sources/config.ts';
import { carryingHandler, type OculusRequest } from '../../../src/lib/server/core/context.ts';
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
        request: new Request('http://127.0.0.1:8791/')
    } as unknown as Parameters<typeof handle>[0]['event'];
    await handle({ event, resolve });
    context.close();
    return locals;
}

describe('the server hook', () => {
    it('puts the carried context and its token on locals before resolving', async () => {
        const context = contextFixture({ token: 'hook-token' });
        const request = {} as OculusRequest;
        const handler = carryingHandler((held: IncomingMessage) => {
            expect((held as OculusRequest).oculus).toBe(context);
        }, context);
        handler(request, {});

        const locals = {} as App.Locals;
        const resolve = vi.fn(() => Promise.resolve(new Response('<title>%oculus.title%</title>')));
        const event = {
            platform: { req: request },
            locals,
            request: new Request('http://127.0.0.1:8791/')
        } as unknown as Parameters<typeof handle>[0]['event'];
        await handle({ event, resolve });

        expect(locals.server).toBe(context);
        expect(locals.token).toBe('hook-token');
        expect(resolve).toHaveBeenCalledOnce();
        context.close();
    });

    it('refuses a request that carries no context', () => {
        const event = {
            platform: undefined,
            locals: {},
            request: new Request('http://127.0.0.1:8791/')
        } as unknown as Parameters<typeof handle>[0]['event'];
        expect(() => handle({ event, resolve: vi.fn() })).toThrow(
            'oculus server context is absent from event.platform.req'
        );
    });

    it('reads the configuration for no request that never asks for it', async () => {
        // revert: src/hooks.server.ts:19 => event.locals.token = context.token; loadConfig('.');
        const read = vi.spyOn(config, 'loadConfig');
        await through(vi.fn(() => Promise.resolve(new Response('{}'))));
        expect(read).not.toHaveBeenCalled();
    });

    it('reads it once for a page, whose title and load function share the read', async () => {
        // revert: src/hooks.server.ts:22 => delete
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
