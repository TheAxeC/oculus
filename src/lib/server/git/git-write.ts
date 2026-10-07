// Layer 2, server. The writing half of git, kept apart from server/core/git/ on purpose.
//
// DESIGN.md, "Git": the read-only module runs only its enumerated read-only commands. Every write
// therefore lives here.
//
//     git -C <root> add [-u] -- <paths | .>
//     git -C <root> apply --cached [--reverse] --recount -    (the patch on standard input)
//     git -C <root> apply --reverse --recount -
//     git -C <root> restore [--staged] -- <paths | .>
//     git -C <root> rm --quiet -- <path>
//     git -C <root> commit [--amend] -F <file> | commit --amend --no-edit
//     git -C <root> cherry-pick <hash> | cherry-pick --abort
//     git -C <root> merge-base --is-ancestor HEAD @{upstream}
//     git -C <root> push [--set-upstream <remote> <branch> | --tags]
//     git -C <root> pull
//     git -C <root> fetch --prune
//     git -C <root> remote
//     git -C <root> branch [--format=... | -d <name> | -D <name>]
//     git -C <root> switch [-c <name> [<hash>] | --detach <ref> | <name>]
//     git -C <root> check-ref-format [--branch <name> | refs/tags/<name>]
//     git -C <root> status --porcelain=v1 -z
//     git -C <root> diff [--cached | --ours] [-U0] [--name-only --diff-filter=U | <range>]
//         [-- <path>]
//     git -C <root> rev-parse [--abbrev-ref] <rev> | rev-parse --verify --quiet MERGE_HEAD |
//         rev-parse --git-path <rebase-merge | rebase-apply>
//     git -C <root> worktree [add -b <name> <path> HEAD | remove <path>]
//     git -C <root> merge [<branch> | --abort]
//     git -C <root> rebase [--abort | --continue]
//     git -C <root> stash [push [--include-untracked | --staged] [--message=<text>] | apply |
//         pop | drop] [stash@{<n>}]
//     git -C <root> tag [-a <name> -F <file> [<hash>] | <name> [<hash>] | -d <name>]
//
// A command that runs the repository's hooks (commit, merge, cherry-pick, rebase --continue, push,
// pull, switch and worktree add) has no time limit, as `NO_TIME_LIMIT` of server/core/git/parse.ts
// says, and takes the signal of the run it belongs to: Cancel (server/core/git/running.ts) aborts
// it and the write answers `cancelled`. Every other command keeps its limit.
//
// A commit is made with `user.useConfigOnly` set through the environment (`GIT_CONFIG_COUNT`,
// `GIT_CONFIG_KEY_0`, `GIT_CONFIG_VALUE_0`), so a repository with no configured name and email is
// refused with git's own message instead of committing as a name guessed from the machine; the
// argument vector is the one written above.
//
// The operations over the remote, over the index and over stashes and tags are in the modules
// beside this one (git-remote.ts, git-index.ts, git-refs.ts), each reaching git through the call
// sites exported below, so every subcommand still has exactly one place it is run from and that
// place is in this file.
//
// Two callers reach this module. server/git-routes.ts answers POST /api/git only for a request
// carrying the write token, coming from this application's own page, and (for the actions that can
// lose work) carrying the confirm the page sets from a dialog. DESIGN.md's decision on git writes
// is that shape: commit, push, pull, branches, stashes, tags and worktrees on the repositories
// oculus knows, every write behind the token and those behind a confirm. server/root/watch/
// autofetch.ts runs only `remoteNames` and `fetchIn`, from a timer, while `git.autofetch_minutes`
// is above 0, on the repositories the last published `git` payload names. Nothing else here is
// reachable from a watcher, a timer or the socket.
//
// `run` of server/core/git/run.ts is not imported: putting a writing subcommand through the
// read-only module's one call site would run it past that module's recorder and break the gate that
// says what it ran.
//
// A root is refused unless the last published `git` payload names it or it is the hub itself or
// under it. That payload is every root the file browser serves as well as every workspace a session
// names, so these writes reach a configured repository nobody has a session in. The timer reads the
// roots from that payload itself and does not go through `permitted`. A path is refused
// unless it is relative and stays inside the repository. Every operation answers
// `{ ok, output, error }` and never throws.
//
// Whether a root is one the payload names and where a path really is are read from
// server/core/paths.ts (`permitted`, `realPath`); a path handed to git is checked by
// core/git/run.ts's `pathInside`; the records of `status --porcelain=v1 -z` are split by
// core/git/parse.ts's `statusRecords`.

