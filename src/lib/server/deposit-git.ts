// Layer 2, server. The git and `gh` calls of the deposit, kept apart from server/git-write.ts.
//
// DESIGN.md's decision on git writes and the deposit: a project's `code/` is ordinary
// tracked content of the hub and never carries a `.git` of its own, and the deposit lives outside
// the hub tree as one mirror clone per deposit repo under the machine-local state folder. Every
// command here therefore runs in a directory under that mirrors folder and nowhere else, which is
// the first refusal of `run` and is checked again by every operation's caller.
//
//     git -C <mirror> clone|init|symbolic-ref|remote|add|ls-files|status|commit|push|branch|switch
//     git -C <mirror> rev-parse|log|check-ref-format|diff|rm
//     gh repo view <name> --json url,defaultBranchRef
//     gh repo create <name> --public|--private --source <mirror> --remote origin --push
//     gh repo edit <owner/repo> --description ... --homepage ... --add-topic ...
//     gh repo edit <owner/repo> --default-branch main
//
// This module exists rather than growing git-write.ts because git-write.ts's gate
// (tests/server/git-write.test.ts) asserts that the force option appears nowhere in that file, and
// the snapshot mode of DESIGN.md's step 6 needs it exactly once. Here it appears at one call site,
// `forcePushSnapshot`, and tests/server/deposit.test.ts asserts that count.
//
// Every operation answers `{ ok, output, error }` and never throws. Nothing here is reachable from
// a watcher, a timer or the socket: the one caller is server/deposit.ts, itself reached only from
// POST /api/deposit with the write token and the page's confirm.

import { scalar } from '../data/guards.ts';
import { execFile } from 'node:child_process';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { GIT } from './git.ts';

/** Milliseconds one command that stays on this machine is given. */
export const TIMEOUT_MS = 10000;

/** A clone, a push and every `gh` call cross the network, so they are given two minutes. */
export const NETWORK_TIMEOUT_MS = 120000;

/** How much output one command may produce. */
export const MAX_OUTPUT = 8 * 1024 * 1024;

/** The `gh` executable, named once so a test can see what would be run. */
export const GH = 'gh';

/** What every operation answers. `ok` false always carries a reason in `error`. */
export type Outcome = { ok: boolean; output: string; error: string };

/** One row of `git branch --format`, as the branch menu draws it. */
export type Branch = { name: string; upstream: string; current: boolean };

/**
 * Where a command runs: the directory git is pointed at, the mirrors root it must stay under, and
 * how git itself is run. server/deposit.ts puts its own runner here so a test can fail one command
 * without a repository in that state; without one the real git below is used.
 */
export type Where = { dir: string; mirrors: string; git?: GitRunner };

/** How `gh` is run. server/deposit.ts takes it as an option so a test never runs the real one. */
export type GhRun = (args: string[], timeout: number) => Promise<Outcome>;

/** How git is run: one argument vector, the `-C` of the mirror already at its head. */
export type GitRunner = (args: string[], timeout: number) => Promise<Outcome>;

/** Every git subcommand this module may run. tests/server/deposit.test.ts asserts no other ran. */
export const SUBCOMMANDS = [
    'add',
    'branch',
    'check-ref-format',
    'clone',
    'commit',
    'diff',
    'init',
    'log',
    'ls-files',
    'push',
    'remote',
    'rev-parse',
    'rm',
    'status',
    'switch',
    'symbolic-ref'
];

function failed(error: string): Outcome {
    return { ok: false, output: '', error };
}

/** ~/.oculus/deposits, resolved at the call rather than at import, as sessions/overrides.ts does. */
export function defaultMirrorsDir(): string {
    return join(homedir(), '.oculus', 'deposits');
}

/** Whether a directory is the mirrors folder itself or one under it. Nothing else may be run in. */
export function underMirrors(dir: string, mirrors: string): boolean {
    if (typeof dir !== 'string' || dir === '' || !isAbsolute(dir)) return false;
    if (typeof mirrors !== 'string' || mirrors === '' || !isAbsolute(mirrors)) return false;
    const full = resolve(dir);
    const base = resolve(mirrors);
    return full === base || full.startsWith(base + sep);
}

