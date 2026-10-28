// Layer 2, server. The diff texts the writing module's `diff` call site answers for a reader:
// what is staged, which the suggested commit message is written from (git-message.ts), one file's
// diff for the pane the Repositories view opens over a row, and a worktree's diff from the branch
// it came from (git-reads.ts). They are reads, kept beside git-write.ts rather than in
// server/core/git/ because `diff` is run from git-write.ts's call site, which already answers the
// writes' diffs; each is refused for a root the writes may not name, as a write is.

import { permitted } from '../core/paths.ts';
import { words } from '../core/words.ts';
import { PANE_DIFF } from '../core/git/parse.ts';
import {
    allowedRoots,
    checkPaths,
    diff,
    failed,
    revParse,
    worktreeUnder,
    type GitAt,
    type Outcome
} from './git-write.ts';

/** What is staged right now, which is what the suggested message is written from. */
export async function stagedDiff(
    at: GitAt,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    return diff(at, ['--cached']);
}

/**
 * One file's diff, staged or not, for the pane the Repositories view opens over a row: its head
 * lines, which the read answers beside the file's two versions. A read: the `git` channel carries
 * the paths and this answers one of them, since a diff of every changed file of every root on every
 * event is what the channel's throttle is there to avoid. A path in conflict, which `git diff`
 * answers as a combined diff, is read as Current's version (stage 2, `--ours`) against the
 * worktree, the side the reader's edits go to.
 */
export async function fileDiff(
    at: GitAt,
    path: string,
    staged: boolean,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome & { ours: boolean }> {
    const wrong = checkPaths(at.root, [path], text, roots);
    if (wrong !== '') return { ...failed(wrong), ours: false };
    const flags = [...PANE_DIFF, '--', path];
    const read = await diff(at, [...(staged ? ['--cached'] : []), ...flags]);
    if (staged || !read.ok || !read.output.startsWith('diff --cc '))
        return { ...read, ours: false };
    return { ...(await diff(at, ['--ours', ...flags])), ours: true };
}

/**
 * The branch a worktree's diff starts from: the repository's checked-out branch, or its HEAD for a
 * detached checkout, which has no branch to name. The worktree's diff is the three-dot diff from it
 * to the worktree's own HEAD, which is what the reader is about to merge back.
 *
 * The repository is named by the caller and never worked out from the path: a worktree of the hub
 * is itself a workspace on the `git` channel and therefore a root of its own, so a path would
 * answer with itself and every worktree this hub makes would be refused.
 */
export async function worktreeFrom(
    at: GitAt,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (!worktreeUnder(at.root, path)) return failed(words(text, 'server.git.outside_worktrees'));
    const head = await revParse(at, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const name = head.output.trim();
    const from = name === '' || name === 'HEAD' ? await revParse(at, ['HEAD']) : head;
    return from.ok ? { ...from, output: from.output.trim() } : from;
}

/** What a worktree holds that the repository's checked-out branch does not, as a diff. */
export async function worktreeDiff(
    at: GitAt,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const from = await worktreeFrom(at, path, text, roots);
    return from.ok ? worktreeRange({ ...at, root: path }, from.output) : from;
}

/**
 * The three-dot diff of a worktree, the root of `tree`, from the branch `worktreeFrom` named,
 * which it checked.
 */
export function worktreeRange(tree: GitAt, from: string): Promise<Outcome> {
    return diff(tree, [...PANE_DIFF, `${from}...HEAD`]);
}
