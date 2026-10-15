// Layer 2, server. Read-only git state for a root: whether it is a repository, its branch, its
// distance from the upstream, and the staged, changed and untracked lists, with the log, the refs,
// the stashes, the worktrees and the sequencer the `git` channel carries. Every command goes
// through run.ts; this file only decides which to ask and how to read the answers.
//
// A state read asks git for about a dozen commands one after another, each awaited, so the event
// loop serves requests between them and one read runs one git process at a time. A repository on a
// slow mount must not stall a watcher: a read that fails is collapsed into the empty shape with a
// short reason, and nothing here rejects. `readState` also says whether every command of the read
// finished within its time limit, since a state read from a git that ran out of time is a state
// nobody saw, which the git watcher reads again.

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, sep } from 'node:path';
import type {
    GitCommit,
    GitEntry,
    GitSequence,
    GitStash,
    GitState,
    GitWorktree
} from '../../../data/model/index.ts';
import { ignoresWorktrees } from '../../../data/helpers/worktrees.ts';
import {
    LOG_FORMAT,
    STASH_FORMAT,
    REFS_FORMAT,
    parseLog,
    parseNumstat,
    parseStashes,
    parseRefs,
    parseWorktrees,
    statusCollector,
    type RefRows
} from './parse.ts';
import type { RecordVisit } from './records.ts';
import {
    NO_REPOSITORY,
    TIMEOUT_MS,
    directory,
    exists,
    milliseconds,
    reasonOf,
    run,
    runRecords,
    seen,
    short,
    whole,
    type Outcome
} from './run.ts';
import { words } from '../words.ts';

/** One workspace with 4000 untracked files, or 4000 branches, must not become the payload. */
export const MAX_ENTRIES = 200;
/**
 * How many commits the log carries: the view is a glance, and a terminal reads a longer history.
 */
export const LOG_ENTRIES = 20;

/** One root's state, and whether every git command of its read finished within its time limit. */
export type StateRead = { state: GitState; finished: boolean };

/** A command run in a root under a time limit. */
type Run = (args: string[]) => Promise<Outcome>;

/**
 * One read's git: a command run in the read's root under the read's time limit, and `records`, a
 * status read whose records are handed to a visitor as git writes them.
 */
type Git = Run & {
    records: (args: string[], visit: RecordVisit) => Promise<Outcome>;
};

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
        conflicted: [],
        held: { staged: 0, changes: 0, untracked: 0, merge: 0 },
        untrackedByFolder: [],
        sequence: '',
        mergeMessage: '',
        remotes: [],
        stashes: [],
        tags: [],
        log: [],
        branches: [],
        worktrees: [],
        ignoresWorktrees: false,
        top: '',
        // The watcher marks the roots of the workspace when it publishes; a read alone says nothing
        // of that.
        inWorkspace: false,
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
 * Read-only git state for one root, and whether every git command of the read finished within its
 * time limit. A command whose limit ran out is the one that did not: its answer was never seen, so
 * the state stands only until a read that finishes. Never rejects, and `text` is the catalog a
 * failure with no reason of git's own is worded from. A root with nothing at its path, or that git
 * answered is not a repository, comes back as the empty shape with `error` set and `repository`
 * false; `present` is false for the first of those two alone, read at the path each time the
 * answer is made, so a caller can say the folder is not there rather than that it is no
 * repository. A root whose check did not answer (a timeout, a git that would not start), a root git
 * refused for a reason other than holding no repository, and a repository where a later read fails
 * all keep `repository` true and say why in `error`, so neither a slow mount nor an unreadable
 * config makes a repository disappear. A caller renders every workspace without a special case.
 */
