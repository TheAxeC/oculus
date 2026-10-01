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
//     git -C <root> status --porcelain=v1 -z --untracked-files=normal --renames
//     git -C <root> diff --numstat -z
//     git -C <root> diff --no-color --no-ext-diff -U0 -- <path>
//     git -C <root> diff --no-color --no-ext-diff -U0 -M <stash>^1 <stash>
//     git -C <root> log -<n> --format=...
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
//     git -C <root> show --format= --name-status -z [-M] --diff-merges=first-parent <commit>
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
// the names handed on its standard input, so the tree can leave them out (ignoredIn below).
// `ls-files` is the Status view's line counts: the paths a folder's repository tracks under it
// (trackedFiles below), which is the set of files server/machine/lines.ts hands to cloc. The
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
// held to those two reading vectors.
//
// Nothing here may ever change a repository. Every writing subcommand belongs to Axel alone, and a
// dashboard watcher must never be the thing that runs one. tests/server/core/git.test.ts holds two
// gates over that: the source names no writing subcommand, and the suite records every argument
// vector the process runs and asserts the whole suite ran only the commands above, `for-each-ref`,
// `worktree`, `symbolic-ref`, `check-ignore`, `ls-files`, `remote`, `config` and `rev-parse` only
// as the vectors written here.
//
// A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
// (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
// short reason. Data only, no rendered strings: the wording comes from the text catalog.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`); the records of
// `status --porcelain=v1 -z` are split by core/git-parse.ts's `statusRecords` and sorted into the
// change lists by its `statusLists`.

import { spawnSync } from 'node:child_process';
import { isUtf8 } from 'node:buffer';
import { existsSync, lstatSync, readFileSync, readlinkSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, sep } from 'node:path';
import type {
    DiffAttributes,
    DiffSides,
    GitBlameLine,
    GitCommit,
    GitCommitFile,
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
    NO_CONTEXT,
    diffHeads,
    parseAttributes,
    parseBlame,
    parseGraph,
    parseLineMarks,
    parseLog,
    parseNameStatus,
    parseNumstat,
    parseStashes,
    parseRefs,
    parseWorktrees,
    shortReason,
    statusLists,
    statusRecords,
    submoduleText,
    type RefRows
} from './git-parse.ts';
import { inside } from './paths.ts';

export const GIT = 'git';
/** The most output one read takes, which a whole version of a large file read by `show` needs. */
const MAX_OUTPUT = 32 * 1024 * 1024;
/** How many characters of git's reason the channel carries. */
const REASON_WIDTH = 120;
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
/** A commit named on a request: a whole or abbreviated hash and nothing a revision could mean. */
const HASH = /^[0-9a-f]{4,40}$/;
/**
 * The one refusal of git's that means the root holds no repository; it opens every wording of it.
 */
const NO_REPOSITORY = 'not a git repository';

/**
 * What one command came back with. `answered` is whether anything about the root can be read from
 * the outcome: a command that timed out or was killed has not answered anything, while a git that
 * could not start is taken at its word, so that a plain folder never becomes a repository because
 * git is missing. `ran` is the narrower fact, whether git itself executed and set the exit status,
 * which is what tells git's own refusal of a root from this machine having no git to ask.
 */
type Outcome = { ok: boolean; answered: boolean; ran: boolean; text: string; utf8: boolean };

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

/**
 * The paths the repository tracks under the folder, relative to it, for the Status view's line
 * counts. `-z` ends each path with a NUL and writes it unquoted, so a name with a space or an
 * accented letter comes back as it is on disk. A folder in no repository, a git that is missing and
 * a run that timed out answer why instead.
 */
