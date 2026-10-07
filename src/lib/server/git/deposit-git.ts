// Layer 2, server. The git and `gh` calls of the deposit, kept apart from server/git/git-write.ts.
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
// This module exists rather than growing git-write.ts because the force option appears nowhere in
// that file, and the snapshot mode of the deposit needs it exactly once (DESIGN.md, "Git",
// "Fixed git choices": the one forced push in oculus). Here it appears at one call site,
// `forcePushSnapshot`.
//
// A command that runs the mirror's hooks (the commit, the switch and the push) has no time limit,
// and every command takes the signal `Where` carries, which ends it when Cancel aborts the run.
//
// Every operation answers `{ ok, output, error }` and never throws. Nothing here is reachable from
// a watcher, a timer or the socket: the one caller is server/git/deposit.ts, itself reached only
// from POST /api/deposit with the write token and the page's confirm.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`).

import { execFile } from 'node:child_process';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { endWith } from '../core/git/running.ts';
import { GIT } from '../core/git/run.ts';
import { inside } from '../core/paths.ts';
import { words } from '../core/words.ts';
import {
    NO_TIME_LIMIT,
    classifyFailure,
    parseBranches,
    type CommandFailure
} from '../core/git/parse.ts';

export { parseBranches };

/** Milliseconds one command that stays on this machine is given. */
export const TIMEOUT_MS = 10000;
/** How many characters of a failed command's reason the page is given. */
const REASON_WIDTH = 200;

/** A clone and every `gh` call cross the network, so they are given two minutes. */
export const NETWORK_TIMEOUT_MS = 120000;

/** How much output one command may produce. */
export const MAX_OUTPUT = 8 * 1024 * 1024;

/** The `gh` executable, named once so a test can see what would be run. */
export const GH = 'gh';

/**
 * What every operation answers. `ok` false always carries a reason in `error`; a command that gave
 * none of git's own (cancelled, out of time, out of room, ended by a signal, an exit status with
 * nothing written) carries it as `failure`, which the route words from the catalog.
 */
export type Outcome = { ok: boolean; output: string; error: string; failure?: CommandFailure };

/** One row of `git branch --format`, as the branch menu draws it. */
export type Branch = { name: string; upstream: string; current: boolean };

/**
 * Where a command runs: the directory git is pointed at, the mirrors root it must stay under, the
 * text catalog its refusal is worded from, how git itself is run, and the signal that ends a run
 * when Cancel aborts it. server/git/deposit.ts puts its own runner here so a test can fail one
 * command without a repository in that state; without one the real git below is used.
 */
export type Where = {
    dir: string;
    mirrors: string;
    /** The text catalog the refusal of a directory outside the mirrors folder is worded from. */
    text: Record<string, string>;
    git?: GitRunner;
    signal?: AbortSignal;
};

/**
 * How `gh` is run. server/git/deposit.ts takes it as an option so a test never runs the real one.
 */
export type GhRun = (args: string[], timeout: number, signal?: AbortSignal) => Promise<Outcome>;

/** How git is run: one argument vector, the `-C` of the mirror already at its head. */
export type GitRunner = (args: string[], timeout: number, signal?: AbortSignal) => Promise<Outcome>;

/**
 * Every git subcommand this module may run.
 */
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

/**
 * ~/.oculus/deposits, resolved at the call rather than at import, as sessions/overrides.ts does.
 */
export function defaultMirrorsDir(): string {
    return join(homedir(), '.oculus', 'deposits');
}

/** Whether a directory is the mirrors folder itself or one under it. Nothing else may be run in. */
export function underMirrors(dir: string, mirrors: string): boolean {
    if (typeof dir !== 'string' || dir === '' || !isAbsolute(dir)) return false;
    if (typeof mirrors !== 'string' || mirrors === '' || !isAbsolute(mirrors)) return false;
    return inside(dir, mirrors);
}

/** The real git, private to this module so the refusal below is the only way to it. */
function git(args: string[], timeout: number, signal?: AbortSignal): Promise<Outcome> {
    return execute(GIT, args, timeout, signal);
}

/**
 * One git command, as a list, with a timeout. The refusal is the module's one gate, and it has
 * already run by the time a runner is reached, so no runner is ever given a directory outside the
 * mirrors folder. `Where` carries the runner: the real git, or the one a caller passed instead.
 */
