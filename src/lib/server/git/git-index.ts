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
// one call site server/git/git-write.ts exports for its subcommand, with the `GitAt` the write is
// handed: the root and the credentials of the server context.
//
// A path handed to git is checked by core/git/run.ts's `pathInside`; the records of `status
// --porcelain=v1 -z` are read one by one as git writes them, through git-write.ts's `statusIn`.

import { basename, dirname, isAbsolute, join } from 'node:path';
import { PassThrough } from 'node:stream';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { byKey } from '../../data/helpers/guards.ts';
import { writeBytesAtomic, writeTextAtomic } from '../core/json.ts';
import { HASH, pathInside } from '../core/git/run.ts';
import { NO_TIME_LIMIT, REFS_FORMAT, parseBranches, type Unfinished } from '../core/git/parse.ts';
import { inside, permitted, realPath } from '../core/paths.ts';
import { words } from '../core/words.ts';
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
    rebaseIn,
    removeIn,
    restore,
    mergeIn,
    revParse,
    statusHolds,
    statusIn,
    trackedChange,
    untrackedAmong,
    type GitAt,
    type Outcome
} from './git-write.ts';

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
    at: GitAt,
    patch: string,
    mode: PatchMode,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    const flags = byKey(FLAGS, mode);
    if (flags === undefined) return failed(words(text, 'server.git.not_a_way_to_apply'));
    if (typeof patch !== 'string' || !patch.startsWith('diff --git ')) {
        return failed(words(text, 'server.git.not_a_patch'));
    }
    const paths = patchPaths(patch);
    if (paths.length === 0) return failed(words(text, 'server.git.patch_names_no_path'));
    const outside = paths.find((path) => !pathInside(at.root, path));
    if (outside !== undefined) {
        return failed(words(text, 'server.git.path_outside_workspace', outside));
    }
    return applyPatch(at, flags, patch.endsWith('\n') ? patch : `${patch}\n`);
}

/**
 * Stage a whole group: every tracked change with `add -u`, or every untracked path as git lists
 * it now, which is the whole group rather than the capped list the channel carries. The untracked
 * paths are read as `status --untracked-files=normal` lists them, a folder git tracks nothing in as
 * one entry, so the add matches each file of a large new folder against one pathspec rather than
 * one per file, whose cost grows with the square of the count; the files staged are the same. The
 * status is read record by record, and each entry is written to the add's standard input as it is
 * read, NUL separated, which no count of them can make too long for the argument vector, each read
 * as a literal name; nothing else of the status is kept. The add starts at the first entry: `git
 * status` lets go of the index before it writes its first record, so the add never waits on it.
 * git reads every path before it stages one, so a status read that fails ends the add with nothing
 * staged, and the status read's failure is the answer. The add has no time limit, since its time
 * grows with the files it stages, and Cancel ends it.
 */
export async function stageAll(
    at: GitAt,
    group: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (group === 'changed') return addTo(at, ['-u', '--', '.']);
    if (group !== 'untracked') return failed(words(text, 'server.git.not_a_group'));
    const add = pathAdder(at, signal);
    const state = await statusIn(
        at,
        (record) => {
            if (record.code === '??') add.take(record.path);
        },
        'normal'
    );
    if (!add.taken()) {
        return state.ok ? failed(words(text, 'server.git.nothing_untracked')) : state;
    }
    const added = await add.end(state.ok);
    return state.ok ? added : state;
}

/**
 * Stage All's add of the untracked paths, started at the first path it takes, each path written to
 * its standard input as it is taken. `end` closes the input of a read that went, so git stages what
 * it read, or ends git for a read that failed, before it has staged anything; Cancel's `signal`
 * ends it too.
 */
function pathAdder(
    at: GitAt,
    signal?: AbortSignal
): {
    take: (path: string) => void;
    taken: () => boolean;
    end: (went: boolean) => Promise<Outcome>;
} {
    const stop = new AbortController();
    let paths: PassThrough | null = null;
    let added: Promise<Outcome> = Promise.resolve(failed(''));
    return {
        take(path) {
            if (paths === null) {
                paths = new PassThrough();
                added = addTo(
                    at,
                    ['--pathspec-from-file=-', '--pathspec-file-nul'],
                    {
                        input: paths,
                        env: { GIT_LITERAL_PATHSPECS: '1' },
                        signal:
                            signal === undefined
                                ? stop.signal
                                : AbortSignal.any([stop.signal, signal])
                    },
                    NO_TIME_LIMIT
                );
            }
            paths.write(`${path}\0`);
        },
        taken: () => paths !== null,
        end(went) {
            if (went) paths?.end();
            else stop.abort();
            return added;
        }
    };
}

