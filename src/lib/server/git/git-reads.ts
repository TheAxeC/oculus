// Layer 2, server. The reads of GET /api/git, one per parameter the request names: the branch
// listing, one file's diff, a worktree's diff, a page of the graph, one commit's files or its diff
// of one file, a file's blame, its gutter marks, the three versions of a conflicted path, a stash's
// diff and the commits that touched one file. Each is same-origin only and refused for a root this
// server has not published, and each is read when a pane asks rather than published, since the
// channel carries state and these are text or a page of history a reader asked for.
//
// The four diff reads answer `files`, the two versions of each file with git's head lines for it
// (`DiffSides`); a file's own diff also answers what git's attributes say of converting it, which
// decides whether the pane may cut a partial patch from it. A file's and a worktree's diff text
// comes from server/git/git-write.ts, whose `diff` call site has always answered them, and the
// versions from server/core/git/reads.ts, the read-only module, which answers every other read.
// Every read is an option with a real default, so tests/routes/git/git.test.ts drives the endpoint
// without git.

import { json } from '@sveltejs/kit';
import type { DiffAttributes, DiffSides } from '../../data/model/index.ts';
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
    allowedRoots,
    branches,
    fileDiff,
    parseBranches,
    permitted,
    worktreeFrom,
    worktreeRange
} from './git-write.ts';

/**
 * A file's own diff: its files, what git's attributes say of converting it, and whether the path is
 * in conflict, where its worktree side is read against Current's version (stage 2).
 */
export type FileDiff = { files: DiffSides[]; attributes: DiffAttributes; conflicted: boolean };

/** The reads a GET may be answered by, each the real one when the option is absent. */
export type ReadOptions = {
    /** Which roots a request may name; the published workspaces and the hub when absent. */
    rootsFor?: () => string[];
    /** One file's diff; the real `git diff` and `show` when absent. */
    diff?: (
        root: string,
        path: string,
        staged: boolean,
        roots: string[]
    ) => Promise<Read<FileDiff>>;
    /** A worktree's diff against its repository's branch; the real one when absent. */
    worktree?: (root: string, path: string, roots: string[]) => Promise<Read<DiffSides[]>>;
    /** The on-demand reads of server/core/git/reads.ts, by name; the real ones when absent. */
    reads?: Partial<CoreReads>;
};

/** The read-only module's on-demand reads this endpoint answers. */
export type CoreReads = {
    graph: typeof graphPage;
    files: typeof commitFiles;
    commit: typeof commitDiff;
    blame: typeof blameOf;
    marks: typeof lineMarks;
    sides: typeof mergeSides;
    stash: typeof stashDiff;
    log: typeof fileLog;
};

const REAL: CoreReads = {
    graph: graphPage,
    files: commitFiles,
    commit: commitDiff,
    blame: blameOf,
    marks: lineMarks,
    sides: mergeSides,
    stash: stashDiff,
    log: fileLog
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

const UNKNOWN = { error: 'that directory is not a workspace oculus knows' };

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
    root: string,
    path: string,
    staged: boolean,
    roots: string[] = allowedRoots()
): Promise<Read<FileDiff>> {
    const read = await fileDiff(root, path, staged, roots);
    if (!read.ok) return { ok: false, error: read.error };
    const before = staged ? 'HEAD:' : read.ours ? ':2:' : ':';
    const files = sidesOf(root, read.output, before, staged ? ':' : null);
    if (!files.ok) return files;
    const attributes = attributesOf(root, path);
    if (!attributes.ok) return attributes;
    return {
        ok: true,
        value: { files: files.value, attributes: attributes.value, conflicted: read.ours }
    };
}

/** A worktree's diff as its two versions: where it parted from the branch against its HEAD. */
export async function worktreeSides(
    root: string,
    path: string,
    roots: string[] = allowedRoots()
): Promise<Read<DiffSides[]>> {
    const from = await worktreeFrom(root, path, roots);
    if (!from.ok) return { ok: false, error: from.error };
    const read = await worktreeRange(path, from.output);
    if (!read.ok) return { ok: false, error: read.error };
    const base = mergeBase(path, from.output);
    if (!base.ok) return base;
    return sidesOf(path, read.output, `${base.value}:`, 'HEAD:');
}

