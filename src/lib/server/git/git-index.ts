// Layer 2, server. The git writes over the index that VS Code's Source Control makes from its diff
// and its section heads: a hunk or chosen lines staged, unstaged or reverted, a whole group staged,
// unstaged or discarded, a conflicted path resolved from the merge editor or marked resolved as it
// stands, a deletion one side made taken, and a merge, a rebase or a cherry-pick that stopped taken
// back or carried on. Two writes touch files rather than the index: untracked paths moved to the
// Trash, and paths appended to the root's `.gitignore`.
//
// A hunk or a set of lines arrives as a patch the page cut from the diff it drew, and git applies
// it: `apply --cached` to the index for a stage, the same reversed for an unstage, and reversed on
// the worktree for a revert. Every path the patch names is held to the repository before git sees
// it, and a patch git refuses is answered with git's own line. Every call reaches git through the
// one call site server/git/git-write.ts exports for its subcommand.
//
// A path handed to git is checked by core/git/run.ts's `pathInside`; the records of `status
// --porcelain=v1 -z` are split by core/git/parse.ts's `statusRecords`.

import { basename, dirname, isAbsolute, join } from 'node:path';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { byKey } from '../../data/helpers/guards.ts';
import { writeBytesAtomic, writeTextAtomic } from '../core/json.ts';
import { HASH, pathInside } from '../core/git/run.ts';
import { REFS_FORMAT, parseBranches, statusRecords, type Unfinished } from '../core/git/parse.ts';
import { inside, permitted, realPath } from '../core/paths.ts';
import { guarded, type Guard } from '../files/fs/ops.ts';
import {
    addTo,
    allowedRoots,
    applyPatch,
    branch,
    checkName,
    checkPaths,
    cherryPickIn,
    diff,
    failed,
    porcelain,
    rebaseIn,
    removeIn,
    restore,
    mergeIn,
    revParse,
    untrackedAmong,
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
    const flags = byKey(FLAGS, mode);
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

/**
 * Whether the porcelain reports a change of the repository's own content. An untracked file is not
 * one: git carries it across a merge and never overwrites it, so refusing a merge over one would
 * refuse every repository with a build folder in it.
 */
function tracked(output: string): boolean {
    return statusRecords(output).some((record) => record.code !== '??');
}

/**
 * Merge a branch into the root's checked-out branch, which is git's own default: a fast-forward
 * where it can be one and a merge commit otherwise. A dirty root and the checked-out branch itself
 * are refused before anything runs. A merge that stops on conflicts is left in progress, as VS
 * Code leaves it, and reported by the paths that conflicted: the view draws them under Merge
 * Changes, where each is resolved in the merge editor, and Abort Merge takes the whole merge back.
 */
export async function merge(
    root: string,
    other: string,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    const wrong = await checkName(root, other, roots);
    if (wrong !== '') return failed(wrong);
    const head = await revParse(root, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const onto = head.output.trim();
    if (onto === 'HEAD' || onto === '') {
        return failed(
            'this repository has no branch checked out, so there is nothing to merge into'
        );
    }
    if (onto === other) {
        return failed(`${other} is the branch that is checked out, so there is nothing to merge`);
    }
    // A name git accepts as a reference is not a branch: a tag or a commit id would be merged just
    // as happily, and what this control offers is the branch of a worktree.
    const listed = await branch(root, [REFS_FORMAT]);
    if (!listed.ok) return listed;
    if (!parseBranches(listed.output).some((one) => one.name === other)) {
        return failed(`${other} is not a branch of this repository`);
    }
    const state = await porcelain(root);
    if (!state.ok) return state;
    if (tracked(state.output)) {
        return failed('the repository has changes of its own, so the merge would carry them in');
    }
    const done = await mergeIn(root, [other], signal);
    if (done.ok) return done;
    return stoppedOn(root, done, 'the merge');
}

/**
 * What a write that stopped answers. A command that ended with a code of its own (Cancel, a signal)
 * says so, with the operation it left unfinished named by `leftInProgress`. Otherwise it is the
 * paths git left unmerged, when there are any, and git's own reason when there are none: a merge, a
 * pull, a stash applied or popped all leave their conflicts in the index for the merge editor, so
 * the sentence says where they are.
 */
export async function stoppedOn(root: string, done: Outcome, what: string): Promise<Outcome> {
    if (done.failure !== undefined) return leftInProgress(root, done);
    const paths = await unmergedPaths(root);
    if (paths.length === 0) return done;
    return failed(
        `${what} stopped on conflicts in ${paths.join(', ')}; they are under Merge Changes`
    );
}

/**
 * A command that ended with a code of its own, with the merge, cherry-pick or rebase it left
 * unfinished named in `failure.left`, so the answer says it is in progress and the view draws its
 * state and Abort Merge. A repository in none of the three answers as it was.
 */
async function leftInProgress(root: string, done: Outcome): Promise<Outcome> {
    if (done.failure === undefined) return done;
    const left = await inProgress(root);
    return left === '' ? done : { ...done, failure: { ...done.failure, left } };
}

/** The paths the index holds unmerged, which is where a stopped write left its conflicts. */
async function unmergedPaths(root: string): Promise<string[]> {
    const conflicted = await diff(root, ['--name-only', '--diff-filter=U']);
    return conflicted.ok ? conflicted.output.trim().split('\n').filter(Boolean) : [];
}

/** Which of the three the repository is in the middle of, read as git itself would. */
async function inProgress(root: string): Promise<Unfinished | ''> {
    const merging = await revParse(root, ['--verify', '--quiet', 'MERGE_HEAD']);
    if (merging.ok) return 'merge';
    for (const name of ['rebase-merge', 'rebase-apply']) {
        const where = await revParse(root, ['--git-path', name]);
        if (!where.ok) continue;
        const path = where.output.trim();
        if (existsSync(isAbsolute(path) ? path : join(root, path))) return 'rebase';
    }
    const picking = await revParse(root, ['--verify', '--quiet', 'CHERRY_PICK_HEAD']);
    return picking.ok ? 'cherry-pick' : '';
}

/**
 * Abort Merge: take the merge, the cherry-pick, or the rebase a pull began, back to where it
 * started.
 */
export async function abortMerge(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    const doing = await inProgress(root);
    if (doing === 'merge') return mergeIn(root, ['--abort']);
    if (doing === 'rebase') return rebaseIn(root, '--abort');
    if (doing === 'cherry-pick') return cherryPickIn(root, ['--abort']);
    return failed('no merge is in progress here, so there is nothing to abort');
}

/** What VS Code says of a pick that changes nothing, which git calls an empty cherry-pick. */
const ALREADY_PRESENT = 'The changes are already present in the current branch.';

/**
 * Cherry-pick a commit onto the checked-out branch. The commit is a hash, checked before git runs.
 * A pick that stops on conflicts is left in progress for the merge editor, as a merge is, and taken
 * back by Abort Merge; a pick that changes nothing is aborted and answered in VS Code's words.
 */
export async function cherryPick(
    root: string,
    hash: string,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if (typeof hash !== 'string' || !HASH.test(hash)) return failed(`${hash} is not a commit`);
    const done = await cherryPickIn(root, [hash], signal);
    if (done.ok) return done;
    if (done.failure !== undefined) return leftInProgress(root, done);
    if ((await inProgress(root)) !== 'cherry-pick') return done;
    if ((await unmergedPaths(root)).length > 0) return stoppedOn(root, done, 'the cherry-pick');
    const taken = await cherryPickIn(root, ['--abort']);
    return taken.ok ? failed(ALREADY_PRESENT) : taken;
}

/** Whether a symbolic link is at the path, whatever it points at. */
function linkAt(path: string): boolean {
    try {
        return lstatSync(path).isSymbolicLink();
    } catch {
        return false;
    }
}

/** The dependencies a discard of untracked files is handed: the Trash, and the guard over files. */
export type TrashInto = {
    trash: (path: string, options: { glob: false }) => Promise<void>;
    guard: () => Guard;
};

/**
 * Move untracked paths to the Trash, each as one item by its real location. A path is refused
 * before the Trash is called when git does not list it as untracked (a tracked path, a path git
 * lists nowhere), when it is a file the server never changes or a folder holding one, and when its
 * folder or the path itself, a symbolic link followed to its target, resolves outside the
 * repository or cannot be resolved. A link that points inside the repository, or at nothing, is
 * moved as the link. A collapsed untracked folder (`dir/`) is one item. The first path the Trash
 * fails on stops the rest.
 */
export async function trashUntracked(
    root: string,
    paths: string[],
    into: TrashInto,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const loose = await untrackedAmong(root, paths, roots);
    if (!(loose instanceof Set)) return loose;
    const top = realPath(root);
    if (top === null) return failed('the repository could not be found');
    const items: { path: string; real: string; target: string }[] = [];
    for (const path of paths) {
        if (!loose.has(path)) return failed(`${path} is not an untracked path, so it is kept`);
        const bare = path.endsWith('/') ? path.slice(0, -1) : path;
        const folder = realPath(dirname(join(root, bare)));
        if (folder === null || !inside(folder, top)) {
            return failed(`the path ${path} is not inside the workspace`);
        }
        const real = join(folder, basename(bare));
        // A link whose target is missing is moved as the link, which changes nothing it named.
        const target = realPath(real) ?? (linkAt(real) ? real : null);
        if (target === null) return failed(`the path ${path} could not be found`);
        if (!inside(target, top)) return failed(`the path ${path} is not inside the workspace`);
        items.push({ path, real, target });
    }
    const guard = into.guard();
    const kept = items.find((item) => guarded(guard, item.real) || guarded(guard, item.target));
    if (kept !== undefined) return failed(`${kept.path} is a file this server never changes`);
    for (const item of items) {
        try {
            await into.trash(item.real, { glob: false });
        } catch {
            return failed(`${item.path} could not be moved to the Trash`);
        }
    }
    return { ok: true, output: '', error: '' };
}

/** The line a path is written as in `.gitignore`: slashes forward, an opening bracket escaped. */
function ignoreLine(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+$/, '').replace(/\[/g, '\\[');
}

/**
 * Add paths of untracked and changed files to the root's `.gitignore`, one line each as VS Code
 * writes it: the path relative to the root, nothing checked for a line already there. The file is
 * made when missing, a line ending is added first when its last line has none, and the file's own
 * line ending is kept. The write is atomic and the file is read again to see the lines are its
 * last. A `.gitignore` that is a symbolic link, a folder, or lies outside the repository is
 * refused.
 */
export function addToGitignore(
    root: string,
    paths: string[],
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    return Promise.resolve(appendIgnored(root, paths, roots));
}

/** The writes of addToGitignore, which read and write the file synchronously. */
function appendIgnored(root: string, paths: string[], roots: string[]): Outcome {
    const wrong = checkPaths(root, paths, roots);
    if (wrong !== '') return failed(wrong);
    const file = join(root, '.gitignore');
    const top = realPath(root);
    if (top === null) return failed('the repository could not be found');
    let current = '';
    try {
        const info = lstatSync(file);
        if (info.isSymbolicLink() || !info.isFile()) {
            return failed('.gitignore is not a plain file, so nothing is added to it');
        }
        const real = realPath(file);
        if (real === null || !inside(real, top)) {
            return failed('.gitignore leaves the repository, so nothing is added to it');
        }
        current = readFileSync(file, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            return failed(`.gitignore could not be read: ${String(error)}`);
        }
    }
    const eol = current.includes('\r\n') ? '\r\n' : '\n';
    const lead = current === '' || current.endsWith('\n') ? '' : eol;
    const added = `${paths.map(ignoreLine).join(eol)}${eol}`;
    try {
        writeBytesAtomic(file, Buffer.from(`${current}${lead}${added}`, 'utf8'));
        if (!readFileSync(file, 'utf8').endsWith(added)) {
            return failed('.gitignore changed while it was written, so check its last lines');
        }
    } catch (error) {
        return failed(`.gitignore could not be written: ${String(error)}`);
    }
    return { ok: true, output: '.gitignore', error: '' };
}

/**
 * Carry a rebase on once its conflicts are resolved, which is what a pull set to rebase needs in
 * place of the merge's commit. A path still unmerged is refused before git is asked.
 */
export async function continueRebase(
    root: string,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(UNKNOWN);
    if ((await inProgress(root)) !== 'rebase') {
        return failed('no rebase is in progress here, so there is nothing to continue');
    }
    const left = await unmergedPaths(root);
    if (left.length > 0) return failed(`${left.join(', ')} still conflicted`);
    return leftInProgress(root, await rebaseIn(root, '--continue', signal));
}
