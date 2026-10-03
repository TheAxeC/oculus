// What server/git/git-refs.ts's deleteBranch and deleteBranchAnyway do: `git branch -d` of a
// merged branch, the refusals, git's own where git judges (a branch not fully merged, which carries
// the code not-merged, and a branch checked out in a worktree) and the module's where it can (the
// checked-out branch, a name that starts with a dash), and `git branch -D` of a branch git called
// unmerged.
//
// What this does NOT cover: the questions the page asks, and git run in a language other than
// English.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { createWorktree } from '../../../../src/lib/server/git/git-write.ts';
import { deleteBranch, deleteBranchAnyway } from '../../../../src/lib/server/git/git-refs.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { commitFile, git, isolateGit, scratchRepo } from './repo.ts';

isolateGit();

const has = (root: string, name: string): boolean =>
    git(root, 'branch', '--list', name).trim() !== '';

describe('deleteBranch', () => {
    it('deletes a branch that is merged', async () => {
        const root = scratchRepo();
        git(root, 'branch', 'merged');
        const answer = await deleteBranch(root, 'merged', [root]);
        expect(answer.ok).toBe(true);
        expect(has(root, 'merged')).toBe(false);
    });

    it('refuses the checked-out branch', async () => {
        const root = scratchRepo();
        const answer = await deleteBranch(root, 'main', [root]);
        expect(answer.ok).toBe(false);
        expect(has(root, 'main')).toBe(true);
    });

    it('refuses a branch git calls not fully merged, with git reason, and keeps it', async () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'unmerged');
        commitFile(root, 'u.txt', 'u\n', 'Unmerged work');
        git(root, 'switch', '-q', 'main');
        const answer = await deleteBranch(root, 'unmerged', [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('not fully merged');
        expect(answer.code).toBe('not-merged');
        expect(has(root, 'unmerged')).toBe(true);
    });

    it('gives the code not-merged for a branch whose long name pushes the phrase past the reason', async () => {
        const root = scratchRepo();
        const name = `unmerged-${'x'.repeat(190)}`;
        git(root, 'switch', '-q', '-c', name);
        commitFile(root, 'u.txt', 'u\n', 'Unmerged work');
        git(root, 'switch', '-q', 'main');
        const answer = await deleteBranch(root, name, [root]);
        expect(answer.ok).toBe(false);
        expect(answer.code).toBe('not-merged');
        expect(has(root, name)).toBe(true);
    });

    it('deletes a branch git calls not fully merged on Delete Anyway', async () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'unmerged');
        commitFile(root, 'u.txt', 'u\n', 'Unmerged work');
        git(root, 'switch', '-q', 'main');
        const answer = await deleteBranchAnyway(root, 'unmerged', [root]);
        expect(answer.ok).toBe(true);
        expect(has(root, 'unmerged')).toBe(false);
    });

    it('deletes a merged branch with no code and no second step', async () => {
        const root = scratchRepo();
        git(root, 'branch', 'merged');
        const answer = await deleteBranch(root, 'merged', [root]);
        expect(answer).toMatchObject({ ok: true });
        expect(answer.code).toBeUndefined();
    });

    it('refuses a branch checked out in a worktree, with git reason', async () => {
        const root = scratchRepo();
        expect((await createWorktree(root, 'wt', [root])).ok).toBe(true);
        const answer = await deleteBranch(root, 'wt', [root]);
        expect(answer.ok).toBe(false);
        expect(answer.code).toBeUndefined();
        expect(has(root, 'wt')).toBe(true);
        expect((await deleteBranchAnyway(root, 'wt', [root])).ok).toBe(false);
        expect(has(root, 'wt')).toBe(true);
    });

    // The root is a folder that is no repository, so any git call would answer with git's own
    // reason; the module's sentence is the proof that git was not asked.
    it('refuses a name that starts with a dash before git runs, for both forms', async () => {
        const folder = scratchDir('oculus-no-repo-');
        for (const name of ['-D', '--force', '-d']) {
            for (const remove of [deleteBranch, deleteBranchAnyway]) {
                const answer = await remove(folder, name, [folder]);
                expect(answer.ok).toBe(false);
                expect(answer.error).toBe(`${name} is not a branch name git accepts`);
            }
        }
    });

    it('refuses the checked-out branch and a name that names no branch, for both forms', async () => {
        const root = scratchRepo();
        for (const remove of [deleteBranch, deleteBranchAnyway]) {
            expect((await remove(root, 'main', [root])).ok).toBe(false);
            expect((await remove(root, 'nothing', [root])).ok).toBe(false);
        }
        expect(has(root, 'main')).toBe(true);
    });

    it('refuses a root no workspace names, for both forms', async () => {
        const root = scratchRepo();
        git(root, 'branch', 'merged');
        expect((await deleteBranch(root, 'merged', ['/nowhere'])).ok).toBe(false);
        expect((await deleteBranchAnyway(root, 'merged', ['/nowhere'])).ok).toBe(false);
        expect(has(root, 'merged')).toBe(true);
    });
});
