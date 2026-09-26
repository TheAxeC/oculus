// Layer 2, server. Read-only git state for the workspaces the session views name. The git watcher,
// the file browser's listing and the git writes all run git through this module's one call site,
// so it sits in server/core, below every folder that reads git.
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
//     git -C <root> diff --no-color --no-ext-diff -U0 -- <path>
//     git -C <root> diff --no-color --no-ext-diff -U<all> <stash>^1 <stash>
//     git -C <root> log -<n> --format=...
//     git -C <root> log --topo-order --format=... --skip=<n> -<n> HEAD --
//     git -C <root> log --topo-order --format=... -<n> <HEAD..@{upstream} | @{upstream}..HEAD> --
//     git -C <root> log --walk-reflogs --format=... refs/stash --
//     git -C <root> worktree list --porcelain
//     git -C <root> check-ignore --stdin -z
//     git -C <root> for-each-ref --format=... refs/heads refs/tags refs/stash
//     git -C <root> remote
//     git -C <root> blame --porcelain -- <path>
//     git -C <root> show :<1|2|3>:<path>
//     git -C <root> show --format= --name-status -z --diff-merges=first-parent <commit>
//     git -C <root> show --format= --no-color --no-ext-diff -U<all> --diff-merges=first-parent
//         <commit> -- <path>
//
// `check-ignore` is the file browser's: which entries of one listed folder the repository ignores,
// the names handed on its standard input, so the tree can leave them out (ignoredIn below). The
// status read above it is the `git` channel's; the graph, the blame, the gutter marks, the three
// versions of a conflicted path, a commit's files and diffs and a stash's diff are read on demand
// by GET /api/git, since each is text or a page a reader asked for rather than state every event
// carries. A stash is listed from its reflog and diffed against its first parent, which is what
// `stash list` and `stash show -p` print, so no command here is a form of a writing subcommand.
//
// Nothing here may ever change a repository. Every writing subcommand belongs to Axel alone, and a
// dashboard watcher must never be the thing that runs one. tests/server/core/git.test.ts holds two
// gates over that: the source names no writing subcommand, and the suite records every argument
// vector the process runs and asserts the whole suite ran only the commands above, `for-each-ref`,
// `worktree`, `symbolic-ref`, `check-ignore`, `remote` and `rev-parse` only as the vectors written
// here.
//
// A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
// (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
// short reason. Data only, no rendered strings: the wording comes from the text catalog.

import { scalar } from '../../data/helpers/guards.ts';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';
import type {
    GitBlameLine,
    GitCommit,
    GitCommitFile,
    GitEntry,
    GitGraphCommit,
    GitGraphPage,
    GitLineMark,
    GitMergeSides,
    GitSequence,
    GitStash,
    GitState,
    GitWorktree
} from '../../data/model/index.ts';
import { ignoresWorktrees } from '../../data/helpers/worktrees.ts';
import {
    GRAPH_FORMAT,
    LOG_FORMAT,
    STASH_FORMAT,
    STASH_REF,
    REFS_FORMAT,
    WHOLE_FILE,
    parseBlame,
    parseGraph,
    parseLineMarks,
    parseLog,
    parseNameStatus,
    parseStashes,
    parseRefs,
    parseWorktrees,
    type RefRows
} from './git-parse.ts';

export const GIT = 'git';
/** Milliseconds one git command is given before it is given up on. */
export const TIMEOUT_MS = 5000;
/** One workspace with 4000 untracked files, or 4000 branches, must not become the payload. */
export const MAX_ENTRIES = 200;
/**
 * How many commits the log carries: the view is a glance, and a terminal reads a longer history.
 */
export const LOG_ENTRIES = 20;
/** How many commits one page of the graph holds; Load More asks for the next as many. */
export const GRAPH_PAGE = 50;
/** git's own letter for a path it does not track. */
export const UNTRACKED = '?';
/** An index or worktree column saying "nothing here". */
const QUIET = [' ', UNTRACKED, '!'];
/** The pairs `status --porcelain` reports an unmerged path by: both columns name the conflict. */
const UNMERGED = ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'];
/** A commit named on a request: a whole or abbreviated hash and nothing a revision could mean. */
const HASH = /^[0-9a-f]{4,40}$/;
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
        conflicted: [],
        sequence: '',
        mergeMessage: '',
        remotes: [],
        stashes: [],
        tags: [],
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

// ---------------------------------------------------------------- read on demand

/** What one on-demand read answers: its value, or why it could not be read. */
export type Read<T> = { ok: true; value: T } | { ok: false; error: string };

