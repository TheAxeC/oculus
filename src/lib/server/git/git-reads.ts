// Layer 2, server. The reads of GET /api/git, one per parameter the request names: the branch
// listing, one file's diff, a worktree's diff, a page of the graph, one commit's files or its diff
// of one file, a file's blame, its gutter marks, the three versions of a conflicted path, and a
// stash's diff. Each is same-origin only and refused for a root this server has not published,
// and each is read when a pane asks rather than published, since the channel carries state and
// these are text or a page of history a reader asked for.
//
// The diffs a pane draws come from server/git/git-write.ts, whose `diff` call site has always
// answered them; everything else is server/core/git.ts's, the read-only module. Every read is an
// option with a real default, so tests/routes/git/git.test.ts drives the endpoint without git.

import { sameOrigin } from '../core/auth.ts';
import {
    blameOf,
    commitDiff,
    commitFiles,
    graphPage,
    lineMarks,
    mergeSides,
    stashDiff,
    type Read
} from '../core/git.ts';
import {
    allowedRoots,
    branches,
    fileDiff,
    parseBranches,
    permitted,
    worktreeDiff,
    type Outcome
} from './git-write.ts';

/** The reads a GET may be answered by, each the real one when the option is absent. */
export type ReadOptions = {
    /** Which roots a request may name; the published workspaces and the hub when absent. */
    rootsFor?: () => string[];
    /** One file's diff; the real `git diff` when absent. */
    diff?: (root: string, path: string, staged: boolean, roots: string[]) => Promise<Outcome>;
    /** A worktree's diff against its repository's branch; the real one when absent. */
    worktree?: (root: string, path: string, roots: string[]) => Promise<Outcome>;
    /** The on-demand reads of server/core/git.ts, by name; the real ones when absent. */
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
};

const REAL: CoreReads = {
    graph: graphPage,
    files: commitFiles,
    commit: commitDiff,
    blame: blameOf,
    marks: lineMarks,
    sides: mergeSides,
    stash: stashDiff
};

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

const NOT_HERE = { error: 'the request did not come from this page' };
const UNKNOWN = { error: 'that directory is not a workspace oculus knows' };

/** A read of the read-only module, answered as the endpoint answers every read. */
function answer<T>(read: Read<T>, key: string): Response {
    if (!read.ok) return json(400, { error: read.error });
    return json(200, { ok: true, [key]: read.value });
}

/** An outcome of the writing module's reads, answered the same way. */
function outcome(done: Outcome): Response {
    if (!done.ok) return json(400, { error: done.error });
    return json(200, { ok: true, output: done.output });
}

/**
 * GET /api/git: one read, by the parameter it names. `diff=<root>&path=&staged=<0|1>` answers a
 * file's diff, `worktree=<path>&root=` a worktree's, `graph=<root>&skip=<n>` a page of the graph,
 * `commit=<hash>&root=[&path=]` a commit's files or its diff of one, `blame=<root>&path=`,
 * `marks=<root>&path=`, `sides=<root>&path=` and `stash=<ref>&root=`, and `root=` alone the
 * branch listing.
 */
export async function handleGitGet(request: Request, options: ReadOptions): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) return json(403, NOT_HERE);
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
        if (root === null) return json(400, UNKNOWN);
        const staged = parameters.get('staged') === '1';
        return outcome(await (options.diff ?? fileDiff)(root, path, staged, roots));
    }
    if (parameters.has('worktree')) {
        const root = named('root');
        if (root === null) return json(400, UNKNOWN);
        const tree = parameters.get('worktree') ?? '';
        return outcome(await (options.worktree ?? worktreeDiff)(root, tree, roots));
    }
    if (parameters.has('graph')) {
        const root = named('graph');
        if (root === null) return json(400, UNKNOWN);
        const skip = Number.parseInt(parameters.get('skip') ?? '0', 10);
        return answer(reads.graph(root, Number.isInteger(skip) ? skip : 0), 'page');
    }
    if (parameters.has('commit')) {
        const root = named('root');
        if (root === null) return json(400, UNKNOWN);
        const hash = parameters.get('commit') ?? '';
        if (path === '') return answer(reads.files(root, hash), 'files');
        return answer(reads.commit(root, hash, path), 'output');
    }
    if (parameters.has('stash')) {
        const root = named('root');
        if (root === null) return json(400, UNKNOWN);
        return answer(reads.stash(root, parameters.get('stash') ?? ''), 'output');
    }
    for (const key of ['blame', 'marks', 'sides'] as const) {
        if (!parameters.has(key)) continue;
        const root = named(key);
        if (root === null) return json(400, UNKNOWN);
        if (key === 'blame') return answer(reads.blame(root, path), 'lines');
        if (key === 'marks') return answer(reads.marks(root, path), 'marks');
        return answer(reads.sides(root, path), 'sides');
    }
    const root = named('root');
    if (root === null) return json(400, UNKNOWN);
    const listed = await branches(root, roots);
    if (!listed.ok) return json(400, { error: listed.error });
    return json(200, { ok: true, branches: parseBranches(listed.output) });
}

/** GET /api/git?root=: the branches of one root, for the branch menu; handleGitGet's last read. */
export function handleGitBranches(request: Request, options: ReadOptions): Promise<Response> {
    return handleGitGet(request, options);
}
