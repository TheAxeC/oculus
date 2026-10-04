// Layer 2, route tests. What POST /api/git does for the two actions on untracked files:
// trashUntracked, which moves paths to the Trash behind the confirm, and ignore, which appends to
// .gitignore. Both run over a real scratch repository; the Trash is a spy.
//
// What this does NOT cover: the real Trash library.
// @module-tag slow: every case runs git in a scratch repository.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { handleGit, type GitOptions } from '../../../src/lib/server/git/git-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { protectedFiles } from '../../../src/lib/server/files/fs/ops.ts';
import { ENGINE_ROOT } from '../../../src/lib/server/files/files.ts';
import { it } from '../../fixtures/scratch.ts';
import { gitPost } from './request.ts';
import { isolateGit, put, scratchRepo } from '../../server/git/refs/repo.ts';

isolateGit();

const TOKEN = mintToken();

function request(body: unknown, headers: Record<string, string> = {}): Request {
    return gitPost(TOKEN, body, headers);
}

type Trash = NonNullable<GitOptions['trash']>;

/** Options over one real repository, the Trash a spy and the guard over `engine` if given. */
function over(root: string, engine?: string, extra: Partial<GitOptions> = {}) {
    const trash = vi.fn<Trash>(() => Promise.resolve());
    const options: GitOptions = {
        config: loadConfig(engineDir()).config,
        rootsFor: () => [root],
        trash,
        guard: () =>
            protectedFiles({
                roots: engine === undefined ? [] : [{ key: ENGINE_ROOT, dir: engine }]
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
            error: 'this action needs the page to confirm it'
        });
        expect(trash).not.toHaveBeenCalled();
    });

    it('moves a confirmed untracked file to the Trash', async () => {
        const root = scratchRepo();
        put(root, 'u.txt', 'loose\n');
        const { trash, options } = over(root);
        const response = await handleGit(
            request({ action: 'trashUntracked', root, paths: ['u.txt'], confirm: true }),
            TOKEN,
            options
        );
        expect(response.status).toBe(200);
        expect(trash).toHaveBeenCalledWith(join(realpathSync(root), 'u.txt'), { glob: false });
    });
});

describe('ignore', () => {
    it('appends the path without a confirm and answers the file it wrote', async () => {
        const root = scratchRepo();
        const { options } = over(root);
        const response = await handleGit(
            request({ action: 'ignore', root, paths: ['a/b.txt'] }),
            TOKEN,
            options
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, output: '.gitignore' });
    });
});