function refused<T>(error: string): Read<T> {
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
    const base = resolve(root);
    const full = resolve(join(root, path));
    return full === base || full.startsWith(base + sep);
}

/**
 * One page of the graph: GRAPH_PAGE commits of HEAD's history in topological order after the
 * first `skip`, whether more follow, and on the first page the commits the upstream holds that
 * HEAD does not and the other way round. A branch with no upstream answers both lists empty, and
 * a repository with no commit answers git's own reason.
 */
export function graphPage(
    root: string,
    skip: number,
    timeout: number = TIMEOUT_MS
): Read<GitGraphPage> {
    const from = Number.isInteger(skip) && skip > 0 ? skip : 0;
    const ms = milliseconds(timeout);
    const done = run(
        root,
        ['log', '--topo-order', GRAPH_FORMAT, `--skip=${from}`, `-${GRAPH_PAGE + 1}`, 'HEAD', '--'],
        ms
    );
    if (!done.ok) return refused(done.text || 'git log failed');
    const rows = parseGraph(done.text);
    return {
        ok: true,
        value: {
            commits: rows.slice(0, GRAPH_PAGE),
            more: rows.length > GRAPH_PAGE,
            incoming: from === 0 ? between(root, 'HEAD..@{upstream}', ms) : [],
            outgoing: from === 0 ? between(root, '@{upstream}..HEAD', ms) : []
        }
    };
}

/** The commits of one range around the upstream, capped; a range git cannot read is empty. */
function between(root: string, range: string, timeout: number): GitGraphCommit[] {
    const done = run(
        root,
        ['log', '--topo-order', GRAPH_FORMAT, `-${MAX_ENTRIES}`, range, '--'],
        timeout
    );
    return done.ok ? parseGraph(done.text) : [];
}

/** The paths one commit changed against its first parent, or against nothing for a root commit. */
export function commitFiles(
    root: string,
    hash: string,
    timeout: number = TIMEOUT_MS
): Read<GitCommitFile[]> {
    if (!HASH.test(hash)) return refused('that is not a commit');
    const done = show(
        root,
        ['--format=', '--name-status', '-z', '--diff-merges=first-parent', hash],
        milliseconds(timeout)
    );
    return done.ok ? { ok: true, value: parseNameStatus(done.text) } : refused(done.text);
}

/** One commit's diff of one path against its first parent, every unchanged line with it. */
export function commitDiff(
    root: string,
    hash: string,
    path: string,
    timeout: number = TIMEOUT_MS
): Read<string> {
    if (!HASH.test(hash)) return refused('that is not a commit');
    if (!pathInside(root, path)) return refused(`the path ${path} is not inside the repository`);
    const done = show(
        root,
        [
            '--format=',
            '--no-color',
            '--no-ext-diff',
            WHOLE_FILE,
            '--diff-merges=first-parent',
            hash,
            '--',
            path
        ],
        milliseconds(timeout)
    );
    return done.ok ? { ok: true, value: done.text } : refused(done.text);
}

/** One stash's diff against the commit it was made on, which is what `stash show -p` prints. */
export function stashDiff(root: string, ref: string, timeout: number = TIMEOUT_MS): Read<string> {
    if (!STASH_REF.test(ref)) return refused('that is not a stash');
    const done = readDiff(
        root,
        ['--no-color', '--no-ext-diff', WHOLE_FILE, `${ref}^1`, ref],
        milliseconds(timeout)
    );
    return done.ok ? { ok: true, value: done.text } : refused(done.text);
}

/** Who last changed each line of one file as the worktree holds it. */
export function blameOf(
    root: string,
    path: string,
    timeout: number = TIMEOUT_MS
): Read<GitBlameLine[]> {
    if (!pathInside(root, path)) return refused(`the path ${path} is not inside the repository`);
    const done = run(root, ['blame', '--porcelain', '--', path], milliseconds(timeout));
    return done.ok ? { ok: true, value: parseBlame(done.text) } : refused(done.text);
}

/**
 * The gutter marks of one file: its worktree lines against the index. An untracked file and a
 * file git has no index entry for answer no marks, as VS Code draws none for them.
 */
export function lineMarks(
    root: string,
    path: string,
    timeout: number = TIMEOUT_MS
): Read<GitLineMark[]> {
    if (!pathInside(root, path)) return refused(`the path ${path} is not inside the repository`);
    const done = readDiff(
        root,
        ['--no-color', '--no-ext-diff', '-U0', '--', path],
        milliseconds(timeout)
    );
    return done.ok ? { ok: true, value: parseLineMarks(done.text) } : refused(done.text);
}