/** Take everything back out of the index, leaving the worktree as it is. */
export async function unstageAll(
    at: GitAt,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    return restore(at, ['.'], true);
}

/**
 * Throw away every worktree change to a tracked path. Untracked paths are left where they are:
 * the only command that would take them is `clean`, and a file git never saw is a file nobody can
 * get back.
 */
export async function discardAll(
    at: GitAt,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    return restore(at, ['.'], false);
}

/**
 * Complete Merge: write the result the merge editor holds over the conflicted path and stage it,
 * which is what tells git the conflict is resolved. A path git does not list as unmerged is
 * refused, so this never writes over a file that is not in conflict.
 */
export async function resolveMerge(
    at: GitAt,
    path: string,
    content: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (typeof path !== 'string' || !pathInside(at.root, path)) {
        return failed(words(text, 'server.git.path_outside_workspace', path));
    }
    if (typeof content !== 'string') return failed(words(text, 'server.git.merge_not_text'));
    if (!(await unmergedPaths(at)).includes(path)) {
        return failed(words(text, 'server.git.not_in_conflict_resolve', path));
    }
    try {
        writeTextAtomic(join(at.root, path), content);
    } catch (error) {
        return failed(words(text, 'server.git.result_unwritable', String(error)));
    }
    return addTo(at, ['--', path]);
}

/** The conflicts in which a side deleted the path: both sides, ours (DU) or theirs (UD). */
const DELETIONS = ['DD', 'DU', 'UD'];

/**
 * The status's two letters for one path, or the empty string when git lists it as clean or the
 * read failed. The read ends at the path's record.
 */
async function pairOf(at: GitAt, path: string): Promise<string> {
    let code = '';
    const state = await statusIn(at, (record) => {
        if (record.path === path) code = record.code;
        return code === '';
    });
    return state.ok ? code : '';
}

/**
 * Accept the deletion of a conflicted path that one side or both deleted: the path goes from the
 * index and from the worktree, which is what tells git the conflict is resolved that way. A path
 * in any other conflict, or in none, is refused before git is asked.
 */
export async function acceptDeletion(
    at: GitAt,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (typeof path !== 'string' || !pathInside(at.root, path)) {
        return failed(words(text, 'server.git.path_outside_workspace', path));
    }
    if (!DELETIONS.includes(await pairOf(at, path))) {
        return failed(words(text, 'server.git.not_a_deletion', path));
    }
    return removeIn(at, ['--quiet', '--', path]);
}

/**
 * Mark Resolved: take a conflicted path as the worktree holds it now. `git add` stages a path the
 * worktree holds and records the deletion of one it no longer holds, as after both sides deleted
 * it, and either way the path's unmerged entries leave the index. A path git does not list as
 * unmerged is refused, so the control never stages an ordinary change.
 */
export async function markResolved(
    at: GitAt,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (typeof path !== 'string' || !pathInside(at.root, path)) {
        return failed(words(text, 'server.git.path_outside_workspace', path));
    }
    const unmerged = await unmergedPaths(at);
    if (!unmerged.includes(path)) {
        return failed(words(text, 'server.git.not_in_conflict_resolve', path));
    }
    return addTo(at, ['--', path]);
}

/**
 * Merge a branch into the root's checked-out branch, which is git's own default: a fast-forward
 * where it can be one and a merge commit otherwise. A dirty root and the checked-out branch itself
 * are refused before anything runs. A merge that stops on conflicts is left in progress, as VS
 * Code leaves it, and reported by the paths that conflicted: the view draws them under Merge
 * Changes, where each is resolved in the merge editor, and Abort Merge takes the whole merge back.
 */
