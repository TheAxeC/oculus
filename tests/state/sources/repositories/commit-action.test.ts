// The commit box's two rules, over the git state and the message: how many lines the message field
// is drawn with, and which of Commit, Sync Changes and Publish Branch the one button is. Pure, so
// each case is a state written out here.

import { describe, expect, it } from 'vitest';
import {
    actionButton,
    canPublish,
    checkedOutBranch,
    messageRows
} from '../../../../src/lib/state/sources/repositories/repositories.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';

const CHANGE = { path: 'a.ts', status: 'M', added: 1, deleted: 0 };
const TRACKING = [{ name: 'main', upstream: 'origin/main', current: true }];

describe('the lines of the commit message field', () => {
    it('is one for an empty message and one for a long line that wraps', () => {
        expect(messageRows('')).toBe(1);
        expect(messageRows('x'.repeat(500))).toBe(1);
    });

    it('is the line count up to ten, a trailing newline counting its empty line', () => {
        expect(messageRows('a\nb\nc\nd')).toBe(4);
        expect(messageRows('a\n')).toBe(2);
        expect(messageRows(Array.from({ length: 30 }, () => 'x').join('\n'))).toBe(10);
        expect(messageRows(Array.from({ length: 10 }, () => 'x').join('\n'))).toBe(10);
        expect(messageRows(Array.from({ length: 11 }, () => 'x').join('\n'))).toBe(10);
    });
});

describe('what the commit box button is', () => {
    it('is Commit while anything is staged, changed, untracked or unmerged', () => {
        expect(actionButton(git({ staged: [CHANGE] }))).toBe('commit');
        expect(actionButton(git({ unstaged: [CHANGE] }))).toBe('commit');
        expect(actionButton(git({ untracked: [CHANGE] }))).toBe('commit');
        expect(actionButton(git({ conflicted: [CHANGE] }))).toBe('commit');
    });

    it('is Commit while a merge or a rebase is in progress with nothing left to stage', () => {
        expect(actionButton(git({ sequence: 'merging' }))).toBe('commit');
        expect(actionButton(git({ sequence: 'rebasing' }))).toBe('commit');
    });

    it('is Sync Changes with nothing to commit and a branch ahead of or behind its upstream', () => {
        const tracked = { upstream: true, branches: TRACKING };
        expect(actionButton(git({ ...tracked, ahead: 1 }))).toBe('sync');
        expect(actionButton(git({ ...tracked, behind: 2 }))).toBe('sync');
        expect(actionButton(git({ ...tracked, ahead: 1, behind: 2 }))).toBe('sync');
    });

    it('is the disabled Commit button with nothing to commit and nothing to sync', () => {
        const tracked = { upstream: true, branches: TRACKING };
        expect(actionButton(git({ ...tracked }))).toBe('none');
        // git has not answered whether the branch tracks anything
        expect(actionButton(git({ upstream: null, ahead: 1, branches: TRACKING }))).toBe('none');
        // the state says it tracks something, but the listing has not named it yet
        expect(actionButton(git({ upstream: true, ahead: 1, branches: [] }))).toBe('none');
    });

    it('is the disabled Commit button on a detached head, whatever the upstream state says', () => {
        const tracked = { upstream: true, branches: TRACKING, ahead: 2, behind: 1 };
        expect(actionButton(git({ ...tracked, detached: true }))).toBe('none');
    });

    it('is Publish Branch with nothing to commit, no upstream and a remote to publish to', () => {
        expect(actionButton(git({ upstream: false, remotes: ['origin'] }))).toBe('publish');
        expect(actionButton(git({ upstream: false, remotes: [] }))).toBe('none');
        expect(actionButton(git({ upstream: false, remotes: ['origin'], detached: true }))).toBe(
            'none'
        );
    });

    it('is Publish Branch for a repository with no commit exactly when Publish Branch is offered', () => {
        for (const remotes of [[], ['origin']]) {
            const fresh = git({ branch: 'start', log: [], branches: [], upstream: false, remotes });
            expect(actionButton(fresh) === 'publish').toBe(canPublish(fresh));
        }
    });

    it('is Commit before it is Sync or Publish', () => {
        const tracked = { upstream: true, branches: TRACKING, ahead: 3 };
        expect(actionButton(git({ ...tracked, staged: [CHANGE] }))).toBe('commit');
        expect(actionButton(git({ upstream: false, remotes: ['origin'], staged: [CHANGE] }))).toBe(
            'commit'
        );
    });
});

describe('the branch the commit box names', () => {
    it('is the checked-out branch, and none for a detached head or an unnamed one', () => {
        expect(checkedOutBranch(git({ branch: 'main' }))).toBe('main');
        expect(checkedOutBranch(git({ branch: 'HEAD', detached: true }))).toBe('');
        expect(checkedOutBranch(git({ branch: 'main', detached: true }))).toBe('');
        expect(checkedOutBranch(git({ branch: '' }))).toBe('');
        expect(checkedOutBranch(git({ branch: 'HEAD' }))).toBe('');
    });
});