/**
 * The three versions of a conflicted path: the common base (stage 1), ours (2) and theirs (3). A
 * side the conflict has no version on (a path one side deleted, the base of a path both sides
 * added, or the other side of a path one side added) is empty.
 */
export function mergeSides(
    root: string,
    path: string,
    timeout: number = TIMEOUT_MS
): Read<GitMergeSides> {
    if (!pathInside(root, path)) return refused(`the path ${path} is not inside the repository`);
    const ms = milliseconds(timeout);
    // A side that deleted the path has no stage in the index, which `show` answers with a failure;
    // an empty file is a stage that answers with no text.
    const side = (stage: number): { held: boolean; text: string } => {
        const done = show(root, [`:${stage}:${path}`], ms);
        return { held: done.ok, text: done.ok ? done.text : '' };
    };
    const [base, ours, theirs] = [side(1), side(2), side(3)];
    if (!base.held && !ours.held && !theirs.held) return refused(`${path} is not in conflict`);
    // A side deleted the path only when the base holds it: with no base, a side without a version
    // never had the path, which the other side added (git's AU and UA).
    const deleted = !base.held
        ? ''
        : !ours.held && !theirs.held
          ? 'both'
          : !ours.held
            ? 'ours'
            : !theirs.held
              ? 'theirs'
              : '';
    return {
        ok: true,
        value: { base: base.text, ours: ours.text, theirs: theirs.text, deleted }
    };
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
    const listed = refs(root, timeout);
    found.branches = listed.branches;
    found.tags = listed.tags;
    // The reflog is walked only where a stash is kept, and the remotes are read only where Publish
    // Branch can be offered, a branch that tracks nothing; either read is a process per root on
    // every event, which the repositories that have no use for it do not pay.
    found.stashes = listed.stash ? stashes(root, timeout) : [];
    found.remotes = found.upstream || found.detached ? [] : remotes(root, timeout);
    found.worktrees = worktrees(root, timeout);
    found.ignoresWorktrees = ignored(root);
    sequenceOf(root, gitDir.text.trim(), found);
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

/**
 * The branches with their upstreams and which one is checked out, the tags with the commits they
 * point at, and whether a stash is kept, from one `for-each-ref` over the three namespaces, each
 * list capped like the change lists. One process reads all three, where a listing each would be
 * three processes per root on every event.
 */
function refs(root: string, timeout: number): RefRows {
    const done = run(
        root,
        ['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash'],
        timeout
    );
    if (!done.ok) return { branches: [], tags: [], stash: false };
    const read = parseRefs(done.text);
    return { branches: capped(read.branches), tags: capped(read.tags), stash: read.stash };
}

/**
 * Every stash, newest first, read from the stash's reflog as `stash list` reads it. A repository
 * with no stash has no such reflog and answers with a failure, which is the empty list.
 */
function stashes(root: string, timeout: number): GitStash[] {
    const done = run(root, ['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--'], timeout);
    return done.ok ? capped(parseStashes(done.text)) : [];
}

/** The repository's remotes by name. */
function remotes(root: string, timeout: number): string[] {
    const done = run(root, ['remote'], timeout);
    return done.ok ? capped(done.text.split('\n').filter((one) => one.trim() !== '')) : [];
}

/**
 * What the repository is in the middle of, read from its git folder: a merge while MERGE_HEAD is
 * there, with the message git prepared for it, and a rebase while either rebase folder is. The
 * folder is the one `rev-parse --git-dir` named, so a worktree reads its own.
 */
function sequenceOf(root: string, gitDir: string, found: GitState): void {
    const dir = isAbsolute(gitDir) ? gitDir : join(root, gitDir);
    let sequence: GitSequence = '';
    if (existsSync(join(dir, 'rebase-merge')) || existsSync(join(dir, 'rebase-apply'))) {
        sequence = 'rebasing';
    } else if (existsSync(join(dir, 'MERGE_HEAD'))) {
        sequence = 'merging';
    }
    found.sequence = sequence;
    if (sequence !== 'merging') return;
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
        if (UNMERGED.includes(`${index}${work}`)) {
            found.conflicted.push(entry(path, `${index}${work}`, undefined));
            continue;
        }
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
    found.conflicted.length = Math.min(found.conflicted.length, MAX_ENTRIES);
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

/** The one `show` call site: an index stage of a path, and a commit's files and diffs. */
function show(root: string, args: string[], timeout: number): Outcome {
    return run(root, ['show', ...args], timeout);
}

/** The call site of the diffs read on demand: a file's gutter marks and a stash's changes. */
function readDiff(root: string, args: string[], timeout: number): Outcome {
    return run(root, ['diff', ...args], timeout);
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
