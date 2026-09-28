// Layer 2, server. The /api/git endpoint. A route module may export only its verbs, so everything
// the request does is here and src/routes/api/(git)/git/+server.ts is the few lines that join them,
// the pattern lib/server/edit/writes.ts and lib/server/machine/pty/routes.ts already hold.
//
// A GET reads, reaching this module only past the origin guard in src/hooks.server.ts's `handle`;
// server/git/git-reads.ts answers it. A POST writes, and carries the write token and, for the
// actions that can lose work or move a branch (CONFIRMED below), a `confirm: true` the page sets
// only from the confirm dialog.
//
// The roots a write may name come from the last published `git` payload, which is every root the
// file browser serves and every workspace a session names, plus the hub itself;
// server/git/git-write.ts checks the same thing again for itself, since a refusal that lives only
// in a route is a refusal that disappears with the next caller.
//
// Every operation is an option with a real default, so tests/routes/git/git.test.ts drives the
// whole endpoint without running git at all.

import { json } from '@sveltejs/kit';
import { textCatalog } from '../../data/sources/config.ts';
import { byKey, strings } from '../../data/helpers/guards.ts';
import { tokenedBody } from '../core/auth.ts';
import { text } from '../core/json.ts';
import {
    allowedRoots,
    commit,
    createBranch,
    createWorktree,
    discard,
    merge,
    permitted,
    push,
    removeWorktree,
    stage,
    switchBranch,
    unstage,
    type Outcome
} from './git-write.ts';
import { fetchAll, publish, pull, pushTags, sync } from './git-remote.ts';
import {
    abortMerge,
    acceptDeletion,
    applyHunk,
    continueRebase,
    discardAll,
    markResolved,
    resolveMerge,
    stageAll,
    unstageAll
} from './git-index.ts';
import { createTag, deleteTag, stash, stashAct, type StashMode } from './git-refs.ts';
import { messageModel, suggestMessage, type MessageOptions } from './git-message.ts';
import { handleGitBranches, handleGitGet, type ReadOptions } from './git-reads.ts';

export { handleGitBranches, handleGitGet };

/** Every action POST /api/git knows. */
export const ACTIONS = [
    'stage',
    'unstage',
    'discard',
    'stagePatch',
    'unstagePatch',
    'revertPatch',
    'stageAll',
    'unstageAll',
    'discardAll',
    'commit',
    'push',
    'pull',
    'fetch',
    'sync',
    'publish',
    'createBranch',
    'switchBranch',
    'createWorktree',
    'removeWorktree',
    'merge',
    'abortMerge',
    'continueRebase',
    'resolve',
    'markResolved',
    'acceptDeletion',
    'stash',
    'stashApply',
    'stashPop',
    'stashDrop',
    'createTag',
    'deleteTag',
    'pushTags',
    'suggest'
];

/**
 * The refusal of an action that can lose work or move a branch and came without the `confirm: true`
 * the page sets only from its confirm dialog, or null when the action needs none or carries it.
 * The answer is never stored, like every answer of this route and server/git/deposit-routes.ts,
 * the two routes that ask for a confirm.
 */
export function unconfirmed(
    confirmed: readonly string[],
    action: string,
    fields: Record<string, unknown>
): Response | null {
    if (!confirmed.includes(action) || fields.confirm === true) return null;
    return json(
        { error: 'this action needs the page to confirm it' },
        { status: 400, headers: { 'cache-control': 'no-store' } }
    );
}

/**
 * The actions that may lose work, move a branch or reach a remote's branches, and therefore need
 * the page's confirm. A stage, an unstage, a fetch, a stash made, applied or popped, a tag made and
 * a resolved path are taken back by the reader in one press, as in VS Code, and ask nothing; a
 * deletion taken removes the file from the worktree, so it asks.
 */
export const CONFIRMED = [
    'commit',
    'push',
    'pull',
    'sync',
    'publish',
    'discard',
    'revertPatch',
    'discardAll',
    'createBranch',
    'switchBranch',
    'createWorktree',
    'removeWorktree',
    'merge',
    'abortMerge',
    'continueRebase',
    'acceptDeletion',
    'stashDrop',
    'deleteTag',
    'pushTags'
];

/** One action, its root and whatever fields it takes. */
export type GitRun = (
    action: string,
    root: string,
    fields: Record<string, unknown>,
    roots: string[]
) => Promise<Outcome>;

