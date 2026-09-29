// The authenticated open endpoint's gates, its route and its client, against directories under
// system temporary storage. The opener is a stub, so no application is launched and no path outside
// the fixture is touched. What may be opened, and the floor under the opener, are
// tests/routes/files/open-program.test.ts.

import { existsSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import { invalidateAll } from '$app/navigation';
import { handleOpen } from '../../../src/lib/server/files/open.ts';
import { browserRoots } from '../../../src/lib/server/files/roots.ts';
import { loadConfig } from '../../../src/lib/data/sources/config.ts';
import { OPEN_PATH } from '../../../src/lib/state/client/writes.svelte.ts';
import { POST } from '../../../src/routes/api/(files)/open/+server.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import {
    TOKEN,
    checkedIn,
    fixture,
    opened,
    request,
    scratch,
    servedOver,
    withFiles,
    writeOpenConfig
} from './open-fixture.ts';
import { it } from '../../fixtures/scratch.ts';

let client: ClientState;
let openFolder: ClientState['writes']['openFolder'];
let openFile: ClientState['writes']['openFile'];
let setToken: ClientState['writes']['setToken'];

beforeEach(() => {
    client = createClientState();
    ({ openFolder, openFile, setToken } = client.writes);
});

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
});

describe('the open endpoint', () => {
    it('requires the write token', async () => {
        const { folder, roots } = fixture();
        const response = await handleOpen(
            request({ path: folder }, ''),
            TOKEN,
            roots,
            checkedIn,
            vi.fn()
        );
        expect(response.status).toBe(403);
    });

    it('requires a path', async () => {
        const { roots } = fixture();
        const response = await handleOpen(request({}), TOKEN, roots, checkedIn, vi.fn());
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'the path is required' });
    });

    it('refuses a directory outside every configured root', async () => {
        const { roots } = fixture();
        const outside = scratch('oculus-open-outside-');
        expect(roots.some((root) => resolve(outside).startsWith(resolve(root.dir) + sep))).toBe(
            false
        );
        const response = await handleOpen(
            request({ path: outside }),
            TOKEN,
            roots,
            checkedIn,
            vi.fn()
        );
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
            checkedIn,
            opener
        );
        expect(response.status).toBe(200);
        expect(opener).toHaveBeenCalledOnce();
        expect(opener).toHaveBeenCalledWith(opened(folder));
    });
});

