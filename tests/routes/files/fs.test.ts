// Layer 2, route tests. What the /api/fs route answers. The route itself is a few lines handing the
// request to lib/server/files/fs.ts with the open workspace, the bookmarks place and the process's
// write chain, which is what this calls: handleFsWrite takes a Request and the target to read
// and write.
//
// Every folder and the workspace state here are synthetic, under the system temporary directory,
// and every path written is asserted to be inside it first. What this does NOT cover: the route
// module reading the machine's own hub `.oculus/local.yml` files.

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { ignoredCache, handleFsWrite, type FsTarget } from '../../../src/lib/server/files/fs.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { noCredentials } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { workspaceWith } from '../../fixtures/hubs/workspace.ts';

const HOST = '127.0.0.1:8791';
const TOKEN = 'a-write-token';

/** A directory under the temporary directory, holding the files and folders named. */
function folder(files: Record<string, string> = {}, dirs: string[] = []): string {
    const dir = scratchDir('oculus-fsroute-');
    for (const name of dirs) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(full, { recursive: true });
    }
    for (const [name, body] of Object.entries(files)) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, body);
    }
    // The real path: a root stores what realpath gave, and on this platform the temporary
    // directory is reached through a link.
    return realpathSync(dir);
}

/**
 * One target: a hub root holding two entries, and the three files and folders the reader's own
 * writes land in, every one of them inside a fresh temporary directory. Nothing here names
 * ~/.oculus.
 */
function target(): FsTarget & { hub: string } {
    const hub = folder({ 'README.md': '# hub\n' }, ['code']);
    const store = scratchDir('oculus-fsstore-');
    return {
        hub,
        engine: folder(),
        workspace: workspaceWith([{ name: 'hub', dir: hub }]),
        machine: { set: [], defaults: {}, values: {}, hubs: {}, portRefused: null },
        bookmarks: join(store, 'bookmarks.yml'),
        writes: fsWrites(),
        ignored: ignoredCache(),
        credentials: noCredentials()
    };
}

/** A POST as the page makes it, with the token unless a case takes it away. */
function post(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/fs`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'content-type': 'application/json',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}

async function read(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

describe('the fs route, writing', () => {
    it('refuses a missing token, a body that is not JSON, and an unknown action', async () => {
        const into = target();

        const stale = await handleFsWrite(
            post({ action: 'select-workspace', name: '' }, { 'x-oculus-token': 'stale' }),
            TOKEN,
            into
        );
        expect(stale.status).toBe(403);
        expect(stale.headers.get('cache-control')).toBe('no-store');
        expect(await read(stale)).toEqual({ error: 'token' });

        const broken = await handleFsWrite(post('not json at all'), TOKEN, into);
        expect(broken.status).toBe(400);
        expect(broken.headers.get('cache-control')).toBe('no-store');
        expect(await read(broken)).toEqual({ error: 'not-json' });

        const unknown = await handleFsWrite(post({ action: 'drop-everything' }), TOKEN, into);
        expect(unknown.status).toBe(400);
        expect((await read(unknown)).error).toBe('not-an-action');
    });
});
