// Layer 2, server. The one place a git command is run: the call site every read-only git form of
// this folder goes through (state.ts, reads.ts, files.ts, compare.ts), the outcome it answers with
// and the small helpers they share. The git watcher, the file browser's listing and the git writes
// all run git through this folder, so it sits in server/core, below every folder that reads git.
//
// What a session touched comes from its transcript. What the checkout looks like right now only git
// can say, and that is state.ts: whether the root is a repository at all, the branch, the distance
// from its upstream, and the staged, changed and untracked lists.
//
// DESIGN.md, "Git": exactly these read-only commands run here and no others, ever.
//
//     git -C <root> rev-parse --git-dir
//     git -C <root> rev-parse --abbrev-ref HEAD
//     git -C <root> symbolic-ref --short HEAD
//     git -C <root> rev-list --left-right --count @{upstream}...HEAD
//     git -C <root> status --porcelain=v1 -z --untracked-files=normal --renames
//     git -C <root> diff --numstat -z
//     git -C <root> diff --no-color --no-ext-diff -U0 -- <path>
//     git -C <root> diff --no-color --no-ext-diff -U0 -M <stash>^1 <stash>
//     git -C <root> log -<n> --format=...
//     git -C <root> log --follow --relative -z --name-status --diff-merges=first-parent
//         --format=... [-51] -- <path>   (GIT_LITERAL_PATHSPECS=1)
//     git -C <root> log --topo-order --format=... --skip=<n> -<n> HEAD --
//     git -C <root> log --topo-order --format=... -<n> <HEAD..@{upstream} | @{upstream}..HEAD> --
//     git -C <root> log --walk-reflogs --format=... refs/stash --
//     git -C <root> worktree list --porcelain
//     git -C <root> check-ignore --stdin -z
//     git -C <root> ls-files -z
//     git -C <root> for-each-ref --format=... refs/heads refs/tags refs/stash
//     git -C <root> remote
//     git -C <root> blame --porcelain -- <path>
//     git -C <root> show :<1|2|3>:<path>
//     git -C <root> show --no-textconv <revision>:<path>
//     git -C <root> show --format= --name-status -z [-M] [--relative] --diff-merges=first-parent
//         <commit>
//     git -C <root> show --format= --no-color --no-ext-diff -U0 -M --diff-merges=first-parent
//         <commit> -- [<old path>] <path>
//     git -C <root> show -s --format=%P <stash>
//     git -C <root> show --format= --no-color --no-ext-diff -U0 <stash>^3
//     git -C <root> merge-base <branch> HEAD
//     git -C <root> check-attr filter text eol working-tree-encoding ident -- <path>
//     git -C <root> config --get --default= core.autocrlf
//     git -C <root> config --get --default= core.sshCommand
//
// `check-ignore` is the file browser's: which entries of one listed folder the repository ignores,
// the names handed on its standard input, so the tree can leave them out (ignoredIn in files.ts).
// `ls-files` is the Status view's line counts: the paths a folder's repository tracks under it
// (trackedFiles in files.ts), which is the set of files server/machine/lines.ts hands to cloc. The
// status read above it is the `git` channel's; the graph, the blame, the gutter marks, the three
// versions of a conflicted path, a commit's files and diffs and a stash's diff are read on demand
// by GET /api/git, since each is text or a page a reader asked for rather than state every event
// carries. A stash is listed from its reflog and diffed against its first parent, which is what
// `stash list` and `stash show -p` print, so no command here is a form of a writing subcommand.
// The diff pane's reads answer each file's two versions whole, read by `show`, beside the head
// lines of the diff; `merge-base` names where a worktree's diff starts, and `check-attr` and
// `config --get` say whether git converts a file's text, which decides whether the pane may cut a
// partial patch from it. `config --get --default= core.sshCommand` is the ssh command the
// repository names, which an unattended fetch extends (server/root/watch/autofetch.ts). `config` is
// held to those two reading vectors. `log --follow --relative -z --name-status
// --diff-merges=first-parent` is the Timeline's: a page of the commits that touched one file across
// its renames and copies (fileLog in files.ts), each with the path the file has in it relative to
// the served root, the first page asking for 51 so the 51st only says more remain and a later page
// reading the log from HEAD and taking the rows after the cursor's commit; the path handed after
// `--` is read as a literal name through GIT_LITERAL_PATHSPECS=1, so a `*` in a name matches
// itself.
//
// Nothing here may ever change a repository. Every writing subcommand belongs to Axel alone, and a
// dashboard watcher must never be the thing that runs one. compare.ts lists its own forms in its
// head.
//
// A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
// (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
// short reason. Data only, no rendered strings: the wording comes from the text catalog.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`); the records of
// `status --porcelain=v1 -z` are split by parse.ts's `statusRecords` and sorted into the change
// lists by its `statusLists`.

