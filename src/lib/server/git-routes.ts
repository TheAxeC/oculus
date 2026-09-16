// Layer 2, server. The /api/git endpoint. A route module may export only its verbs, so everything
// the request does is here and src/routes/api/git/+server.ts is the few lines that join them, the
// pattern lib/server/writes.ts and lib/server/pty/routes.ts already hold.
//
// A GET reads and is same-origin only, like every read: the branches of one root, one file's diff,
// or what a worktree holds that its repository does not. A POST writes, and carries three things:
// the write token, this application's own origin, and, for the eight actions that can lose work
// (commit, push, discard, createBranch, switchBranch, createWorktree, removeWorktree, merge), a
// `confirm: true` the page sets only from the confirm dialog.
//
// The roots a write may name come from the last published `git` payload, which is every root the
// file browser serves and every workspace a session names, plus the hub itself; server/git-write.ts
// checks the same thing again for itself, since a refusal that lives only in a route is a refusal
// that disappears with the next caller.
//
// Every operation is an option with a real default, so tests/routes/git.test.ts drives the whole
// endpoint without running git at all.

import { loadConfig, textCatalog } from '../data/sources/config.ts';
import { byKey, strings } from '../data/guards.ts';
import { hasToken, sameOrigin } from './auth.ts';
import {
    allowedRoots,
    branches,
    commit,
    createBranch,
    createWorktree,
    discard,
    fileDiff,
    merge,
    parseBranches,
    permitted,
    push,
    removeWorktree,
    stage,
    switchBranch,
    unstage,
    worktreeDiff,
    type Outcome
} from './git-write.ts';
import { messageModel, suggestMessage, type MessageOptions } from './git-message.ts';

/** Every action POST /api/git knows. */
export const ACTIONS = [
    'stage',
    'unstage',
    'discard',
    'commit',
    'push',
    'createBranch',
    'switchBranch',
    'createWorktree',
    'removeWorktree',
    'merge',
    'suggest'
];

/** The actions that may lose work, and therefore need the page's confirm. */
export const CONFIRMED = [
    'commit',
    'push',
    'discard',
    'createBranch',
    'switchBranch',
    'createWorktree',
    'removeWorktree',
    'merge'
];

/** One action, its root and whatever fields it takes. */
export type GitRun = (
    action: string,
    root: string,
    fields: Record<string, unknown>,
    roots: string[]
) => Promise<Outcome>;

export type GitOptions = {
    /** The engine directory the commit-message instruction and model are read from. */
    engine: string;
    /** What an action does; the real git-write.ts operations when absent. */
    run?: GitRun;
    /** Which roots a request may name; the published workspaces and the hub when absent. */
    rootsFor?: () => string[];
    /** How a message is suggested; the real `claude -p` when absent. */
    suggest?: (root: string, roots: string[]) => Promise<Outcome>;
    /** Overrides for the default diff reader and message subprocess. */
    message?: MessageOptions;
    /** Re-read a root after a successful write. */
    refresh?: (root: string) => void;
    /** One file's diff; the real `git diff` when absent. */
    diff?: (root: string, path: string, staged: boolean, roots: string[]) => Promise<Outcome>;
    /** A worktree's diff against its repository's branch; the real one when absent. */
    worktree?: (root: string, path: string, roots: string[]) => Promise<Outcome>;
};

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** The required catalog instruction used to suggest a commit message. */
export function messagePrompt(config: Record<string, unknown>): string {
    const prompt = byKey(textCatalog(config), 'git.message_prompt');
    if (prompt === undefined) {
        throw new Error('text key not in the text catalog (config/text/): git.message_prompt');
    }
    return prompt;
}

/** The real suggestion: the instruction from the catalog, the model from config/behavior.yml. */
async function suggestFor(
    root: string,
    roots: string[],
    engine: string,
    options: MessageOptions = {}
): Promise<Outcome> {
    const { config } = loadConfig(engine);
    return suggestMessage(
        root,
        messagePrompt(config),
        { ...options, model: messageModel(config) },
        roots
    );
}

/** The real operations, one per action. `suggest` is answered before this is reached. */
const OPERATIONS: Record<string, GitRun> = {
    stage: (_action, root, fields, roots) => stage(root, strings(fields.paths), roots),
    unstage: (_action, root, fields, roots) => unstage(root, strings(fields.paths), roots),
    discard: (_action, root, fields, roots) => discard(root, strings(fields.paths), roots),
    commit: (_action, root, fields, roots) => commit(root, text(fields.message), roots),
    push: (_action, root, _fields, roots) => push(root, roots),
    createBranch: (_action, root, fields, roots) => createBranch(root, text(fields.name), roots),
    switchBranch: (_action, root, fields, roots) => switchBranch(root, text(fields.name), roots),
    createWorktree: (_action, root, fields, roots) =>
        createWorktree(root, text(fields.name), roots),
    removeWorktree: (_action, root, fields, roots) =>
        removeWorktree(root, text(fields.path), roots),
    merge: (_action, root, fields, roots) => merge(root, text(fields.branch), roots)
};

