// Layer 2, server. Cloning the repository of a project into a folder the reader picked. The folder
// may exist already and hold files, so the clone is not `git clone` (which needs an empty folder)
// but its steps one by one:
//
//     git -C <dir> init -q
//     git -C <dir> remote add origin <url>
//     git -C <dir> ls-remote --symref origin HEAD       (the remote's default branch)
//     git -C <dir> fetch origin
//     git -C <dir> ls-tree -r --name-only -z origin/<branch>   (what the repository tracks)
//     git -C <dir> checkout -t origin/<branch>
//
// A repository that tracks a file the folder already holds is refused after the fetch and before
// the checkout, naming every such file, since the checkout would write over it. Every refusal, and
// a failed command, leaves the folder as it was found: the `.git` made here is removed, and so is
// the folder when this call made it. A refusal for files held carries the files in `held`, which
// is how the page knows to ask for another folder.
//
// The hub's exclude file is not touched here: the block that keeps a repository inside the hub out
// of the hub's git is rewritten from the walk of the hub (exclude.ts).
//
// A command runs through the `GitRunner` the caller gives, so a test drives the steps over scratch
// repositories or a runner of its own; the routes give the real git (clone-git.ts) with the server
// context's credentials. Every operation answers `{ ok, output, error }` and never throws. Nothing
// here is reachable from a watcher or a timer: the callers are server/git/clone/clone-routes.ts,
// behind the write token.

import { existsSync, lstatSync, mkdirSync, rmSync, rmdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GitRunner, Outcome } from '../deposit/deposit-git.ts';
import { words } from '../../core/words.ts';
import { LOCAL_TIMEOUT_MS, REMOTE_TIMEOUT_MS } from './clone-git.ts';

/** What the clone of one project needs to know. */
export type CloneRequest = {
    /** The folder to clone into: made when missing. */
    dir: string;
    /** The address of the remote. */
    url: string;
    text: Record<string, string>;
    /** How git is run: clone-git.ts's `cloneGit` with the server context's credentials. */
    git: GitRunner;
    signal?: AbortSignal;
};

/** What a clone answers: the outcome, and the files the folder holds that the repository tracks. */
export type CloneOutcome = Outcome & { held?: string[] };

function refused(error: string): CloneOutcome {
    return { ok: false, output: '', error };
}

/** The branch a remote's HEAD names, from the output of `ls-remote --symref`, or null for none. */
function defaultBranchOf(output: string): string | null {
    for (const line of output.split('\n')) {
        const found = /^ref: refs\/heads\/(\S+)\s+HEAD$/.exec(line.trim());
        if (found !== null) return found[1];
    }
    return null;
}

/** The files a folder holds among the paths a repository tracks, as the repository names them. */
function held(dir: string, tracked: string[]): string[] {
    return tracked.filter((path) => {
        try {
            lstatSync(join(dir, path));
            return true;
        } catch {
            return false;
        }
    });
}

/** The folders of the path `dir` that do not exist yet, the deepest first. */
function missingFolders(dir: string): string[] {
    const missing: string[] = [];
    for (let at = dir; !existsSync(at); at = dirname(at)) missing.push(at);
    return missing;
}

/** Take away what the clone made: its `.git`, and the folders it made on the way to it. */
function undo(dir: string, made: string[]): void {
    rmSync(join(dir, '.git'), { recursive: true, force: true });
    for (const folder of made) {
        try {
            rmdirSync(folder);
        } catch {
            // A folder that holds something else stays.
        }
    }
}

/**
 * Clone `url` into `dir`, checking out the remote's default branch with a local branch that tracks
 * it. Refused, with nothing left behind, when the folder already holds a `.git`, when the remote
 * does not answer, has no branch, or tracks a file the folder holds.
 */
export async function cloneRepository(request: CloneRequest): Promise<CloneOutcome> {
    const { dir, url, text, signal, git } = request;
    const at = (...args: string[]): string[] => ['-C', dir, ...args];
    if (url.trim() === '') return refused(words(text, 'server.clone.no_url'));
    if (existsSync(join(dir, '.git')))
        return refused(words(text, 'server.clone.already_cloned', dir));
    const made = missingFolders(dir);
    try {
        mkdirSync(dir, { recursive: true });
    } catch {
        return refused(words(text, 'server.clone.made_by_hand', dir));
    }
    const step = async (args: string[], timeout: number): Promise<CloneOutcome | null> => {
        const done = await git(at(...args), timeout, signal);
        if (done.ok) return null;
        undo(dir, made);
        return done;
    };
    let failed = await step(['init', '-q'], LOCAL_TIMEOUT_MS);
    if (failed !== null) return failed;
    failed = await step(['remote', 'add', 'origin', url], LOCAL_TIMEOUT_MS);
    if (failed !== null) return failed;
    const heads = await git(
        at('ls-remote', '--symref', 'origin', 'HEAD'),
        REMOTE_TIMEOUT_MS,
        signal
    );
    if (!heads.ok) {
        undo(dir, made);
        return heads;
    }
    const branch = defaultBranchOf(heads.output);
    if (branch === null) {
        undo(dir, made);
        return refused(words(text, 'server.clone.empty_remote', url));
    }
    failed = await step(['fetch', 'origin'], REMOTE_TIMEOUT_MS);
    if (failed !== null) return failed;
    const tree = await git(
        at('ls-tree', '-r', '--name-only', '-z', `origin/${branch}`),
        LOCAL_TIMEOUT_MS,
        signal
    );
    if (!tree.ok) {
        undo(dir, made);
        return tree;
    }
    const clash = held(
        dir,
        tree.output.split('\0').filter((one) => one !== '')
    );
    if (clash.length > 0) {
        undo(dir, made);
        return {
            ...refused(words(text, 'server.clone.files_held', dir, clash.join(', '))),
            held: clash
        };
    }
    failed = await step(['checkout', '-t', `origin/${branch}`], REMOTE_TIMEOUT_MS);
    if (failed !== null) return failed;
    return { ok: true, output: branch, error: '' };
}
