// Layer 2, server. Read-only git state for the workspaces the session views name.
//
// What a session touched comes from its transcript. What the checkout looks like right now only git
// can say, and that is this module: whether the root is a repository at all, the branch, the
// distance from its upstream, and the staged, changed and untracked lists.
//
// DESIGN.md, "Git": exactly these read-only commands run here and no others, ever.
//
//     git -C <root> rev-parse --git-dir
//     git -C <root> rev-parse --abbrev-ref HEAD
//     git -C <root> symbolic-ref --short HEAD
//     git -C <root> rev-list --left-right --count @{upstream}...HEAD
//     git -C <root> status --porcelain=v1 -z --untracked-files=normal
//     git -C <root> diff --numstat -z
//     git -C <root> log -<n> --format=...
//     git -C <root> branch --format=...
//     git -C <root> worktree list --porcelain
//     git -C <root> check-ignore --stdin -z
//
// The last is the file browser's: which entries of one listed folder the repository ignores, the
// names handed on its standard input, so the tree can leave them out (ignoredIn below).
//
// Nothing here may ever change a repository. Every writing subcommand belongs to Axel alone, and a
// dashboard watcher must never be the thing that runs one. tests/server/git/git.test.ts holds two
// gates over that: the source names no writing subcommand, and the suite records every argument
// vector the process runs and asserts the whole suite ran only the commands above, `branch`,
// `worktree`, `symbolic-ref` and `check-ignore` only as the vectors written here.
//
// A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
// (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
// short reason. Data only, no rendered strings: the wording comes from the text catalog.

import { scalar } from '../../data/helpers/guards.ts';
import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import type { GitBranch, GitCommit, GitEntry, GitState, GitWorktree } from '../../data/model.ts';
import { ignoresWorktrees } from '../../data/helpers/worktrees.ts';
import { BRANCH_FORMAT, LOG_FORMAT, parseBranches, parseLog, parseWorktrees } from './git-parse.ts';

export const GIT = 'git';
/** Milliseconds one git command is given before it is given up on. */
export const TIMEOUT_MS = 5000;
/** One workspace with 4000 untracked files, or 4000 branches, must not become the payload. */
export const MAX_ENTRIES = 200;
/**
 * How many commits the log carries: the view is a glance, and a terminal reads a longer history.
 */
export const LOG_ENTRIES = 20;
/** git's own letter for a path it does not track. */
export const UNTRACKED = '?';
/** An index or worktree column saying "nothing here". */
const QUIET = [' ', UNTRACKED, '!'];
/** A rename or a copy reports its old path as a second field. */
const TWO_PATHS = ['R', 'C'];
/**
 * The one refusal of git's that means the root holds no repository; it opens every wording of it.
 */
const NO_REPOSITORY = 'not a git repository';

/** path to (added, deleted) for the worktree; null where git reported a binary file. */
type Counts = Map<string, [number | null, number | null]>;

/** One row of the porcelain output: the index letter, the worktree letter, and the path. */
type Row = [string, string, string];

/**
 * What one command came back with. `answered` is whether anything about the root can be read from
 * the outcome: a command that timed out or was killed has not answered anything, while a git that
 * could not start is taken at its word, so that a plain folder never becomes a repository because
 * git is missing. `ran` is the narrower fact, whether git itself executed and set the exit status,
 * which is what tells git's own refusal of a root from this machine having no git to ask.
 */
type Outcome = { ok: boolean; answered: boolean; ran: boolean; text: string };

/** The shape every caller can count on, with nothing in it. */
export function empty(error: string | null = null): GitState {
    return {
        branch: '',
        ahead: 0,
        behind: 0,
        // Nothing has been read yet, so whether the branch tracks anything is not known.
        upstream: null,
        detached: false,
        staged: [],
        unstaged: [],
        untracked: [],
        log: [],
        branches: [],
        worktrees: [],
        ignoresWorktrees: false,
        // Nothing says a root is not there until a read of the path itself says so, so a read that
        // threw leaves the root where it was; state() sets this from exists() at both answers.
        present: true,
        // A root is a repository once `rev-parse --git-dir` has said so, or once that check timed
        // out.
        repository: false,
        error
    };
}

/**
 * Read-only git state for each root, keyed by root. Never throws. A root with nothing at its path,
 * or that git answered is not a repository, comes back as the empty shape with `error` set and
 * `repository` false; `present` is false for the first of those two alone, read at the path each
 * time the answer is made, so a caller can say the folder is not there rather than that it is no
 * repository. A root whose check did not answer (a timeout, a git that would not start), a root git
 * refused for a reason other than holding no repository, and a repository where a later read fails
 * all keep `repository` true and say why in `error`, so neither a slow mount nor an unreadable
 * config makes a repository disappear. A caller renders every workspace without a special case. A
 * repeated root is read once.
 */
