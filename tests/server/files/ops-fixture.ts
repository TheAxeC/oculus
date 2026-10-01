// Layer 4, test helper. The worlds the file operation tests over server/files/fs/ops.ts run in:
// a root, or several, under a scratch directory; the post of one request to them with the token a
// real page holds; the trash spy a case hands in; and the listing of a folder by name.
//
// Every directory comes from tests/fixtures/scratch.ts, which refuses a path outside the system
// temporary directory, so nothing here can write into the checkout or the hub.

import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';
import type { OpsAnswer } from '../../../src/lib/data/file-ops.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleOps, type OpsDeps, type OpsTarget } from '../../../src/lib/server/files/fs/ops.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { plantScratch } from '../../fixtures/scratch.ts';

export const TOKEN = 'an-ops-token';

/** The spy a case hands in as the trash call. */
export type Spy = ReturnType<
    typeof vi.fn<(path: string, options?: { glob: boolean }) => Promise<void>>
>;

export function spy(): Spy {
    return vi.fn<(path: string, options?: { glob: boolean }) => Promise<void>>(() =>
        Promise.resolve()
    );
}

/** A scratch directory (by its real path) holding the files and folders named. */
export function folder(files: Record<string, string> = {}, dirs: string[] = []): string {
    return realpathSync(plantScratch('oculus-ops-', files, dirs));
}

/** One world: the roots a request is served over, and the post of one operation to them. */
export type World = {
    hub: string;
    roots: Root[];
    target: OpsTarget;
    post: (body: unknown, deps?: OpsDeps, headers?: Record<string, string>) => Promise<Answer>;
};

export type Answer = { status: number; body: OpsAnswer & Record<string, unknown> };

export function worldOver(roots: Root[], hub: string): World {
    const target: OpsTarget = { roots, writes: fsWrites() };
    return {
        hub,
        roots,
        target,
        async post(body, deps = {}, headers = { 'x-oculus-token': TOKEN }) {
            const request = new Request('http://localhost/api/ops', {
                method: 'POST',
                headers: { 'content-type': 'application/json', ...headers },
                body: typeof body === 'string' ? body : JSON.stringify(body)
            });
            const response = await handleOps(request, TOKEN, target, deps);
            return {
                status: response.status,
                body: (await response.json()) as OpsAnswer & Record<string, unknown>
            };
        }
    };
}

/** A world of one root `hub` holding the files and folders named. */
export function world(files: Record<string, string> = {}, dirs: string[] = []): World {
    const hub = folder(files, dirs);
    return worldOver([{ key: 'hub', dir: hub }], hub);
}

/** The names a folder holds, as readdir lists them. */
export function names(dir: string): string[] {
    return readdirSync(dir).sort();
}

/** Whether this machine's volume reads `README.md` and `readme.md` as one name. */
export const INSENSITIVE = (() => {
    const dir = folder({ 'Probe.txt': 'x' });
    return existsSync(join(dir, 'probe.txt'));
})();

export const create = (path: string, name: string, folder = false, root = 'hub') => ({
    op: 'create',
    root,
    path,
    name,
    folder
});
