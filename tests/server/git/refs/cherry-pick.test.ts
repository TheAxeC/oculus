// What server/git/git-index.ts's cherryPick does with a commit of another branch: a new commit on
// the checked-out branch, a stop on conflicts left in progress for the merge editor and taken back
// by abortMerge, and a pick git calls empty, aborted and answered in VS Code's words. The state is
// read by server/core/git/state.ts's statusFor.
//
// What this does NOT cover: the banner and the commit box the page draws over a cherry-pick in
// progress.

import { describe, expect } from 'vitest';
import { abortMerge, cherryPick } from '../../../../src/lib/server/git/git-index.ts';
import { statusFor } from '../../../../src/lib/server/core/git/state.ts';
import { it } from '../../../fixtures/scratch.ts';
import { commitFile, git, isolateGit, scratchRepo } from './repo.ts';

isolateGit();

/** `main` and a branch `other` one commit apart; the repository is left on `main`. */
function diverged(conflict: boolean): { root: string; pick: string } {
    const root = scratchRepo();
    git(root, 'switch', '-q', '-c', 'other');
    const pick = conflict
        ? commitFile(root, 'kept.txt', 'other\n', 'Other change')
        : commitFile(root, 'o.txt', 'o\n', 'Other file');
    git(root, 'switch', '-q', 'main');
    // The two branches differ, so a pick is a new commit and never the commit it picked.
    if (conflict) commitFile(root, 'kept.txt', 'main\n', 'Main change');
    else commitFile(root, 'm.txt', 'm\n', 'Main file');
    return { root, pick };
}

describe('cherryPick', () => {
    it('makes a new commit on the checked-out branch with the commit message', async () => {
        const { root, pick } = diverged(false);
        const answer = await cherryPick(root, pick, [root]);
        expect(answer.ok).toBe(true);
        expect(git(root, 'log', '-1', '--format=%s').trim()).toBe('Other file');
        expect(git(root, 'rev-parse', 'HEAD').trim()).not.toBe(pick);
        expect(git(root, 'show', '--name-only', '--format=', 'HEAD').trim()).toBe('o.txt');
        expect(statusFor([root])[root].sequence).toBe('');
    });

    it('leaves a conflicting pick in progress, with git message prepared', async () => {
        const { root, pick } = diverged(true);
        const answer = await cherryPick(root, pick, [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('kept.txt');
        const found = statusFor([root])[root];
        expect(found.sequence).toBe('cherry-picking');
        expect(found.conflicted.map((entry) => entry.path)).toEqual(['kept.txt']);
        expect(found.mergeMessage).toContain('Other change');
    });

    it('takes a conflicting pick back with abortMerge', async () => {
        const { root, pick } = diverged(true);
        const before = git(root, 'rev-parse', 'HEAD').trim();
        await cherryPick(root, pick, [root]);
        expect((await abortMerge(root, [root])).ok).toBe(true);
        expect(statusFor([root])[root].sequence).toBe('');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(before);
        expect(git(root, 'status', '--porcelain').trim()).toBe('');
    });

    it('aborts a pick git calls empty and answers VS Code message for it', async () => {
        const { root } = diverged(false);
        const ancestor = git(root, 'rev-parse', 'HEAD').trim();
        const answer = await cherryPick(root, ancestor, [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toBe('The changes are already present in the current branch.');
        expect(statusFor([root])[root].sequence).toBe('');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(ancestor);
    });

    it('refuses a revision that is not a hash before git runs', async () => {
        const { root } = diverged(false);
        const before = git(root, 'rev-parse', 'HEAD').trim();
        for (const revision of ['other', '-n', '--abort', 'HEAD~1', 'zz']) {
            expect((await cherryPick(root, revision, [root])).ok, revision).toBe(false);
        }
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(before);
        expect(statusFor([root])[root].sequence).toBe('');
    });

    it('refuses a root no workspace names', async () => {
        const { root, pick } = diverged(false);
        expect((await cherryPick(root, pick, ['/nowhere'])).ok).toBe(false);
    });
});