import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { scalar } from '../../data/helpers/guards.ts';
import type { GitBranch } from '../../data/model/index.ts';
import { isWorktreePath, validName, worktreePath } from '../../data/helpers/worktrees.ts';
import { defaultMirrorsDir } from './deposit-git.ts';
import {
    NO_CONTEXT,
    NO_TIME_LIMIT,
    REFS_FORMAT,
    classifyFailure,
    parseBranches,
    statusRecords,
    type CommandFailure
} from '../core/git/parse.ts';
import { endWith } from '../core/git/running.ts';
import { GIT, pathInside } from '../core/git/run.ts';
import { permitted, realPath } from '../core/paths.ts';
import { words } from '../core/words.ts';

export { parseBranches };

/** Milliseconds one git command is given, for everything that stays on this machine. */
export const TIMEOUT_MS = 10000;
/** How many characters of a failed command's reason the page is given. */
const REASON_WIDTH = 200;

/** A fetch crosses the network, so it is given a minute, not ten seconds. */
export const PUSH_TIMEOUT_MS = 60000;

/** How much output one command may produce. A staged diff is the big one. */
export const MAX_OUTPUT = 8 * 1024 * 1024;

/**
 * What every operation answers. `ok` false always carries a reason in `error`, and a refusal the
 * page acts on carries a `code` that names it. A command that ended with no reason of git's own
 * (cancelled, out of time, out of room, ended by a signal, an exit status with nothing written)
 * carries it as `failure`, which the route words from the catalog in place of `error`.
 */
export type Outcome = {
    ok: boolean;
    output: string;
    error: string;
    code?: string;
    failure?: CommandFailure;
};

/** One row of `git branch --format`, as the branch menu draws it. */
export type Branch = GitBranch;

export function failed(error: string): Outcome {
    return { ok: false, output: '', error };
}

/**
 * What one command may carry beside its arguments: text on its standard input, variables, the
 * codes of refusals the page acts on, each named by a phrase of git's whole error stream, and the
 * signal that ends the run when Cancel aborts it.
 */
type Extra = {
    input?: string;
    env?: Record<string, string>;
    codes?: Record<string, string>;
    signal?: AbortSignal;
};

/**
 * One git command, as a list, with a timeout (`NO_TIME_LIMIT` for none). This is the module's one
 * subprocess call site, and every refusal above it has run when it is reached. A failure says git's
 * own reason as `classifyFailure` (server/core/git/parse.ts) reads it: the last `fatal: ` line of
 * the error stream, else its first line, and where that stream is empty the last non-empty line of
 * the output stream (a merge that stopped on conflicts, a commit with nothing to commit); a command
 * that gave none is answered with its code.
 */
function run(root: string, args: string[], timeout: number, extra: Extra = {}): Promise<Outcome> {
    const argv = ['-C', root, ...args];
    return new Promise((settle) => {
        // A list, never a shell. A path or a branch name from the page is an argument and can
        // therefore never be read as syntax.
        const child = execFile(
            GIT,
            argv,
            {
                encoding: 'utf8',
                timeout,
                maxBuffer: MAX_OUTPUT,
                env: extra.env === undefined ? process.env : { ...process.env, ...extra.env }
            },
            (error, stdout, stderr) => {
                if (error !== null) {
                    const said = classifyFailure(
                        ended(error),
                        stdout,
                        stderr,
                        { timeoutMs: timeout, maxBytes: MAX_OUTPUT },
                        REASON_WIDTH,
                        'git'
                    );
                    if (said.failure !== undefined) {
                        settle({ ...failed(said.reason), failure: said.failure });
                        return;
                    }
                    const whole = typeof stderr === 'string' ? stderr : '';
                    const code = Object.entries(extra.codes ?? {}).find(([phrase]) =>
                        whole.includes(phrase)
                    )?.[1];
                    settle(
                        code === undefined ? failed(said.reason) : { ...failed(said.reason), code }
                    );
                    return;
                }
                settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
            }
        );
        const ended = endWith(child, extra.signal);
        child.stdin?.end(extra.input ?? '');
    });
}

