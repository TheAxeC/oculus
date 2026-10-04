// What server/git/git-write.ts's switchDetached, createBranch and server/git/git-refs.ts's
// createTag do from a commit: a detached HEAD at a hash or a remote branch, and a branch or a tag
// made at a start point. The repositories are the real git's, with this machine's git
// configuration replaced by an empty file.
//
// What this does NOT cover: the questions the page asks first, and the route's confirm
// (tests/routes/git/git.test.ts).
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { createBranch, switchDetached } from '../../../../src/lib/server/git/git-write.ts';
import { createTag } from '../../../../src/lib/server/git/git-refs.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { commitFile, git, isolateGit, put, scratchRepo } from './repo.ts';

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

    it('detaches HEAD at the tip of a remote branch named by its own name', async () => {
        const { root, second } = twoCommits();
        const remote = scratchDir('oculus-remote-');
        git(remote, 'init', '-q', '--bare');
        git(root, 'remote', 'add', 'origin', remote);
        git(root, 'switch', '-q', '-c', 'feature');
        const tip = commitFile(root, 'f.txt', 'f\n', 'Feature');
        git(root, 'push', '-q', 'origin', 'feature');
        git(root, 'fetch', '-q', 'origin');
        git(root, 'switch', '-q', 'main');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(second);
        const answer = await switchDetached(root, 'origin/feature', [root]);
        expect(answer.ok).toBe(true);
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(tip);
        expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('HEAD');
    });

    it('refuses a dirty tree and leaves HEAD where it was', async () => {
        const { root, first, second } = twoCommits();
        put(root, 'kept.txt', 'changed\n');
        const answer = await switchDetached(root, first, [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('dirty');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(second);
        expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
    });

    it('refuses a name that starts with a dash before git runs', async () => {
        const { root, second } = twoCommits();
        const answer = await switchDetached(root, '--orphan', [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toBe('--orphan is not a branch name git accepts');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(second);
    });

    it('refuses a root no workspace names', async () => {
        const { root, first } = twoCommits();
        expect((await switchDetached(root, first, ['/nowhere'])).ok).toBe(false);
    });
});

describe('createBranch from a commit', () => {
    it('makes the branch at the commit and checks it out', async () => {
        const { root, first } = twoCommits();
        const answer = await createBranch(root, 'x', [root], first);
        expect(answer.ok).toBe(true);
        expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('x');
        expect(git(root, 'rev-parse', 'x').trim()).toBe(first);
    });

    it('answers git own refusal for a name that is taken', async () => {
        const { root, first } = twoCommits();
        git(root, 'branch', 'x');
        const answer = await createBranch(root, 'x', [root], first);
        expect(answer.ok).toBe(false);
        expect(answer.error).toContain('x');
        expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
    });

    it('refuses a start point that is not a hash before git runs', async () => {
        const { root, second } = twoCommits();
        for (const start of ['-x', 'HEAD~1', 'main', '--detach', 'abc', 'zzzzzzz', '']) {
            const answer = await createBranch(root, 'z', [root], start);
            expect(answer.ok, start).toBe(false);
        }
        expect(git(root, 'branch', '--list', 'z').trim()).toBe('');
        expect(git(root, 'rev-parse', 'HEAD').trim()).toBe(second);
    });

    it('refuses a start point that names no commit', async () => {
        const { root } = twoCommits();
        const answer = await createBranch(root, 'z', [root], 'deadbeef');
        expect(answer.ok).toBe(false);
        expect(git(root, 'branch', '--list', 'z').trim()).toBe('');
    });
});

describe('createTag from a commit', () => {
    it('points the tag at the commit', async () => {
        const { root, first } = twoCommits();
        const answer = await createTag(root, 'v1', '', [root], first);
        expect(answer.ok).toBe(true);
        expect(git(root, 'rev-list', '-n', '1', 'v1').trim()).toBe(first);
    });

    it('makes an annotated tag at the commit when a message is given', async () => {
        const { root, first } = twoCommits();
        expect((await createTag(root, 'v2', 'Release two', [root], first)).ok).toBe(true);
        expect(git(root, 'rev-list', '-n', '1', 'v2').trim()).toBe(first);
        expect(git(root, 'cat-file', '-t', 'v2').trim()).toBe('tag');
    });

    it('refuses a start point that is not a hash before git runs', async () => {
        const { root } = twoCommits();
        for (const start of ['-x', 'HEAD~1', '--force']) {
            expect((await createTag(root, 'v4', '', [root], start)).ok, start).toBe(false);
        }
        expect(git(root, 'tag', '--list').trim()).toBe('');
    });
});