/** The real git, private to this module so the refusal below is the only way to it. */
function git(args: string[], timeout: number): Promise<Outcome> {
    return execute(GIT, args, timeout);
}

/**
 * One git command, as a list, with a timeout. The refusal is the module's one gate, and it has
 * already run by the time a runner is reached, so no runner is ever given a directory outside the
 * mirrors folder. `Where` carries the runner: the real git, or the one a caller passed instead.
 */
function run(at: Where, args: string[], timeout: number = TIMEOUT_MS): Promise<Outcome> {
    if (!underMirrors(at.dir, at.mirrors)) {
        return Promise.resolve(failed('that directory is not a deposit mirror'));
    }
    const argv = ['-C', at.dir, ...args];
    return (at.git ?? git)(argv, timeout);
}

/**
 * The real `gh`. server/deposit.ts reaches it through its `gh` option, which a test replaces, so
 * nothing in the suite ever talks to GitHub. The create shape names the mirror in `--source`, so no
 * call here needs a working directory of its own.
 */
export function gh(args: string[], timeout: number = NETWORK_TIMEOUT_MS): Promise<Outcome> {
    return execute(GH, args, timeout);
}

function execute(command: string, argv: string[], timeout: number): Promise<Outcome> {
    return new Promise((settle) => {
        // A list, never a shell. A path, a branch name or a topic from the page is an argument and
        // can therefore never be read as syntax.
        execFile(
            command,
            argv,
            { encoding: 'utf8', timeout, maxBuffer: MAX_OUTPUT },
            (error, stdout, stderr) => {
                if (error !== null) {
                    const failure = error as NodeJS.ErrnoException;
                    const reason =
                        failure.code === 'ETIMEDOUT'
                            ? `${command} timed out`
                            : short(stderr) || short(failure.message) || `${command} failed`;
                    settle(failed(reason));
                    return;
                }
                settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
            }
        );
    });
}

// ---------------------------------------------------------------- the git operations

/** Clone a deposit repo into the mirrors folder under `name`. `at.dir` is the mirrors folder. */
export function cloneInto(at: Where, url: string, name: string): Promise<Outcome> {
    return run(at, ['clone', '--', url, name], NETWORK_TIMEOUT_MS);
}

/** Make an empty mirror. `setHeadMain` follows it, so both paths publish `main`. */
export function initMirror(at: Where): Promise<Outcome> {
    return run(at, ['init', '-q']);
}

/**
 * The one `symbolic-ref` call site: pointing HEAD at `main` in a new mirror, and reading the branch
 * name back in a mirror that has no commit yet, which `rev-parse` cannot answer.
 */
export function symbolicRef(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['symbolic-ref', ...args]);
}

/** Point HEAD at `main` in a mirror with no commits yet. */
export function setHeadMain(at: Where): Promise<Outcome> {
    return symbolicRef(at, ['HEAD', 'refs/heads/main']);
}

/** Stage everything the mirror's own `.gitignore` does not exclude. */
export function addAll(at: Where): Promise<Outcome> {
    return run(at, ['add', '-A']);
}

/** What the mirror would ship: the staged tree, one path per line. */
export function lsFiles(at: Where): Promise<Outcome> {
    return run(at, ['ls-files']);
}

/** What changed against the mirror's last commit, in git's own letters. */
export function porcelain(at: Where): Promise<Outcome> {
    return run(at, ['status', '--porcelain=v1']);
}

/** Commit what is staged, the message through a file as git-write.ts's commit does. */
export function commitFile(at: Where, file: string): Promise<Outcome> {
    return run(at, ['commit', '-F', file]);
}

/** The one `remote` call site: reading origin's URL and adding it. */
export function remoteCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['remote', ...args]);
}

/** The one `branch` call site: the list, the move and the delete. */
export function branchCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['branch', ...args]);
}