// ---------------------------------------------------------------- what may be written where

/**
 * The roots a write may name: the workspaces on the `git` channel, the hub itself, and the deposit
 * mirrors folder. The third is there for the suggested commit message of the deposit panel, which
 * asks this module for a message over the mirror's staged diff; every other write on a mirror goes
 * through server/git/deposit.ts, whose own gate is the enumerated subcommands of deposit-git.ts.
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

export function checkPaths(
    root: string,
    paths: unknown[],
    text: Record<string, string>,
    roots: string[]
): string {
    if (!permitted(root, roots)) return words(text, 'server.git.unknown_directory');
    if (!Array.isArray(paths) || paths.length === 0) return words(text, 'server.git.no_path');
    for (const path of paths) {
        const one = scalar(path);
        if (one === '' || !pathInside(root, one)) {
            return words(text, 'server.git.path_outside_workspace', one);
        }
    }
    return '';
}

// ---------------------------------------------------------------- the operations

/** Stage the given paths. */
export async function stage(
    root: string,
    paths: string[],
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = checkPaths(root, paths, text, roots);
    if (wrong !== '') return failed(wrong);
    return addTo(root, ['--', ...paths]);
}

/** Take the given paths back out of the index, leaving the worktree as it is. */
export async function unstage(
    root: string,
    paths: string[],
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const wrong = checkPaths(root, paths, text, roots);
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
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const loose = await untrackedAmong(root, paths, text, roots);
    if (!(loose instanceof Set)) return loose;
    const refused = paths.filter((path) => loose.has(path));
    if (refused.length > 0) {
        return failed(words(text, 'server.git.not_tracked', refused[0]));
    }
    return restore(root, paths, false);
}

/**
 * Commit what is staged. The message goes through a file rather than an argument: it is several
 * lines with quotes and backticks in it, and `-F` is the one form no quoting can break.
 *
 * With `amend`, the commit replaces the one at HEAD, keeping its message when the box is empty.
 * An amend of a commit the upstream already holds is refused before anything runs: the only way
 * on from there is a forced push, which nothing here runs.
 */
export async function commit(
    root: string,
    message: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    amend = false,
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    const body = typeof message === 'string' ? message : '';
    if (!amend && body.trim() === '') return failed(words(text, 'server.git.commit_needs_message'));
    if (amend) {
        const pushed = await pushedAlready(root);
        if (pushed) return failed(words(text, 'server.git.amend_pushed'));
        if (body.trim() === '') return commitWith(root, ['--amend', '--no-edit'], signal);
    }
    return withFile('oculus-commit-', body, (file) =>
        commitWith(root, [...(amend ? ['--amend'] : []), '-F', file], signal)
    );
}

/**
 * Hand git a text through a file of its own in a folder made for it and taken away after, for the
 * two writes whose text is a message a person wrote: a commit and an annotated tag.
 */