export function trackedFiles(root: string, timeout: number = TIMEOUT_MS): Read<string[]> {
    const done = run(root, ['ls-files', '-z'], milliseconds(timeout));
    if (!done.ok) return refused(done.text);
    return { ok: true, value: done.text.split('\0').filter((path) => path !== '') };
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
    return inside(join(root, path), root);
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

/**
 * One commit's diff of one path against its first parent, as the two versions of each file. A path
 * the commit renamed is diffed from its old path, which the commit's own file list names.
 */
export function commitDiff(
    root: string,
    hash: string,
    path: string,
    timeout: number = TIMEOUT_MS
): Read<DiffSides[]> {
    if (!HASH.test(hash)) return refused('that is not a commit');
    if (!pathInside(root, path)) return refused(`the path ${path} is not inside the repository`);
    const ms = milliseconds(timeout);
    const listed = show(
        root,
        ['--format=', '--name-status', '-z', '-M', '--diff-merges=first-parent', hash],
        ms
    );
    if (!listed.ok) return refused(listed.text);
    const renamed = parseNameStatus(listed.text).find((file) => file.path === path && file.from);
    const paths = renamed ? [renamed.from, path] : [path];
    const done = show(
        root,
        [
            '--format=',
            '--no-color',
            '--no-ext-diff',
            NO_CONTEXT,
            '-M',
            '--diff-merges=first-parent',
            hash,
            '--',
            ...paths
        ],
        ms
    );
    if (!done.ok) return refused(done.text);
    return sidesOf(root, done.text, `${hash}^:`, `${hash}:`, ms);
}

/**
 * One stash's files against the commit it was made on, which is what `stash show -p` prints, as the
 * two versions of each; a stash that kept untracked files lists them after, each from nothing.
 */
export function stashDiff(
    root: string,
    ref: string,
    timeout: number = TIMEOUT_MS
): Read<DiffSides[]> {
    if (!STASH_REF.test(ref)) return refused('that is not a stash');
    const ms = milliseconds(timeout);
    const done = readDiff(
        root,
        ['--no-color', '--no-ext-diff', NO_CONTEXT, '-M', `${ref}^1`, ref],
        ms
    );
    if (!done.ok) return refused(done.text);
    const tracked = sidesOf(root, done.text, `${ref}^1:`, `${ref}:`, ms);
    if (!tracked.ok) return tracked;
    const parents = show(root, ['-s', '--format=%P', ref], ms);
    if (!parents.ok) return refused(parents.text);
    if (parents.text.trim().split(/\s+/).length < 3) return tracked;
    // The untracked files are a third parent with no parent of its own, so `show` lists each as
    // new.
    const loose = show(
        root,
        ['--format=', '--no-color', '--no-ext-diff', NO_CONTEXT, `${ref}^3`],
        ms
    );
    if (!loose.ok) return refused(loose.text);
    const added = sidesOf(root, loose.text, `${ref}^3:`, `${ref}^3:`, ms);
    return added.ok ? { ok: true, value: [...tracked.value, ...added.value] } : added;
}

/**
 * The two versions of each file of a diff: its head lines cut from the diff's text, and each side
 * read whole, `before` and `after` naming where (a revision and a colon, `:` for the index, `:2:`
 * for Current's stage of a conflict, or null for the worktree). A binary file, and the side a file
 * was created or deleted on, is the empty string; a submodule's sides are git's own lines for it.
 * `encoded` says whether both sides' bytes were UTF-8 before they were decoded.
 */
export function sidesOf(
    root: string,
    diffText: string,
    before: string | null,
    after: string | null,
    timeout: number = TIMEOUT_MS
): Read<DiffSides[]> {
    const ms = milliseconds(timeout);
    const files: DiffSides[] = [];
    for (const file of diffHeads(diffText)) {
        const sides = { oldPath: file.oldPath, newPath: file.newPath, head: file.head };
        if (file.binary || file.submodule) {
            const original = file.binary ? '' : submoduleText(file, '-');
            const modified = file.binary ? '' : submoduleText(file, '+');
            files.push({ ...sides, binary: file.binary, encoded: true, original, modified });
            continue;
        }
        const original = file.created ? NOTHING : version(root, before, file.oldPath, ms);
        const modified = file.deleted ? NOTHING : version(root, after, file.newPath, ms);
        if (!original.ok) return refused(original.text);
        if (!modified.ok) return refused(modified.text);
        files.push({
            ...sides,
            binary: false,
            encoded: original.utf8 && modified.utf8,
            original: original.text,
            modified: modified.text
        });
    }
    return { ok: true, value: files };
}

/** The side of a file a diff created or deleted it on. */
const NOTHING: Version = { ok: true, text: '', utf8: true };

/** One version of a file: its text, and whether its bytes were UTF-8 before they were decoded. */
type Version = { ok: boolean; text: string; utf8: boolean };

/** One file's text at a revision (`show <at><path>`), or as the worktree holds it for null; a
 * symbolic link is its target, as git stores it. */
function version(root: string, at: string | null, path: string, timeout: number): Version {
    if (!pathInside(root, path))
        return { ok: false, text: `the path ${path} is not inside the repository`, utf8: true };
    if (at !== null) return show(root, ['--no-textconv', `${at}${path}`], timeout);
    const full = join(root, path);
    try {
        const bytes = lstatSync(full).isSymbolicLink()
            ? readlinkSync(full, { encoding: 'buffer' })
            : readFileSync(full);
        return { ok: true, text: bytes.toString('utf8'), utf8: isUtf8(bytes) };
    } catch {
        // A file the worktree deleted is read as git reads it: nothing.
        return NOTHING;
    }
}

/**
 * Where a branch and a worktree's HEAD parted: the commit a worktree's three-dot diff starts at.
 */
export function mergeBase(root: string, from: string, timeout: number = TIMEOUT_MS): Read<string> {
    if (from.startsWith('-')) return refused('that is not a branch');
    const done = run(root, ['merge-base', from, 'HEAD'], milliseconds(timeout));
    return done.ok ? { ok: true, value: done.text.trim() } : refused(done.text);
}

/**
 * What git says of converting one file's text: `check-attr`'s `filter`, `text`, `eol`,
 * `working-tree-encoding` and `ident`, and `core.autocrlf` (the empty string when it is not set),
 * so the diff pane withholds its partial patches from a file git converts.
 */
export function attributesOf(
    root: string,
    path: string,
    timeout: number = TIMEOUT_MS
): Read<DiffAttributes> {
    if (!pathInside(root, path)) return refused(`the path ${path} is not inside the repository`);
    const ms = milliseconds(timeout);
    const checked = run(
        root,
        ['check-attr', 'filter', 'text', 'eol', 'working-tree-encoding', 'ident', '--', path],
        ms
    );
    if (!checked.ok) return refused(checked.text);
    const autocrlf = run(root, ['config', '--get', '--default=', 'core.autocrlf'], ms);
    if (!autocrlf.ok) return refused(autocrlf.text);
    return {
        ok: true,
        value: { ...parseAttributes(checked.text), autocrlf: autocrlf.text.trim() }
    };
}

/**
 * The ssh command the repository's configuration names, `core.sshCommand`: the empty text when none
 * is set, which includes a folder that is no repository (git answers it from the global
 * configuration), and null when the read fails (a timeout, git not run, or git exiting non-zero).
 */
export function sshCommand(root: string): string | null {
    const done = run(root, ['config', '--get', '--default=', 'core.sshCommand'], TIMEOUT_MS);
    return done.ok ? done.text.trim() : null;
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
    const listing = run(
        root,
        ['status', '--porcelain=v1', '-z', '--untracked-files=normal', '--renames'],
        timeout
    );
    if (!listing.ok) {
        found.error = listing.text || 'git status failed';
        return found;
    }
    const counts = run(root, ['diff', '--numstat', '-z'], timeout);
    const lines = parseNumstat(counts.ok ? counts.text : '');
    Object.assign(found, statusLists(statusRecords(listing.text), lines, MAX_ENTRIES));
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

// ---------------------------------------------------------------- git output

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
 * answered. The output is read as bytes, `utf8` says whether they were UTF-8, and `text` is them
 * decoded as UTF-8. This is the module's one call site.
 */
function run(root: string, args: string[], timeout: number, input?: string): Outcome {
    // Every read runs without optional locks, so a status refresh never writes .git/index.lock and
    // never collides with a commit the owner is making in the same repository.
    const argv = ['-C', root, '--no-optional-locks', ...args];
    // A list, never a shell, and a timeout: a hung git must not hang a watcher.
    const done = spawnSync(GIT, argv, { timeout, input, maxBuffer: MAX_OUTPUT });
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

/** What a spawned process wrote, as bytes; nothing when it wrote nothing. */
function bytesOf(output: unknown): Buffer {
    return Buffer.isBuffer(output) ? output : Buffer.alloc(0);
}

/** A one-line reason fit for a tooltip. */
function short(value: unknown): string {
    return shortReason(value, REASON_WIDTH);
}
