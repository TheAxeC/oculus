// What server/git/git-index.ts's cherryPick does with a commit of another branch: a new commit on
// the checked-out branch. The state is read by server/core/git/state.ts's statusFor.
//
// What this does NOT cover: the banner and the commit box the page draws over a cherry-pick in
// progress.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { cherryPick } from '../../../../src/lib/server/git/git-index.ts';
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
});