describe('the open endpoint over a file', () => {
    it('opens a file by its root and its path under that root, once, at its real path', async () => {
        const { report, roots } = withFiles();
        const opener = vi.fn();
        const response = await handleOpen(
            request({ root: 'hub', path: 'projects/active/alpha/report.docx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(response.status).toBe(200);
        expect(opener).toHaveBeenCalledOnce();
        expect(opener).toHaveBeenCalledWith(opened(report));
    });

    it("opens a file under a workspace root by that root's key", async () => {
        const { sheet, roots } = withFiles();
        const opener = vi.fn();
        const response = await handleOpen(
            request({ root: 'work', path: 'deck.xlsx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(response.status).toBe(200);
        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(sheet));
    });

    it('opens a folder by its root and its path, as the file form does a file', async () => {
        const { folder, roots } = withFiles();
        const opener = vi.fn();
        const response = await handleOpen(
            request({ root: 'hub', path: 'projects/active/alpha' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(response.status).toBe(200);
        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(folder));
    });

    it('opens a file by a hub-relative path and by an absolute one in the form without a root', async () => {
        const { report, sheet, roots } = withFiles();
        const opener = vi.fn();
        const relative = await handleOpen(
            request({ path: 'projects/active/alpha/report.docx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        const absolute = await handleOpen(
            request({ path: sheet }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(relative.status).toBe(200);
        expect(absolute.status).toBe(200);
        expect(opener.mock.calls).toEqual([[opened(report)], [opened(sheet)]]);
    });

    it('opens a file of the engine root, a reserved key the file browser serves', async () => {
        const { roots } = withFiles();
        const engine = scratch('oculus-open-engine-');
        writeFileSync(join(engine, 'notes.docx'), 'PK a document', { mode: 0o644 });
        const opener = vi.fn();
        const response = await handleOpen(
            request({ root: 'engine', path: 'notes.docx' }),
            TOKEN,
            [...roots, { key: 'engine', dir: engine }],
            checkedIn,
            opener
        );
        expect(response.status).toBe(200);
        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(join(engine, 'notes.docx')));
    });

    it('opens a file under a root the saved workspace adds, through the roots the file browser serves', async () => {
        // The route hands handleOpen browserRoots(locals.server); this is that fold over a saved
        // workspaces file whose current workspace carries a root of its own.
        const { hub, work, sheet } = withFiles();
        const server = servedOver(hub, work);
        const served = browserRoots(server);
        const opener = vi.fn();
        const response = await handleOpen(
            request({ root: 'work', path: 'deck.xlsx' }),
            TOKEN,
            served,
            checkedIn,
            opener
        );
        expect(response.status).toBe(200);
        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(sheet));
    });

    it("hands the route the file browser's roots, so a saved workspace's key is a root it knows", async () => {
        // Over the roots the file browser serves the key is known and the refusal is on the path;
        // over the configured roots alone it would be on the root.
        const { hub, work } = withFiles();
        expect(existsSync(join(work, 'gone.docx'))).toBe(false);
        const server = { ...servedOver(hub, work), openPath: vi.fn() };
        const locals = { token: TOKEN, server, config: () => loadConfig(server.engine) };
        const response = await POST({
            request: request({ root: 'work', path: 'gone.docx' }),
            locals
        } as unknown as Parameters<typeof POST>[0]);
        expect(response.status).toBe(404);
        expect(((await response.json()) as { refused: unknown }).refused).toEqual([
            { field: 'path', reason: 'there is no file or folder at the path' }
        ]);
    });

    it('reads open.program_ext from the configuration on disk at every request', async () => {
        const { hub, work, sheet } = withFiles();
        const server = { ...servedOver(hub, work), openPath: vi.fn() };
        const post = async (): Promise<Response> =>
            POST({
                request: request({ root: 'work', path: 'deck.xlsx' }),
                locals: { token: TOKEN, server, config: () => loadConfig(server.engine) }
            } as unknown as Parameters<typeof POST>[0]);

        expect((await post()).status).toBe(200);
        writeOpenConfig(server.engine, { '.xlsx': 'com.apple.iWork.Numbers' });
        expect((await post()).status).toBe(200);
        writeOpenConfig(server.engine, { '.docx': 'com.microsoft.Word' });
        const refused = await post();
        expect(refused.status).toBe(403);
        writeOpenConfig(server.engine, ['.xlsx']);
        const unusable = await post();
        expect(unusable.status).toBe(500);
        expect(((await unusable.json()) as { error: string }).error).toContain('open.program_ext');

        expect(server.openPath.mock.calls).toEqual([
            [opened(sheet)],
            [opened(sheet, { '.xlsx': 'com.apple.iWork.Numbers' })]
        ]);
    });

    it('refuses a missing file in either form without calling the opener', async () => {
        const { roots } = withFiles();
        const opener = vi.fn();
        const rooted = await handleOpen(
            request({ root: 'hub', path: 'projects/active/alpha/gone.docx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(rooted.status).toBe(404);
        expect(await rooted.json()).toEqual({
            error: 'there is no file or folder at the path',
            refused: [{ field: 'path', reason: 'there is no file or folder at the path' }]
        });
        const plain = await handleOpen(
            request({ path: 'projects/active/alpha/gone.docx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(plain.status).toBe(403);
        expect(opener).not.toHaveBeenCalled();
    });

    it('refuses a path that climbs out of its root by .. in either form', async () => {
        const { hub, outside, roots } = withFiles();
        const climb = relative(hub, outside);
        expect(climb.startsWith('..')).toBe(true);
        const opener = vi.fn();
        const rooted = await handleOpen(
            request({ root: 'hub', path: climb }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        const plain = await handleOpen(request({ path: climb }), TOKEN, roots, checkedIn, opener);
        expect(rooted.status).toBe(403);
        expect(((await rooted.json()) as { refused: unknown }).refused).toEqual([
            { field: 'path', reason: 'the path is outside the configured roots' }
        ]);
        expect(plain.status).toBe(403);
        expect(opener).not.toHaveBeenCalled();
    });

    it('refuses a symlink inside the root that resolves to a file outside every root', async () => {
        const { folder, outside, roots } = withFiles();
        symlinkSync(outside, join(folder, 'link.docx'));
        const opener = vi.fn();
        const rooted = await handleOpen(
            request({ root: 'hub', path: 'projects/active/alpha/link.docx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        const plain = await handleOpen(
            request({ path: 'projects/active/alpha/link.docx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(rooted.status).toBe(403);
        expect(plain.status).toBe(403);
        expect(opener).not.toHaveBeenCalled();
    });

    it('refuses an absolute path handed with a root when it is outside that root', async () => {
        const { outside, roots } = withFiles();
        const opener = vi.fn();
        const response = await handleOpen(
            request({ root: 'hub', path: outside }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(response.status).toBe(403);
        expect(opener).not.toHaveBeenCalled();
    });

    it('refuses a root key no root carries, an empty one, one that is not a string and an inherited name', async () => {
        const { roots } = withFiles();
        const opener = vi.fn();
        for (const root of ['nowhere', '', 7, null, 'constructor', '__proto__']) {
            const response = await handleOpen(
                request({ root, path: 'projects/active/alpha/report.docx' }),
                TOKEN,
                roots,
                checkedIn,
                opener
            );
            expect(response.status, String(root)).toBe(400);
            expect(await response.json()).toEqual({
                error: 'the root names no served root',
                refused: [{ field: 'root', reason: 'the root names no served root' }]
            });
        }
        expect(opener).not.toHaveBeenCalled();
    });

    it('refuses a path that is not a string, with or without a root', async () => {
        const { roots } = withFiles();
        const opener = vi.fn();
        for (const body of [{ root: 'hub', path: 7 }, { root: 'hub' }, { path: ['a'] }]) {
            const response = await handleOpen(request(body), TOKEN, roots, checkedIn, opener);
            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'the path is required' });
        }
        expect(opener).not.toHaveBeenCalled();
    });

    it('refuses a file without the write token and never calls the opener', async () => {
        const { roots } = withFiles();
        const opener = vi.fn();
        const response = await handleOpen(
            request({ root: 'hub', path: 'projects/active/alpha/report.docx' }, ''),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(response.status).toBe(403);
        expect(opener).not.toHaveBeenCalled();
    });

    it('says a path could not be opened when the opener fails', async () => {
        const { roots } = withFiles();
        const opener = vi.fn(() => Promise.reject(new Error('no application')));
        const response = await handleOpen(
            request({ root: 'hub', path: 'projects/active/alpha/report.docx' }),
            TOKEN,
            roots,
            checkedIn,
            opener
        );
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: 'the path could not be opened: no application'
        });
    });
});

describe('the open client', () => {
    it('posts a file by its root and path to the open endpoint with the token', async () => {
        const { report, roots } = withFiles();
        const opener = vi.fn();
        setToken(TOKEN);
        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
            handleOpen(
                request(
                    JSON.parse(scalar(init.body)),
                    new Headers(init.headers).get('x-oculus-token') ?? ''
                ),
                TOKEN,
                roots,
                checkedIn,
                opener
            )
        );
        vi.stubGlobal('fetch', fetcher);

        const answer = await openFile('hub', 'projects/active/alpha/report.docx');

        expect(answer.ok).toBe(true);
        expect(fetcher).toHaveBeenCalledOnce();
        const [url, init] = fetcher.mock.calls[0];
        expect(url).toBe(OPEN_PATH);
        expect(OPEN_PATH).toBe('/api/open');
        expect(init.method).toBe('POST');
        expect(new Headers(init.headers).get('x-oculus-token')).toBe(TOKEN);
        expect(JSON.parse(scalar(init.body))).toEqual({
            root: 'hub',
            path: 'projects/active/alpha/report.docx'
        });
        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(report));
    });

    it("reports an unknown root's refusal once without a token refresh or retry", async () => {
        const { roots } = withFiles();
        const opener = vi.fn();
        setToken(TOKEN);
        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
            handleOpen(request(JSON.parse(scalar(init.body))), TOKEN, roots, checkedIn, opener)
        );
        vi.stubGlobal('fetch', fetcher);
        const answer = await openFile('nowhere', 'report.docx');
        expect(answer.ok).toBe(false);
        expect(answer.refused).toEqual([
            { field: 'root', reason: 'the root names no served root' }
        ]);
        expect(fetcher).toHaveBeenCalledOnce();
        expect(invalidateAll).not.toHaveBeenCalled();
        expect(opener).not.toHaveBeenCalled();
    });

    it('reports an outside-root refusal once without a token refresh or retry', async () => {
        const { roots } = fixture();
        const outside = scratch('oculus-open-client-');
        const opener = vi.fn();
        setToken(TOKEN);
        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
            handleOpen(request(JSON.parse(scalar(init.body))), TOKEN, roots, checkedIn, opener)
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
                    JSON.parse(scalar(init.body)),
                    new Headers(init.headers).get('x-oculus-token') ?? ''
                ),
                TOKEN,
                roots,
                checkedIn,
                opener
            )
        );
        vi.stubGlobal('fetch', fetcher);
        expect((await openFolder(folder)).ok).toBe(true);
        expect(invalidateAll).toHaveBeenCalledOnce();
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(opener).toHaveBeenCalledWith(opened(folder));
        expect(opener).toHaveBeenCalledOnce();
    });

    it('retries with the token a reload installs after invalidateAll has already resolved', async () => {
        // The page is what installs the token: the load hands it over and an effect puts it in the
        // store, so it lands a turn after invalidateAll() resolves rather than inside it. The mock
        // leaves the token stale and installs it from a microtask queued behind the one the caller
        // resumes on, which is the order a flushed effect lands in, and the retry is expected to
        // carry the new token all the same.
        const { roots, folder } = fixture();
        const opener = vi.fn();
        setToken('old-token');
        vi.mocked(invalidateAll).mockImplementation(() => {
            queueMicrotask(() => queueMicrotask(() => setToken(TOKEN)));
            return Promise.resolve();
        });
        const sent: string[] = [];
        const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
            const carried = new Headers(init.headers).get('x-oculus-token') ?? '';
            sent.push(carried);
            return handleOpen(
                request(JSON.parse(scalar(init.body)), carried),
                TOKEN,
                roots,
                checkedIn,
                opener
            );
        });
        vi.stubGlobal('fetch', fetcher);

        expect((await openFolder(folder)).ok).toBe(true);
        expect(sent).toEqual(['old-token', TOKEN]);
        expect(opener).toHaveBeenCalledOnce();
    });
});
