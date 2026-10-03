// Layer 4, server test. POST /api/folders/pick with a runner standing in for the folder panel
// (server/files/fs/picker.ts): the paths it printed, none on a cancel, the refusals for a platform
// that is not macOS, a failed script, a second request while a panel is open and a missing token.
// No test opens a panel: the runner is always the test's own.

import { describe, expect, it } from 'vitest';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import {
    handlePick,
    pickerState,
    type PickRun,
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
    it('answers the paths the panel printed, one a line', async () => {
        const answer = await pick(printing('/a\n/b\n'));
        expect(answer.status).toBe(200);
        expect(answer.body).toEqual({ ok: true, paths: ['/a', '/b'] });
        expect(answer.headers.get('cache-control')).toBe('no-store');
    });

    it('answers no paths when the panel was cancelled', async () => {
        const answer = await pick(printing(''));
        expect(answer.body).toEqual({ ok: true, paths: [] });
    });

    it('answers failed when the script exits with a status other than zero', async () => {
        const answer = await pick(printing('', 1));
        expect(answer.status).toBe(500);
        expect(answer.body).toEqual({ error: 'failed' });
        expect(answer.headers.get('cache-control')).toBe('no-store');
    });

    it('answers failed when the runner itself throws', async () => {
        const answer = await pick(() => Promise.reject(new Error('no osascript')));
        expect(answer.body).toEqual({ error: 'failed' });
    });

    it('answers unsupported off macOS, and never runs the script', async () => {
        let ran = 0;
        const answer = await pick(
            () => {
                ran += 1;
                return Promise.resolve({ code: 0, out: '/a\n' });
            },
            { platform: 'linux' }
        );
        expect(answer.status).toBe(400);
        expect(answer.body).toEqual({ error: 'unsupported' });
        expect(answer.headers.get('cache-control')).toBe('no-store');
        expect(ran).toBe(0);
    });

    it('answers busy to a second request while the first panel is open, then opens again', async () => {
        const state = pickerState();
        let release: (run: PickRun) => void = () => undefined;
        const first = pick(() => new Promise<PickRun>((resolve) => (release = resolve)), { state });
        await Promise.resolve();
        const second = await pick(printing('/never\n'), { state });
        expect(second.status).toBe(409);
        expect(second.body).toEqual({ error: 'busy' });
        expect(second.headers.get('cache-control')).toBe('no-store');
        release({ code: 0, out: '/a\n' });
        expect((await first).body).toEqual({ ok: true, paths: ['/a'] });
        const third = await pick(printing('/b\n'), { state });
        expect(third.body).toEqual({ ok: true, paths: ['/b'] });
    });

    it('refuses a request without the token with a 403, before it runs anything', async () => {
        const answer = await pick(printing('/a\n'), { token: false });
        expect(answer.status).toBe(403);
        expect(answer.headers.get('cache-control')).toBe('no-store');
    });
});
