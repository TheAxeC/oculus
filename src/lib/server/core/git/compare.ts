// Layer 2, server. The read-only git forms behind the graph's compare items and the change rows'
// Open File (HEAD), Open File (Index) and Compare with Workspace: a file as HEAD or the index holds
// it, who last changed each line of it, the files and the two sides of a file between a ref and a
// commit, the refs a picker offers, and the base a branch is compared against. state.ts, reads.ts
// and files.ts hold the state of a workspace and the rest of the reads; every module of this folder
// reaches git through run.ts's one call site.
//
// Exactly these read-only commands run here, besides those run.ts lists.
//
//     git -C <root> cat-file -t HEAD:<path>
//     git -C <root> ls-files --stage -z -- <path>
//     git -C <root> show --no-textconv <HEAD|:0>:<path>
//     git -C <root> blame --porcelain HEAD -- <path>
//     git -C <root> blame --porcelain --contents - -- <path>      (the index's text on stdin)
//     git -C <root> rev-parse --verify --quiet <ref>^{commit}
//     git -C <root> diff --name-status -z -M --end-of-options <from> <to>
//     git -C <root> diff --no-color --no-ext-diff -U0 -M --end-of-options <from> <to>
//         -- [<old>] <path>
//     git -C <root> for-each-ref --format=... refs/heads refs/remotes refs/tags
//     git -C <root> config --get-regexp ^branch\..*\.vscode-merge-base$
//     git -C <root> log --walk-reflogs --format=%gs <ref> --
//     git -C <root> symbolic-ref --short HEAD
//
// A ref is refused when it starts with a dash and is resolved to a commit before any diff runs; the
// diff names it after `--end-of-options` and the path after `--`, read literally
// (`GIT_LITERAL_PATHSPECS`), so neither can be taken for an option or a glob. Nothing here writes:
// the base a branch is compared against is read as VS Code's `getBranchBase` reads it and never
// stored back as `branch.<name>.vscode-merge-base`.