export async function withFile(
    prefix: string,
    text: string,
    act: (file: string) => Promise<Outcome>
): Promise<Outcome> {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    const file = join(dir, 'message.txt');
    try {
        writeFileSync(file, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
        return await act(file);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

/**
 * Whether the upstream already holds HEAD. A branch with no upstream holds nothing anywhere, so
 * its HEAD is not pushed; git answering that HEAD is an ancestor of the upstream is the one yes.
 */
async function pushedAlready(root: string): Promise<boolean> {
    const up = await upstream(root);
    if (!up.ok) return false;
    const held = await run(
        root,
        ['merge-base', '--is-ancestor', 'HEAD', '@{upstream}'],
        TIMEOUT_MS
    );
    return held.ok;
}

/**
 * Push the current branch to its upstream. A branch with no upstream is refused with that as the
 * reason, before anything is sent: `--set-upstream` decides where a branch lives, and that decision
 * is Axel's at a terminal rather than a side effect of a button. This push never forces.
 */
export async function push(
    root: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    const up = await upstream(root);
    if (!up.ok) return failed(words(text, 'server.git.push_no_upstream'));
    return pushTo(root, [], signal);
}

/** Every branch, with its upstream and which one is checked out. A read, and the only one here. */
export async function branches(
    root: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    return branch(root, [REFS_FORMAT]);
}

/**
 * A commit named as a start point: a whole or abbreviated hash and nothing a revision or an option
 * could be read as.
 */
const START = /^[0-9a-f]{4,64}$/;

/** Why a start point is refused, or the empty string when it is a hash. Checked before git runs. */
export function checkStart(start: string, text: Record<string, string>): string {
    return typeof start === 'string' && START.test(start)
        ? ''
        : words(text, 'server.git.not_a_hash', typeof start === 'string' ? start : '');
}

/**
 * Make a branch and check it out, at HEAD or at the commit `start` names. The name is git's own to
 * judge, so git judges it first.
 */
export async function createBranch(
    root: string,
    name: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    start?: string,
    signal?: AbortSignal
): Promise<Outcome> {
    const wrong = await checkName(root, name, text, roots);
    if (wrong !== '') return failed(wrong);
    if (start === undefined) return switchTo(root, ['-c', name], signal);
    const refusal = checkStart(start, text);
    if (refusal !== '') return failed(refusal);
    return switchTo(root, ['-c', name, start], signal);
}

/**
 * Whether the porcelain reports a change of the repository's own content. An untracked file is not
 * one: git carries it across a switch or a merge and never overwrites it, so refusing over one
 * would refuse every repository with a build folder in it. A switch that would overwrite an
 * untracked file is git's own refusal, which `switched` words.
 */
export function trackedChange(output: string): boolean {
    return statusRecords(output).some((record) => record.code !== '??');
}

/**
 * A switch's answer: a refusal of git's own is worded from the catalog with git's line after it,
 * and a command that ended with no reason of git's own keeps its failure code.
 */
async function switched(run: Promise<Outcome>, text: Record<string, string>): Promise<Outcome> {
    const done = await run;
    if (done.ok || done.failure !== undefined) return done;
    return failed(
        words(text, 'server.git.git_said', words(text, 'server.git.switch_refused'), done.error)
    );
}

/**
 * Check a branch out. A tree with a change to a tracked path is refused: git carries uncommitted
 * changes across a switch, and a change carried onto another branch by a click is the way this
 * panel would lose work. An untracked file does not stop the switch; git refuses it itself when it
 * would be overwritten.
 */
export async function switchBranch(
    root: string,
    name: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    const wrong = await checkName(root, name, text, roots);
    if (wrong !== '') return failed(wrong);
    const state = await porcelain(root);
    if (!state.ok) return state;
    if (trackedChange(state.output)) return failed(words(text, 'server.git.dirty_switch'));
    return switched(switchTo(root, [name], signal), text);
}

/**
 * Detach HEAD at a commit or a remote branch. Refused over a change to a tracked path like
 * `switchBranch`, for the same reason: git carries uncommitted changes across a switch.
 */
export async function switchDetached(
    root: string,
    ref: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    const wrong = await checkName(root, ref, text, roots);
    if (wrong !== '') return failed(wrong);
    const state = await porcelain(root);
    if (!state.ok) return state;
    if (trackedChange(state.output)) return failed(words(text, 'server.git.dirty_switch'));
    return switched(switchTo(root, ['--detach', ref], signal), text);
}

/** What is staged right now, which is what the suggested message is written from. */
export async function stagedDiff(
    root: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    return diff(root, ['--cached']);
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
    root: string,
    path: string,
    staged: boolean,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome & { ours: boolean }> {
    const wrong = checkPaths(root, [path], text, roots);
    if (wrong !== '') return { ...failed(wrong), ours: false };
    const flags = ['--no-color', '--no-ext-diff', NO_CONTEXT, '--', path];
    const read = await diff(root, [...(staged ? ['--cached'] : []), ...flags]);
    if (staged || !read.ok || !read.output.startsWith('diff --cc '))
        return { ...read, ours: false };
    return { ...(await diff(root, ['--ours', ...flags])), ours: true };
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
    root: string,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (!worktreeUnder(root, path)) return failed(words(text, 'server.git.outside_worktrees'));
    const head = await revParse(root, ['--abbrev-ref', 'HEAD']);
    if (!head.ok) return head;
    const name = head.output.trim();
    const from = name === '' || name === 'HEAD' ? await revParse(root, ['HEAD']) : head;
    return from.ok ? { ...from, output: from.output.trim() } : from;
}

/** What a worktree holds that the repository's checked-out branch does not, as a diff. */
export async function worktreeDiff(
    root: string,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const from = await worktreeFrom(root, path, text, roots);
    return from.ok ? worktreeRange(path, from.output) : from;
}

/** The three-dot diff of a worktree from the branch `worktreeFrom` named, which it checked. */
export function worktreeRange(path: string, from: string): Promise<Outcome> {
    return diff(path, ['--no-color', '--no-ext-diff', NO_CONTEXT, `${from}...HEAD`]);
}

// ---------------------------------------------------------------- worktrees and the merge back

/**
 * Whether the path is a worktree this tool made under the root. Both sides go through realpath
 * first, so a `..` inside either is worked out and a symbolic link under the worktrees folder that
 * points at another repository resolves to where it points and is refused; a path that does not
 * exist is refused too, since there is nothing to remove or diff. The rule itself is
 * data/helpers/worktrees.ts's, which the page reads too.
 */
function worktreeUnder(root: string, path: string): boolean {
    if (typeof path !== 'string' || path === '' || !isAbsolute(path)) return false;
    if (!validName(basename(resolve(path)))) return false;
    const full = realPath(path);
    const top = realPath(root);
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
    text: Record<string, string>,
    roots: string[] = allowedRoots(),
    signal?: AbortSignal
): Promise<Outcome> {
    const wrong = await checkName(root, name, text, roots);
    if (wrong !== '') return failed(wrong);
    if (!validName(name)) return failed(words(text, 'server.git.worktree_name', name));
    const path = worktreePath(root, name);
    if (existsSync(path)) return failed(words(text, 'server.git.already_something', path));
    return worktree(root, ['add', '-b', name, path, 'HEAD'], signal);
}

/**
 * Take a worktree away, and the branch it was on with it. A worktree holding uncommitted work is
 * refused before anything runs: `git worktree remove` would refuse it too, and the reason is worth
 * more than git's. The branch goes by `-d`, which git refuses for a branch not merged into its
 * upstream, or into HEAD when it has none, so such a branch stays and the answer says so.
 */
export async function removeWorktree(
    root: string,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    if (!permitted(root, roots)) return failed(words(text, 'server.git.unknown_directory'));
    if (!worktreeUnder(root, path)) return failed(words(text, 'server.git.outside_worktrees'));
    if (!existsSync(path)) return failed(words(text, 'server.git.no_worktree_at', path));
    const state = await porcelain(path);
    if (!state.ok) return state;
    // Untracked files count here, unlike the merge: `git worktree remove` would take the folder and
    // them with it, and a file git never saw is a file nobody can get back.
    if (state.output.trim() !== '') return failed(words(text, 'server.git.worktree_dirty'));
    const head = await revParse(path, ['--abbrev-ref', 'HEAD']);
    const name = head.ok ? head.output.trim() : '';
    const gone = await worktree(root, ['remove', path]);
    if (!gone.ok) return gone;
    if (name === '' || name === 'HEAD') return gone;
    const dropped = await branch(root, ['-d', name]);
    if (dropped.ok) return { ok: true, output: `${gone.output}${dropped.output}`, error: '' };
    return {
        ok: true,
        output: `${gone.output}${words(text, 'server.git.branch_kept', name, dropped.error)}`,
        error: ''
    };
}

// ---------------------------------------------------------------- the shared call sites

/** The one `restore` call site: staged is the unstage, unstaged is the discard. */
export function restore(root: string, paths: string[], staged: boolean): Promise<Outcome> {
    const flags = staged ? ['--staged'] : [];
    return run(root, ['restore', ...flags, '--', ...paths], TIMEOUT_MS);
}

/**
 * The one `rm` call site: Accept Deletion over a conflicted path a side deleted, which takes the
 * path from the index and the worktree.
 */
export function removeIn(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['rm', ...args], TIMEOUT_MS);
}

/** The one `add` call site: named paths, and every tracked change under the root with `-u`. */
export function addTo(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['add', ...args], TIMEOUT_MS);
}

/**
 * The one `apply` call site: a patch the page made from a hunk or from chosen lines, handed on
 * standard input. `--recount` has git count the lines itself, since a patch cut down to some of
 * a hunk's lines no longer matches the counts in its head.
 */
export function applyPatch(root: string, flags: string[], patch: string): Promise<Outcome> {
    return run(root, ['apply', ...flags, '--recount', '-'], TIMEOUT_MS, { input: patch });
}

/**
 * The one `commit` call site: a message from a file, an amend, and a merge's commit. It runs the
 * repository's commit hooks, so it has no time limit.
 */
function commitWith(root: string, args: string[], signal?: AbortSignal): Promise<Outcome> {
    return run(root, ['commit', ...args], NO_TIME_LIMIT, { env: CONFIG_ONLY, signal });
}

/**
 * `user.useConfigOnly=true` for one command, through the environment: git refuses a commit made
 * without a name and an address in its configuration instead of guessing them from the machine.
 */
const CONFIG_ONLY = {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'user.useConfigOnly',
    GIT_CONFIG_VALUE_0: 'true'
};

/**
 * The one `cherry-pick` call site: a commit picked onto the checked-out branch, which runs the
 * repository's hooks and has no time limit, and the abort, which runs none and keeps the limit.
 */
export function cherryPickIn(root: string, args: string[], signal?: AbortSignal): Promise<Outcome> {
    return run(root, ['cherry-pick', ...args], limitOf(args), { signal });
}

/** The time limit of a command whose `--abort` form runs no hook: it keeps the local limit. */
function limitOf(args: string[]): number {
    return args.includes('--abort') ? TIMEOUT_MS : NO_TIME_LIMIT;
}

/**
 * The one `push` call site: the branch to its upstream, a branch published, and the tags. It runs
 * the pre-push hook, so it has no time limit.
 */
export function pushTo(root: string, args: string[], signal?: AbortSignal): Promise<Outcome> {
    return run(root, ['push', ...args], NO_TIME_LIMIT, { signal });
}

/**
 * The one `pull` call site, with the repository's own configuration and nothing imposed. A pull
 * merges and runs the post-merge hook, so it has no time limit.
 */
export function pullIn(root: string, signal?: AbortSignal): Promise<Outcome> {
    return run(root, ['pull'], NO_TIME_LIMIT, { signal });
}

/** How a fetch nobody pressed is told never to wait for a person. */
export type FetchOptions = {
    /** Sets `GIT_TERMINAL_PROMPT=0`, so git asks for no user name or password. */
    unattended?: boolean;
    /**
     * The ssh command to run with, already carrying `-o BatchMode=yes`, so ssh asks for no password
     * or passphrase. Only used when `unattended` is set; the caller resolves it, since reading the
     * repository's own command is a read and not a write.
     */
    sshCommand?: string;
};

/** The environment of an unattended fetch, beside the process environment. */
function unattendedEnv(options: FetchOptions): Record<string, string> | undefined {
    if (options.unattended !== true) return undefined;
    const env: Record<string, string> = { GIT_TERMINAL_PROMPT: '0' };
    if (options.sshCommand !== undefined) env.GIT_SSH_COMMAND = options.sshCommand;
    return env;
}

/** The one `fetch` call site: every remote branch, and the ones gone from the remote taken away. */
export function fetchIn(root: string, options: FetchOptions = {}): Promise<Outcome> {
    return run(root, ['fetch', '--prune'], PUSH_TIMEOUT_MS, { env: unattendedEnv(options) });
}

/** The one `remote` call site: the remotes by name, which a branch may be published to. */
export function remoteNames(root: string): Promise<Outcome> {
    return run(root, ['remote'], TIMEOUT_MS);
}

/**
 * The one `rebase` call site: the abort, which keeps the local time limit, and the continue once
 * every conflict is resolved, which runs the hooks and has none. Its editor is told to take the
 * message as it stands, since no one is at a terminal to write it.
 */
export function rebaseIn(
    root: string,
    step: '--abort' | '--continue',
    signal?: AbortSignal
): Promise<Outcome> {
    return run(root, ['rebase', step], limitOf([step]), {
        env: { GIT_EDITOR: 'true' },
        signal
    });
}

/** The one `stash` call site: every form of it, the push, the apply, the pop and the drop. */
export function stashIn(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['stash', ...args], TIMEOUT_MS);
}

/** The one `tag` call site: a tag made at HEAD, plain or annotated, and a tag deleted. */
export function tagIn(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['tag', ...args], TIMEOUT_MS);
}

