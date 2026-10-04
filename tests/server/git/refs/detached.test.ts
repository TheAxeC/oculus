// What server/git/git-write.ts's switchDetached does from a commit: a detached HEAD at a hash. The
// repositories are the real git's, with this machine's git configuration replaced by an empty file.
//
// What this does NOT cover: the questions the page asks first, and the route's confirm
// (tests/routes/git/git.test.ts).
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { switchDetached } from '../../../../src/lib/server/git/git-write.ts';
import { it } from '../../../fixtures/scratch.ts';
import { commitFile, git, isolateGit, scratchRepo } from './repo.ts';

isolateGit();

/** A repository with a second commit, and the hash of the first. */
function twoCommits(): { root: string; first: string; second: string } {
    const root = scratchRepo();
    const first = git(root, 'rev-parse', 'HEAD').trim();
    const second = commitFile(root, 'two.txt', 'two\n', 'Second');
    return { root, first, second };
}

describe('switchDetached', () => {
    it('detaches HEAD at a hash on a clean tree', async () => {
        const { root, first } = twoCommits();
        const answer = await switchDetached(root, first, [root]);
        expect(answer.ok).toBe(true);
        expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('HEAD');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(first);
    });
});