import { isUtf8 } from 'node:buffer';
import { lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import type { DiffSides, GitBlameLine, GitCommitFile } from '../../../data/model/index.ts';
import { permitted } from '../paths.ts';
import { words } from '../words.ts';
import { PANE_DIFF, parseBlame, parseNameStatus } from './parse.ts';
import { sidesOf } from './reads.ts';
import {
    HASH,
    TIMEOUT_MS,
    milliseconds,
    pathInside,
    reasonOf,
    refused,
    run,
    type Outcome,
    type Read
} from './run.ts';
import { worktrees } from './state.ts';

/** Which copy of a file the HEAD item reads: the last commit's, or what the index holds. */
export type HeadStage = 'head' | 'index';

/** One kind of ref a picker lists. */
export type RefKind = 'branch' | 'remote' | 'tag';

/** A ref a picker offers, by the name a reader types and `rev-parse` resolves. */
export type RefName = { name: string; kind: RefKind };

/** What `headFile` found: the text, nothing at that path, or bytes that are not text. */
export type HeadFile = { text: string } | { missing: true } | { binary: true };

/** The one `diff` call site of this module, run with the path rule set to literal. */
function diff(root: string, args: string[], timeout: number): Promise<Outcome> {
    return run(root, ['diff', ...args], timeout, undefined, { GIT_LITERAL_PATHSPECS: '1' });
}

/** A file as HEAD or the index holds it; a directory is refused and a path git lacks is missing. */
export async function headFile(
    root: string,
    stage: HeadStage,
    path: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<HeadFile>> {
    if (path === '.' || !pathInside(root, path)) {
        return refused(words(text, 'server.git.path_outside', path));
    }
    const ms = milliseconds(timeout);
    const spec = `${stage === 'head' ? 'HEAD' : ':0'}:${path}`;
    const kind =
        stage === 'head'
            ? await headKind(root, spec, text, ms)
            : await indexKind(root, path, text, ms);
    if (!kind.ok) return kind;
    if (kind.value === 'none') return missing();
    if (kind.value === 'folder') return refused(words(text, 'server.git.is_a_folder', path));
    if (kind.value === 'other') return refused(words(text, 'server.git.not_a_file', path));
    const done = await run(root, ['show', '--no-textconv', spec], ms);
    if (!done.ok) return refused(reasonOf(done, text));
    if (isBinary(done.text, done.utf8)) return { ok: true, value: { binary: true } };
    return { ok: true, value: { text: done.text } };
}

/**
 * Who last changed each line of a file as HEAD holds it, or as the index holds it. The index's text
 * is handed to `git blame --contents -` as the file's contents, so a staged change to a line shows
 * git's uncommitted author on that line.
 */
export async function blameAt(
    root: string,
    path: string,
    stage: HeadStage,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<GitBlameLine[]>> {
    if (!pathInside(root, path)) return refused(words(text, 'server.git.path_outside', path));
    const ms = milliseconds(timeout);
    if (stage === 'head') {
        const done = await run(root, ['blame', '--porcelain', 'HEAD', '--', path], ms);
        return done.ok ? { ok: true, value: parseBlame(done.text) } : refused(reasonOf(done, text));
    }
    const held = await headFile(root, 'index', path, text, ms);
    if (!held.ok) return held;
    if (!('text' in held.value)) return refused(words(text, 'server.git.no_index_text', path));
    const done = await run(
        root,
        ['blame', '--porcelain', '--contents', '-', '--', path],
        ms,
        held.value.text
    );
    return done.ok ? { ok: true, value: parseBlame(done.text) } : refused(reasonOf(done, text));
}

/** What a path is in a commit or the index: a file, a folder, something else, or not there. */
type Kind = 'file' | 'folder' | 'other' | 'none';

/** The type of the object `HEAD:<path>` names; a path HEAD lacks, or no HEAD at all, is none. */
async function headKind(
    root: string,
    spec: string,
    text: Record<string, string>,
    timeout: number
): Promise<Read<Kind>> {
    const done = await run(root, ['cat-file', '-t', spec], timeout);
    if (!done.ok) {
        return done.text.includes('not a git repository')
            ? refused(reasonOf(done, text))
            : { ok: true, value: 'none' };
    }
    const type = done.text.trim();
    return { ok: true, value: type === 'blob' ? 'file' : type === 'tree' ? 'folder' : 'other' };
}

/**
 * What the index holds at a path: `ls-files --stage` lists the entry itself for a file and the
 * entries under it for a folder, each as `<mode> <hash> <stage>\t<path>`.
 */
async function indexKind(
    root: string,
    path: string,
    text: Record<string, string>,
    timeout: number
): Promise<Read<Kind>> {
    const done = await run(root, ['ls-files', '--stage', '-z', '--', path], timeout, undefined, {
        GIT_LITERAL_PATHSPECS: '1'
    });
    if (!done.ok) return refused(reasonOf(done, text));
    const rows = done.text.split('\0').filter((row) => row !== '');
    if (rows.length === 0) return { ok: true, value: 'none' };
    const own = rows.find((row) => row.slice(row.indexOf('\t') + 1) === path);
    if (own === undefined) return { ok: true, value: 'folder' };
    return {
        ok: true,
        value: own.startsWith('100') ? 'file' : own.startsWith('120') ? 'file' : 'other'
    };
}

function missing(): Read<HeadFile> {
    return { ok: true, value: { missing: true } };
}

/**
 * The commit a ref names, or why it names none. A ref that starts with a dash is refused before git
 * runs, since it could be an option.
 */
async function commitOf(
    root: string,
    ref: string,
    text: Record<string, string>,
    timeout: number
): Promise<Read<string>> {
    if (typeof ref !== 'string' || ref === '' || ref.startsWith('-')) {
        return refused(words(text, 'server.git.not_a_reference'));
    }
    const done = await run(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], timeout);
    const hash = done.text.trim();
    return done.ok && HASH.test(hash)
        ? { ok: true, value: hash }
        : refused(words(text, 'server.git.names_no_commit', ref));
}

/** The files of `git diff <from> <to>`: the from side is any ref, the to side a commit hash. */
export async function compareFiles(
    root: string,
    from: string,
    to: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<GitCommitFile[]>> {
    if (!HASH.test(to)) return refused(words(text, 'server.git.not_a_commit'));
    const ms = milliseconds(timeout);
    const start = await commitOf(root, from, text, ms);
    if (!start.ok) return start;
    const done = await diff(
        root,
        ['--name-status', '-z', '-M', '--end-of-options', start.value, to],
        ms
    );
    return done.ok
        ? { ok: true, value: parseNameStatus(done.text) }
        : refused(reasonOf(done, text));
}

/**
 * One file's two sides between a ref and a commit, the ref's on the left. A path the comparison
 * renamed is diffed from its old path, which the comparison's own file list names.
 */
export async function compareSides(
    root: string,
    from: string,
    to: string,
    path: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<DiffSides[]>> {
    if (!HASH.test(to)) return refused(words(text, 'server.git.not_a_commit'));
    if (!pathInside(root, path)) return refused(words(text, 'server.git.path_outside', path));
    const ms = milliseconds(timeout);
    const start = await commitOf(root, from, text, ms);
    if (!start.ok) return start;
    const listed = await diff(
        root,
        ['--name-status', '-z', '-M', '--end-of-options', start.value, to],
        ms
    );
    if (!listed.ok) return refused(reasonOf(listed, text));
    const renamed = parseNameStatus(listed.text).find((file) => file.path === path && file.from);
    const paths = renamed ? [renamed.from, path] : [path];
    const done = await diff(
        root,
        [...PANE_DIFF, '-M', '--end-of-options', start.value, to, '--', ...paths],
        ms
    );
    if (!done.ok) return refused(reasonOf(done, text));
    return sidesOf(root, done.text, `${start.value}:`, `${to}:`, text, ms);
}

/** The refs a picker offers: local branches, remote branches and tags, never a remote's HEAD. */
export async function refNames(
    root: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<RefName[]>> {
    const table = await refTable(root, text, milliseconds(timeout));
    if (!table.ok) return table;
    const rows: RefName[] = [];
    for (const row of table.value) {
        if (row.name.startsWith('refs/heads/')) {
            rows.push({ name: row.name.slice('refs/heads/'.length), kind: 'branch' });
        } else if (row.name.startsWith('refs/remotes/') && row.symref === '') {
            rows.push({ name: row.name.slice('refs/remotes/'.length), kind: 'remote' });
        } else if (row.name.startsWith('refs/tags/')) {
            rows.push({ name: row.name.slice('refs/tags/'.length), kind: 'tag' });
        }
    }
    return { ok: true, value: rows };
}

/** One ref with the ref it stands for when it is symbolic, and the upstream of a local branch. */
type RefRow = { name: string; symref: string; upstream: string };

/** The one `for-each-ref` read of this module: the three namespaces with what a base reads. */
async function refTable(
    root: string,
    text: Record<string, string>,
    timeout: number
): Promise<Read<RefRow[]>> {
    const done = await run(
        root,
        [
            'for-each-ref',
            '--format=%(refname)%00%(symref)%00%(upstream:short)',
            'refs/heads',
            'refs/remotes',
            'refs/tags'
        ],
        timeout
    );
    if (!done.ok) return refused(reasonOf(done, text));
    const rows: RefRow[] = [];
    for (const line of done.text.split('\n')) {
        const [name = '', symref = '', upstream = ''] = line.split('\0');
        if (name !== '') rows.push({ name, symref, upstream });
    }
    return { ok: true, value: rows };
}

/**
 * The ref the checked-out branch is compared against, read as VS Code's `getBranchBase` reads it,
 * or the empty string when none is found: `branch.<name>.vscode-merge-base` when it names a remote
 * branch; else the branch the checked-out branch was created from (its reflog's creation entry, the
 * `HEAD` reflog's checkout when that says `HEAD`), a remote branch itself and a local branch by its
 * upstream; else the remote's default branch, `refs/remotes/<remote>/HEAD`. Nothing is written
 * back.
 */
export async function branchBase(
    root: string,
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<string> {
    const ms = milliseconds(timeout);
    const head = await run(root, ['symbolic-ref', '--short', 'HEAD'], ms);
    const table = await refTable(root, text, ms);
    if (!head.ok || !table.ok) return '';
    const branch = head.text.trim();
    const remote = (name: string): boolean =>
        table.value.some((row) => row.name === `refs/remotes/${name}` && row.symref === '');
    const configured = await mergeBaseSetting(root, branch, ms);
    if (configured !== '' && remote(configured)) return configured;
    const from = await createdFrom(root, branch, ms);
    if (from !== '') {
        if (remote(from)) return from;
        const upstream = table.value.find((row) => row.name === `refs/heads/${from}`)?.upstream;
        if (upstream !== undefined && upstream !== '') return upstream;
    }
    return defaultBranchOf(table.value, branch);
}

/** The value of `branch.<name>.vscode-merge-base`, or the empty string when it is not set. */
async function mergeBaseSetting(root: string, branch: string, timeout: number): Promise<string> {
    const done = await run(
        root,
        ['config', '--get-regexp', '^branch\\..*\\.vscode-merge-base$'],
        timeout
    );
    if (!done.ok) return '';
    for (const line of done.text.split('\n')) {
        const at = line.indexOf(' ');
        if (at === -1) continue;
        if (line.slice(0, at) === `branch.${branch}.vscode-merge-base`)
            return line.slice(at + 1).trim();
    }
    return '';
}

/** The `%gs` subjects of a ref's reflog, newest first; none for a ref with no reflog. */
async function reflogOf(root: string, ref: string, timeout: number): Promise<string[]> {
    const done = await run(root, ['log', '--walk-reflogs', '--format=%gs', ref, '--'], timeout);
    return done.ok ? done.text.split('\n').filter((line) => line !== '') : [];
}

/**
 * The ref the branch was made from: the one `branch: Created from <X>` entry of its reflog, and for
 * an X of `HEAD` the branch the oldest `checkout: moving from <X> to <branch>` entry of the HEAD
 * reflog left. The empty string when the reflog says nothing.
 */
async function createdFrom(root: string, branch: string, timeout: number): Promise<string> {
    const created = (await reflogOf(root, `refs/heads/${branch}`, timeout))
        .filter((line) => line.startsWith('branch: Created from '))
        .map((line) => line.slice('branch: Created from '.length));
    if (created.length !== 1) return '';
    if (created[0] !== 'HEAD') return created[0];
    const prefix = 'checkout: moving from ';
    const suffix = ` to ${branch}`;
    const moves = (await reflogOf(root, 'HEAD', timeout)).filter(
        (line) => line.startsWith(prefix) && line.endsWith(suffix)
    );
    const last = moves.at(-1);
    return last === undefined ? '' : last.slice(prefix.length, last.length - suffix.length);
}

/**
 * The default branch of the remote the checked-out branch tracks, else of `origin`, else of the
 * first remote that has one: a remote's `HEAD` symbolic ref, in the name a reader types.
 */
function defaultBranchOf(rows: RefRow[], branch: string): string {
    const tracked = rows.find((row) => row.name === `refs/heads/${branch}`)?.upstream ?? '';
    const heads = rows.filter(
        (row) =>
            row.name.startsWith('refs/remotes/') && row.name.endsWith('/HEAD') && row.symref !== ''
    );
    const remoteOf = (row: RefRow): string =>
        row.name.slice('refs/remotes/'.length, -'/HEAD'.length);
    const chosen =
        heads.find((row) => remoteOf(row) === tracked.split('/')[0]) ??
        heads.find((row) => remoteOf(row) === 'origin') ??
        heads.at(0);
    return chosen === undefined ? '' : chosen.symref.slice('refs/remotes/'.length);
}

/**
 * One file of a linked worktree against the same path in the main worktree, both read from disk:
 * the main worktree's on the left. A file one side lacks reads as empty. The repository must be a
 * linked worktree, each side's real location must stay inside its own worktree, and the main
 * worktree must lie under one of the roots, both taken by their real paths, before a file is
 * read from it.
 */
export async function workspaceSides(
    root: string,
    path: string,
    roots: string[],
    text: Record<string, string>,
    timeout: number = TIMEOUT_MS
): Promise<Read<DiffSides[]>> {
    if (path === '.' || !pathInside(root, path)) {
        return refused(words(text, 'server.git.path_outside', path));
    }
    const listed = await worktrees(root, milliseconds(timeout));
    const main = listed.at(0)?.path;
    if (main === undefined) return refused(words(text, 'server.git.no_worktrees'));
    if (realOf(main) === realOf(root)) return refused(words(text, 'server.git.is_main_worktree'));
    if (!permitted(realOf(main), roots.map(realOf)) || !pathInside(main, path)) {
        return refused(words(text, 'server.git.main_worktree_unknown'));
    }
    const left = onDisk(main, path, text);
    const right = onDisk(root, path, text);
    if (!left.ok) return left;
    if (!right.ok) return right;
    const binary = left.value.binary || right.value.binary;
    // The two worktrees' files are read from disk and no git diff compares them: no git line
    // changes, so the pane draws Monaco's own diff.
    return {
        ok: true,
        value: [
            {
                oldPath: path,
                newPath: path,
                head: [],
                binary,
                encoded: left.value.utf8 && right.value.utf8,
                original: binary ? '' : left.value.text,
                modified: binary ? '' : right.value.text
            }
        ]
    };
}

/**
 * The path with every symbolic link resolved. A part that is not there yet is kept as written under
 * the nearest folder that is, so a file a worktree lacks still has a place to be checked against.
 */
function realOf(path: string): string {
    try {
        return realpathSync(path);
    } catch {
        const up = dirname(path);
        return up === path ? path : join(realOf(up), basename(path));
    }
}

type Disk = { text: string; utf8: boolean; binary: boolean };

/** Whether a file's content is binary: not valid UTF-8, else holding a NUL character. */
function isBinary(text: string, utf8: boolean): boolean {
    return !utf8 || text.includes('\0');
}

/**
 * One file as a worktree holds it. A symbolic link is its target text, as git stores it; a file
 * that is not there is empty; a folder, and a file whose folder resolves outside the worktree, are
 * refused.
 */
function onDisk(base: string, path: string, text: Record<string, string>): Read<Disk> {
    const full = join(base, path);
    const folder = realOf(dirname(full));
    const top = realOf(base);
    if (folder !== top && !folder.startsWith(top + sep)) {
        return refused(words(text, 'server.git.path_leaves_worktree', path));
    }
    try {
        const stat = lstatSync(full);
        if (stat.isDirectory()) return refused(words(text, 'server.git.is_a_folder', path));
        const bytes = stat.isSymbolicLink()
            ? readlinkSync(full, { encoding: 'buffer' })
            : readFileSync(full);
        const held = bytes.toString('utf8');
        const utf8 = isUtf8(bytes);
        return { ok: true, value: { text: held, utf8, binary: isBinary(held, utf8) } };
    } catch {
        return { ok: true, value: { text: '', utf8: true, binary: false } };
    }
}
