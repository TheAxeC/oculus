// Layer 2, server tests. Kit's handle reads the ServerContext off the raw request and puts it,
// with its token, on the event's locals; the built entry's wrapper is what puts it on the request.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { handle } from '../../src/hooks.server.ts';
import { carryingHandler, type OculusRequest } from '../../src/lib/server/context.ts';
import { contextFixture } from './context-fixture.ts';

describe('the server hook', () => {
    it('puts the carried context and its token on locals before resolving', async () => {
        const context = contextFixture({ token: 'hook-token' });
        const request = {} as OculusRequest;
        const handler = carryingHandler((held: IncomingMessage) => {
            expect((held as OculusRequest).oculus).toBe(context);
        }, context);
        handler(request, {} as ServerResponse);

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
});
