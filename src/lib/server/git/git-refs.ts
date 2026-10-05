// Layer 2, server. Stashes and tags, as VS Code's Source Control makes them: a stash of the tracked
// changes, of every change with the untracked files, or of what is staged, each with an optional
// message; a stash applied, popped or dropped; a tag made at HEAD or at a commit, annotated when it
// has a message, and a tag deleted; and a local branch deleted by `branch -d`, or by `branch -D`
// once the page has asked. Every call reaches git through the one call site
// server/git/git-write.ts exports for its subcommand.
//
// A stash is addressed by git's own name for it, `stash@{<n>}`, and nothing else is taken, so a
// request can never hand the stash command a revision or an option. A stash applied or popped over
// changes it conflicts with leaves the conflicts in the index, as git does, and the answer names
// them: the view draws them under Merge Changes, and a popped stash that conflicted is kept.
//
// The records of `status --porcelain=v1 -z` are split by core/git/parse.ts's `statusRecords`.

import { permitted } from '../core/paths.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { BRANCH_NOT_MERGED } from '../../data/model/index.ts';
import { REFS_FORMAT, STASH_REF, parseBranches, statusRecords } from '../core/git/parse.ts';
import {
    allowedRoots,
    branch as branchIn,
    checkName,
    checkStart,
    failed,
    porcelain,
    refFormat,
    stashIn,
    tagIn,
    withFile,
    type Outcome
} from './git-write.ts';
import { stoppedOn } from './git-index.ts';

const UNKNOWN = 'that directory is not a workspace oculus knows';

/** What a stash takes: the tracked changes, those and the untracked files, or what is staged. */
export type StashMode = 'tracked' | 'untracked' | 'staged';

const STASH_FLAGS: Record<StashMode, string[]> = {
    tracked: [],
    untracked: ['--include-untracked'],
    staged: ['--staged']
};

/**
 * Whether the porcelain holds something the stash would take, so a stash of nothing is refused
 * with a sentence rather than git's own quiet success that made no stash.
 */
function holds(output: string, mode: StashMode): boolean {
    return statusRecords(output).some(({ code }) => {
        if (mode === 'staged') return !code.startsWith(' ') && !code.startsWith('?');
        if (mode === 'tracked') return code !== '??';
        return true;
    });
}

/** Stash the changes the mode names, with the message when one is given. */
export async function stash(
    root: string,
    mode: StashMode,
    message: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const flags = byKey(STASH_FLAGS, mode);
    if (flags === undefined) return failed('that is not a way to stash');
    const state = await porcelain(root);
    if (!state.ok) return state;
    if (!holds(state.output, mode)) return failed('there is nothing here for that stash to take');
    const text = typeof message === 'string' ? message.trim() : '';
    const done = await stashIn(root, [
        'push',
        ...flags,
        ...(text === '' ? [] : [`--message=${text}`])
    ]);
    if (!done.ok && mode === 'staged' && stagedUnknown(done.error)) {
        return failed(
            'this git is older than 2.35, the first git that stashes only what is staged'
        );
    }
    return done;
}

/** Whether git refused `--staged` as an option it does not know, as a git before 2.35 does. */
export function stagedUnknown(error: string): boolean {
    return /unknown option [`']?staged/.test(error);
}

/** Apply, pop or drop one stash by git's own name for it. */
export async function stashAct(
    root: string,
    act: 'apply' | 'pop' | 'drop',
    ref: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if (!['apply', 'pop', 'drop'].includes(act)) return failed('that is not a stash action');
    if (typeof ref !== 'string' || !STASH_REF.test(ref)) return failed('that is not a stash');
    const done = await stashIn(root, [act, ref]);
    if (done.ok || act === 'drop') return done;
    return stoppedOn(root, done, act === 'pop' ? 'the pop' : 'the apply');
}

/** Whether a name is one git takes for a tag, judged by git over the whole ref. */
async function tagName(root: string, name: string): Promise<string> {
    if (typeof name !== 'string' || name.trim() === '') return 'a tag needs a name';
    if (name.startsWith('-')) return `${name} is not a tag name git accepts`;
    const judged = await refFormat(root, [`refs/tags/${name}`]);
    return judged.ok ? '' : `${name} is not a tag name git accepts`;
}

/**
 * Make a tag at HEAD, or at the commit `start` names: a plain one, or an annotated one carrying
 * the message when it has one. The message goes through a file, as a commit's does.
 */
export async function createTag(
    root: string,
    name: string,
    message: string,
    roots: string[] = allowedRoots(),
    start?: string
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const wrong = await tagName(root, name);
    if (wrong !== '') return failed(wrong);
    const at: string[] = [];
    if (start !== undefined) {
        const refusal = checkStart(start);
        if (refusal !== '') return failed(refusal);
        at.push(start);
    }
    const text = typeof message === 'string' ? message.trim() : '';
    if (text === '') return tagIn(root, [name, ...at]);
    return withFile('oculus-tag-', text, (file) => tagIn(root, ['-a', name, '-F', file, ...at]));
}

/** Delete one tag here; a tag already pushed stays on the remote. */
export async function deleteTag(
    root: string,
    name: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const wrong = await tagName(root, name);
    if (wrong !== '') return failed(wrong);
    return tagIn(root, ['-d', name]);
}

/**
 * The refusal of a branch that cannot be deleted before git is asked, or null: a name git does not
 * accept, a branch the repository lacks, and the branch checked out here.
 */
async function undeletable(root: string, name: string, roots: string[]): Promise<Outcome | null> {
    const wrong = await checkName(root, name, roots);
    if (wrong !== '') return failed(wrong);
    const listed = await branchIn(root, [REFS_FORMAT]);
    if (!listed.ok) return listed;
    const found = parseBranches(listed.output).find((one) => one.name === name);
    if (found === undefined) return failed(`${name} is not a branch of this repository`);
    if (found.current) return failed(`${name} is the branch that is checked out, so it is kept`);
    return null;
}

/**
 * Delete a local branch with `branch -d`, which git refuses for a branch not merged into its
 * upstream, or into HEAD when it has none, and for one a worktree has checked out; git's reason is
 * the answer and the branch stays. A branch git calls not fully merged is refused with the code
 * `not-merged`, found in git's whole error stream, which the page answers with its second
 * question; the command runs with git's messages in English so that refusal is recognised whatever
 * the reader's language. The branch checked out here is refused before git is asked.
 */
export async function deleteBranch(
    root: string,
    name: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const refused = await undeletable(root, name, roots);
    if (refused !== null) return refused;
    return branchIn(root, ['-d', name], {
        env: { LC_ALL: 'C' },
        codes: { 'is not fully merged': BRANCH_NOT_MERGED }
    });
}

/**
 * Delete a local branch with `branch -D`, which git runs whether or not the branch is merged. It is
 * the one write of this module that discards commits no other branch holds, and the page sends it
 * only after the question Delete Anyway asks. The same refusals as `deleteBranch` come first.
 */
export async function deleteBranchAnyway(
    root: string,
    name: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const refused = await undeletable(root, name, roots);
    if (refused !== null) return refused;
    return branchIn(root, ['-D', name]);
}
