// Layer 2, server. The git reads a page asks for on demand through GET /api/git: a page of the
// graph over HEAD and its upstream, a commit's files and diffs, a stash's diff, the two versions of
// a file, the merge base, the attributes that decide whether a diff may be cut, the blame, the
// gutter marks and the three stages of a conflicted path. Every command goes through run.ts, which
// answers a promise, so each read here is awaited by its caller and the event loop serves other
// requests while git works. A refusal is worded from the `text` catalog each read is handed.

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
    GitGraphRange,
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
import { words } from '../words.ts';
import {
    HASH,
    TIMEOUT_MS,
    milliseconds,
    pathInside,
    readDiff,
    reasonOf,
    refused,
    run,
    show,
    type Read
} from './run.ts';

/** How many commits one page of the graph holds; Load More asks for the next as many. */
export const GRAPH_PAGE = 50;

/**
 * One page of the graph: GRAPH_PAGE commits in topological order after the first `skip`, read over
 * HEAD and, when the branch has one, its upstream together, as VS Code's graph is one graph of the
 * branch and its upstream, so a commit only one of them holds sits in its own lane and every
 * commit is listed once; and whether more follow. The first page also carries the commits the
 * upstream holds that HEAD does not and the other way round, which the page marks as incoming and
 * outgoing, and the range they span (`rangeOf`), which Incoming Changes and Outgoing Changes list
 * the files of. A branch with no upstream reads HEAD alone and answers both lists empty and no
 * range, and a repository with no commit answers git's own reason.
 */
export async function graphPage(
    root: string,
    skip: number,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<GitGraphPage>> {
    const from = Number.isInteger(skip) && skip > 0 ? skip : 0;
    const ms = milliseconds(timeout);
    const upstream = await commitOf(root, '@{upstream}', ms);
    const tips = upstream === '' ? ['HEAD'] : ['HEAD', upstream];
    const done = await run(
        root,
        [
            'log',
            '--topo-order',
            GRAPH_FORMAT,
            `--skip=${from}`,
            `-${GRAPH_PAGE + 1}`,
            ...tips,
            '--'
        ],
        ms
    );
    if (!done.ok) return refused(reasonOf(done, text));
    const rows = parseGraph(done.text);
    const first = from === 0 && upstream !== '';
    const range = first ? await rangeOf(root, upstream, ms) : null;
    return {
        ok: true,
        value: {
            commits: rows.slice(0, GRAPH_PAGE),
            more: rows.length > GRAPH_PAGE,
            incoming: first ? await between(root, `HEAD..${upstream}`, ms) : [],
            outgoing: first ? await between(root, `${upstream}..HEAD`, ms) : [],
            ...(range === null ? {} : { range })
        }
    };
}

/** The commit a ref names, or the empty string when it names none (a branch with no upstream). */
async function commitOf(root: string, ref: string, timeout: number): Promise<string> {
    const done = await run(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], timeout);
    const hash = done.text.trim();
    return done.ok && HASH.test(hash) ? hash : '';
}

/**
 * The commits either side of the upstream span: the merge base of HEAD and the upstream, the
 * upstream's commit and HEAD's. Incoming Changes are the files between the base and the upstream,
 * Outgoing Changes the files between the base and HEAD. Null when git names no base, as for two
 * histories with nothing in common.
 */
async function rangeOf(
    root: string,
    upstream: string,
    timeout: number
): Promise<GitGraphRange | null> {
    const head = await commitOf(root, 'HEAD', timeout);
    const based = await run(root, ['merge-base', upstream, 'HEAD'], timeout);
    const base = based.text.trim();
    if (head === '' || !based.ok || !HASH.test(base)) return null;
    return { base, incoming: upstream, outgoing: head };
}

/** The commits of one range around the upstream, capped; a range git cannot read is empty. */
async function between(root: string, range: string, timeout: number): Promise<GitGraphCommit[]> {
    const done = await run(
        root,
        ['log', '--topo-order', GRAPH_FORMAT, `-${MAX_ENTRIES}`, range, '--'],
        timeout
    );
    return done.ok ? parseGraph(done.text) : [];
}

