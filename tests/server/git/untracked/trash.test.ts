// What server/git/git-index.ts's trashUntracked moves to the Trash, and what it refuses before the
// Trash is called. The Trash is a spy the case hands in, so nothing leaves the scratch directory;
// the repositories are the real git's, under the system temporary directory, with this machine's
// git configuration replaced by an empty file (tests/server/git/refs/repo.ts).
//
// What this does NOT cover: the real Trash library is never called, and the route's chaining behind
// the Files write chain is tests/routes/git/untracked.test.ts.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { mkdirSync, realpathSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { trashUntracked } from '../../../../src/lib/server/git/git-index.ts';
import { protectedFiles } from '../../../../src/lib/server/files/fs/ops.ts';
import { ENGINE_ROOT } from '../../../../src/lib/server/files/files.ts';

import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { git, isolateGit, put, scratchRepo } from '../refs/repo.ts';

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

    it('refuses a tracked path, calling the Trash for none', async () => {
        const root = scratchRepo();
        const { spy, into } = deps();
        const answer = await trashUntracked(root, ['kept.txt'], into, [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('kept.txt');
        expect(spy).not.toHaveBeenCalled();
    });

    it('refuses the whole request when one path of it is tracked', async () => {
        const root = scratchRepo();
        put(root, 'u.txt', 'loose\n');
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['u.txt', 'kept.txt'], into, [root])).ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('refuses a local.yml beside an engine root, which the Files view never touches', async () => {
        const root = scratchRepo();
        put(root, 'local.yml', 'port: 1\n');
        const { spy, into } = deps(root);
        const answer = await trashUntracked(root, ['local.yml'], into, [root]);
        expect(answer.ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('refuses an untracked folder that holds the guarded file', async () => {
        const root = scratchRepo();
        const engine = join(root, 'engine');
        put(root, 'engine/local.yml', 'port: 1\n');
        const { spy, into } = deps(engine);
        expect((await trashUntracked(root, ['engine/'], into, [root])).ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('moves a collapsed untracked folder as the one folder', async () => {
        const root = scratchRepo();
        put(root, 'dir/a.txt', 'a\n');
        put(root, 'dir/b.txt', 'b\n');
        expect(git(root, 'status', '--porcelain')).toContain('?? dir/');
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['dir/'], into, [root])).ok).toBe(true);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(join(realpathSync(root), 'dir'), { glob: false });
    });

    it('moves each of several files, one call to the Trash each', async () => {
        const root = scratchRepo();
        put(root, 'a.txt', 'a\n');
        put(root, 'b.txt', 'b\n');
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['a.txt', 'b.txt'], into, [root])).ok).toBe(true);
        expect(spy.mock.calls.map((call) => call[0])).toEqual([
            join(realpathSync(root), 'a.txt'),
            join(realpathSync(root), 'b.txt')
        ]);
    });

    it('refuses a path outside the repository and a path git lists nowhere', async () => {
        const root = scratchRepo();
        put(root, 'u.txt', 'loose\n');
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['../u.txt'], into, [root])).ok).toBe(false);
        expect((await trashUntracked(root, ['missing.txt'], into, [root])).ok).toBe(false);
        expect((await trashUntracked(root, [], into, [root])).ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('refuses a root no workspace names', async () => {
        const root = scratchRepo();
        put(root, 'u.txt', 'loose\n');
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['u.txt'], into, ['/nowhere'])).ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('refuses an untracked link that points out of the repository, calling the Trash for none', async () => {
        const root = scratchRepo();
        const outside = scratchDir('oculus-elsewhere-');
        put(outside, 'target.txt', 'kept\n');
        symlinkSync(outside, join(root, 'out'));
        symlinkSync(join(outside, 'target.txt'), join(root, 'file-out'));
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['out'], into, [root])).ok).toBe(false);
        expect((await trashUntracked(root, ['file-out'], into, [root])).ok).toBe(false);
        expect((await trashUntracked(root, ['u.txt', 'out'], into, [root])).ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('moves an untracked link whose target is missing as the link, wherever it pointed', async () => {
        const root = scratchRepo();
        symlinkSync(join(root, 'nowhere'), join(root, 'dangling'));
        symlinkSync(join(scratchDir('oculus-elsewhere-'), 'gone'), join(root, 'dangling-out'));
        const { spy, into } = deps();
        const answer = await trashUntracked(root, ['dangling', 'dangling-out'], into, [root]);
        expect(answer.ok).toBe(true);
        expect(spy.mock.calls.map((call) => call[0])).toEqual([
            join(realpathSync(root), 'dangling'),
            join(realpathSync(root), 'dangling-out')
        ]);
    });

    it('moves an untracked link that points inside the repository as the link, and a plain file with it', async () => {
        const root = scratchRepo();
        put(root, 'u.txt', 'loose\n');
        symlinkSync(join(root, 'u.txt'), join(root, 'inner'));
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['inner', 'u.txt'], into, [root])).ok).toBe(true);
        expect(spy.mock.calls.map((call) => call[0])).toEqual([
            join(realpathSync(root), 'inner'),
            join(realpathSync(root), 'u.txt')
        ]);
    });

    it('refuses a path whose folder is a link out of the repository', async () => {
        const root = scratchRepo();
        const outside = scratchDir('oculus-elsewhere-');
        put(outside, 'target.txt', 'kept\n');
        mkdirSync(join(root, 'real'));
        symlinkSync(outside, join(root, 'real', 'out'));
        const { spy, into } = deps();
        expect((await trashUntracked(root, ['real/out/target.txt'], into, [root])).ok).toBe(false);
        expect(spy).not.toHaveBeenCalled();
    });

    it('stops at the first path the Trash fails on and says which', async () => {
        const root = scratchRepo();
        put(root, 'a.txt', 'a\n');
        put(root, 'b.txt', 'b\n');
        const { spy, into } = deps(undefined, (path) =>
            path.endsWith('a.txt') ? Promise.reject(new Error('no Trash')) : Promise.resolve()
        );
        const answer = await trashUntracked(root, ['a.txt', 'b.txt'], into, [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('a.txt');
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