/** The one `switch` call site: an existing branch, a new one, and the orphan of the snapshot. */
export function switchCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['switch', ...args]);
}

/** The one `rev-parse` call site: the current branch and whether it has an upstream. */
export function revParse(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['rev-parse', ...args]);
}

/** The one `log` call site: the commits the mirror is ahead of its upstream by. */
export function logCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['log', ...args]);
}

/** git's own answer on whether a name is a branch name. */
export function checkRefFormat(at: Where, name: string): Promise<Outcome> {
    return run(at, ['check-ref-format', '--branch', name]);
}

/** The one `push` call site, for both the ordinary push and the snapshot below it. */
function pushCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['push', ...args], NETWORK_TIMEOUT_MS);
}

/** Push the mirror's current branch to its upstream. Nothing is forced here. */
export function push(at: Where): Promise<Outcome> {
    return pushCmd(at, []);
}

/**
 * The snapshot of DESIGN.md's step 6, kept as a second button: the orphan commit replaces the
 * remote's `main` outright, so the history that was there is gone. This is the one call in oculus
 * that forces a push, and tests/server/deposit.test.ts asserts the option appears once in this file.
 */
export function forcePushSnapshot(at: Where): Promise<Outcome> {
    return pushCmd(at, ['--force', 'origin', 'HEAD:main']);
}

/** The rows of `branchCmd(['--format=...'])`, as the menu reads them. */
export function parseBranches(output: string): Branch[] {
    const rows: Branch[] = [];
    for (const line of output.split('\n')) {
        if (line.trim() === '') continue;
        const parts = line.split('\t');
        const name = parts.at(0);
        if (name === undefined || name === '') continue;
        rows.push({
            name,
            upstream: parts.at(1) ?? '',
            current: (parts.at(2) ?? '').trim() === '*'
        });
    }
    return rows;
}

// ---------------------------------------------------------------- the `gh` shapes

/** `gh repo view <name> --json url,defaultBranchRef`: whether the repo exists, and where it is. */
export function viewArgs(name: string): string[] {
    return ['repo', 'view', name, '--json', 'url,defaultBranchRef'];
}

/** `gh repo create <name> --public|--private --source <mirror> --remote origin --push`. */
export function createArgs(name: string, visibility: string, mirror: string): string[] {
    return [
        'repo',
        'create',
        name,
        visibility === 'private' ? '--private' : '--public',
        '--source',
        mirror,
        '--remote',
        'origin',
        '--push'
    ];
}

/** `gh repo edit <owner/repo> --description ... --homepage ... --add-topic ...`, topics added. */
export function editArgs(
    slug: string,
    about: { description?: string; homepage?: string; topics?: string[] }
): string[] {
    const args: string[] = [];
    if (about.description !== undefined && about.description !== '') {
        args.push('--description', about.description);
    }
    if (about.homepage !== undefined && about.homepage !== '') {
        args.push('--homepage', about.homepage);
    }
    for (const topic of about.topics ?? []) {
        if (topic !== '') args.push('--add-topic', topic);
    }
    return args.length === 0 ? [] : ['repo', 'edit', slug, ...args];
}

/** `gh repo edit <owner/repo> --default-branch <branch>`: what the repository's landing page is. */
export function defaultBranchArgs(slug: string, branch: string): string[] {
    return ['repo', 'edit', slug, '--default-branch', branch];
}

/** OWNER/REPO out of a repo URL. `gh repo edit` rejects a bare name, so the URL is reduced to one. */
export function slugOf(url: string): string {
    const bare = url.replace(/\/+$/, '').replace(/\.git$/, '');
    const at = bare.indexOf('github.com/');
    return at === -1 ? bare : bare.slice(at + 'github.com/'.length);
}

function short(value: unknown): string {
    const text = value instanceof Error ? value.message : scalar(value);
    const lines = text.trim().split('\n');
    let line = lines.length > 0 ? lines[0].trim() : '';
    if (line.toLowerCase().startsWith('fatal: ')) line = line.slice(7);
    return line.slice(0, 200);
}