/** The paths one commit changed against its first parent, or against nothing for a root commit. */
export async function commitFiles(
    root: string,
    hash: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<GitCommitFile[]>> {
    if (!HASH.test(hash)) return refused(words(text, 'server.git.not_a_commit'));
    const done = await show(
        root,
        ['--format=', '--name-status', '-z', '--diff-merges=first-parent', hash],
        milliseconds(timeout)
    );
    return done.ok
        ? { ok: true, value: parseNameStatus(done.text) }
        : refused(reasonOf(done, text));
}

/**
 * One commit's diff of one path against its first parent, as the two versions of each file. A path
 * the commit renamed is diffed from its old path, which the commit's own file list names.
 */
export async function commitDiff(
    root: string,
    hash: string,
    path: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<DiffSides[]>> {
    if (!HASH.test(hash)) return refused(words(text, 'server.git.not_a_commit'));
    if (!pathInside(root, path)) return refused(words(text, 'server.git.path_outside', path));
    const ms = milliseconds(timeout);
    const listed = await show(
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
    if (!listed.ok) return refused(reasonOf(listed, text));
    const renamed = parseNameStatus(listed.text).find((file) => file.path === path && file.from);
    const paths = renamed ? [renamed.from, path] : [path];
    const done = await show(
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
    if (!done.ok) return refused(reasonOf(done, text));
    return sidesOf(root, done.text, `${hash}^:`, `${hash}:`, text, ms);
}

/**
 * One stash's files against the commit it was made on, which is what `stash show -p` prints, as the
 * two versions of each; a stash that kept untracked files lists them after, each from nothing.
 */
export async function stashDiff(
    root: string,
    ref: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<DiffSides[]>> {
    if (!STASH_REF.test(ref)) return refused(words(text, 'server.git.not_a_stash'));
    const ms = milliseconds(timeout);
    const done = await readDiff(
        root,
        ['--no-color', '--no-ext-diff', NO_CONTEXT, '-M', `${ref}^1`, ref],
        ms
    );
    if (!done.ok) return refused(reasonOf(done, text));
    const tracked = await sidesOf(root, done.text, `${ref}^1:`, `${ref}:`, text, ms);
    if (!tracked.ok) return tracked;
    const parents = await show(root, ['-s', '--format=%P', ref], ms);
    if (!parents.ok) return refused(reasonOf(parents, text));
    if (parents.text.trim().split(/\s+/).length < 3) return tracked;
    // The untracked files are a third parent with no parent of its own, so `show` lists each as
    // new.
    const loose = await show(
        root,
        ['--format=', '--no-color', '--no-ext-diff', NO_CONTEXT, `${ref}^3`],
        ms
    );
    if (!loose.ok) return refused(reasonOf(loose, text));
    const added = await sidesOf(root, loose.text, `${ref}^3:`, `${ref}^3:`, text, ms);
    return added.ok ? { ok: true, value: [...tracked.value, ...added.value] } : added;
}

/**
 * The two versions of each file of a diff: its head lines cut from the diff's text, and each side
 * read whole, `before` and `after` naming where (a revision and a colon, `:` for the index, `:2:`
 * for Current's stage of a conflict, or null for the worktree). A binary file, and the side a file
 * was created or deleted on, is the empty string; a submodule's sides are git's own lines for it.
 * `encoded` says whether both sides' bytes were UTF-8 before they were decoded.
 */
export async function sidesOf(
    root: string,
    diffText: string,
    before: string | null,
    after: string | null,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<DiffSides[]>> {
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
        const original = file.created
            ? NOTHING
            : await version(root, before, file.oldPath, text, ms);
        const modified = file.deleted
            ? NOTHING
            : await version(root, after, file.newPath, text, ms);
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
async function version(
    root: string,
    at: string | null,
    path: string,
    text: Record<string, string>,
    timeout: number
): Promise<Version> {
    if (!pathInside(root, path)) {
        return { ok: false, text: words(text, 'server.git.path_outside', path), utf8: true };
    }
    if (at !== null) {
        const done = await show(root, ['--no-textconv', `${at}${path}`], timeout);
        return done.ok ? done : { ok: false, text: reasonOf(done, text), utf8: true };
    }
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
export async function mergeBase(
    root: string,
    from: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<string>> {
    if (from.startsWith('-')) return refused(words(text, 'server.git.not_a_branch'));
    const done = await run(root, ['merge-base', from, 'HEAD'], milliseconds(timeout));
    return done.ok ? { ok: true, value: done.text.trim() } : refused(reasonOf(done, text));
}

/**
 * What git says of converting one file's text: `check-attr`'s `filter`, `text`, `eol`,
 * `working-tree-encoding` and `ident`, and `core.autocrlf` (the empty string when it is not set),
 * so the diff pane withholds its partial patches from a file git converts.
 */
export async function attributesOf(
    root: string,
    path: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<DiffAttributes>> {
    if (!pathInside(root, path)) return refused(words(text, 'server.git.path_outside', path));
    const ms = milliseconds(timeout);
    const checked = await run(
        root,
        ['check-attr', 'filter', 'text', 'eol', 'working-tree-encoding', 'ident', '--', path],
        ms
    );
    if (!checked.ok) return refused(reasonOf(checked, text));
    const autocrlf = await run(root, ['config', '--get', '--default=', 'core.autocrlf'], ms);
    if (!autocrlf.ok) return refused(reasonOf(autocrlf, text));
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
export async function sshCommand(root: string): Promise<string | null> {
    const done = await run(root, ['config', '--get', '--default=', 'core.sshCommand'], TIMEOUT_MS);
    return done.ok ? done.text.trim() : null;
}

/** Who last changed each line of one file in the worktree: the working tab's blame. */
export async function blameOf(
    root: string,
    path: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<GitBlameLine[]>> {
    if (!pathInside(root, path)) return refused(words(text, 'server.git.path_outside', path));
    const done = await run(root, ['blame', '--porcelain', '--', path], milliseconds(timeout));
    return done.ok ? { ok: true, value: parseBlame(done.text) } : refused(reasonOf(done, text));
}

/**
 * The gutter marks of one file: its worktree lines against the index. An untracked file and a
 * file git has no index entry for answer no marks, as VS Code draws none for them.
 */
export async function lineMarks(
    root: string,
    path: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<GitLineMark[]>> {
    if (!pathInside(root, path)) return refused(words(text, 'server.git.path_outside', path));
    const done = await readDiff(
        root,
        ['--no-color', '--no-ext-diff', '-U0', '--', path],
        milliseconds(timeout)
    );
    return done.ok ? { ok: true, value: parseLineMarks(done.text) } : refused(reasonOf(done, text));
}

/**
 * The three versions of a conflicted path: the common base (stage 1), ours (2) and theirs (3). A
 * side the conflict has no version on (a path one side deleted, the base of a path both sides
 * added, or the other side of a path one side added) is empty.
 */
export async function mergeSides(
    root: string,
    path: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<GitMergeSides>> {
    if (!pathInside(root, path)) return refused(words(text, 'server.git.path_outside', path));
    const ms = milliseconds(timeout);
    // A side that deleted the path has no stage in the index, which `show` answers with a failure;
    // an empty file is a stage that answers with no text.
    const side = async (stage: number): Promise<{ held: boolean; text: string }> => {
        const done = await show(root, [`:${stage}:${path}`], ms);
        return { held: done.ok, text: done.ok ? done.text : '' };
    };
    const [base, ours, theirs] = [await side(1), await side(2), await side(3)];
    if (!base.held && !ours.held && !theirs.held) {
        return refused(words(text, 'server.git.not_in_conflict', path));
    }
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
