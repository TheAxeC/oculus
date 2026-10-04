// What server/git/git-index.ts's trashUntracked moves to the Trash, and what it refuses before the
// Trash is called. The Trash is a spy the case hands in, so nothing leaves the scratch directory;
// the repositories are the real git's, under the system temporary directory, with this machine's
// git configuration replaced by an empty file (tests/server/git/refs/repo.ts).
//
// What this does NOT cover: the real Trash library is never called, and the route's chaining behind
// the Files write chain is tests/routes/git/untracked.test.ts.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { trashUntracked } from '../../../../src/lib/server/git/git-index.ts';
import { protectedFiles } from '../../../../src/lib/server/files/fs/ops.ts';
import { ENGINE_ROOT } from '../../../../src/lib/server/files/files.ts';

import { it } from '../../../fixtures/scratch.ts';
import { isolateGit, put, scratchRepo } from '../refs/repo.ts';

isolateGit();

type Trash = (path: string, options: { glob: false }) => Promise<void>;

/** The Trash as a spy, and the dependencies a call is handed, the guard over `engine` if given. */
function deps(engine?: string, trash: Trash = () => Promise.resolve()) {
    const spy = vi.fn<Trash>(trash);
    return {
        spy,
        into: {
            trash: spy,
            guard: () =>
                protectedFiles({
                    roots: engine === undefined ? [] : [{ key: ENGINE_ROOT, dir: engine }]
                })
        }
    };
}

describe('trashUntracked', () => {
    it('moves an untracked file to the Trash by its real path', async () => {
        const root = scratchRepo();
        put(root, 'u.txt', 'loose\n');
        const { spy, into } = deps();
        const answer = await trashUntracked(root, ['u.txt'], into, [root]);
        expect(answer.ok).toBe(true);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(join(realpathSync(root), 'u.txt'), { glob: false });
    });

    it('refuses a local.yml beside an engine root, which the Files view never touches', async () => {
        const root = scratchRepo();
        put(root, 'local.yml', 'port: 1\n');
        const { spy, into } = deps(root);
        const answer = await trashUntracked(root, ['local.yml'], into, [root]);
        expect(answer.ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });
});