/**
 * The one `switch` call site, for both the branch that exists and the one being made. A switch
 * runs the post-checkout hook, so it has no time limit.
 */
function switchTo(root: string, args: string[], signal?: AbortSignal): Promise<Outcome> {
    return run(root, ['switch', ...args], NO_TIME_LIMIT, { signal });
}

/** The one `status` call site: the dirty check and the untracked list read the same output. */
export function porcelain(root: string): Promise<Outcome> {
    return run(root, ['status', '--porcelain=v1', '-z'], TIMEOUT_MS);
}

/**
 * The one `rev-parse` call site: the upstream of the current branch, what HEAD is, whether a merge
 * is in progress, and where git keeps a rebase's state.
 */
export function revParse(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['rev-parse', ...args], TIMEOUT_MS);
}

/** Whether the current branch has somewhere to push to. */
export function upstream(root: string): Promise<Outcome> {
    return revParse(root, ['--abbrev-ref', '@{upstream}']);
}

/** The one `diff` call site: the staged diff, one file's, a worktree's range, and the conflicts. */
export function diff(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['diff', ...args], TIMEOUT_MS);
}

/**
 * The one `branch` call site: the listing the menu draws, the `-d` a worktree removal and Delete
 * Branch make, and the `-D` Delete Anyway makes after its question.
 */