function run(at: Where, args: string[], timeout: number = TIMEOUT_MS): Promise<Outcome> {
    if (!underMirrors(at.dir, at.mirrors)) {
        return Promise.resolve(failed(words(at.text, 'server.deposit.not_a_mirror')));
    }
    const argv = ['-C', at.dir, ...args];
    return (at.git ?? git)(argv, timeout, at.signal);
}

/**
 * The real `gh`. server/git/deposit.ts reaches it through its `gh` option, which a test replaces,
 * so nothing in the suite ever talks to GitHub. The create shape names the mirror in `--source`, so
 * no call here needs a working directory of its own.
 */
export function gh(
    args: string[],
    timeout: number = NETWORK_TIMEOUT_MS,
    signal?: AbortSignal
): Promise<Outcome> {
    return execute(GH, args, timeout, signal);
}

/**
 * One command, as a list. A failure says the program's own reason, as `classifyFailure`
 * (server/core/git/parse.ts) reads it from the error stream or the output stream; a command that
 * gave none is answered with its code and the program that ran.
 */
function execute(
    command: string,
    argv: string[],
    timeout: number,
    signal?: AbortSignal
): Promise<Outcome> {
    return new Promise((settle) => {
        // A list, never a shell. A path, a branch name or a topic from the page is an argument and
        // can therefore never be read as syntax.
        const child = execFile(
            command,
            argv,
            {
                encoding: 'utf8',
                timeout,
                maxBuffer: MAX_OUTPUT
            },
            (error, stdout, stderr) => {
                if (error !== null) {
                    const said = classifyFailure(
                        ended(error),
                        stdout,
                        stderr,
                        { timeoutMs: timeout, maxBytes: MAX_OUTPUT },
                        REASON_WIDTH,
                        command
                    );
                    settle(
                        said.failure === undefined
                            ? failed(said.reason)
                            : { ...failed(said.reason), failure: said.failure }
                    );
                    return;
                }
                settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
            }
        );
        const ended = endWith(child, signal);
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

/**
 * What changed against the mirror's last commit, in git's own letters, NUL separated and never
 * quoted, for core/git/parse.ts's statusRecords to read.
 */
export function porcelain(at: Where): Promise<Outcome> {
    return run(at, ['status', '--porcelain=v1', '-z']);
}

/**
 * Commit what is staged, the message through a file as git-write.ts's commit does. The mirror's
 * commit hooks run, so it has no time limit.
 */
export function commitFile(at: Where, file: string): Promise<Outcome> {
    return run(at, ['commit', '-F', file], NO_TIME_LIMIT);
}

/** The one `remote` call site: reading origin's URL and adding it. */
export function remoteCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['remote', ...args]);
}

/** The one `branch` call site: the list, the move and the delete. */
export function branchCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['branch', ...args]);
}

/**
 * The one `switch` call site: an existing branch, a new one, and the orphan of the snapshot. The
 * mirror's post-checkout hook runs, so it has no time limit.
 */
export function switchCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['switch', ...args], NO_TIME_LIMIT);
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

/**
 * The one `push` call site, for both the ordinary push and the snapshot below it. The mirror's
 * pre-push hook runs, so it has no time limit.
 */
function pushCmd(at: Where, args: string[]): Promise<Outcome> {
    return run(at, ['push', ...args], NO_TIME_LIMIT);
}

/** Push the mirror's current branch to its upstream. Nothing is forced here. */
export function push(at: Where): Promise<Outcome> {
    return pushCmd(at, []);
}

/**
 * The snapshot of the deposit (DESIGN.md, "Fixed git choices"), kept as a second button: the
 * orphan commit replaces the remote's `main` outright, so the history that was there is gone. This
 * is the one call in oculus that forces a push.
 */
export function forcePushSnapshot(at: Where): Promise<Outcome> {
    return pushCmd(at, ['--force', 'origin', 'HEAD:main']);
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

/**
 * OWNER/REPO out of a repo URL. `gh repo edit` rejects a bare name, so the URL is reduced to one.
 */
export function slugOf(url: string): string {
    const bare = url.replace(/\/+$/, '').replace(/\.git$/, '');
    const at = bare.indexOf('github.com/');
    return at === -1 ? bare : bare.slice(at + 'github.com/'.length);
}
