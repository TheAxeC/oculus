// Layer 4, test helper. One merge that stops on the three conflicts a deletion makes, for the
// suites over the merge editor's reads and writes: both sides renamed `both.txt` apart (DD), the
// current branch deleted `ours.txt` while the other changed it (DU), and the other deleted
// `theirs.txt` while the current branch changed it (UD).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** A git command in the repository, as the calling suite runs one. */
type Git = (root: string, ...args: string[]) => unknown;

/** The paths of the three conflicts, by the two letters git's status gives each. */
export const DELETED = { both: 'both.txt', ours: 'ours.txt', theirs: 'theirs.txt' };

/**
 * Commit the three files on the checked-out branch, change them apart on a branch `side` and on
 * the checked-out branch, and merge `side` in, which stops on the three conflicts.
 */
export function deletionConflicts(root: string, git: Git, branch: string): void {
    const put = (name: string, body: string): void => writeFileSync(join(root, name), body);
    put(DELETED.both, 'the same lines on both sides\nof the rename\n');
    put(DELETED.ours, 'kept by the other side\n');
    put(DELETED.theirs, 'kept by this side\n');
    git(root, 'add', '.');
    git(root, 'commit', '-q', '-m', 'Three files');
    git(root, 'switch', '-q', '-c', 'side');
    git(root, 'mv', DELETED.both, 'renamed-there.txt');
    git(root, 'rm', '-q', DELETED.theirs);
    put(DELETED.ours, 'changed by the other side\n');
    git(root, 'commit', '-q', '-am', 'Side');
    git(root, 'switch', '-q', branch);
    git(root, 'mv', DELETED.both, 'renamed-here.txt');
    git(root, 'rm', '-q', DELETED.ours);
    put(DELETED.theirs, 'changed by this side\n');
    git(root, 'commit', '-q', '-am', 'Here');
    try {
        git(root, 'merge', '-q', 'side');
    } catch {
        // The merge stops on its conflicts, which is what the suites read.
    }
}
