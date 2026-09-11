// What POST /api/hook answers. The route itself is one line handing the request to
// handleHookRequest with the target hookTarget() builds, which is what this calls with a synthetic
// target instead: every case here is one Request object and a HookTarget the test owns, so nothing
// posts to a real server and no notification fires (the target's exec is a recording stub).

import { describe, expect, it } from 'vitest';
import {
    RateLimiter,
    handleHookRequest,
    type ExecFile,
    type HookTarget
} from '../../src/lib/server/hooks.ts';
import { HookStore } from '../../src/lib/server/sessions/hooks.ts';

const HOST = '127.0.0.1:8791';

function noopExec(): ExecFile {
    return (_file, _args, _options, callback) => callback(null);
}

function target(over: Partial<HookTarget> = {}): HookTarget {
    return {
        store: new HookStore(),
        hub: null,
        limiter: new RateLimiter(),
        config: {
            enabled: true,
            events: ['permission_prompt', 'idle_prompt', 'stop'],
            quietSeconds: 3
        },
        exec: noopExec(),
        ...over
    };
}

function request(
    headers: Record<string, string> = {},
    body = '{"hook_event_name":"Stop","session_id":"s1"}'
): Request {
    return new Request(`http://${HOST}/api/hook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body
    });
}

describe('POST /api/hook', () => {
    it('answers 200 for a request with no Origin header, as curl sends', async () => {
        const response = await handleHookRequest(request(), target());
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
    });

    it('refuses 403 for a foreign Origin', async () => {
        const response = await handleHookRequest(
            request({ origin: 'http://evil.example' }),
            target()
        );
        expect(response.status).toBe(403);
    });

    it('answers 200 for a same-origin Origin', async () => {
        const response = await handleHookRequest(request({ origin: `http://${HOST}` }), target());
        expect(response.status).toBe(200);
    });

    it('accepts 20 requests in one second and refuses the 21st with 429', async () => {
        const limiter = new RateLimiter();
        const now = Date.now();
        const into = target({ limiter, now: () => now });
        let last = new Response(null);
        for (let i = 0; i < 21; i += 1) {
            last = await handleHookRequest(request(), into);
        }
        expect(last.status).toBe(429);
    });

    it('answers 200 for a request with the 20th call, the one before the limit', async () => {
        const limiter = new RateLimiter();
        const now = Date.now();
        const into = target({ limiter, now: () => now });
        let last = new Response(null);
        for (let i = 0; i < 20; i += 1) {
            last = await handleHookRequest(request(), into);
        }
        expect(last.status).toBe(200);
    });

    it('answers 200 and records nothing for a non-JSON body', async () => {
        const store = new HookStore();
        const response = await handleHookRequest(request({}, 'not json at all'), target({ store }));
        expect(response.status).toBe(200);
        expect(store.latest('s1', Date.now())).toBeNull();
    });
});