export function statusFor(roots: string[], timeout: number = TIMEOUT_MS): Record<string, GitState> {
    const out: Record<string, GitState> = {};
    if (!Array.isArray(roots)) return out;
    const ms = milliseconds(timeout);
    for (const root of roots) {
        if (typeof root !== 'string' || root === '' || root in out) continue;
        try {
            out[root] = state(root, ms);
        } catch (error) {
            out[root] = empty(short(error));
        }
    }
    return out;
}

/**
 * The names among `names` that git ignores in the folder, for the file browser's tree. git answers
 * 0 when it named at least one, 1 when it named none and 128 when the folder is in no repository;
 * only 0 carries names, so a folder in no repository, a git that is missing, a run that timed out
 * and one that failed all answer that nothing is ignored. A name is asked for bare: git reads for
 * itself whether it is a folder, so a pattern naming folders alone (`build/`) matches one, and a
 * trailing slash would make git refuse the whole run over a link to a folder. A tracked file is
 * never named, since git does not ignore what it already tracks.
 */
export function ignoredIn(
    root: string,
    names: string[],
    timeout: number = TIMEOUT_MS
): Set<string> {
    const none = new Set<string>();
    if (names.length === 0) return none;
    const input = names.map((name) => `${name}\0`).join('');
    const done = run(root, ['check-ignore', '--stdin', '-z'], milliseconds(timeout), input);
    if (!done.ok) return none;
    const said = new Set(done.text.split('\0').filter((one) => one !== ''));
    return new Set(names.filter((name) => said.has(name)));
}

// ---------------------------------------------------------------- one root

function state(root: string, timeout: number): GitState {
    // A path with nothing at it is the one root git is never asked about. A path that is there and
    // is no directory, and one nothing may enter, are handed to git like any other, so the reader
    // gets git's own reason for them instead of being told the folder is gone.
    if (!directory(root) && !exists(root)) {
        const gone = empty('no such directory');
        gone.present = false;
        return gone;
    }
    // The one read that tells a repository from a folder: it names no commit, so a repository with
    // none yet answers it like any other. Only a check that timed out says nothing about the root,
    // which is then kept as the repository it was taken for; a git that cannot start or is killed
    // is taken at its word, so a plain folder never becomes a repository because git is missing.
    const gitDir = run(root, ['rev-parse', '--git-dir'], timeout);
    if (!gitDir.ok && gitDir.answered) {
        const reason = gitDir.text || NO_REPOSITORY;
        const refused = empty(reason);
        // The root may have gone between the check above and this answer, and then git refused it
        // for being gone rather than for being no repository. The path is read again here, so the
        // two are told apart by what is there when the answer is made.
        refused.present = exists(root);
        // A refusal git itself made, over a root where a `.git` can be seen, and that does not name
        // the root as no repository, is a repository that is there and did not read: a config it
        // cannot parse, a file under `.git` it cannot open. The root keeps `repository`, so a
        // reader is told the read failed rather than that there is no repository here. Every other
        // refusal (no `.git` to be seen, a `.git` naming a gitdir that is gone, a git that could
        // not start) leaves `repository` false.
        const ownRefusal = gitDir.ran && !reason.includes(NO_REPOSITORY);
        refused.repository = ownRefusal && seen(join(root, '.git'));
        return refused;
    }
    const found = empty(null);
    found.repository = true;
    if (!gitDir.ok) {
        found.error = gitDir.text || 'git failed';
        return found;
    }
    if (!checkedOut(root, found, timeout)) return found;
    upstream(root, found, timeout);
    found.log = log(root, timeout);
    found.branches = branches(root, timeout);
    found.worktrees = worktrees(root, timeout);
    found.ignoresWorktrees = ignored(root);
    const rows = porcelain(root, timeout);
    if (rows.rows === null) {
        found.error = rows.reason || 'git status failed';
        return found;
    }
    fill(found, rows.rows, numstat(root, timeout));
    return found;
}

/**
 * The checked-out branch, or false with `error` set when git names none. `--abbrev-ref` says HEAD
 * when nothing is checked out. A repository with no commit yet has a HEAD that resolves to nothing,
 * so the branch it will make is read from HEAD itself: that repository is ordinary, not an error.
 */
