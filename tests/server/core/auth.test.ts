// Layer 2, server tests. The token and body checks a write adds.

import { describe, expect, it } from 'vitest';
import { TOKEN_HEADER, tokenedBody } from '../../../src/lib/server/core/auth.ts';

const TOKEN = 'the-token-of-this-process';

/** A write as a client sends it, with the headers a case names. */
function write(headers: Record<string, string>, body = '{"kind":"one"}'): Request {
    return new Request('http://127.0.0.1:8791/api/write', { method: 'POST', headers, body });
}

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
});
