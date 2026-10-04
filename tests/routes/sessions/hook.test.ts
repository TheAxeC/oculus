// Layer 2, route tests. What POST /api/hook answers. The route itself is one line handing the
// request to handleHookRequest with the request context's HookTarget and the notification settings
// it reads at the request, which is what this calls with a fixture: every case here is one Request
// object and a target the test owns, so nothing posts to a real server and no notification fires
// (the target's exec is a recording stub).

import { describe, expect, it } from 'vitest';
import {
    RateLimiter,
    handleHookRequest,
    notifyConfig,
    type ExecFile,
    type HookRequestTarget
} from '../../../src/lib/server/root/hooks.ts';
import { HookStore } from '../../../src/lib/server/sessions/stores/hooks.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';

const HOST = '127.0.0.1:8791';

function noopExec(): ExecFile {
    return (_file, _args, _options, callback) => callback(null);
}

function target(over: Partial<HookRequestTarget> = {}): HookRequestTarget {
    const server = contextFixture();
    return {
        ...server.hooks,
        config: notifyConfig({}),
        store: new HookStore(),
        hub: null,
        limiter: new RateLimiter(),
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
    it("answers 200 with ok for the hook's post", async () => {
        const response = await handleHookRequest(request(), target());
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
    });

    it('accepts 20 requests in one second and refuses the 21st with 429', async () => {
        const limiter = new RateLimiter();
        const now = Date.now();
        const into = target({ limiter, now: () => now });
        const statuses: number[] = [];
        for (let i = 0; i < 21; i += 1) {
            statuses.push((await handleHookRequest(request(), into)).status);
        }
        expect(statuses).toEqual([...Array<number>(20).fill(200), 429]);
    });

    it('answers 200 and records nothing for a non-JSON body', async () => {
        const store = new HookStore();
        const response = await handleHookRequest(request({}, 'not json at all'), target({ store }));
        expect(response.status).toBe(200);
        expect(store.latest('s1', Date.now())).toBeNull();
    });
});
