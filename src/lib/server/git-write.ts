// Layer 2, server. The writing half of git, kept apart from server/git.ts on purpose.
//
// DESIGN.md, "Git": the read-only module runs exactly four commands and a test asserts that its
// source names no writing subcommand at all. Every write therefore lives here, and this module's own
// gate is the opposite one: tests/server/git-write.test.ts enumerates the subcommands it may run,
// asserts each appears at exactly one call site, and watches every argument vector the suite ran.
//
//     git -C <root> add -- <paths>
//     git -C <root> restore [--staged] -- <paths>
//     git -C <root> commit -F <file>
//     git -C <root> push
//     git -C <root> branch --format=...
//     git -C <root> switch [-c] <name>
//     git -C <root> check-ref-format --branch <name>
//     git -C <root> status --porcelain=v1 -z
//     git -C <root> diff --cached
//     git -C <root> rev-parse --abbrev-ref @{upstream}
//
// Nothing here is reachable from a watcher, a timer or the socket. The one caller is server/
// git-routes.ts, which answers POST /api/git only for a request carrying the write token, coming
// from this application's own page, and (for the five destructive actions) carrying the confirm the
// page sets from a dialog. DESIGN.md's decision of 2026-09-10 on git writes is that shape: commit,
// push and branches on the sessions' workspaces, every write behind the token and a confirm.
//
// `git.ts`'s `run` is not imported: putting a writing subcommand through the read-only module's one
// call site would run it past that module's recorder and break the gate that says what it ran.
//
// A root is refused unless the last published `git` payload names it (a workspace the sessions views
// are showing) or it is the hub itself or under it. A path is refused unless it is relative and
// stays inside the repository. Every operation answers `{ ok, output, error }` and never throws.

import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { defaultMirrorsDir } from './deposit-git.ts';
import { GIT } from './git.ts';
import { target } from './writes.ts';

/** Milliseconds one git command is given, for everything that stays on this machine. */
export const TIMEOUT_MS = 10000;

/** A push crosses the network, so it is given a minute rather than ten seconds. */
export const PUSH_TIMEOUT_MS = 60000;

/** How much output one command may produce. A staged diff is the big one. */
export const MAX_OUTPUT = 8 * 1024 * 1024;

/** What every operation answers. `ok` false always carries a reason in `error`. */
export type Outcome = { ok: boolean; output: string; error: string };

/** One row of `git branch --format`, as the branch menu draws it. */
export type Branch = { name: string; upstream: string; current: boolean };

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
 */
export function allowedRoots(workspaces: string[] = [], hub?: string): string[] {
    const roots = new Set(workspaces);
    if (hub !== undefined) roots.add(hub);
    else {
        try {
            roots.add(target().hub);
        } catch {
            // A machine whose local.yml cannot be read still permits the roots the caller supplied.
        }
    }
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

function checkPaths(root: string, paths: string[], roots: string[]): string {
    if (!permitted(root, roots)) return 'that directory is not a workspace oculus knows';
    if (!Array.isArray(paths) || paths.length === 0) return 'no path was given';
    for (const path of paths) {
        if (!insideRepo(root, path)) return `the path ${String(path)} is not inside the workspace`;
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
    return run(
        root,
        ['branch', '--format=%(refname:short)%09%(upstream:short)%09%(HEAD)'],
        TIMEOUT_MS
    );
}

/** The rows of `branches`, as the menu reads them. */
export function parseBranches(output: string): Branch[] {
    const rows: Branch[] = [];
    for (const line of output.split('\n')) {
        if (line.trim() === '') continue;
        const [name, up, head] = line.split('\t');
        if (name === undefined || name === '') continue;
        rows.push({ name, upstream: up ?? '', current: (head ?? '').trim() === '*' });
    }
    return rows;
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
    return run(root, ['diff', '--cached'], TIMEOUT_MS);
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

/** The one `rev-parse` call site: whether the current branch has somewhere to push to. */
function upstream(root: string): Promise<Outcome> {
    return run(root, ['rev-parse', '--abbrev-ref', '@{upstream}'], TIMEOUT_MS);
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
        if (code[0] === 'R' || code[0] === 'C') at += 1;
        if (code === '??') loose.add(record.slice(3));
    }
    return loose;
}

function short(value: unknown): string {
    const text = value instanceof Error ? value.message : String(value ?? '');
    const lines = text.trim().split('\n');
    let line = lines.length > 0 ? lines[0].trim() : '';
    if (line.toLowerCase().startsWith('fatal: ')) line = line.slice(7);
    return line.slice(0, 200);
}
