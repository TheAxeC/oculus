// Layer 2, server. The git reads a page asks for on demand through GET /api/git: a page of the
// graph, a commit's files and diffs, a stash's diff, the two versions of a file, the merge base,
// the attributes that decide whether a diff may be cut, the blame, the gutter marks and the three
// stages of a conflicted path. Every command goes through run.ts.

import { isUtf8 } from 'node:buffer';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import type {
    DiffAttributes,
    DiffSides,
    GitBlameLine,
    GitCommitFile,
    GitGraphCommit,
    GitGraphPage,
    GitLineMark,
    GitMergeSides
} from '../../../data/model/index.ts';
import {
    GRAPH_FORMAT,
    NO_CONTEXT,
    STASH_REF,
    diffHeads,
    parseAttributes,
    parseBlame,
    parseGraph,
    parseLineMarks,
    parseNameStatus,
    submoduleText
} from './parse.ts';
import { MAX_ENTRIES } from './state.ts';
import {
    HASH,
    TIMEOUT_MS,
    milliseconds,
    pathInside,
    readDiff,
    refused,
    run,
    show,
    type Read
} from './run.ts';

/** How many commits one page of the graph holds; Load More asks for the next as many. */
export const GRAPH_PAGE = 50;

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
        [
            '--format=',
            '--name-status',
            '-z',
            '-M',
            '--relative',
            '--diff-merges=first-parent',
            hash
        ],
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

/** Who last changed each line of one file in the worktree: the working tab's blame. */
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
