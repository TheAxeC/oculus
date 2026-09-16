// Layer 2, server. Read-only git state for the workspaces the session views name.
//
// What a session touched comes from its transcript. What the checkout looks like right now only git
// can say, and that is this module: the branch, the distance from its upstream, and the staged,
// changed and untracked lists.
//
// DESIGN.md, "Git": exactly these read-only commands run here and no others, ever.
//
//     git -C <root> rev-parse --abbrev-ref HEAD
//     git -C <root> rev-list --left-right --count @{upstream}...HEAD
//     git -C <root> status --porcelain=v1 -z --untracked-files=normal
//     git -C <root> diff --numstat -z
//     git -C <root> log -<n> --format=...
//     git -C <root> branch --format=...
//     git -C <root> worktree list --porcelain
//
// Nothing here may ever change a repository. Every writing subcommand belongs to Axel alone, and a
// dashboard watcher must never be the thing that runs one. tests/server/git.test.ts holds two gates
// over that: the source names no writing subcommand, and the suite records every argument vector the
// process runs and asserts the whole suite ran only the commands above, `worktree` only as a
// listing.
//
// A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
// (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
// short reason. Data only, no rendered strings: the wording comes from the text catalog.

import { scalar } from '../data/guards.ts';
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import type { GitBranch, GitCommit, GitEntry, GitState, GitWorktree } from '../data/model.ts';
import { ignoresWorktrees } from '../data/worktrees.ts';
import { BRANCH_FORMAT, LOG_FORMAT, parseBranches, parseLog, parseWorktrees } from './git-parse.ts';

export const GIT = 'git';
/** Milliseconds one git command is given before it is given up on. */
export const TIMEOUT_MS = 5000;
/** One workspace with 4000 untracked files, or 4000 branches, must not become the payload. */
export const MAX_ENTRIES = 200;
/** How many commits the log carries: the view is a glance, and a terminal reads a longer history. */
export const LOG_ENTRIES = 20;
/** git's own letter for a path it does not track. */
export const UNTRACKED = '?';
/** An index or worktree column saying "nothing here". */
const QUIET = [' ', UNTRACKED, '!'];
/** A rename or a copy reports its old path as a second field. */
const TWO_PATHS = ['R', 'C'];

/** path to (added, deleted) for the worktree; null where git reported a binary file. */
type Counts = Map<string, [number | null, number | null]>;

/** One row of the porcelain output: the index letter, the worktree letter, and the path. */
type Row = [string, string, string];

type Outcome = { ok: boolean; text: string };

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
        error
    };
}

/**
 * Read-only git state for each root, keyed by root. Never throws. A root that is not a directory,
 * not a repository, or where git fails or times out comes back as the empty shape with `error` set,
 * so a caller renders every workspace without a special case. A repeated root is read once.
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

// ---------------------------------------------------------------- one root

function state(root: string, timeout: number): GitState {
    if (!directory(root)) return empty('no such directory');
    const head = run(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout);
    if (!head.ok) return empty(head.text || 'not a git repository');
    const found = empty(null);
    const name = head.text.trim();
    found.branch = name;
    // --abbrev-ref says HEAD when nothing is checked out.
    found.detached = name === 'HEAD';
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
 * Distance from the tracking branch. `--left-right --count` prints behind, then ahead. A branch with
 * no upstream is ordinary, not an error, and leaves both counts at zero.
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
 * slow to answer all come back as not ok with a short reason. This is the module's one call site.
 */
function run(root: string, args: string[], timeout: number): Outcome {
    // Every read runs without optional locks, so a status refresh never writes .git/index.lock and
    // never collides with a commit the owner is making in the same repository.
    const argv = ['-C', root, '--no-optional-locks', ...args];
    // A list, never a shell, and a timeout: a hung git must not hang a watcher.
    const done = spawnSync(GIT, argv, { encoding: 'utf8', timeout });
    if (done.error !== undefined) {
        const failure = done.error as NodeJS.ErrnoException;
        return { ok: false, text: failure.code === 'ETIMEDOUT' ? 'git timed out' : short(failure) };
    }
    if (done.status !== 0) return { ok: false, text: short(done.stderr) || 'git failed' };
    return { ok: true, text: typeof done.stdout === 'string' ? done.stdout : '' };
}

// ---------------------------------------------------------------- small stuff

function directory(root: string): boolean {
    try {
        return statSync(root).isDirectory();
    } catch {
        return false;
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
