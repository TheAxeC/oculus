// Layer 2, server. The writing half of git, kept apart from server/git.ts on purpose.
//
// DESIGN.md, "Git": the read-only module runs only its enumerated read-only commands and a test
// asserts that its source names no writing subcommand at all. Every write therefore lives here, and this module's own
// gate is the opposite one: tests/server/git-write.test.ts enumerates the subcommands it may run,
// asserts each appears at exactly one call site, and watches every argument vector the suite ran.
//
//     git -C <root> add -- <paths>
//     git -C <root> restore [--staged] -- <paths>
//     git -C <root> commit -F <file>
//     git -C <root> push
//     git -C <root> branch [--format=... | -d <name>]
//     git -C <root> switch [-c] <name>
//     git -C <root> check-ref-format --branch <name>
//     git -C <root> status --porcelain=v1 -z
//     git -C <root> diff [--cached | --name-only --diff-filter=U | <range>] [-- <path>]
//     git -C <root> rev-parse [--abbrev-ref] <rev>
//     git -C <root> worktree [add -b <name> <path> HEAD | remove <path>]
//     git -C <root> merge [<branch> | --abort]
//
// Nothing here is reachable from a watcher, a timer or the socket. The one caller is server/
// git-routes.ts, which answers POST /api/git only for a request carrying the write token, coming
// from this application's own page, and (for the eight destructive actions) carrying the confirm the
// page sets from a dialog. DESIGN.md's decision on git writes is that shape: commit, push, branches
// and worktrees on the repositories oculus knows, every write behind the token and a confirm.
//
// `git.ts`'s `run` is not imported: putting a writing subcommand through the read-only module's one
// call site would run it past that module's recorder and break the gate that says what it ran.
//
// A root is refused unless the last published `git` payload names it or it is the hub itself or
// under it. That payload is every root the file browser serves as well as every workspace a session
// names, so these writes reach a configured repository nobody has a session in. A path is refused
// unless it is relative and stays inside the repository. Every operation answers
// `{ ok, output, error }` and never throws.

import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join, resolve, sep } from 'node:path';
import { scalar } from '../data/guards.ts';
import type { GitBranch } from '../data/model.ts';
import { isWorktreePath, validName, worktreePath } from '../data/worktrees.ts';
import { defaultMirrorsDir } from './deposit-git.ts';
import { BRANCH_FORMAT, parseBranches } from './git-parse.ts';
import { GIT } from './git.ts';

export { parseBranches };

/** Milliseconds one git command is given, for everything that stays on this machine. */
export const TIMEOUT_MS = 10000;

/** A push crosses the network, so it is given a minute rather than ten seconds. */
export const PUSH_TIMEOUT_MS = 60000;

/** How much output one command may produce. A staged diff is the big one. */
export const MAX_OUTPUT = 8 * 1024 * 1024;

/** What every operation answers. `ok` false always carries a reason in `error`. */
export type Outcome = { ok: boolean; output: string; error: string };

/** One row of `git branch --format`, as the branch menu draws it. */
export type Branch = GitBranch;

function failed(error: string): Outcome {
    return { ok: false, output: '', error };
}

/**
 * One git command, as a list, with a timeout. This is the module's one subprocess call site, and
 * every refusal above it has already run by the time it is reached.
 */
function run(root: string, args: string[], timeout: number): Promise<Outcome> {
    const argv = ['-C', root, ...args];
    return new Promise((settle) => {
        // A list, never a shell. A path or a branch name from the page is an argument and can
        // therefore never be read as syntax.
        execFile(
            GIT,
            argv,
            { encoding: 'utf8', timeout, maxBuffer: MAX_OUTPUT },
            (error, stdout, stderr) => {
                if (error !== null) {
                    const failure = error as NodeJS.ErrnoException;
                    const reason =
                        failure.code === 'ETIMEDOUT'
                            ? 'git timed out'
                            : short(stderr) || short(failure.message) || 'git failed';
                    settle(failed(reason));
                    return;
                }
                settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
            }
        );
    });
}

