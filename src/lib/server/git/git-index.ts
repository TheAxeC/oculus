// Layer 2, server. The git writes over the index that VS Code's Source Control makes from its
// diff and its section heads: a hunk or chosen lines staged, unstaged or reverted, a whole group
// staged, unstaged or discarded, a conflicted path resolved from the merge editor or marked
// resolved as it stands, a deletion one side made taken, and a merge or a rebase that stopped taken
// back or carried on.
//
// A hunk or a set of lines arrives as a patch the page cut from the diff it drew, and git applies
// it: `apply --cached` to the index for a stage, the same reversed for an unstage, and reversed on
// the worktree for a revert. Every path the patch names is held to the repository before git sees
// it, and a patch git refuses is answered with git's own line. Every call reaches git through the
// one call site server/git/git-write.ts exports for its subcommand.
//
// A path handed to git is checked by core/git.ts's `pathInside`; the records of `status
// --porcelain=v1 -z` are split by core/git-parse.ts's `statusRecords`.

import { isAbsolute, join } from 'node:path';
import { existsSync } from 'node:fs';
import { writeTextAtomic } from '../core/json.ts';
import { pathInside } from '../core/git.ts';
import { statusRecords } from '../core/git-parse.ts';
import {
    addTo,
    allowedRoots,
    applyPatch,
    failed,
    permitted,
    porcelain,
    rebaseIn,
    removeIn,
    restore,
    mergeIn,
    revParse,
    unmergedPaths,
    untrackedIn,
    type Outcome
} from './git-write.ts';

const UNKNOWN = 'that directory is not a workspace oculus knows';

/** What a patch does, which picks the flags `apply` is given. */
export type PatchMode = 'stage' | 'unstage' | 'revert';

const FLAGS: Record<PatchMode, string[]> = {
    stage: ['--cached'],
    unstage: ['--cached', '--reverse'],
    revert: ['--reverse']
};

/**
 * The paths a patch names in its heads, each as git would read it: the `a/` or `b/` prefix taken
 * off, a quoted name unquoted, and `/dev/null` left out.
 */
