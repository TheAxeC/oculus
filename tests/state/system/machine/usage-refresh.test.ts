// Layer 2, client-state tests. The words a refused usage refresh is held under, for each body the
// route answers with and for the bodies it does not: an error that is not a word, a body that is a
// list, no JSON at all, and a request that never reached the server.
//
// `fetch` is a stub, so nothing here opens a socket. What this does not cover: the Usage view that
// draws the refusal, which is tests/views/system/machine/usage.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

/** The requests the stub was given, in order. */
let sent: { url: string; init: RequestInit }[] = [];

/** Answer every request with this text and status. */
function answering(text: string, status: number): void {
    sent = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
        sent.push({ url, init });
        return Promise.resolve(new Response(text, { status }));
    });
}

/** The sentence a refusal is held under for one reason. */
function refused(reason: string): string {
    return t('usage.refresh_refused', reason);
}

beforeEach(() => {
    client = createClientState();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('a refused usage refresh', () => {
    it('posts the account as JSON with the write token', async () => {
        client.writes.setToken('usage-token');
        answering('{}', 200);
        await client.usageRefresh.refreshUsageAccount('work');
        expect(sent).toHaveLength(1);
        expect(sent[0].url).toBe('/api/usage/refresh');
        expect(sent[0].init.method).toBe('POST');
        expect(sent[0].init.headers).toStrictEqual({
            'content-type': 'application/json',
            'x-oculus-token': 'usage-token'
        });
        expect(sent[0].init.body).toBe('{"account":"work"}');
    });

    it('holds nothing for an answer that is fine', async () => {
        answering('{"error":"forbidden"}', 200);
        await client.usageRefresh.refreshUsageAccount('work');
        expect(client.usageRefresh.refreshRefusal('work')).toBe('');
    });

    it.each([
        ['forbidden', '{"error":"forbidden"}', 'usage.refusal_forbidden'],
        ['bad body', '{"error":"bad body"}', 'usage.refusal_bad_request'],
        ['bad account', '{"error":"bad account"}', 'usage.refusal_bad_request'],
        ['account not found', '{"error":"account not found"}', 'usage.refusal_not_found'],
        ['another word', '{"error":"anything else"}', 'usage.refusal_failed'],
        ['a number', '{"error":3}', 'usage.refusal_failed'],
        ['a body that is a list', '["forbidden"]', 'usage.refusal_failed'],
        ['a body that is no JSON', '<html>Bad Gateway</html>', 'usage.refusal_failed']
    ])('holds the words for an error that is %s', async (_name, text, key) => {
        answering(text, 403);
        await client.usageRefresh.refreshUsageAccount('work');
        expect(client.usageRefresh.refreshRefusal('work')).toBe(refused(t(key)));
        expect(client.usageRefresh.refreshRefusal('other')).toBe('');
    });

    it('holds the failed words for a request that never reached the server', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
        await client.usageRefresh.refreshUsageAccount('work');
        expect(client.usageRefresh.refreshRefusal('work')).toBe(refused(t('usage.refusal_failed')));
    });

    it('holds one refusal per account, and a later one for the same account replaces it', async () => {
        answering('{"error":"forbidden"}', 403);
        await client.usageRefresh.refreshUsageAccount('work');
        answering('{"error":"account not found"}', 404);
        await client.usageRefresh.refreshUsageAccount('home');
        expect(client.usageRefresh.refreshRefusal('work')).toBe(
            refused(t('usage.refusal_forbidden'))
        );
        expect(client.usageRefresh.refreshRefusal('home')).toBe(
            refused(t('usage.refusal_not_found'))
        );
        answering('{"error":"bad body"}', 400);
        await client.usageRefresh.refreshUsageAccount('work');
        expect(client.usageRefresh.refreshRefusal('work')).toBe(
            refused(t('usage.refusal_bad_request'))
        );
    });
});
