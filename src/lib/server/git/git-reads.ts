// Layer 2, server. The reads of GET /api/git, one per parameter the request names: the branch
// listing, one file's diff, a worktree's diff, a page of the graph, one commit's files or its diff
// of one file, a file's blame, its gutter marks, the three versions of a conflicted path, a stash's
// diff, the commits that touched one file, a file as HEAD or the index holds it, a comparison
// between a ref and a commit, the refs a picker lists, and a file of a linked worktree against the
// main worktree's. Each is same-origin only and refused for a root this server has not published,
// and each is read when a pane asks rather than published, since the channel carries state and
// these are text or a page of history a reader asked for.
//
// The four diff reads answer `files`, the two versions of each file with git's head lines for it
// (`DiffSides`); a file's own diff also answers what git's attributes say of converting it, which
// decides whether the pane may cut a partial patch from it. A file's and a worktree's diff text
// comes from server/git/git-diffs.ts, through git-write.ts's `diff` call site, and the
// versions from server/core/git/reads.ts, the read-only module, which answers every other read.
// Every read is an option with a real default, so tests/routes/git/git.test.ts drives the endpoint
// without git.

import { permitted } from '../core/paths.ts';
import { words } from '../core/words.ts';
import { json } from '@sveltejs/kit';
import { textCatalog } from '../../data/sources/config.ts';
import type { DiffAttributes, DiffSides, GitBlameLine } from '../../data/model/index.ts';
import {
    attributesOf,
    blameOf,
    commitDiff,
    commitFiles,
    graphPage,
    lineMarks,
    mergeBase,
    mergeSides,
    sidesOf,
    stashDiff
} from '../core/git/reads.ts';
import { fileLog } from '../core/git/files.ts';
import type { Read } from '../core/git/run.ts';
import {
    blameAt,
    branchBase,
    compareFiles,
    compareSides,
    headFile,
    refNames,
    workspaceSides,
    type HeadStage
} from '../core/git/compare.ts';
import type { GitCredentials } from '../core/git/credentials.ts';
import { allowedRoots, branches, parseBranches, type GitAt } from './git-write.ts';
import { fileDiff, worktreeFrom, worktreeRange } from './git-diffs.ts';

/**
 * A file's own diff: its files, what git's attributes say of converting it, and whether the path is
 * in conflict, where its worktree side is read against Current's version (stage 2).
 */
export type FileDiff = { files: DiffSides[]; attributes: DiffAttributes; conflicted: boolean };

/** The reads a GET may be answered by, each the real one when the option is absent. */
export type ReadOptions = {
    /** What every git a read starts is given: the server context's (core/git/credentials.ts). */
    credentials: GitCredentials;
    /**
     * The request's merged configuration, which holds the text catalog the sentences come from; a
     * caller that names none words no sentence, and a read that has one to say then fails on the
     * missing catalog key.
     */
    config?: Record<string, unknown>;
    /** Which roots a request may name; the published workspaces and the hub when absent. */
    rootsFor?: () => string[];
    /** One file's diff; the real `git diff` and `show` when absent. */
    diff?: (
        at: GitAt,
        path: string,
        staged: boolean,
        text: Record<string, string>,
        roots: string[]
    ) => Promise<Read<FileDiff>>;
    /** A worktree's diff against its repository's branch; the real one when absent. */
    worktree?: (
        at: GitAt,
        path: string,
        text: Record<string, string>,
        roots: string[]
    ) => Promise<Read<DiffSides[]>>;
    /** The on-demand reads of server/core/git/, by name; the real ones when absent. */
    reads?: Partial<CoreReads>;
};

/** The read-only module's on-demand reads this endpoint answers. */
export type CoreReads = {
    graph: typeof graphPage;
    files: typeof commitFiles;
    commit: typeof commitDiff;
    blame: (
        credentials: GitCredentials,
        root: string,
        path: string,
        text: Record<string, string>,
        stage?: HeadStage
    ) => Promise<Read<GitBlameLine[]>>;
    marks: typeof lineMarks;
    sides: typeof mergeSides;
    stash: typeof stashDiff;
    log: typeof fileLog;
    head: typeof headFile;
    compareFiles: typeof compareFiles;
    compareSides: typeof compareSides;
    refs: typeof refNames;
    workspace: typeof workspaceSides;
    base: typeof branchBase;
};