export async function merge(
    at: GitAt,
    other: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    const wrong = await checkName(at, other, text, roots);
    if (wrong !== '') return failed(wrong);
    const head = await revParse(at, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const onto = head.output.trim();
    if (onto === 'HEAD' || onto === '') return failed(words(text, 'server.git.merge_no_branch'));
    if (onto === other) return failed(words(text, 'server.git.checked_out_merge', other));
    // A name git accepts as a reference is not a branch: a tag or a commit id would be merged just
    // as happily, and what this control offers is the branch of a worktree.
    const listed = await branch(at, [REFS_FORMAT]);
    if (!listed.ok) return listed;
    if (!parseBranches(listed.output).some((one) => one.name === other)) {
        return failed(words(text, 'server.git.not_a_branch_here', other));
    }
    const dirty = await statusHolds(at, trackedChange);
    if (dirty !== false)
        return dirty === true ? failed(words(text, 'server.git.dirty_merge')) : dirty;
    const done = await mergeIn(at, [other], signal);
    if (done.ok) return done;
    return stoppedOn(at, done, text, 'merge');
}

/** The writes whose conflicts `stoppedOn` names. */
export type Stopped = 'merge' | 'pull' | 'cherry-pick' | 'pop' | 'apply';

/**
 * What a write that stopped answers. A command that ended with a code of its own (Cancel, a signal)
 * says so, with the operation it left unfinished named by `leftInProgress`. Otherwise it is the
 * paths git left unmerged, when there are any, and git's own reason when there are none: a merge, a
 * pull, a stash applied or popped all leave their conflicts in the index for the merge editor, so
 * the sentence says where they are.
 */
export async function stoppedOn(
    at: GitAt,
    done: Outcome,
    text: Record<string, string>,
    what: Stopped
): Promise<Outcome> {
    if (done.failure !== undefined) return leftInProgress(at, done);
    const paths = await unmergedPaths(at);
    if (paths.length === 0) return done;
    return failed(words(text, 'server.git.stopped_on', stoppedWord(text, what), paths.join(', ')));
}

/** The capitalised word a conflict sentence opens with, for the write that stopped. */
function stoppedWord(text: Record<string, string>, what: Stopped): string {
    if (what === 'merge') return words(text, 'server.git.stopped_merge');
    if (what === 'pull') return words(text, 'server.git.stopped_pull');
    if (what === 'cherry-pick') return words(text, 'server.git.stopped_cherry_pick');
    if (what === 'pop') return words(text, 'server.git.stopped_pop');
    return words(text, 'server.git.stopped_apply');
}

/**
 * A command that ended with a code of its own, with the merge, cherry-pick or rebase it left
 * unfinished named in `failure.left`, so the answer says it is in progress and the view draws its
 * state and Abort Merge. A repository in none of the three answers as it was.
 */
async function leftInProgress(at: GitAt, done: Outcome): Promise<Outcome> {
    if (done.failure === undefined) return done;
    const left = await inProgress(at);
    return left === '' ? done : { ...done, failure: { ...done.failure, left } };
}

/** The paths the index holds unmerged, which is where a stopped write left its conflicts. */
async function unmergedPaths(at: GitAt): Promise<string[]> {
    const conflicted = await diff(at, ['--name-only', '--diff-filter=U']);
    return conflicted.ok ? conflicted.output.trim().split('\n').filter(Boolean) : [];
}

/** Which of the three the repository is in the middle of, read as git itself would. */
async function inProgress(at: GitAt): Promise<Unfinished | ''> {
    const merging = await revParse(at, ['--verify', '--quiet', 'MERGE_HEAD']);
    if (merging.ok) return 'merge';
    for (const name of ['rebase-merge', 'rebase-apply']) {
        const where = await revParse(at, ['--git-path', name]);
        if (!where.ok) continue;
        const path = where.output.trim();
        if (existsSync(isAbsolute(path) ? path : join(at.root, path))) return 'rebase';
    }
    const picking = await revParse(at, ['--verify', '--quiet', 'CHERRY_PICK_HEAD']);
    return picking.ok ? 'cherry-pick' : '';
}

/**
 * Abort Merge: take the merge, the cherry-pick, or the rebase a pull began, back to where it
 * started.
 */
export async function abortMerge(
    at: GitAt,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    const doing = await inProgress(at);
    if (doing === 'merge') return mergeIn(at, ['--abort']);
    if (doing === 'rebase') return rebaseIn(at, '--abort');
    if (doing === 'cherry-pick') return cherryPickIn(at, ['--abort']);
    return failed(words(text, 'server.git.no_merge_to_abort'));
}

/**
 * Cherry-pick a commit onto the checked-out branch. The commit is a hash, checked before git runs.
 * A pick that stops on conflicts is left in progress for the merge editor, as a merge is, and taken
 * back by Abort Merge; a pick that changes nothing is aborted and answered in VS Code's words.
 */
export async function cherryPick(
    at: GitAt,
    hash: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (typeof hash !== 'string' || !HASH.test(hash)) {
        return failed(words(text, 'server.git.not_a_commit_named', hash));
    }
    const done = await cherryPickIn(at, [hash], signal);
    if (done.ok) return done;
    if (done.failure !== undefined) return leftInProgress(at, done);
    if ((await inProgress(at)) !== 'cherry-pick') return done;
    if ((await unmergedPaths(at)).length > 0) return stoppedOn(at, done, text, 'cherry-pick');
    const taken = await cherryPickIn(at, ['--abort']);
    return taken.ok ? failed(words(text, 'server.git.already_present')) : taken;
}

/** Whether a symbolic link is at the path, whatever it points at. */
function linkAt(path: string): boolean {
    try {
        return lstatSync(path).isSymbolicLink();
    } catch {
        return false;
    }
}

/** The dependency a discard of untracked files is handed: the Trash. */
export type TrashInto = {
    trash: (path: string, options: { glob: false }) => Promise<void>;
};

/**
 * Move untracked paths to the Trash, each as one item by its real location. A path is refused
 * before the Trash is called when git does not list it as untracked (a tracked path, a path git
 * lists nowhere), and when its folder or the path itself, a symbolic link followed to its target,
 * resolves outside the repository or cannot be resolved. A link that points inside the repository,
 * or at nothing, is moved as the link. A collapsed untracked folder (`dir/`) is one item. The first
 * path the Trash fails on stops the rest.
 */
export async function trashUntracked(
    at: GitAt,
    paths: string[],
    into: TrashInto,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const loose = await untrackedAmong(at, paths, text, roots);
    if (!(loose instanceof Set)) return loose;
    const top = realPath(at.root);
    if (top === null) return failed(words(text, 'server.git.repository_not_found'));
    const items: { path: string; real: string; target: string }[] = [];
    for (const path of paths) {
        if (!loose.has(path)) return failed(words(text, 'server.git.not_untracked', path));
        const bare = path.endsWith('/') ? path.slice(0, -1) : path;
        const folder = realPath(dirname(join(at.root, bare)));
        if (folder === null || !inside(folder, top)) {
            return failed(words(text, 'server.git.path_outside_workspace', path));
        }
        const real = join(folder, basename(bare));
        // A link whose target is missing is moved as the link, which changes nothing it named.
        const target = realPath(real) ?? (linkAt(real) ? real : null);
        if (target === null) return failed(words(text, 'server.git.path_not_found', path));
        if (!inside(target, top)) {
            return failed(words(text, 'server.git.path_outside_workspace', path));
        }
        items.push({ path, real, target });
    }
    for (const item of items) {
        try {
            await into.trash(item.real, { glob: false });
        } catch {
            return failed(words(text, 'server.git.trash_failed', item.path));
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
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    return Promise.resolve(appendIgnored(root, paths, text, roots));
}

/** The writes of addToGitignore, which read and write the file synchronously. */
function appendIgnored(
    root: string,
    paths: string[],
    text: Record<string, string>,
    roots: string[]
): Outcome {
    const wrong = checkPaths(root, paths, text, roots);
    if (wrong !== '') return failed(wrong);
    const file = join(root, '.gitignore');
    const top = realPath(root);
    if (top === null) return failed(words(text, 'server.git.repository_not_found'));
    let current = '';
    try {
        const info = lstatSync(file);
        if (info.isSymbolicLink() || !info.isFile()) {
            return failed(words(text, 'server.git.gitignore_not_plain'));
        }
        const real = realPath(file);
        if (real === null || !inside(real, top)) {
            return failed(words(text, 'server.git.gitignore_leaves'));
        }
        current = readFileSync(file, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            return failed(words(text, 'server.git.gitignore_unreadable', String(error)));
        }
    }
    const eol = current.includes('\r\n') ? '\r\n' : '\n';
    const lead = current === '' || current.endsWith('\n') ? '' : eol;
    const added = `${paths.map(ignoreLine).join(eol)}${eol}`;
    try {
        writeBytesAtomic(file, Buffer.from(`${current}${lead}${added}`, 'utf8'));
        if (!readFileSync(file, 'utf8').endsWith(added)) {
            return failed(words(text, 'server.git.gitignore_changed'));
        }
    } catch (error) {
        return failed(words(text, 'server.git.gitignore_unwritable', String(error)));
    }
    return { ok: true, output: '.gitignore', error: '' };
}

/**
 * Carry a rebase on once its conflicts are resolved, which is what a pull set to rebase needs in
 * place of the merge's commit. A path still unmerged is refused before git is asked.
 */
export async function continueRebase(
    at: GitAt,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(at.root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if ((await inProgress(at)) !== 'rebase') {
        return failed(words(text, 'server.git.no_rebase_to_continue'));
    }
    const left = await unmergedPaths(at);
    if (left.length > 0) return failed(words(text, 'server.git.still_conflicted', left.join(', ')));
    return leftInProgress(at, await rebaseIn(at, '--continue', signal));
}