// ---------------------------------------------------------------- what may be written where

/**
 * The roots a write may name: the workspaces on the `git` channel, the hub itself, and the deposit
 * mirrors folder. The third is there for the suggested commit message of the deposit panel, which
 * asks this module for a message over the mirror's staged diff; every other write on a mirror goes
 * through server/deposit.ts, whose own gate is the enumerated subcommands of deposit-git.ts.
 *
 * The hub is named by the caller, which is the route: it holds the machine's own configuration on
 * the request's server context, so nothing here reads a file to find out where the hub is.
 */
export function allowedRoots(workspaces: string[] = [], hub?: string): string[] {
    const roots = new Set(workspaces);
    if (hub !== undefined) roots.add(hub);
    roots.add(defaultMirrorsDir());
    return [...roots].filter((root) => root !== '');
}

/** Whether a root is one of the allowed ones, or a directory under one. */
export function permitted(root: string, roots: string[] = allowedRoots()): boolean {
    if (typeof root !== 'string' || root === '' || !isAbsolute(root)) return false;
    const full = resolve(root);
    return roots.some((one) => {
        const base = resolve(one);
        return full === base || full.startsWith(base + sep);
    });
}

/**
 * Whether a path is one this module will hand to git: relative to the repository, staying inside it,
 * and not a lone dash git would read as an option.
 */
export function insideRepo(root: string, path: string): boolean {
    if (typeof path !== 'string' || path === '' || path.startsWith('-')) return false;
    if (isAbsolute(path)) return false;
    const full = resolve(join(root, path));
    const base = resolve(root);
    return full === base || full.startsWith(base + sep);
}

function checkPaths(root: string, paths: unknown[], roots: string[]): string {
    if (!permitted(root, roots)) return 'that directory is not a workspace oculus knows';
    if (!Array.isArray(paths) || paths.length === 0) return 'no path was given';
    for (const path of paths) {
        const one = scalar(path);
        if (one === '' || !insideRepo(root, one)) {
            return `the path ${one} is not inside the workspace`;
        }
    }
    return '';
}

// ---------------------------------------------------------------- the operations

/** Stage the given paths. */
export async function stage(
    root: string,
    paths: string[],
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = checkPaths(root, paths, roots);
    if (wrong !== '') return failed(wrong);
    return run(root, ['add', '--', ...paths], TIMEOUT_MS);
}

/** Take the given paths back out of the index, leaving the worktree as it is. */
export async function unstage(
    root: string,
    paths: string[],
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = checkPaths(root, paths, roots);
    if (wrong !== '') return failed(wrong);
    return restore(root, paths, true);
}

/**
 * Throw away the worktree change to the given tracked paths. An untracked path is refused: the only
 * command that would remove one is `clean`, and a dashboard that can delete a file git never saw is
 * a dashboard that can lose work nobody can get back.
 */
export async function discard(
    root: string,
    paths: string[],
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = checkPaths(root, paths, roots);
    if (wrong !== '') return failed(wrong);
    const state = await porcelain(root);
    if (!state.ok) return state;
    const loose = untrackedIn(state.output);
    const refused = paths.filter((path) => loose.has(path));
    if (refused.length > 0) {
        return failed(`git does not track ${refused[0]}, so there is nothing to restore it to`);
    }
    return restore(root, paths, false);
}

/**
 * Commit what is staged. The message goes through a file rather than an argument: it is several
 * lines with quotes and backticks in it, and `-F` is the one form no quoting can break.
 */
