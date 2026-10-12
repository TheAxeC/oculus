// Layer 2, route tests. What POST /api/git does for the action on untracked files: trashUntracked,
// which moves paths to the Trash behind the confirm. It runs over a real scratch repository; the
// Trash is a spy.
//
// What this does NOT cover: the real Trash library.
// @module-tag slow: every case runs git in a scratch repository.

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { handleGit, type GitOptions } from '../../../src/lib/server/git/git-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { protectedFiles } from '../../../src/lib/server/files/fs/ops.ts';
import { it } from '../../fixtures/scratch.ts';
import { gitPost } from './request.ts';
import { isolateGit, put, scratchRepo } from '../../server/git/refs/repo.ts';

isolateGit();

const TOKEN = mintToken();

function request(body: unknown, headers: Record<string, string> = {}): Request {
    return gitPost(TOKEN, body, headers);
}

type Trash = NonNullable<GitOptions['trash']>;

/** Options over one real repository, the Trash a spy and the guard over the hub `hub` if given. */
function over(root: string, hub?: string, extra: Partial<GitOptions> = {}) {
    const trash = vi.fn<Trash>(() => Promise.resolve());
    const options: GitOptions = {
        config: loadConfig(engineDir()).config,
        claudeBin: 'claude',
        rootsFor: () => [root],
        trash,
        guard: () =>
            protectedFiles({
                roots: hub === undefined ? [] : [{ key: 'lab', dir: hub, hub: true }],
                config: join(tmpdir(), 'oculus-test-no-config')
            }),
        ...extra
    };
    return { trash, options };
}

describe('trashUntracked', () => {
    it('refuses a request the page did not confirm', async () => {
        const root = scratchRepo();
        put(root, 'u.txt', 'loose\n');
        const { trash, options } = over(root);
        const response = await handleGit(
            request({ action: 'trashUntracked', root, paths: ['u.txt'] }),
            TOKEN,
            options
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'This action needs the page to confirm it'
        });
        expect(trash).not.toHaveBeenCalled();
    });
});
