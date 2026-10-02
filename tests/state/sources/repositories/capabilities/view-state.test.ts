// What a Repositories tab keeps for Close Repository, Close Other Repositories and Reopen Closed
// Repositories; the message git prepared for a merge or a cherry pick; and which change groups the
// 200-entry cut shortened.
//
// What this does NOT cover: the quick pick and the rows drawn, which tests/views holds.

import { describe, expect, it } from 'vitest';
import {
    closeOthers,
    closeRepository,
    cutGroups,
    pickerRoots,
    preparedMessage,
    reopenRepositories,
    repositoriesViewOf,
    shownRoot,
    visibleRoots
} from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import { git } from '../../../../fixtures/sessions-fixture.ts';

const VIEW = repositoriesViewOf({ root: '/a' });
const ROOTS = ['/a', '/b', '/c'];

describe('the repositories a tab has closed', () => {
    // Revert: leave `closed` out of repositoriesViewOf.
    it('keeps the closed roots in the tab state, their strings only, none for a state that names none', () => {
        expect(repositoriesViewOf({}).closed).toEqual([]);
        expect(repositoriesViewOf({ closed: ['/b'] }).closed).toEqual(['/b']);
        expect(repositoriesViewOf({ closed: 3 }).closed).toEqual([]);
        expect(repositoriesViewOf({ closed: ['/b', 4] }).closed).toEqual(['/b']);
    });

    // Revert: filter nothing in visibleRoots.
    it('draws the roots not closed, in the channel order', () => {
        expect(visibleRoots(ROOTS, [])).toEqual(ROOTS);
        expect(visibleRoots(ROOTS, ['/b'])).toEqual(['/a', '/c']);
        expect(visibleRoots(ROOTS, ['/gone'])).toEqual(ROOTS);
    });

    // Revert: close the root in every tab by writing nothing to the tab state.
    it('closes one repository, once', () => {
        const closed = closeRepository(VIEW, '/b');
        expect(closed.closed).toEqual(['/b']);
        expect(closeRepository(closed, '/b').closed).toEqual(['/b']);
        expect(VIEW.closed).toEqual([]);
    });

    // Revert: close the repository itself in closeOthers.
    it('closes every other repository and keeps the one asked', () => {
        const others = closeOthers(VIEW, ROOTS, '/b');
        expect(others.closed.sort()).toEqual(['/a', '/c']);
        expect(visibleRoots(ROOTS, others.closed)).toEqual(['/b']);
        expect(closeOthers(closeRepository(VIEW, '/a'), ROOTS, '/b').closed.sort()).toEqual([
            '/a',
            '/c'
        ]);
    });

    // Revert: make '*' reopen the one repository.
    it('reopens one repository, or all of them', () => {
        const closed = closeOthers(VIEW, ROOTS, '/a');
        expect(reopenRepositories(closed, '/b').closed).toEqual(['/c']);
        expect(reopenRepositories(closed, '*').closed).toEqual([]);
    });

    // Revert: show the kept root although it is closed.
    it('shows the first repository left when the kept one is closed', () => {
        const left = visibleRoots(ROOTS, ['/a']);
        expect(shownRoot(left, '/a')).toBe('/b');
        expect(shownRoot(visibleRoots(ROOTS, ROOTS), '/a')).toBe('');
        expect(pickerRoots(ROOTS, () => git())).toEqual(ROOTS);
    });
});

describe('the message git prepared', () => {
    // Revert: return the message for 'rebasing' too.
    it('is the merge message of a merge or a cherry pick in progress, and none otherwise', () => {
        const message = 'Merge branch x\n';
        expect(preparedMessage(git({ sequence: 'merging', mergeMessage: message }))).toBe(message);
        expect(preparedMessage(git({ sequence: 'cherry-picking', mergeMessage: message }))).toBe(
            message
        );
        expect(preparedMessage(git({ sequence: 'rebasing', mergeMessage: message }))).toBe('');
        expect(preparedMessage(git({ mergeMessage: message }))).toBe('');
    });
});

describe('the groups the 200-entry cut shortened', () => {
    const rows = (n: number) =>
        Array.from({ length: n }, (_, at) => ({
            path: `f${String(at)}`,
            status: 'M',
            added: 0,
            deleted: 0
        }));

    // Revert: compare the counts with 201 rather than with the rows shown.
    it('names each group that held more than it shows', () => {
        const state = git({
            unstaged: rows(200),
            staged: rows(10),
            held: { staged: 10, changes: 250, untracked: 0, merge: 0 }
        });
        expect(cutGroups(state)).toEqual(['changed']);
    });

    it('names none for a repository nothing was cut from', () => {
        expect(cutGroups(git({ unstaged: rows(10) }))).toEqual([]);
        expect(cutGroups(git())).toEqual([]);
    });

    it('names every group that was cut', () => {
        const state = git({
            staged: rows(200),
            unstaged: rows(200),
            untracked: rows(200),
            held: { staged: 201, changes: 300, untracked: 999, merge: 0 }
        });
        expect(cutGroups(state)).toEqual(['staged', 'changed', 'untracked']);
    });
});