/**
 * GET /api/git: one read, by the parameter it names. `diff=<root>&path=&staged=<0|1>` answers a
 * file's diff, `worktree=<path>&root=` a worktree's, `graph=<root>&skip=<n>` a page of the graph,
 * `commit=<hash>&root=[&path=]` a commit's files or its diff of one, `blame=<root>&path=`,
 * `marks=<root>&path=`, `sides=<root>&path=`, `log=<root>&path=` (the commits that touched the
 * file, newest first and across renames) and `stash=<ref>&root=`, and `root=` alone the
 * branch listing.
 */
export async function handleGitGet(request: Request, options: ReadOptions): Promise<Response> {
    const parameters = new URL(request.url).searchParams;
    const roots = (options.rootsFor ?? allowedRoots)();
    const reads = { ...REAL, ...options.reads };
    const path = parameters.get('path') ?? '';
    const named = (key: string): string | null => {
        const root = parameters.get(key);
        return root !== null && permitted(root, roots) ? root : null;
    };

    if (parameters.has('diff')) {
        const root = named('diff');
        if (root === null) return json(UNKNOWN, { status: 400, headers: NO_STORE });
        const staged = parameters.get('staged') === '1';
        const read = await (options.diff ?? fileSides)(root, path, staged, roots);
        if (!read.ok) return json({ error: read.error }, { status: 400, headers: NO_STORE });
        return json({ ok: true, ...read.value }, { headers: NO_STORE });
    }
    if (parameters.has('worktree')) {
        const root = named('root');
        if (root === null) return json(UNKNOWN, { status: 400, headers: NO_STORE });
        const tree = parameters.get('worktree') ?? '';
        return answer(await (options.worktree ?? worktreeSides)(root, tree, roots), 'files');
    }
    if (parameters.has('graph')) {
        const root = named('graph');
        if (root === null) return json(UNKNOWN, { status: 400, headers: NO_STORE });
        const skip = Number.parseInt(parameters.get('skip') ?? '0', 10);
        return answer(reads.graph(root, Number.isInteger(skip) ? skip : 0), 'page');
    }
    if (parameters.has('commit')) {
        const root = named('root');
        if (root === null) return json(UNKNOWN, { status: 400, headers: NO_STORE });
        const hash = parameters.get('commit') ?? '';
        if (path === '') return answer(reads.files(root, hash), 'files');
        return answer(reads.commit(root, hash, path), 'files');
    }
    if (parameters.has('stash')) {
        const root = named('root');
        if (root === null) return json(UNKNOWN, { status: 400, headers: NO_STORE });
        return answer(reads.stash(root, parameters.get('stash') ?? ''), 'files');
    }
    for (const key of ['blame', 'marks', 'sides', 'log'] as const) {
        if (!parameters.has(key)) continue;
        const root = named(key);
        if (root === null) return json(UNKNOWN, { status: 400, headers: NO_STORE });
        if (key === 'blame') return answer(reads.blame(root, path), 'lines');
        if (key === 'log') return answer(reads.log(root, path), 'commits');
        if (key === 'marks') return answer(reads.marks(root, path), 'marks');
        return answer(reads.sides(root, path), 'sides');
    }
    const root = named('root');
    if (root === null) return json(UNKNOWN, { status: 400, headers: NO_STORE });
    const listed = await branches(root, roots);
    if (!listed.ok) return json({ error: listed.error }, { status: 400, headers: NO_STORE });
    return json({ ok: true, branches: parseBranches(listed.output) }, { headers: NO_STORE });
}

/** GET /api/git?root=: the branches of one root, for the branch menu; handleGitGet's last read. */
export function handleGitBranches(request: Request, options: ReadOptions): Promise<Response> {
    return handleGitGet(request, options);
}