async function operate(
    action: string,
    root: string,
    fields: Record<string, unknown>,
    roots: string[]
): Promise<Outcome> {
    const operation = byKey(OPERATIONS, action);
    if (operation === undefined) {
        return { ok: false, output: '', error: `no git action named ${action}` };
    }
    return operation(action, root, fields, roots);
}

/**
 * GET /api/git: one of three reads, by the parameter it names. `diff=<root>&path=<file>&staged=<0|1>`
 * answers one file's diff, `worktree=<path>&root=<root>` answers what that worktree holds that its
 * repository's branch does not, and `root=` answers the branch listing. Each is same-origin only and
 * refused for a root this server has not published; the diffs are fetched when a pane opens rather
 * than published, since the channel carries state and not text.
 */
export async function handleGitGet(request: Request, options: GitOptions): Promise<Response> {
    const parameters = new URL(request.url).searchParams;
    if (parameters.has('diff')) return handleGitDiff(request, parameters, options);
    if (parameters.has('worktree')) return handleGitWorktree(request, parameters, options);
    return handleGitBranches(request, options);
}

/** One file's diff, staged or not. */
async function handleGitDiff(
    request: Request,
    parameters: URLSearchParams,
    options: GitOptions
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const root = parameters.get('diff') ?? '';
    const roots = (options.rootsFor ?? allowedRoots)();
    if (!inside(root, roots)) {
        return json(400, { error: 'that directory is not a workspace oculus knows' });
    }
    const staged = parameters.get('staged') === '1';
    const outcome = await (options.diff ?? fileDiff)(
        root,
        parameters.get('path') ?? '',
        staged,
        roots
    );
    if (!outcome.ok) return json(400, { error: outcome.error });
    return json(200, { ok: true, output: outcome.output });
}

/**
 * What one worktree holds that its repository's checked-out branch does not. The request names both
 * the worktree and the repository it belongs to: a worktree of the hub is itself a workspace on the
 * `git` channel, so a root worked out from the path would be the worktree.
 */
async function handleGitWorktree(
    request: Request,
    parameters: URLSearchParams,
    options: GitOptions
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const path = parameters.get('worktree') ?? '';
    const root = parameters.get('root') ?? '';
    const roots = (options.rootsFor ?? allowedRoots)();
    if (!inside(root, roots)) {
        return json(400, { error: 'that directory is not a workspace oculus knows' });
    }
    const outcome = await (options.worktree ?? worktreeDiff)(root, path, roots);
    if (!outcome.ok) return json(400, { error: outcome.error });
    return json(200, { ok: true, output: outcome.output });
}

/**
 * GET /api/git?root=: the branches of one root, for the branch menu. A read, so it carries no token,
 * but it is still refused to another origin, and to a root this server has not published.
 */
export async function handleGitBranches(request: Request, options: GitOptions): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const root = new URL(request.url).searchParams.get('root') ?? '';
    const roots = (options.rootsFor ?? allowedRoots)();
    if (!inside(root, roots)) {
        return json(400, { error: 'that directory is not a workspace oculus knows' });
    }
    const outcome = await branches(root, roots);
    if (!outcome.ok) return json(400, { error: outcome.error });
    return json(200, { ok: true, branches: parseBranches(outcome.output) });
}

/**
 * POST /api/git: one action on one root. The order is the order of the refusals: the origin, the
 * token, the body, the action, the root, the confirm, and only then git.
 */
export async function handleGit(
    request: Request,
    token: string,
    options: GitOptions
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return json(403, { error: 'the write token is missing or stale' });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json(400, { error: 'the body is not a git action' });
    }
    const fields = body as Record<string, unknown>;
    const action = text(fields.action);
    if (!ACTIONS.includes(action)) {
        return json(400, { error: 'the body is not a git action' });
    }
    const root = text(fields.root);
    const roots = (options.rootsFor ?? allowedRoots)();
    if (!inside(root, roots)) {
        return json(400, { error: 'that directory is not a workspace oculus knows' });
    }
    if (CONFIRMED.includes(action) && fields.confirm !== true) {
        return json(400, { error: 'this action needs the page to confirm it' });
    }

    if (action === 'suggest') {
        const answer = await (
            options.suggest ??
            ((selected, allowed) => suggestFor(selected, allowed, options.engine, options.message))
        )(root, roots);
        if (!answer.ok) return json(400, { error: answer.error });
        return json(200, { ok: true, output: answer.output });
    }

    const outcome = await (options.run ?? operate)(action, root, fields, roots);
    if (!outcome.ok) return json(400, { error: outcome.error });
    // The watcher would find this at its next event, up to two seconds later and only if the write
    // touched a path it watches; re-reading here is what makes the panel answer the click.
    options.refresh?.(root);
    return json(200, { ok: true, output: outcome.output });
}

/** Whether a root is one of the allowed ones, or a directory under one. git-write.ts's own rule. */
function inside(root: string, roots: string[]): boolean {
    return permitted(root, roots);
}