function checkedOut(root: string, found: GitState, timeout: number): boolean {
    const head = run(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout);
    if (head.ok) {
        found.branch = head.text.trim();
        found.detached = found.branch === 'HEAD';
        return true;
    }
    const unborn = run(root, ['symbolic-ref', '--short', 'HEAD'], timeout);
    if (unborn.ok) {
        found.branch = unborn.text.trim();
        return true;
    }
    found.error = head.text || 'git named no branch';
    return false;
}

/**
 * The newest commits of the checked-out branch. A repository with no commit yet answers with a
 * failure rather than an empty log, which is an empty list here like every other unreadable list:
 * the branch line above it is what says the repository is there.
 */
function log(root: string, timeout: number): GitCommit[] {
    const done = run(root, ['log', `-${LOG_ENTRIES}`, LOG_FORMAT], timeout);
    return done.ok ? parseLog(done.text) : [];
}

/** Every list this module puts on the channel is cut here: one repository is never the payload. */
export function capped<Row>(rows: Row[]): Row[] {
    return rows.slice(0, MAX_ENTRIES);
}

/** Every branch, with its upstream and which one is checked out, capped like the change lists. */
function branches(root: string, timeout: number): GitBranch[] {
    const done = run(root, ['branch', BRANCH_FORMAT], timeout);
    return done.ok ? capped(parseBranches(done.text)) : [];
}

/**
 * Every worktree of the repository, the checkout itself first. `list` is the one form run here.
 *
 * git answers with real paths, and a root reached through a symbolic link is therefore named
 * differently there than it is everywhere else in oculus, where the root is the key the channel and
 * the file browser use. Each path under the real root is put back under the root as asked for, so
 * one vocabulary reaches the page and the checks a write makes.
 */
function worktrees(root: string, timeout: number): GitWorktree[] {
    const done = run(root, ['worktree', 'list', '--porcelain'], timeout);
    if (!done.ok) return [];
    const real = realpath(root);
    return capped(parseWorktrees(done.text)).map((one) => ({
        ...one,
        path: under(one.path, real, root)
    }));
}

/** The path with `real` swapped back for `root`, and the path itself when it is somewhere else. */
function under(path: string, real: string, root: string): string {
    if (real === root) return path;
    if (path === real) return root;
    return path.startsWith(real + sep) ? root + path.slice(real.length) : path;
}

/** The root with every symbolic link resolved, or the root itself when it cannot be resolved. */
function realpath(root: string): string {
    try {
        return realpathSync(root);
    } catch {
        return root;
    }
}

/**
 * Whether the repository keeps its worktrees folder out of its own history. A repository with no
 * .gitignore, or one that cannot be read, does not, which is what the view warns about.
 */
function ignored(root: string): boolean {
    try {
        return ignoresWorktrees(readFileSync(join(root, '.gitignore'), 'utf8'));
    } catch {
        return false;
    }
}

/**
 * Distance from the tracking branch. `--left-right --count` prints behind, then ahead. A branch
 * with no upstream is ordinary, not an error, and leaves both counts at zero.
 */