export async function readState(
    root: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<StateRead> {
    const ms = milliseconds(timeout);
    let finished = true;
    const seenBy = (done: Outcome): Outcome => {
        if (!done.answered) finished = false;
        return done;
    };
    const git: Git = Object.assign(async (args: string[]) => seenBy(await run(root, args, ms)), {
        records: async (args: string[], visit: RecordVisit) =>
            seenBy(await runRecords(root, args, ms, visit))
    });
    try {
        const found = await state(root, text, git);
        return { state: found, finished };
    } catch (error) {
        return { state: empty(short(error)), finished };
    }
}

// ---------------------------------------------------------------- one root

async function state(root: string, text: Record<string, string>, git: Git): Promise<GitState> {
    // A path with nothing at it is the one root git is never asked about. A path that is there and
    // is no directory, and one nothing may enter, are handed to git like any other, so the reader
    // gets git's own reason for them instead of being told the folder is gone.
    if (!directory(root) && !exists(root)) {
        const gone = empty(words(text, 'server.git.no_directory'));
        gone.present = false;
        return gone;
    }
    // The one read that tells a repository from a folder: it names no commit, so a repository with
    // none yet answers it like any other. Only a check that timed out says nothing about the root,
    // which is then kept as the repository it was taken for; a git that cannot start or is killed
    // is taken at its word, so a plain folder never becomes a repository because git is missing.
    const gitDir = await git(['rev-parse', '--git-dir']);
    if (!gitDir.ok && gitDir.answered) {
        const reason = reasonOf(gitDir, text);
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
        const ownRefusal = gitDir.ran && !gitDir.text.includes(NO_REPOSITORY);
        refused.repository = ownRefusal && seen(join(root, '.git'));
        return refused;
    }
    const found = empty(null);
    found.repository = true;
    if (!gitDir.ok) {
        found.error = reasonOf(gitDir, text);
        return found;
    }
    // The folder that holds the repository, in git's own spelling. A bare repository and a git that
    // would not answer have none, and the root is then a repository of its own.
    const top = await git(['rev-parse', '--show-toplevel']);
    found.top = top.ok ? top.text.trim() : '';
    if (!(await checkedOut(found, text, git))) return found;
    await upstream(found, git);
    found.log = await log(git);
    const listed = await refs(git);
    found.branches = listed.branches;
    found.tags = listed.tags;
    // The reflog is walked only where a stash is kept, and the remotes are read only where Publish
    // Branch can be offered, a branch that tracks nothing; either read is a process per root on
    // every event, which the repositories that have no use for it do not pay.
    found.stashes = listed.stash ? await stashes(git) : [];
    found.remotes = found.upstream || found.detached ? [] : await remotes(git);
    found.worktrees = await worktreesOf(root, git);
    found.ignoresWorktrees = ignored(root);
    sequenceOf(root, gitDir.text.trim(), found);
    // Every untracked file is listed on its own line, as VS Code's status read lists them, so a new
    // folder's files are rows of their own; a nested repository is listed as its folder alone. The
    // records are taken as git writes them, each list keeping its first MAX_ENTRIES and counting
    // the rest, so no number of untracked files makes the read fail; the line counts are read
    // first, since an entry is made with its counts.
    const counts = await git(['diff', '--numstat', '-z']);
    const lists = statusCollector(parseNumstat(counts.ok ? counts.text : ''), MAX_ENTRIES);
    const listing = await git.records(
        ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--renames'],
        lists.add
    );
    if (!listing.ok) {
        found.error = reasonOf(listing, text);
        return found;
    }
    Object.assign(found, lists.lists());
    if (found.held.untracked > found.untracked.length)
        found.untrackedByFolder = await byFolder(git);
    return found;
}

/**
 * The untracked paths folder by folder, read when the untracked list was cut: a folder holding
 * only untracked files is one entry, so the Explorer marks every file under it, the files the cut
 * list leaves out included. A read that fails gives none.
 */
async function byFolder(git: Git): Promise<GitEntry[]> {
    const lists = statusCollector(new Map(), MAX_ENTRIES);
    const done = await git.records(
        ['status', '--porcelain=v1', '-z', '--untracked-files=normal'],
        lists.add
    );
    return done.ok ? lists.lists().untracked : [];
}

/**
 * The checked-out branch, or false with `error` set when git names none. `--abbrev-ref` says HEAD
 * when nothing is checked out. A repository with no commit yet has a HEAD that resolves to nothing,
 * so the branch it will make is read from HEAD itself: that repository is ordinary, not an error.
 */
async function checkedOut(
    found: GitState,
    text: Record<string, string>,
    git: Git
): Promise<boolean> {
    const head = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (head.ok) {
        found.branch = head.text.trim();
        found.detached = found.branch === 'HEAD';
        return true;
    }
    const unborn = await git(['symbolic-ref', '--short', 'HEAD']);
    if (unborn.ok) {
        found.branch = unborn.text.trim();
        return true;
    }
    found.error = reasonOf(head, text);
    return false;
}

/**
 * The newest commits of the checked-out branch. A repository with no commit yet answers with a
 * failure rather than an empty log, which is an empty list here like every other unreadable list:
 * the branch line above it is what says the repository is there.
 */
async function log(git: Git): Promise<GitCommit[]> {
    const done = await git(['log', `-${LOG_ENTRIES}`, LOG_FORMAT]);
    return done.ok ? parseLog(done.text) : [];
}

/** Every list this module puts on the channel is cut here: one repository is never the payload. */
export function capped<Row>(rows: Row[]): Row[] {
    return rows.slice(0, MAX_ENTRIES);
}

/**
 * The branches with their upstreams and which one is checked out, the tags with the commits they
 * point at, and whether a stash is kept, from one `for-each-ref` over the three namespaces, each
 * list capped like the change lists. One process reads all three, where a listing each would be
 * three processes per root on every event.
 */
async function refs(git: Git): Promise<RefRows> {
    const done = await git(['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash']);
    if (!done.ok) return { branches: [], tags: [], stash: false };
    const read = parseRefs(done.text);
    return { branches: capped(read.branches), tags: capped(read.tags), stash: read.stash };
}

/**
 * Every stash, newest first, read from the stash's reflog as `stash list` reads it. A repository
 * with no stash has no such reflog and answers with a failure, which is the empty list.
 */
async function stashes(git: Git): Promise<GitStash[]> {
    const done = await git(['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--']);
    return done.ok ? capped(parseStashes(done.text)) : [];
}

/** The repository's remotes by name. */
async function remotes(git: Git): Promise<string[]> {
    const done = await git(['remote']);
    return done.ok ? capped(done.text.split('\n').filter((one) => one.trim() !== '')) : [];
}

/**
 * What the repository is in the middle of, read from its git folder: a merge while MERGE_HEAD is
 * there, with the message git prepared for it, a cherry-pick while CHERRY_PICK_HEAD is, with the
 * message git prepared for that, and a rebase while either rebase folder is. The folder is the one
 * `rev-parse --git-dir` named, so a worktree reads its own.
 */
function sequenceOf(root: string, gitDir: string, found: GitState): void {
    const dir = isAbsolute(gitDir) ? gitDir : join(root, gitDir);
    let sequence: GitSequence = '';
    if (existsSync(join(dir, 'rebase-merge')) || existsSync(join(dir, 'rebase-apply'))) {
        sequence = 'rebasing';
    } else if (existsSync(join(dir, 'MERGE_HEAD'))) {
        sequence = 'merging';
    } else if (existsSync(join(dir, 'CHERRY_PICK_HEAD'))) {
        sequence = 'cherry-picking';
    }
    found.sequence = sequence;
    if (sequence !== 'merging' && sequence !== 'cherry-picking') return;
    try {
        found.mergeMessage = readFileSync(join(dir, 'MERGE_MSG'), 'utf8')
            .split('\n')
            .filter((line) => !line.startsWith('#'))
            .join('\n')
            .trim();
    } catch {
        found.mergeMessage = '';
    }
}

/**
 * Every worktree of the repository, the checkout itself first. `list` is the one form run here.
 *
 * git answers with real paths, and a root reached through a symbolic link is therefore named
 * differently there than it is everywhere else in oculus, where the root is the key the channel and
 * the file browser use. Each path under the real root is put back under the root as asked for, so
 * one vocabulary reaches the page and the checks a write makes.
 */
export async function worktrees(
    root: string,
    timeout: number = TIMEOUT_MS
): Promise<GitWorktree[]> {
    return worktreesOf(root, (args) => run(root, args, timeout));
}

/** The worktrees of the repository at `root`, listed through the git of one read. */
async function worktreesOf(root: string, git: Run): Promise<GitWorktree[]> {
    const done = await git(['worktree', 'list', '--porcelain']);
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
async function upstream(found: GitState, git: Git): Promise<void> {
    const done = await git(['rev-list', '--left-right', '--count', '@{upstream}...HEAD']);
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