export function branch(root: string, args: string[], extra: Extra = {}): Promise<Outcome> {
    return run(root, ['branch', ...args], TIMEOUT_MS, extra);
}

/**
 * The one `worktree` call site: the add, which runs the post-checkout hook and has no time limit,
 * and the remove, which keeps the local limit. The list is server/core/git/state.ts's read.
 */
function worktree(root: string, args: string[], signal?: AbortSignal): Promise<Outcome> {
    const limit = args[0] === 'add' ? NO_TIME_LIMIT : TIMEOUT_MS;
    return run(root, ['worktree', ...args], limit, { signal });
}

/**
 * The one `merge` call site: the merge itself, which runs the hooks and has no time limit, and the
 * abort that takes a conflicted one back, which keeps the local limit.
 */
export function mergeIn(root: string, args: string[], signal?: AbortSignal): Promise<Outcome> {
    return run(root, ['merge', ...args], limitOf(args), { signal });
}

/** Whether a name is a branch name git accepts, judged by git, or the empty string when it is. */
export async function checkName(
    root: string,
    name: string,
    text: Record<string, string>,
    roots: string[]
): Promise<string> {
    if (!permitted(root, roots)) return words(text, 'server.git.unknown_directory');
    if (typeof name !== 'string' || name.trim() === '') {
        return words(text, 'server.git.branch_needs_name');
    }
    if (name.startsWith('-')) return words(text, 'server.git.not_branch_name', name);
    const judged = await refFormat(root, ['--branch', name]);
    return judged.ok ? '' : words(text, 'server.git.not_branch_name', name);
}

/** The one `check-ref-format` call site: git's own answer on a branch name or a whole ref. */
export function refFormat(root: string, args: string[]): Promise<Outcome> {
    return run(root, ['check-ref-format', ...args], TIMEOUT_MS);
}

// ---------------------------------------------------------------- small stuff

/** The paths `status --porcelain=v1 -z` reported as untracked. */
export function untrackedIn(output: string): Set<string> {
    return new Set(
        statusRecords(output)
            .filter((record) => record.code === '??')
            .map((record) => record.path)
    );
}

/**
 * The paths git lists as untracked in a repository, or the refusal when `paths` holds one the
 * write may not touch or the status could not be read.
 */
export async function untrackedAmong(
    root: string,
    paths: string[],
    text: Record<string, string>,
    roots: string[]
): Promise<Set<string> | Outcome> {
    const wrong = checkPaths(root, paths, text, roots);
    if (wrong !== '') return failed(wrong);
    const state = await porcelain(root);
    return state.ok ? untrackedIn(state.output) : state;
}