function upstream(root: string, found: GitState, timeout: number): void {
    const done = run(root, ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'], timeout);
    // The command git answers here is the one that knows: it resolves @{upstream}, so a failure is
    // the branch having none. That fact travels with the state, which is on the page before the
    // branch listing is, so the push control never has to read a listing that has not answered as
    // "no upstream".
    found.upstream = done.ok;
    if (!done.ok) return;
    const parts = done.text.split(/\s+/).filter((part) => part !== '');
    if (parts.length !== 2) return;
    found.behind = whole(parts[0]);
    found.ahead = whole(parts[1]);
}

function fill(found: GitState, rows: Row[], counts: Counts): void {
    for (const [index, work, path] of rows) {
        if (index === UNTRACKED || work === UNTRACKED) {
            found.untracked.push(entry(path, UNTRACKED, undefined));
            continue;
        }
        if (!QUIET.includes(index)) {
            // Line counts come from the worktree diff, which says nothing about the index, so a
            // file in the index reports its letter and no numbers rather than the wrong ones.
            found.staged.push(entry(path, index, undefined));
        }
        if (!QUIET.includes(work)) found.unstaged.push(entry(path, work, counts.get(path)));
    }
    found.staged.length = Math.min(found.staged.length, MAX_ENTRIES);
    found.unstaged.length = Math.min(found.unstaged.length, MAX_ENTRIES);
    found.untracked.length = Math.min(found.untracked.length, MAX_ENTRIES);
}

function entry(
    path: string,
    status: string,
    counts: [number | null, number | null] | undefined
): GitEntry {
    return {
        path,
        status,
        added: counts === undefined ? 0 : counts[0],
        deleted: counts === undefined ? 0 : counts[1]
    };
}

// ---------------------------------------------------------------- git output

/**
 * The porcelain rows, or null with a reason. `-z` output is NUL separated and never quoted, and a
 * rename carries its old path as a whole extra field.
 */
function porcelain(root: string, timeout: number): { rows: Row[] | null; reason: string } {
    const done = run(root, ['status', '--porcelain=v1', '-z', '--untracked-files=normal'], timeout);
    if (!done.ok) return { rows: null, reason: done.text };
    const fields = done.text.split('\0');
    const rows: Row[] = [];
    let i = 0;
    while (i < fields.length) {
        const field = fields[i];
        i += 1;
        if (field.length < 4) continue;
        const index = field[0];
        const work = field[1];
        // Skip the old path; the new one is what the view shows.
        if (TWO_PATHS.includes(index)) i += 1;
        rows.push([index, work, field.slice(3)]);
    }
    return { rows, reason: '' };
}

/**
 * path to (added, deleted) for the worktree. A binary file reports `-` and becomes null. In `-z`
 * output a rename ends its record after the tab and puts both paths in their own fields.
 */
function numstat(root: string, timeout: number): Counts {
    const out: Counts = new Map();
    const done = run(root, ['diff', '--numstat', '-z'], timeout);
    if (!done.ok) return out;
    const fields = done.text.split('\0');
    let i = 0;
    while (i < fields.length) {
        const field = fields[i];
        i += 1;
        const parts = field.split('\t');
        if (parts.length < 3) continue;
        let path = parts[2];
        if (path === '') {
            if (i + 1 >= fields.length) break;
            // The old path, then the new one.
            path = fields[i + 1];
            i += 2;
        }
        out.set(path, [count(parts[0]), count(parts[1])]);
    }
    return out;
}

/**
 * One git command, as a list, with a timeout. A non-zero exit, a broken git, or a repository too
 * slow to answer all come back as not ok with a short reason, and only the non-zero exit as
 * answered. This is the module's one call site.
 */
function run(root: string, args: string[], timeout: number, input?: string): Outcome {
    // Every read runs without optional locks, so a status refresh never writes .git/index.lock and
    // never collides with a commit the owner is making in the same repository.
    const argv = ['-C', root, '--no-optional-locks', ...args];
    // A list, never a shell, and a timeout: a hung git must not hang a watcher.
    const done = spawnSync(GIT, argv, { encoding: 'utf8', timeout, input });
    if (done.error !== undefined) {
        const failure = done.error as NodeJS.ErrnoException;
        const text = failure.code === 'ETIMEDOUT' ? 'git timed out' : short(failure);
        return { ok: false, answered: failure.code !== 'ETIMEDOUT', ran: false, text };
    }
    if (done.status !== 0) {
        return { ok: false, answered: true, ran: true, text: short(done.stderr) || 'git failed' };
    }
    return {
        ok: true,
        answered: true,
        ran: true,
        text: typeof done.stdout === 'string' ? done.stdout : ''
    };
}

// ---------------------------------------------------------------- small stuff

/**
 * Whether a name can be seen at the path. Unlike exists(), a read that could not tell (a parent
 * nothing may enter) answers false: this is asked where a name has to be shown to be there, not
 * where a root has to be shown to be gone.
 */
function seen(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch {
        return false;
    }
}

function directory(root: string): boolean {
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
function exists(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch (error) {
        const code = (error as NodeJS.ErrnoException | null)?.code ?? '';
        return !['ENOENT', 'ENOTDIR', 'ENAMETOOLONG'].includes(code);
    }
}

/** A timeout that is not a positive number falls back to the default rather than failing a root. */
function milliseconds(timeout: unknown): number {
    const value = Number(timeout);
    if (!Number.isFinite(value) || value <= 0) return TIMEOUT_MS;
    return value;
}

function whole(token: string): number {
    const value = Number.parseInt(token, 10);
    return Number.isInteger(value) ? value : 0;
}

function count(token: string): number | null {
    return token === '-' ? null : whole(token);
}

/** A one-line reason fit for a tooltip. git's own `fatal: ` prefix says nothing worth the width. */
function short(value: unknown): string {
    const text = value instanceof Error ? value.message : scalar(value);
    const lines = text.trim().split('\n');
    let line = lines.length > 0 ? lines[0].trim() : '';
    if (line.toLowerCase().startsWith('fatal: ')) line = line.slice(7);
    return line.slice(0, 120);
}
