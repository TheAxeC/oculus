// Layer 2, server. Stashes and tags, as VS Code's Source Control makes them: a stash of the tracked
// changes, of every change with the untracked files, or of what is staged, each with an optional
// message; a stash applied, popped or dropped; a tag made at HEAD, annotated when it has a message,
// and a tag deleted. Every call reaches git through the one call site server/git/git-write.ts
// exports for its subcommand.
//
// A stash is addressed by git's own name for it, `stash@{<n>}`, and nothing else is taken, so a
// request can never hand the stash command a revision or an option. A stash applied or popped over
// changes it conflicts with leaves the conflicts in the index, as git does, and the answer names
// them: the view draws them under Merge Changes, and a popped stash that conflicted is kept.
//
// The records of `status --porcelain=v1 -z` are split by core/git-parse.ts's `statusRecords`.

import { STASH_REF, statusRecords } from '../core/git-parse.ts';
import {
    allowedRoots,
    failed,
    permitted,
    porcelain,
    refFormat,
    stashIn,
    stoppedOn,
    tagIn,
    withFile,
    type Outcome
} from './git-write.ts';

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
    const flags = STASH_FLAGS[mode] as string[] | undefined;
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
 * Make a tag at HEAD: a plain one, or an annotated one carrying the message when it has one. The
 * message goes through a file, as a commit's does.
 */
export async function createTag(
    root: string,
    name: string,
    message: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const wrong = await tagName(root, name);
    if (wrong !== '') return failed(wrong);
    const text = typeof message === 'string' ? message.trim() : '';
    if (text === '') return tagIn(root, [name]);
    return withFile('oculus-tag-', text, (file) => tagIn(root, ['-a', name, '-F', file]));
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
