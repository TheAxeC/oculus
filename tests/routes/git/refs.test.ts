// Layer 2, route tests. What /api/git does for the actions on commits and refs: the
// actions cherryPick, checkoutDetached, deleteBranch and deleteBranchAnyway, a start point for a
// branch and a tag, each over a real scratch repository. The token and the confirm are
// tests/routes/git/git.test.ts.
//
// What this does NOT cover: the page's use of the answers, which tests/state/sources/repositories
// holds.
// @module-tag slow: every case runs git in a scratch repository.

import { describe, expect } from 'vitest';
import { handleGit, type GitOptions } from '../../../src/lib/server/git/git-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { it } from '../../fixtures/scratch.ts';
import { gitPost } from './request.ts';
import { commitFile, git, isolateGit, scratchRepo } from '../../server/git/refs/repo.ts';

isolateGit();

const TOKEN = mintToken();

function post(body: unknown, headers: Record<string, string> = {}): Request {
    return gitPost(TOKEN, body, headers);
}

function over(...roots: string[]): GitOptions {
    return { config: loadConfig(engineDir()).config, rootsFor: () => roots };
}

describe('the actions on commits and branches', () => {
    it('detaches HEAD at a confirmed hash', async () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        commitFile(root, 'two.txt', 'two\n', 'Second');
        const response = await handleGit(
            post({ action: 'checkoutDetached', root, ref: first, confirm: true }),
            TOKEN,
            over(root)
        );
        expect(response.status).toBe(200);
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(first);
        expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('HEAD');
    });

    it('makes a branch and a tag at the start point the body names', async () => {
        const root = scratchRepo();
        const first = git(root, 'rev-parse', 'HEAD').trim();
        commitFile(root, 'two.txt', 'two\n', 'Second');
        const branch = await handleGit(
            post({ action: 'createBranch', root, name: 'x', start: first, confirm: true }),
            TOKEN,
            over(root)
        );
        expect(branch.status).toBe(200);
        expect(git(root, 'rev-parse', 'x').trim()).toBe(first);
        git(root, 'switch', '-q', 'main');
        const tag = await handleGit(
            post({ action: 'createTag', root, name: 'v1', start: first }),
            TOKEN,
            over(root)
        );
        expect(tag.status).toBe(200);
        expect(git(root, 'rev-list', '-n', '1', 'v1').trim()).toBe(first);
    });

    it('cherry-picks a confirmed commit and deletes a confirmed merged branch', async () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'other');
        const pick = commitFile(root, 'o.txt', 'o\n', 'Other file');
        git(root, 'switch', '-q', 'main');
        const picked = await handleGit(
            post({ action: 'cherryPick', root, ref: pick, confirm: true }),
            TOKEN,
            over(root)
        );
        expect(picked.status).toBe(200);
        git(root, 'branch', 'merged');
        const deleted = await handleGit(
            post({ action: 'deleteBranch', root, name: 'merged', confirm: true }),
            TOKEN,
            over(root)
        );
        expect(deleted.status).toBe(200);
        expect(git(root, 'branch', '--list', 'merged').trim()).toBe('');
    });

    it('answers a branch git calls unmerged with the code not-merged, and deletes it on Delete Anyway', async () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'unmerged');
        commitFile(root, 'u.txt', 'u\n', 'Unmerged work');
        git(root, 'switch', '-q', 'main');
        const refused = await handleGit(
            post({ action: 'deleteBranch', root, name: 'unmerged', confirm: true }),
            TOKEN,
            over(root)
        );
        expect(refused.status).toBe(400);
        expect(await refused.json()).toMatchObject({ code: 'not-merged' });
        expect(git(root, 'branch', '--list', 'unmerged').trim()).toBe('unmerged');
        const unconfirmed = await handleGit(
            post({ action: 'deleteBranchAnyway', root, name: 'unmerged' }),
            TOKEN,
            over(root)
        );
        expect(unconfirmed.status).toBe(400);
        expect(git(root, 'branch', '--list', 'unmerged').trim()).toBe('unmerged');
        const gone = await handleGit(
            post({ action: 'deleteBranchAnyway', root, name: 'unmerged', confirm: true }),
            TOKEN,
            over(root)
        );
        expect(gone.status).toBe(200);
        expect(git(root, 'branch', '--list', 'unmerged').trim()).toBe('');
    });
});