export async function commit(
    root: string,
    message: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed('that directory is not a workspace oculus knows');
    if (typeof message !== 'string' || message.trim() === '') {
        return failed('a commit needs a message');
    }
    const dir = mkdtempSync(join(tmpdir(), 'oculus-commit-'));
    const file = join(dir, 'message.txt');
    try {
        writeFileSync(file, message.endsWith('\n') ? message : `${message}\n`, 'utf8');
        return await run(root, ['commit', '-F', file], TIMEOUT_MS);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

/**
 * Push the current branch to its upstream. A branch with no upstream is refused with that as the
 * reason, before anything is sent: `--set-upstream` decides where a branch lives, and that decision
 * is Axel's at a terminal rather than a side effect of a button. Nothing is ever forced: the gate in
 * tests/server/git-write.test.ts asserts that the option does not appear in this file at all.
 */
export async function push(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed('that directory is not a workspace oculus knows');
    const up = await upstream(root);
    if (!up.ok) return failed('this branch has no upstream, so there is nowhere to push it');
    return run(root, ['push'], PUSH_TIMEOUT_MS);
}

/** Every branch, with its upstream and which one is checked out. A read, and the only one here. */
export async function branches(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed('that directory is not a workspace oculus knows');
    return branch(root, [BRANCH_FORMAT]);
}

/** Make a branch and check it out. The name is git's own to judge, so git judges it first. */
export async function createBranch(
    root: string,
    name: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = await checkName(root, name, roots);
    if (wrong !== '') return failed(wrong);
    return switchTo(root, ['-c', name]);
}

/**
 * Check a branch out. A dirty tree is refused: git carries uncommitted changes across a switch, and
 * a change carried onto another branch by a click is the way this panel would lose work.
 */
export async function switchBranch(
    root: string,
    name: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = await checkName(root, name, roots);
    if (wrong !== '') return failed(wrong);
    const state = await porcelain(root);
    if (!state.ok) return state;
    if (state.output.trim() !== '') {
        return failed('the working tree is dirty, so switching would carry the changes across');
    }
    return switchTo(root, [name]);
}

/** What is staged right now, which is what the suggested message is written from. */
export async function stagedDiff(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
    if (!permitted(root, roots)) return failed('that directory is not a workspace oculus knows');
    return diff(root, ['--cached']);
}

/**
 * One file's diff, staged or not, for the pane the Repositories view opens over a row. A read: the
 * `git` channel carries the paths and this answers the text of one of them, since a diff of every
 * changed file of every root on every event is what the channel's throttle is there to avoid.
 */
export async function fileDiff(
    root: string,
    path: string,
    staged: boolean,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = checkPaths(root, [path], roots);
    if (wrong !== '') return failed(wrong);
    return diff(root, [...(staged ? ['--cached'] : []), '--', path]);
}

/**
 * What a worktree holds that the repository's checked-out branch does not: the three-dot diff from
 * that branch to the worktree's own HEAD, which is what the reader is about to merge back. A
 * detached checkout has no branch to name, so its HEAD stands in.
 *
 * The repository is named by the caller and never worked out from the path: a worktree of the hub is
 * itself a workspace on the `git` channel and therefore a root of its own, so a path would answer
 * with itself and every worktree this hub makes would be refused.
 */
export async function worktreeDiff(
    root: string,
    path: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed('that directory is not a workspace oculus knows');
    if (!worktreeUnder(root, path)) return failed(OUTSIDE_WORKTREES);
    const head = await revParse(root, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const name = head.output.trim();
    const from = name === '' || name === 'HEAD' ? await revParse(root, ['HEAD']) : head;
    if (!from.ok) return from;
    return diff(path, [`${from.output.trim()}...HEAD`]);
}

// ---------------------------------------------------------------- worktrees and the merge back

/** What a request naming a path outside the root's worktrees folder is refused with. */
const OUTSIDE_WORKTREES = 'that path is not a worktree oculus made under this repository';

/** The real path of a directory, or null when there is nothing there to resolve. */
function real(path: string): string | null {
    try {
        return realpathSync(path);
    } catch {
        return null;
    }
}

/**
 * Whether the path is a worktree this tool made under the root. Both sides go through realpath
 * first, so a `..` inside either is worked out and a symbolic link under the worktrees folder that
 * points at another repository resolves to where it points and is refused; a path that does not
 * exist is refused too, since there is nothing to remove or diff. The rule itself is
 * data/worktrees.ts's, which the page reads too.
 */
function worktreeUnder(root: string, path: string): boolean {
    if (typeof path !== 'string' || path === '' || !isAbsolute(path)) return false;
    if (!validName(basename(resolve(path)))) return false;
    const full = real(path);
    const top = real(root);
    if (full === null || top === null) return false;
    return isWorktreePath(top, full);
}

/**
 * Make a worktree of the root on a new branch of the same name, under the root's own worktrees
 * folder. The name is one path segment and a name git accepts as a branch, and the folder must not
 * already be there: a worktree over an existing folder is a merge of two unrelated things.
 */
export async function createWorktree(
    root: string,
    name: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = await checkName(root, name, roots);
    if (wrong !== '') return failed(wrong);
    if (!validName(name)) return failed(`${name} is not a name one worktree folder can carry`);
    const path = worktreePath(root, name);
    if (existsSync(path)) return failed(`there is already something at ${path}`);
    return worktree(root, ['add', '-b', name, path, 'HEAD']);
}

/**
 * Take a worktree away, and the branch it was on with it. A worktree holding uncommitted work is
 * refused before anything runs: `git worktree remove` would refuse it too, and the reason is worth
 * more than git's. The branch goes by `-d`, which git refuses for work no other branch holds, so a
 * branch that is not merged stays and the answer says so.
 */
export async function removeWorktree(
    root: string,
    path: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed('that directory is not a workspace oculus knows');
    if (!worktreeUnder(root, path)) return failed(OUTSIDE_WORKTREES);
    if (!existsSync(path)) return failed(`there is no worktree at ${path}`);
    const state = await porcelain(path);
    if (!state.ok) return state;
    // Untracked files count here, unlike the merge: `git worktree remove` would take the folder and
    // them with it, and a file git never saw is a file nobody can get back.
    if (state.output.trim() !== '') {
        return failed(
            'that worktree holds uncommitted changes or untracked files, so it is not taken away'
        );
    }
    const head = await revParse(path, ['--abbrev-ref', 'HEAD']);
    const name = head.ok ? head.output.trim() : '';
    const gone = await worktree(root, ['remove', path]);
    if (!gone.ok) return gone;
    if (name === '' || name === 'HEAD') return gone;
    const dropped = await branch(root, ['-d', name]);
    if (dropped.ok) return { ok: true, output: `${gone.output}${dropped.output}`, error: '' };
    return {
        ok: true,
        output: `${gone.output}the branch ${name} was kept: ${dropped.error}`,
        error: ''
    };
}

/**
 * Merge a branch into the root's checked-out branch, which is git's own default: a fast-forward
 * where it can be one and a merge commit otherwise. A dirty root and the checked-out branch itself
 * are refused before anything runs, and a conflict is aborted and reported by the paths that
 * conflicted, so a press on the page never leaves a repository half merged.
 */
export async function merge(
    root: string,
    name: string,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = await checkName(root, name, roots);
    if (wrong !== '') return failed(wrong);
    const head = await revParse(root, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const onto = head.output.trim();
    if (onto === 'HEAD' || onto === '') {
        return failed(
            'this repository has no branch checked out, so there is nothing to merge into'
        );
    }
    if (onto === name) {
        return failed(`${name} is the branch that is checked out, so there is nothing to merge`);
    }
    // A name git accepts as a reference is not a branch: a tag or a commit id would be merged just
    // as happily, and what this control offers is the branch of a worktree.
    const listed = await branch(root, [BRANCH_FORMAT]);
    if (!listed.ok) return listed;
    if (!parseBranches(listed.output).some((one) => one.name === name)) {
        return failed(`${name} is not a branch of this repository`);
    }
    const state = await porcelain(root);
    if (!state.ok) return state;
    if (tracked(state.output)) {
        return failed('the repository has changes of its own, so the merge would carry them in');
    }
    const done = await mergeIn(root, [name]);
    if (done.ok) return done;
    const conflicted = await diff(root, ['--name-only', '--diff-filter=U']);
    const paths = conflicted.ok ? conflicted.output.trim().split('\n').filter(Boolean) : [];
    await mergeIn(root, ['--abort']);
    if (paths.length === 0) return done;
    return failed(`the merge was taken back: ${paths.join(', ')} conflicted`);
}

// ---------------------------------------------------------------- the shared call sites

/** The one `restore` call site: staged is the unstage, unstaged is the discard. */
function restore(root: string, paths: string[], staged: boolean): Promise<Outcome> {
    const flags = staged ? ['--staged'] : [];
    return run(root, ['restore', ...flags, '--', ...paths], TIMEOUT_MS);
}

/** The one `switch` call site, for both the branch that exists and the one being made. */
function switchTo(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['switch', ...args], TIMEOUT_MS);
}

/** The one `status` call site: the dirty check and the untracked list read the same output. */
function porcelain(root: string): Promise<Outcome> {
    return run(root, ['status', '--porcelain=v1', '-z'], TIMEOUT_MS);
}

/** The one `rev-parse` call site: the upstream of the current branch, and what HEAD is. */
function revParse(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['rev-parse', ...args], TIMEOUT_MS);
}

/** Whether the current branch has somewhere to push to. */
function upstream(root: string): Promise<Outcome> {
    return revParse(root, ['--abbrev-ref', '@{upstream}']);
}

/** The one `diff` call site: the staged diff, one file's, a worktree's range, and the conflicts. */
function diff(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['diff', ...args], TIMEOUT_MS);
}

/** The one `branch` call site: the listing the menu draws, and the delete a worktree removal makes. */
function branch(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['branch', ...args], TIMEOUT_MS);
}

