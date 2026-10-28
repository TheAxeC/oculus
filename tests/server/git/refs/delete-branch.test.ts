// What server/git/git-refs.ts's deleteBranch and deleteBranchAnyway do: `git branch -d` of a merged
// branch, and `git branch -D` of a branch git called unmerged.
//
// What this does NOT cover: the questions the page asks, and git run in a language other than
// English.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { deleteBranch, deleteBranchAnyway } from '../../../../src/lib/server/git/git-refs.ts';
import { it } from '../../../fixtures/scratch.ts';
import { commitFile, git, gitAt, isolateGit, scratchRepo } from './repo.ts';
import { TEXT } from '../../text.ts';

isolateGit();

const has = (root: string, name: string): boolean =>
    git(root, 'branch', '--list', name).trim() !== '';

describe('deleteBranch', () => {
    it('deletes a branch that is merged', async () => {
        const root = scratchRepo();
        git(root, 'branch', 'merged');
        const answer = await deleteBranch(gitAt(root), 'merged', TEXT, [root]);
        expect(answer.ok).toBe(true);
        expect(has(root, 'merged')).toBe(false);
    });

    it('deletes a branch git calls not fully merged on Delete Anyway', async () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'unmerged');
        commitFile(root, 'u.txt', 'u\n', 'Unmerged work');
        git(root, 'switch', '-q', 'main');
        const answer = await deleteBranchAnyway(gitAt(root), 'unmerged', TEXT, [root]);
        expect(answer.ok).toBe(true);
        expect(has(root, 'unmerged')).toBe(false);
    });
});
