// Layer 4, server test. POST /api/folders/pick with a runner standing in for the folder panel
// (server/files/fs/picker.ts): a missing token. No test opens a panel: the runner is always the
// test's own.

import { describe, expect, it } from 'vitest';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import {
    handlePick,
    pickerState,
    type PickRunner
} from '../../../src/lib/server/files/fs/picker.ts';

const TOKEN = 'a-picker-token';

/** One post of the route's body to the handler, with the token unless the case drops it. */
async function pick(
    runner: PickRunner,
    over: {
        state?: ReturnType<typeof pickerState>;
        platform?: NodeJS.Platform;
        token?: boolean;
    } = {}
) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (over.token !== false) headers[TOKEN_HEADER] = TOKEN;
    const request = new Request('http://localhost/api/folders/pick', {
        method: 'POST',
        headers,
        body: '{}'
    });
    const response = await handlePick(request, TOKEN, over.state ?? pickerState(), {
        platform: over.platform ?? 'darwin',
        run: runner
    });
    return {
        status: response.status,
        headers: response.headers,
        body: (await response.json()) as unknown
    };
}

const printing =
    (out: string, code = 0): PickRunner =>
    () =>
        Promise.resolve({ code, out });

describe('the folder panel route', () => {
    it('refuses a request without the token with a 403, before it runs anything', async () => {
        const answer = await pick(printing('/a\n'), { token: false });
        expect(answer.status).toBe(403);
        expect(answer.headers.get('cache-control')).toBe('no-store');
    });
});
