// What server/git/git-write.ts's switchDetached does from a commit: a detached HEAD at a hash. The
// repositories are the real git's, with this machine's git configuration replaced by an empty file.
//
// What this does NOT cover: the questions the page asks first, and the route's confirm
// (tests/routes/git/git.test.ts).
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { switchDetached } from '../../../../src/lib/server/git/git-write.ts';
import { it } from '../../../fixtures/scratch.ts';
import { commitFile, git, gitAt, isolateGit, scratchRepo } from './repo.ts';
import { TEXT } from '../../text.ts';

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
        for (const [row, untracked] of [
            ['a clean tree', null],
            ['an untracked file only, which stays', 'untracked.txt']
        ] as const) {
            const { root, first } = twoCommits();
            if (untracked !== null) writeFileSync(join(root, untracked), 'carried\n');
            const answer = await switchDetached(gitAt(root), first, TEXT, [root]);
            expect(answer.ok, row).toBe(true);
            expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), row).toBe('HEAD');
            expect(git(root, 'rev-parse', 'HEAD').trim(), row).toBe(first);
            if (untracked !== null) {
                expect(readFileSync(join(root, untracked), 'utf8'), row).toBe('carried\n');
            }
        }
    });
});
