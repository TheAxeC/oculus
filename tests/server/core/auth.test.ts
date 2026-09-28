// Layer 2, server tests. The one origin rule every request under /api/ passes, and the token and
// body checks a write adds to it. The rule reads two headers and refuses a request with neither;
// the paths that admit one are the guard's, in tests/server/root/hooks-server.test.ts.

import { describe, expect, it } from 'vitest';
import {
    TOKEN_HEADER,
    gatedBody,
    sameOrigin,
    tokenedBody
} from '../../../src/lib/server/core/auth.ts';

const TOKEN = 'the-token-of-this-process';

describe('sameOrigin', () => {
    it("admits an Origin naming the request's own host", () => {
        const headers = new Headers({ origin: 'http://oculus.local:8790' });
        expect(sameOrigin(headers, 'oculus.local:8790')).toBe(true);
    });

    it('refuses a same-site request that names no Origin', () => {
        expect(sameOrigin(new Headers({ 'sec-fetch-site': 'same-site' }), '127.0.0.1:8791')).toBe(
            false
        );
    });

    it('refuses a request with neither header', () => {
        expect(sameOrigin(new Headers(), '127.0.0.1:8791')).toBe(false);
    });
});

/** A write as a client sends it, with the headers a case names. */
function write(headers: Record<string, string>, body = '{"kind":"one"}'): Request {
    return new Request('http://127.0.0.1:8791/api/write', { method: 'POST', headers, body });
}

describe('gatedBody', () => {
    it('refuses a write that carries no token', async () => {
        const answer = await gatedBody(write({}), TOKEN);
        expect(answer).toBeInstanceOf(Response);
        expect((answer as Response).status).toBe(403);
    });

    it('reads the body of a write that carries the token', async () => {
        const answer = await gatedBody(write({ [TOKEN_HEADER]: TOKEN }), TOKEN);
        expect(answer).toEqual({ kind: 'one' });
    });
});

describe('tokenedBody', () => {
    const SHAPE = { headers: { 'cache-control': 'no-store' }, fields: { ok: false } };

    it('refuses an empty process token, a missing one and a wrong one, in the route shape', async () => {
        for (const [asked, held] of [
            [{ [TOKEN_HEADER]: '' }, ''],
            [{}, TOKEN],
            [{ [TOKEN_HEADER]: 'another' }, TOKEN]
        ] as const) {
            const answer = (await tokenedBody(write(asked), held, SHAPE)) as Response;
            expect(answer.status).toBe(403);
            expect(answer.headers.get('cache-control')).toBe('no-store');
            expect(await answer.json()).toEqual({
                ok: false,
                error: 'the write token is missing or stale'
            });
        }
    });

    it('refuses a body that does not parse, and hands back any body that does', async () => {
        const bad = (await tokenedBody(write({ [TOKEN_HEADER]: TOKEN }, '{'), TOKEN)) as Response;
        expect(bad.status).toBe(400);
        expect(await bad.json()).toEqual({ error: 'the body is not JSON' });
        expect(await tokenedBody(write({ [TOKEN_HEADER]: TOKEN }, '[1]'), TOKEN)).toEqual({
            body: [1]
        });
    });

    it("answers each refusal in the route's own words when the shape names them", async () => {
        const words = { token: 'token', json: 'not-json' };
        const stale = (await tokenedBody(write({}), TOKEN, { words })) as Response;
        expect(stale.status).toBe(403);
        expect(await stale.json()).toEqual({ error: 'token' });
        const bad = (await tokenedBody(write({ [TOKEN_HEADER]: TOKEN }, '{'), TOKEN, {
            words
        })) as Response;
        expect(bad.status).toBe(400);
        expect(await bad.json()).toEqual({ error: 'not-json' });
    });
});

/** Status, body and content type, the three things a JSON answer is to its reader. */
async function shape(
    response: Response
): Promise<{ status: number; body: string; type: string | null }> {
    return {
        status: response.status,
        body: await response.text(),
        type: response.headers.get('content-type')
    };
}

describe('a JSON answer', () => {
    it('answers the status, body and content type a hand-built one did', async () => {
        const refused = await gatedBody(write({}), TOKEN);
        expect(await shape(refused as Response)).toEqual(
            await shape(
                new Response(JSON.stringify({ error: 'forbidden' }), {
                    status: 403,
                    headers: { 'content-type': 'application/json' }
                })
            )
        );
        for (const body of ['[1]', '{']) {
            const bad = await gatedBody(write({ [TOKEN_HEADER]: TOKEN }, body), TOKEN);
            expect(await shape(bad as Response)).toEqual(
                await shape(
                    new Response(JSON.stringify({ error: 'bad body' }), {
                        status: 400,
                        headers: { 'content-type': 'application/json' }
                    })
                )
            );
        }
    });
});
