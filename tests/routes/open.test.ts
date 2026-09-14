// The authenticated open-folder endpoint against directories under system temporary storage. The
// opener is a stub, so no application is launched and no path outside the fixture is touched.

import { mkdirSync, mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { invalidateAll } from '$app/navigation';
import { openFolder, setToken } from '../../src/lib/state/writes.svelte.ts';
import { mintToken } from '../../src/lib/server/auth.ts';
import { handleOpen } from '../../src/lib/server/open.ts';
import type { Root } from '../../src/lib/server/files.ts';

const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
});

function fixture(): { hub: string; folder: string; roots: Root[] } {
    const hub = mkdtempSync(join(tmpdir(), 'oculus-open-'));
    expect(resolve(hub).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const folder = join(hub, 'projects', 'active', 'alpha');
    expect(resolve(folder).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    return { hub, folder, roots: [{ key: 'hub', dir: hub }] };
}

function request(body: unknown, token = TOKEN): Request {
    return new Request(`http://${HOST}/api/open`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

describe('the open endpoint', () => {
    it('requires the write token', async () => {
        const { folder, roots } = fixture();
        const response = await handleOpen(request({ path: folder }, ''), TOKEN, roots, vi.fn());
        expect(response.status).toBe(403);
    });

    it('requires a path', async () => {
        const { roots } = fixture();
        const response = await handleOpen(request({}), TOKEN, roots, vi.fn());
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'the path is required' });
    });

    it('refuses a directory outside every configured root', async () => {
        const { roots } = fixture();
        const outside = mkdtempSync(join(tmpdir(), 'oculus-open-outside-'));
        expect(roots.some((root) => resolve(outside).startsWith(resolve(root.dir) + sep))).toBe(
            false
        );
        const response = await handleOpen(request({ path: outside }), TOKEN, roots, vi.fn());
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            error: 'the path is outside the configured roots',
            refused: [{ field: 'path', reason: 'the path is outside the configured roots' }]
        });
    });

    it('resolves a hub-relative folder and calls only the supplied opener', async () => {
        const { folder, roots } = fixture();
        const opener = vi.fn();
        const response = await handleOpen(
            request({ path: 'projects/active/alpha' }),
            TOKEN,
            roots,
            opener
        );
        expect(response.status).toBe(200);
        expect(opener).toHaveBeenCalledOnce();
        expect(opener).toHaveBeenCalledWith(realpathSync(folder));
    });
});

describe('the open client', () => {
    it('reports an outside-root refusal once without a token refresh or retry', async () => {
        const { roots } = fixture();
        const outside = mkdtempSync(join(tmpdir(), 'oculus-open-client-'));
        const opener = vi.fn();
        setToken(TOKEN);
        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
            handleOpen(request(JSON.parse(String(init.body))), TOKEN, roots, opener)
        );
        vi.stubGlobal('fetch', fetcher);
        const answer = await openFolder(outside);
        expect(answer.ok).toBe(false);
        expect(answer.refused[0]?.field).toBe('path');
        expect(answer.error).toBe('the path is outside the configured roots');
        expect(fetcher).toHaveBeenCalledOnce();
        expect(invalidateAll).not.toHaveBeenCalled();
        expect(opener).not.toHaveBeenCalled();
    });

    it('refreshes a stale token once and opens through the stub after retry', async () => {
        const { roots, folder } = fixture();
        const opener = vi.fn();
        setToken('old-token');
        vi.mocked(invalidateAll).mockImplementation(() => {
            setToken(TOKEN);
            return Promise.resolve();
        });
        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
            handleOpen(
                request(
                    JSON.parse(String(init.body)),
                    new Headers(init.headers).get('x-oculus-token') ?? ''
                ),
                TOKEN,
                roots,
                opener
            )
        );
        vi.stubGlobal('fetch', fetcher);
        expect((await openFolder(folder)).ok).toBe(true);
        expect(invalidateAll).toHaveBeenCalledOnce();
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(opener).toHaveBeenCalledWith(realpathSync(folder));
        expect(opener).toHaveBeenCalledOnce();
    });
});
