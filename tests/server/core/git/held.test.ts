// What server/core/git/state.ts's statusFor says of a change list it cut: each list holds at most
// MAX_ENTRIES rows, and `held` carries the count each list had before the cut, so the page can say
// that rows are missing.
//
// What this does NOT cover: the warning the page draws from the counts.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { MAX_ENTRIES, statusFor } from '../../../../src/lib/server/core/git/state.ts';
import { it } from '../../../fixtures/scratch.ts';
import { git, isolateGit, put, scratchRepo } from '../../git/refs/repo.ts';

isolateGit();

const MANY = MAX_ENTRIES + 50;

describe('the counts a cut list was held at', () => {
    it('holds 250 changed files as 200 rows and a count of 250', () => {
        const root = scratchRepo();
        for (let index = 0; index < MANY; index += 1) put(root, `f/${index}.txt`, 'a\n');
        git(root, 'add', '.');
        git(root, 'commit', '-q', '-m', 'Many');
        for (let index = 0; index < MANY; index += 1) put(root, `f/${index}.txt`, 'b\n');
        const found = statusFor([root])[root];
        expect(found.unstaged).toHaveLength(MAX_ENTRIES);
        expect(found.held).toEqual({ staged: 0, changes: MANY, untracked: 0, merge: 0 });
    });

    it('holds 250 staged files and 250 untracked files each at its own count', () => {
        const root = scratchRepo();
        for (let index = 0; index < MANY; index += 1) put(root, `s/${index}.txt`, 'a\n');
        git(root, 'add', 's');
        for (let index = 0; index < MANY; index += 1) put(root, `u${index}.txt`, 'a\n');
        const found = statusFor([root])[root];
        expect(found.staged).toHaveLength(MAX_ENTRIES);
        expect(found.untracked).toHaveLength(MAX_ENTRIES);
        expect(found.held).toEqual({ staged: MANY, changes: 0, untracked: MANY, merge: 0 });
    });

    it('holds 10 changed files at 10 rows and a count of 10', () => {
        const root = scratchRepo();
        for (let index = 0; index < 10; index += 1) put(root, `f${index}.txt`, 'a\n');
        git(root, 'add', '.');
        git(root, 'commit', '-q', '-m', 'Ten');
        for (let index = 0; index < 10; index += 1) put(root, `f${index}.txt`, 'b\n');
        const found = statusFor([root])[root];
        expect(found.unstaged).toHaveLength(10);
        expect(found.held.changes).toBe(10);
    });

    it('holds the paths of a merge in conflict as the merge count', () => {
        const root = scratchRepo();
        git(root, 'switch', '-q', '-c', 'other');
        put(root, 'kept.txt', 'other\n');
        git(root, 'commit', '-q', '-am', 'Other');
        git(root, 'switch', '-q', 'main');
        put(root, 'kept.txt', 'main\n');
        git(root, 'commit', '-q', '-am', 'Main');
        expect(() => git(root, 'merge', 'other')).toThrow();
        const found = statusFor([root])[root];
        expect(found.conflicted).toHaveLength(1);
        expect(found.held.merge).toBe(1);
    });

    it('holds nothing for a folder that is no repository', () => {
        const found = statusFor(['/nonexistent-q88-root'])['/nonexistent-q88-root'];
        expect(found.held).toEqual({ staged: 0, changes: 0, untracked: 0, merge: 0 });
    });
});