export function patchPaths(patch: string): string[] {
    const paths: string[] = [];
    for (const line of patch.split('\n')) {
        const head = /^(?:---|\+\+\+) (.*)$/.exec(line);
        const moved = /^(?:rename|copy) (?:from|to) (.*)$/.exec(line);
        const raw = head?.[1] ?? moved?.[1];
        if (raw === undefined) continue;
        let name = unquote(raw.replace(/\t$/, ''));
        if (name === '/dev/null') continue;
        if (head !== null) name = name.replace(/^[ab]\//, '');
        paths.push(name);
    }
    return paths;
}

/** A C-quoted name as git writes one in a diff head, and any other name as it is. */
function unquote(name: string): string {
    if (!name.startsWith('"') || !name.endsWith('"') || name.length < 2) return name;
    try {
        return JSON.parse(name) as string;
    } catch {
        return name.slice(1, -1);
    }
}

/**
 * Apply one patch the page made from a hunk or from chosen lines. A patch that names no path, or a
 * path outside the repository, is refused before git is asked.
 */
export async function applyHunk(
    root: string,
    patch: string,
    mode: PatchMode,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const flags = FLAGS[mode] as string[] | undefined;
    if (flags === undefined) return failed('that is not a way to apply a change');
    if (typeof patch !== 'string' || !patch.startsWith('diff --git ')) {
        return failed('that is not a patch git can apply');
    }
    const paths = patchPaths(patch);
    if (paths.length === 0) return failed('the patch names no path');
    const outside = paths.find((path) => !pathInside(root, path));
    if (outside !== undefined) return failed(`the path ${outside} is not inside the workspace`);
    return applyPatch(root, flags, patch.endsWith('\n') ? patch : `${patch}\n`);
}

/**
 * Stage a whole group: every tracked change with `add -u`, or every untracked path as git lists
 * it now, which is the whole group rather than the capped list the channel carries.
 */
export async function stageAll(
    root: string,
    group: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if (group === 'changed') return addTo(root, ['-u', '--', '.']);
    if (group !== 'untracked') return failed('that is not a group of changes');
    const state = await porcelain(root);
    if (!state.ok) return state;
    const loose = [...untrackedIn(state.output)];
    if (loose.length === 0) return failed('nothing is untracked, so there is nothing to stage');
    return addTo(root, ['--', ...loose]);
}

/** Take everything back out of the index, leaving the worktree as it is. */
export async function unstageAll(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    return restore(root, ['.'], true);
}

/**
 * Throw away every worktree change to a tracked path. Untracked paths are left where they are:
 * the only command that would take them is `clean`, and a file git never saw is a file nobody can
 * get back.
 */
export async function discardAll(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    return restore(root, ['.'], false);
}

/**
 * Complete Merge: write the result the merge editor holds over the conflicted path and stage it,
 * which is what tells git the conflict is resolved. A path git does not list as unmerged is
 * refused, so this never writes over a file that is not in conflict.
 */
export async function resolveMerge(
    root: string,
    path: string,
    content: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if (typeof path !== 'string' || !pathInside(root, path)) {
        return failed(`the path ${path} is not inside the workspace`);
    }
    if (typeof content !== 'string') return failed('the merge result is not text');
    if (!(await unmergedPaths(root)).includes(path)) {
        return failed(`${path} is not in conflict, so there is nothing to resolve`);
    }
    try {
        writeTextAtomic(join(root, path), content);
    } catch (error) {
        return failed(`the result could not be written: ${String(error)}`);
    }
    return addTo(root, ['--', path]);
}

/** The conflicts in which a side deleted the path: both sides, ours (DU) or theirs (UD). */
const DELETIONS = ['DD', 'DU', 'UD'];

/** The porcelain's two letters for one path, or the empty string when git lists it as clean. */
async function pairOf(root: string, path: string): Promise<string> {
    const state = await porcelain(root);
    if (!state.ok) return '';
    return statusRecords(state.output).find((record) => record.path === path)?.code ?? '';
}

/**
 * Accept the deletion of a conflicted path that one side or both deleted: the path goes from the
 * index and from the worktree, which is what tells git the conflict is resolved that way. A path
 * in any other conflict, or in none, is refused before git is asked.
 */
export async function acceptDeletion(
    root: string,
    path: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if (typeof path !== 'string' || !pathInside(root, path)) {
        return failed(`the path ${path} is not inside the workspace`);
    }
    if (!DELETIONS.includes(await pairOf(root, path))) {
        return failed(`${path} is not a conflict a side deleted, so there is no deletion to take`);
    }
    return removeIn(root, ['--quiet', '--', path]);
}

/**
 * Mark Resolved: take a conflicted path as the worktree holds it now. `git add` stages a path the
 * worktree holds and records the deletion of one it no longer holds, as after both sides deleted
 * it, and either way the path's unmerged entries leave the index. A path git does not list as
 * unmerged is refused, so the control never stages an ordinary change.
 */
export async function markResolved(
    root: string,
    path: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if (typeof path !== 'string' || !pathInside(root, path)) {
        return failed(`the path ${path} is not inside the workspace`);
    }
    const unmerged = await unmergedPaths(root);
    if (!unmerged.includes(path)) {
        return failed(`${path} is not in conflict, so there is nothing to resolve`);
    }
    return addTo(root, ['--', path]);
}

/** Which of the two the repository is in the middle of, read as git itself would. */
async function inProgress(root: string): Promise<'merge' | 'rebase' | ''> {
    const merging = await revParse(root, ['--verify', '--quiet', 'MERGE_HEAD']);
    if (merging.ok) return 'merge';
    for (const name of ['rebase-merge', 'rebase-apply']) {
        const where = await revParse(root, ['--git-path', name]);
        if (!where.ok) continue;
        const path = where.output.trim();
        if (existsSync(isAbsolute(path) ? path : join(root, path))) return 'rebase';
    }
    return '';
}

/** Abort Merge: take the merge, or the rebase a pull began, back to where it started. */
export async function abortMerge(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const doing = await inProgress(root);
    if (doing === 'merge') return mergeIn(root, ['--abort']);
    if (doing === 'rebase') return rebaseIn(root, '--abort');
    return failed('no merge is in progress here, so there is nothing to abort');
}

/**
 * Carry a rebase on once its conflicts are resolved, which is what a pull set to rebase needs in
 * place of the merge's commit. A path still unmerged is refused before git is asked.
 */
export async function continueRebase(
    root: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if ((await inProgress(root)) !== 'rebase') {
        return failed('no rebase is in progress here, so there is nothing to continue');
    }
    const left = await unmergedPaths(root);
    if (left.length > 0) return failed(`${left.join(', ')} still conflicted`);
    return rebaseIn(root, '--continue');
}