export type GitOptions = {
    /** The request's merged configuration, which holds the commit-message instruction and model. */
    config: Record<string, unknown>;
    /** What an action does; the real git-write.ts operations when absent. */
    run?: GitRun;
    /** Which roots a request may name; the published workspaces and the hub when absent. */
    rootsFor?: () => string[];
    /** How a message is suggested; the real `claude -p` when absent. */
    suggest?: (root: string, roots: string[]) => Promise<Outcome>;
    /** Overrides for the default diff reader and message subprocess. */
    message?: MessageOptions;
    /** Re-read a root after a write, whatever git answered. */
    refresh?: (root: string) => void;
} & ReadOptions;

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** A field the page sends as a string, or as nothing, which reads as its default word. */
function word<T extends string>(value: unknown, fallback: T): T {
    return typeof value === 'string' && value !== '' ? (value as T) : fallback;
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
    config: Record<string, unknown>,
    options: MessageOptions = {}
): Promise<Outcome> {
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
    stagePatch: (_action, root, fields, roots) =>
        applyHunk(root, text(fields.patch), 'stage', roots),
    unstagePatch: (_action, root, fields, roots) =>
        applyHunk(root, text(fields.patch), 'unstage', roots),
    revertPatch: (_action, root, fields, roots) =>
        applyHunk(root, text(fields.patch), 'revert', roots),
    stageAll: (_action, root, fields, roots) => stageAll(root, text(fields.group), roots),
    unstageAll: (_action, root, _fields, roots) => unstageAll(root, roots),
    discardAll: (_action, root, _fields, roots) => discardAll(root, roots),
    commit: (_action, root, fields, roots) =>
        commit(root, text(fields.message), roots, fields.amend === true),
    push: (_action, root, _fields, roots) => push(root, roots),
    pull: (_action, root, _fields, roots) => pull(root, roots),
    fetch: (_action, root, _fields, roots) => fetchAll(root, roots),
    sync: (_action, root, _fields, roots) => sync(root, roots),
    publish: (_action, root, fields, roots) => publish(root, text(fields.remote), roots),
    createBranch: (_action, root, fields, roots) => createBranch(root, text(fields.name), roots),
    switchBranch: (_action, root, fields, roots) => switchBranch(root, text(fields.name), roots),
    createWorktree: (_action, root, fields, roots) =>
        createWorktree(root, text(fields.name), roots),
    removeWorktree: (_action, root, fields, roots) =>
        removeWorktree(root, text(fields.path), roots),
    merge: (_action, root, fields, roots) => merge(root, text(fields.branch), roots),
    abortMerge: (_action, root, _fields, roots) => abortMerge(root, roots),
    continueRebase: (_action, root, _fields, roots) => continueRebase(root, roots),
    resolve: (_action, root, fields, roots) =>
        resolveMerge(root, text(fields.path), text(fields.content), roots),
    markResolved: (_action, root, fields, roots) => markResolved(root, text(fields.path), roots),
    acceptDeletion: (_action, root, fields, roots) =>
        acceptDeletion(root, text(fields.path), roots),
    stash: (_action, root, fields, roots) =>
        stash(root, word<StashMode>(fields.mode, 'tracked'), text(fields.message), roots),
    stashApply: (_action, root, fields, roots) => stashAct(root, 'apply', text(fields.ref), roots),
    stashPop: (_action, root, fields, roots) => stashAct(root, 'pop', text(fields.ref), roots),
    stashDrop: (_action, root, fields, roots) => stashAct(root, 'drop', text(fields.ref), roots),
    createTag: (_action, root, fields, roots) =>
        createTag(root, text(fields.name), text(fields.message), roots),
    deleteTag: (_action, root, fields, roots) => deleteTag(root, text(fields.name), roots),
    pushTags: (_action, root, _fields, roots) => pushTags(root, roots)
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
 * POST /api/git: one action on one root. The order is the order of the refusals: the token, the
 * body, the action, the root, the confirm, and only then git.
 */
export async function handleGit(
    request: Request,
    token: string,
    options: GitOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE });
    if (read instanceof Response) return read;
    const body = read.body;
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json({ error: 'the body is not a git action' }, { status: 400, headers: NO_STORE });
    }
    const fields = body as Record<string, unknown>;
    const action = text(fields.action);
    if (!ACTIONS.includes(action)) {
        return json({ error: 'the body is not a git action' }, { status: 400, headers: NO_STORE });
    }
    const root = text(fields.root);
    const roots = (options.rootsFor ?? allowedRoots)();
    if (!inside(root, roots)) {
        return json(
            { error: 'that directory is not a workspace oculus knows' },
            { status: 400, headers: NO_STORE }
        );
    }
    const refused = unconfirmed(CONFIRMED, action, fields);
    if (refused !== null) return refused;

    if (action === 'suggest') {
        const answer = await (
            options.suggest ??
            ((selected, allowed) => suggestFor(selected, allowed, options.config, options.message))
        )(root, roots);
        if (!answer.ok) return json({ error: answer.error }, { status: 400, headers: NO_STORE });
        return json({ ok: true, output: answer.output }, { headers: NO_STORE });
    }

    const outcome = await (options.run ?? operate)(action, root, fields, roots);
    // The watcher would find this at its next event, up to two seconds later and only if the write
    // touched a path it watches; re-reading here is what makes the panel answer the click. A write
    // git refused may still have moved the repository (a merge that stopped on conflicts leaves
    // them in the index), so it is read again either way.
    options.refresh?.(root);
    if (!outcome.ok) return json({ error: outcome.error }, { status: 400, headers: NO_STORE });
    return json({ ok: true, output: outcome.output }, { headers: NO_STORE });
}

/** Whether a root is one of the allowed ones, or a directory under one. git-write.ts's own rule. */
function inside(root: string, roots: string[]): boolean {
    return permitted(root, roots);
}