/** The one `worktree` call site: the add and the remove. The list is server/git.ts's read. */
function worktree(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['worktree', ...args], TIMEOUT_MS);
}

/** The one `merge` call site: the merge itself and the abort that takes a conflicted one back. */
function mergeIn(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['merge', ...args], TIMEOUT_MS);
}

/** The one `check-ref-format` call site: git's own answer on whether a name is a branch name. */
async function checkName(root: string, name: string, roots: string[]): Promise<string> {
    if (!permitted(root, roots)) return 'that directory is not a workspace oculus knows';
    if (typeof name !== 'string' || name.trim() === '') return 'a branch needs a name';
    if (name.startsWith('-')) return `${name} is not a branch name git accepts`;
    const judged = await run(root, ['check-ref-format', '--branch', name], TIMEOUT_MS);
    return judged.ok ? '' : `${name} is not a branch name git accepts`;
}

// ---------------------------------------------------------------- small stuff

/**
 * Whether the porcelain reports a change of the repository's own content. An untracked file is not
 * one: git carries it across a merge and never overwrites it, so refusing a merge over one would
 * refuse every repository with a build folder in it.
 */
function tracked(output: string): boolean {
    for (const record of output.split('\0')) {
        if (record.length < 4) continue;
        if (!record.startsWith('??')) return true;
    }
    return false;
}

/**
 * The paths `status --porcelain=v1 -z` reported as untracked. A rename names its old path in the
 * record after it, which is a path rather than a status line, so that record is stepped over.
 */
function untrackedIn(output: string): Set<string> {
    const loose = new Set<string>();
    const records = output.split('\0');
    for (let at = 0; at < records.length; at += 1) {
        const record = records[at];
        if (record.length < 4) continue;
        const code = record.slice(0, 2);
        if (code.startsWith('R') || code.startsWith('C')) at += 1;
        if (code === '??') loose.add(record.slice(3));
    }
    return loose;
}

function short(value: unknown): string {
    const text = value instanceof Error ? value.message : scalar(value);
    const lines = text.trim().split('\n');
    let line = lines.length > 0 ? lines[0].trim() : '';
    if (line.toLowerCase().startsWith('fatal: ')) line = line.slice(7);
    return line.slice(0, 200);
}