const REAL: CoreReads = {
    graph: graphPage,
    files: commitFiles,
    commit: commitDiff,
    blame: (credentials, root, path, text, stage) =>
        stage === undefined
            ? blameOf(credentials, root, path, text)
            : blameAt(credentials, root, path, stage, text),
    marks: lineMarks,
    sides: mergeSides,
    stash: stashDiff,
    log: fileLog,
    head: headFile,
    compareFiles,
    compareSides,
    refs: refNames,
    workspace: workspaceSides,
    base: branchBase
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The answer to a root this server has not published. */
function unknown(text: Record<string, string>): Response {
    return json(
        { error: words(text, 'server.git.unknown_directory') },
        { status: 400, headers: NO_STORE }
    );
}

/** The answer to a `stage` that names neither side a file is read at. */
function notASide(text: Record<string, string>): Response {
    return json(
        { error: words(text, 'server.git.not_a_side') },
        { status: 400, headers: NO_STORE }
    );
}

/** A read of the read-only module, answered as the endpoint answers every read. */
function answer<T>(read: Read<T>, key: string): Response {
    if (!read.ok) return json({ error: read.error }, { status: 400, headers: NO_STORE });
    return json({ ok: true, [key]: read.value }, { headers: NO_STORE });
}

/**
 * One file's diff as its two versions: the index against the worktree, or HEAD against the index
 * when staged, and for a path in conflict Current's version (stage 2) against the worktree.
 */
export async function fileSides(
    at: GitAt,
    path: string,
    staged: boolean,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Read<FileDiff>> {
    const { root, credentials } = at;
    const read = await fileDiff(at, path, staged, text, roots);
    if (!read.ok) return { ok: false, error: read.error };
    const before = staged ? 'HEAD:' : read.ours ? ':2:' : ':';
    const files = await sidesOf(credentials, root, read.output, before, staged ? ':' : null, text);
    if (!files.ok) return files;
    const attributes = await attributesOf(credentials, root, path, text);
    if (!attributes.ok) return attributes;
    return {
        ok: true,
        value: { files: files.value, attributes: attributes.value, conflicted: read.ours }
    };
}

/** A worktree's diff as its two versions: where it parted from the branch against its HEAD. */
export async function worktreeSides(
    at: GitAt,
    path: string,
    text: Record<string, string>,
    roots: string[] = allowedRoots()
): Promise<Read<DiffSides[]>> {
    const from = await worktreeFrom(at, path, text, roots);
    if (!from.ok) return { ok: false, error: from.error };
    const read = await worktreeRange({ ...at, root: path }, from.output);
    if (!read.ok) return { ok: false, error: read.error };
    const base = await mergeBase(at.credentials, path, from.output, text);
    if (!base.ok) return base;
    return sidesOf(at.credentials, path, read.output, `${base.value}:`, 'HEAD:', text);
}

/**
 * GET /api/git: one read, by the parameter it names. `diff=<root>&path=&staged=<0|1>` answers a
 * file's diff, `worktree=<path>&root=` a worktree's, `graph=<root>&skip=<n>` a page of the graph,
 * `commit=<hash>&root=[&path=]` a commit's files or its diff of one,
 * `blame=<root>&path=[&stage=head|index]` (who last changed each line of the worktree's file, of
 * the last commit's version or of the staged text; any other `stage` is refused),
 * `marks=<root>&path=`, `sides=<root>&path=`, `log=<root>&path=[&before=<hash>]` (a page of the
 * commits that touched the file, newest first and across renames and copies, answered with `more`
 * for whether older commits remain; `before` names the last commit of the page read, the page being
 * the rows after it, and `path` is the file as the first page named it; a `before` that is no hash
 * or is in no row of the log is refused) and `stash=<ref>&root=`, `head=<root>&path=&stage=` a file
 * as HEAD or the index holds it, `compare=<root>&from=<ref>&to=<hash>[&path=]` a comparison,
 * `refs=<root>` the refs a picker lists, `workspace=<root>&path=` a linked worktree's file against
 * the main worktree's, and `root=` alone the branch listing.
 */
export async function handleGitGet(request: Request, options: ReadOptions): Promise<Response> {
    const parameters = new URL(request.url).searchParams;
    const roots = (options.rootsFor ?? allowedRoots)();
    const text = options.config === undefined ? {} : textCatalog(options.config);
    const reads = { ...REAL, ...options.reads };
    const path = parameters.get('path') ?? '';
    const named = (key: string): string | null => {
        const root = parameters.get(key);
        return root !== null && permitted(root, roots) ? root : null;
    };
    const { credentials } = options;
    const at = (root: string): GitAt => ({ root, credentials });

    if (parameters.has('diff')) {
        const root = named('diff');
        if (root === null) return unknown(text);
        const staged = parameters.get('staged') === '1';
        const read = await (options.diff ?? fileSides)(at(root), path, staged, text, roots);
        if (!read.ok) return json({ error: read.error }, { status: 400, headers: NO_STORE });
        return json({ ok: true, ...read.value }, { headers: NO_STORE });
    }
    if (parameters.has('worktree')) {
        const root = named('root');
        if (root === null) return unknown(text);
        const tree = parameters.get('worktree') ?? '';
        const sides = options.worktree ?? worktreeSides;
        return answer(await sides(at(root), tree, text, roots), 'files');
    }
    if (parameters.has('graph')) {
        const root = named('graph');
        if (root === null) return unknown(text);
        const skip = Number.parseInt(parameters.get('skip') ?? '0', 10);
        const first = !Number.isInteger(skip) || skip <= 0;
        const page = await reads.graph(credentials, root, first ? 0 : skip, text);
        // The base is the first page's alone: it belongs to the branch, not to a stretch of
        // history.
        if (!page.ok || !first) return answer(page, 'page');
        const base = await reads.base(credentials, root, text);
        return answer({ ok: true, value: { ...page.value, base } }, 'page');
    }
    if (parameters.has('head')) {
        const root = named('head');
        if (root === null) return unknown(text);
        const stage = parameters.get('stage');
        if (stage !== 'head' && stage !== 'index') return notASide(text);
        const read = await reads.head(credentials, root, stage, path, text);
        if (!read.ok) return json({ error: read.error }, { status: 400, headers: NO_STORE });
        return json({ ok: true, ...read.value }, { headers: NO_STORE });
    }
    if (parameters.has('compare')) {
        const root = named('compare');
        if (root === null) return unknown(text);
        const [from, to] = [parameters.get('from') ?? '', parameters.get('to') ?? ''];
        if (path === '') {
            return answer(await reads.compareFiles(credentials, root, from, to, text), 'files');
        }
        return answer(await reads.compareSides(credentials, root, from, to, path, text), 'files');
    }
    if (parameters.has('refs')) {
        const root = named('refs');
        if (root === null) return unknown(text);
        return answer(await reads.refs(credentials, root, text), 'refs');
    }
    if (parameters.has('workspace')) {
        const root = named('workspace');
        if (root === null) return unknown(text);
        return answer(await reads.workspace(credentials, root, path, roots, text), 'files');
    }
    if (parameters.has('commit')) {
        const root = named('root');
        if (root === null) return unknown(text);
        const hash = parameters.get('commit') ?? '';
        if (path === '') return answer(await reads.files(credentials, root, hash, text), 'files');
        return answer(await reads.commit(credentials, root, hash, path, text), 'files');
    }
    if (parameters.has('stash')) {
        const root = named('root');
        if (root === null) return unknown(text);
        const ref = parameters.get('stash') ?? '';
        return answer(await reads.stash(credentials, root, ref, text), 'files');
    }
    for (const key of ['blame', 'marks', 'sides', 'log'] as const) {
        if (!parameters.has(key)) continue;
        const root = named(key);
        if (root === null) return unknown(text);
        if (key === 'blame') {
            const stage = parameters.get('stage');
            if (stage !== null && stage !== 'head' && stage !== 'index') return notASide(text);
            const lines = await reads.blame(credentials, root, path, text, stage ?? undefined);
            return answer(lines, 'lines');
        }
        if (key === 'log') {
            const before = parameters.has('before') ? (parameters.get('before') ?? '') : undefined;
            const page = await reads.log(credentials, root, path, text, before);
            if (!page.ok) return json({ error: page.error }, { status: 400, headers: NO_STORE });
            return json({ ok: true, ...page.value }, { headers: NO_STORE });
        }
        if (key === 'marks')
            return answer(await reads.marks(credentials, root, path, text), 'marks');
        return answer(await reads.sides(credentials, root, path, text), 'sides');
    }
    const root = named('root');
    if (root === null) return unknown(text);
    const listed = await branches(at(root), text, roots);
    if (!listed.ok) return json({ error: listed.error }, { status: 400, headers: NO_STORE });
    return json({ ok: true, branches: parseBranches(listed.output) }, { headers: NO_STORE });
}

/** GET /api/git?root=: the branches of one root, for the branch menu; handleGitGet's last read. */
export function handleGitBranches(request: Request, options: ReadOptions): Promise<Response> {
    return handleGitGet(request, options);
}