import { spawnSync } from 'node:child_process';
import { isUtf8 } from 'node:buffer';
import { lstatSync, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { inside } from '../paths.ts';
import { shortReason } from './parse.ts';

export const GIT = 'git';
/** The most output one read takes, which a whole version of a large file read by `show` needs. */
const MAX_OUTPUT = 32 * 1024 * 1024;
/** How many characters of git's reason the channel carries. */
const REASON_WIDTH = 120;
/** Milliseconds one git command is given before it is given up on. */
export const TIMEOUT_MS = 5000;
/** A commit named on a request: a whole or abbreviated hash and nothing a revision could mean. */
export const HASH = /^[0-9a-f]{4,40}$/;
/**
 * The one refusal of git's that means the root holds no repository; it opens every wording of it.
 */
export const NO_REPOSITORY = 'not a git repository';

/**
 * What one command came back with. `answered` is whether anything about the root can be read from
 * the outcome: a command that timed out or was killed has not answered anything, while a git that
 * could not start is taken at its word, so that a plain folder never becomes a repository because
 * git is missing. `ran` is the narrower fact, whether git itself executed and set the exit status,
 * which is what tells git's own refusal of a root from this machine having no git to ask.
 */
export type Outcome = { ok: boolean; answered: boolean; ran: boolean; text: string; utf8: boolean };

/** What one on-demand read answers: its value, or why it could not be read. */
export type Read<T> = { ok: true; value: T } | { ok: false; error: string };

export function refused<T>(error: string): Read<T> {
    return { ok: false, error };
}

/**
 * Whether a path is one a read hands to git: relative, inside the repository, and not a lone
 * dash git would take for an option. The writing module holds the same rule for its own paths.
 */
export function pathInside(root: string, path: string): boolean {
    if (typeof path !== 'string' || path === '' || path.startsWith('-') || isAbsolute(path)) {
        return false;
    }
    return inside(join(root, path), root);
}

// ---------------------------------------------------------------- git output

/** The one `show` call site: an index stage of a path, and a commit's files and diffs. */
export function show(root: string, args: string[], timeout: number): Outcome {
    return run(root, ['show', ...args], timeout);
}

/** The call site of the diffs read on demand: a file's gutter marks and a stash's changes. */
export function readDiff(root: string, args: string[], timeout: number): Outcome {
    return run(root, ['diff', ...args], timeout);
}

/**
 * One git command, as a list, with a timeout. A non-zero exit, a broken git, or a repository too
 * slow to answer all come back as not ok with a short reason, and only the non-zero exit as
 * answered. The output is read as bytes, `utf8` says whether they were UTF-8, and `text` is them
 * decoded as UTF-8. This is the module's one call site.
 */
export function run(
    root: string,
    args: string[],
    timeout: number,
    input?: string,
    env?: Record<string, string>
): Outcome {
    // Every read runs without optional locks, so a status refresh never writes .git/index.lock and
    // never collides with a commit the owner is making in the same repository.
    const argv = ['-C', root, '--no-optional-locks', ...args];
    // A list, never a shell, and a timeout: a hung git must not hang a watcher.
    const done = spawnSync(GIT, argv, {
        timeout,
        input,
        maxBuffer: MAX_OUTPUT,
        ...(env === undefined ? {} : { env: { ...process.env, ...env } })
    });
    if (done.error !== undefined) {
        const failure = done.error as NodeJS.ErrnoException;
        const text = failure.code === 'ETIMEDOUT' ? 'git timed out' : short(failure);
        return { ok: false, answered: failure.code !== 'ETIMEDOUT', ran: false, text, utf8: true };
    }
    if (done.status !== 0) {
        const text = short(bytesOf(done.stderr).toString('utf8')) || 'git failed';
        return { ok: false, answered: true, ran: true, text, utf8: true };
    }
    const bytes = bytesOf(done.stdout);
    return {
        ok: true,
        answered: true,
        ran: true,
        text: bytes.toString('utf8'),
        utf8: isUtf8(bytes)
    };
}

// ---------------------------------------------------------------- small stuff

/**
 * Whether a name can be seen at the path. Unlike exists(), a read that could not tell (a parent
 * nothing may enter) answers false: this is asked where a name has to be shown to be there, not
 * where a root has to be shown to be gone.
 */
export function seen(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch {
        return false;
    }
}

export function directory(root: string): boolean {
    try {
        return statSync(root).isDirectory();
    } catch {
        return false;
    }
}

/**
 * Whether anything is at the path: a directory, a file, a symbolic link whose target is gone, or a
 * folder under a parent nothing may enter. The link itself is read rather than what it points at,
 * since a link that is there is a name that is there.
 *
 * Three codes answer false. `ENOENT` and `ENOTDIR` say no such name is there, and `ENAMETOOLONG`
 * says no such name can be there, since the system will not carry one that long. Every other
 * failure is a read that could not tell, and a root is never called gone on one.
 */
export function exists(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch (error) {
        const code = (error as NodeJS.ErrnoException | null)?.code ?? '';
        return !['ENOENT', 'ENOTDIR', 'ENAMETOOLONG'].includes(code);
    }
}

/** A timeout that is not a positive number falls back to the default rather than failing a root. */
export function milliseconds(timeout: unknown): number {
    const value = Number(timeout);
    if (!Number.isFinite(value) || value <= 0) return TIMEOUT_MS;
    return value;
}

export function whole(token: string): number {
    const value = Number.parseInt(token, 10);
    return Number.isInteger(value) ? value : 0;
}

/** What a spawned process wrote, as bytes; nothing when it wrote nothing. */
function bytesOf(output: unknown): Buffer {
    return Buffer.isBuffer(output) ? output : Buffer.alloc(0);
}

/** A one-line reason fit for a tooltip. */
export function short(value: unknown): string {
    return shortReason(value, REASON_WIDTH);
}
