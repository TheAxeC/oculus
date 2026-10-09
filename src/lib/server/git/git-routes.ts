// Layer 2, server. The /api/git endpoint. A route module may export only its verbs, so everything
// the request does is here and src/routes/api/(git)/git/+server.ts is the few lines that join them,
// the pattern lib/server/edit/writes.ts and lib/server/machine/pty/routes.ts already hold.
//
// A GET reads, reaching this module only past the origin guard in src/hooks.server.ts's `handle`;
// server/git/git-reads.ts answers it. A POST writes, and carries the write token and, for the
// actions that can lose work or move a branch (CONFIRMED below), a `confirm: true` the page sets
// only from the confirm dialog.
//
// A write is registered with server/core/git/running.ts under its root while it runs, and the
// action `cancel` (behind the token, with no confirm) aborts the write in flight on the root it
// names. A write that ended without a reason of git's own is worded from the `server.git` group of
// the catalog (`failureLine` of server/core/git/failure.ts).
//
// The roots a write may name come from the last published `git` payload, which is every root the
// file browser serves and every workspace a session names, plus the hub itself;
// server/git/git-write.ts checks the same thing again for itself, since a refusal that lives only
// in a route is a refusal that disappears with the next caller.
//
// Every operation is an option with a real default, so tests/routes/git/git.test.ts drives the
// whole endpoint without running git at all.

import { permitted } from '../core/paths.ts';
import { json } from '@sveltejs/kit';
import trashLibrary from 'trash';
import { z } from 'zod';
import { textCatalog } from '../../data/sources/config.ts';
import { byKey, isMap } from '../../data/helpers/guards.ts';
import { tokenedBody } from '../core/auth.ts';
import { failureLine } from '../core/git/failure.ts';
import { createRunningGit, type RunningGit } from '../core/git/running.ts';
import { words } from '../core/words.ts';
import { chained, type FsWrites } from '../core/json.ts';
import type { Guard } from '../files/fs/ops.ts';
import {
    allowedRoots,
    commit,
    createBranch,
    createWorktree,
    discard,
    failed,
    push,
    removeWorktree,
    stage,
    switchBranch,
    switchDetached,
    unstage,
    type Outcome
} from './git-write.ts';
import { fetchAll, publish, pull, pushTags, sync } from './git-remote.ts';
import {
    abortMerge,
    acceptDeletion,
    addToGitignore,
    applyHunk,
    cherryPick,
    continueRebase,
    discardAll,
    markResolved,
    merge,
    resolveMerge,
    stageAll,
    trashUntracked,
    unstageAll
} from './git-index.ts';
import {
    createTag,
    deleteBranch,
    deleteBranchAnyway,
    deleteTag,
    stash,
    stashAct,
    type StashMode
} from './git-refs.ts';
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
    'trashUntracked',
    'ignore',
    'cherryPick',
    'checkoutDetached',
    'deleteBranch',
    'deleteBranchAnyway',
    'suggest',
    'cancel'
] as const;

/**
 * The refusal of an action that can lose work or move a branch and came without the `confirm: true`
 * the page sets only from its confirm dialog, or null when the action needs none or carries it.
 * The answer is never stored, like every answer of this route and server/git/deposit-routes.ts,
 * the two routes that ask for a confirm.
 */
export function unconfirmed(
    confirmed: readonly string[],
    action: string,
    fields: Record<string, unknown>,
    text: Record<string, string>
): Response | null {
    if (!confirmed.includes(action) || fields.confirm === true) return null;
    return json(
        { error: words(text, 'server.git.confirm_needed') },
        { status: 400, headers: { 'cache-control': 'no-store' } }
    );
}

/**
 * The actions that may lose work, move a branch or reach a remote's branches, and therefore need
 * the page's confirm. A stage, an unstage, a fetch, a stash made, applied or popped, a tag made and
 * a resolved path are taken back by the reader in one press, as in VS Code, and ask nothing; a
 * deletion taken removes the file from the worktree, so it asks.
 */
const CONFIRMED = [
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
    'pushTags',
    'trashUntracked',
    'cherryPick',
    'checkoutDetached',
    'deleteBranch',
    'deleteBranchAnyway'
];

/**
 * One action, its root and whatever fields it takes. The last argument is the signal Cancel aborts
 * to end the run.
 */
export type GitRun = (
    action: string,
    root: string,
    fields: Record<string, unknown>,
    roots: string[],
    signal?: AbortSignal
) => Promise<Outcome>;

export type GitOptions = {
    /**
     * The request's merged configuration, which holds the commit-message instruction and model and
     * the text catalog every sentence of a write is worded from.
     */
    config: Record<string, unknown>;
    /** The `claude_bin` of local.yml: the program that suggests a commit message. */
    claudeBin: string;
    /** What an action does; the real git-write.ts operations when absent. */
    run?: GitRun;
    /** Which roots a request may name; the published workspaces and the hub when absent. */
    rootsFor?: () => string[];
    /** How a message is suggested; the real `claude -p` when absent. */
    suggest?: (root: string, roots: string[]) => Promise<Outcome>;
    /** Overrides for the default diff reader and message subprocess. */
    message?: MessageOptions;
    /** Re-read a root after a write, whatever git answered; settles when the read has landed. */
    refresh?: (root: string) => Promise<void>;
    /** The Trash; the real one, called with `{ glob: false }`, when absent. */
    trash?: (path: string, options: { glob: false }) => Promise<void>;
    /**
     * The files the server never changes, by identity, as the Files view's operations build them.
     * Without it Discard of untracked files is refused, since nothing says what it must not take.
     */
    guard?: () => Guard;
    /** The chain the Files view's writes wait on, so a discard and a Files write are ordered. */
    writes?: FsWrites;
    /**
     * The writes in flight, so Cancel ends the one a root is running; one of its own when absent.
     */
    running?: RunningGit;
} & ReadOptions;

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** A text field the page sends as a string; anything else reads as the empty text. */
const textFieldShape = z.string().catch('');

/**
 * The body of POST /api/git: the action among ACTIONS and every field an action reads, each with
 * the fallback the action gives it. The page sends `mode` as a word, and an empty one reads as
 * `tracked`; a word that is no stash mode reaches `stash`, which refuses it in its own sentence.
 */
export const gitBodyShape = z.looseObject({
    action: z.enum(ACTIONS),
    root: textFieldShape,
    paths: z
        .array(z.unknown())
        .transform((items) => items.filter((item) => typeof item === 'string'))
        .catch(() => []),
    patch: textFieldShape,
    group: textFieldShape,
    message: textFieldShape,
    amend: z
        .unknown()
        .optional()
        .transform((held) => held === true),
    remote: textFieldShape,
    name: textFieldShape,
    path: textFieldShape,
    branch: textFieldShape,
    content: textFieldShape,
    ref: textFieldShape,
    start: z
        .unknown()
        .optional()
        .transform((held) =>
            held === undefined ? undefined : typeof held === 'string' ? held : ''
        ),
    mode: z.custom<StashMode>((held) => typeof held === 'string' && held !== '').catch('tracked')
});

type GitBody = z.output<typeof gitBodyShape>;

/** The refusal of a body that is no git action, answered before anything else is read. */
function notAnAction(text: Record<string, string>): Response {
    return json(
        { error: words(text, 'server.git.not_an_action') },
        { status: 400, headers: NO_STORE }
    );
}

/**
 * The body of a write request whose token held and whose body is a map of `shape`: the map, as it
 * came, with what the shape read of it, or the response that refuses it (the token's, or the
 * `refusal` the route words for a body that is no action of its own).
 */
export async function shapedBody<Read>(
    request: Request,
    token: string,
    shape: z.ZodType<Read>,
    text: Record<string, string>,
    refusal: () => Response
): Promise<{ body: Record<string, unknown>; read: Read } | Response> {
    const tokened = await tokenedBody(request, token, { headers: NO_STORE, text: () => text });
    if (tokened instanceof Response) return tokened;
    const parsed = shape.safeParse(tokened.body);
    if (!isMap(tokened.body) || !parsed.success) return refusal();
    return { body: tokened.body, read: parsed.data };
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
    text: Record<string, string>,
    claudeBin: string,
    options: MessageOptions = {}
): Promise<Outcome> {
    return suggestMessage(
        root,
        messagePrompt(config),
        text,
        claudeBin,
        { ...options, model: messageModel(config) },
        roots
    );
}

/**
 * One real operation: the root, the parsed body, the text catalog its sentences are worded from,
 * the roots a request may name and the signal that ends the run when Cancel aborts it.
 */
type GitOperation = (
    root: string,
    fields: GitBody,
    text: Record<string, string>,
    roots: string[],
    options: GitOptions,
    signal: AbortSignal
) => Promise<Outcome>;

/** Run a write that changes files the Files view also writes behind that view's write chain. */
function ordered(options: GitOptions, work: () => Promise<Outcome>): Promise<Outcome> {
    return options.writes === undefined ? work() : chained(options.writes, work);
}

/** The real operations, one per action. `suggest` is answered before this is reached. */
export const OPERATIONS: Record<string, GitOperation> = {
    stage: (root, fields, text, roots) => stage(root, fields.paths, text, roots),
    unstage: (root, fields, text, roots) => unstage(root, fields.paths, text, roots),
    discard: (root, fields, text, roots) => discard(root, fields.paths, text, roots),
    stagePatch: (root, fields, text, roots) => applyHunk(root, fields.patch, 'stage', text, roots),
    unstagePatch: (root, fields, text, roots) =>
        applyHunk(root, fields.patch, 'unstage', text, roots),
    revertPatch: (root, fields, text, roots) =>
        applyHunk(root, fields.patch, 'revert', text, roots),
    stageAll: (root, fields, text, roots) => stageAll(root, fields.group, text, roots),
    unstageAll: (root, _fields, text, roots) => unstageAll(root, text, roots),
    discardAll: (root, _fields, text, roots) => discardAll(root, text, roots),
    commit: (root, fields, text, roots, _options, signal) =>
        commit(root, fields.message, text, roots, fields.amend, signal),
    push: (root, _fields, text, roots, _options, signal) => push(root, text, roots, signal),
    pull: (root, _fields, text, roots, _options, signal) => pull(root, text, roots, signal),
    fetch: (root, _fields, text, roots) => fetchAll(root, text, roots),
    sync: (root, _fields, text, roots, _options, signal) => sync(root, text, roots, signal),
    publish: (root, fields, text, roots, _options, signal) =>
        publish(root, fields.remote, text, roots, signal),
    createBranch: (root, fields, text, roots, _options, signal) =>
        createBranch(root, fields.name, text, roots, fields.start, signal),
    switchBranch: (root, fields, text, roots, _options, signal) =>
        switchBranch(root, fields.name, text, roots, signal),
    createWorktree: (root, fields, text, roots, _options, signal) =>
        createWorktree(root, fields.name, text, roots, signal),
    removeWorktree: (root, fields, text, roots) => removeWorktree(root, fields.path, text, roots),
    merge: (root, fields, text, roots, _options, signal) =>
        merge(root, fields.branch, text, roots, signal),
    abortMerge: (root, _fields, text, roots) => abortMerge(root, text, roots),
    continueRebase: (root, _fields, text, roots, _options, signal) =>
        continueRebase(root, text, roots, signal),
    resolve: (root, fields, text, roots) =>
        resolveMerge(root, fields.path, fields.content, text, roots),
    markResolved: (root, fields, text, roots) => markResolved(root, fields.path, text, roots),
    acceptDeletion: (root, fields, text, roots) => acceptDeletion(root, fields.path, text, roots),
    stash: (root, fields, text, roots) => stash(root, fields.mode, fields.message, text, roots),
    stashApply: (root, fields, text, roots) => stashAct(root, 'apply', fields.ref, text, roots),
    stashPop: (root, fields, text, roots) => stashAct(root, 'pop', fields.ref, text, roots),
    stashDrop: (root, fields, text, roots) => stashAct(root, 'drop', fields.ref, text, roots),
    createTag: (root, fields, text, roots) =>
        createTag(root, fields.name, fields.message, text, roots, fields.start),
    deleteTag: (root, fields, text, roots) => deleteTag(root, fields.name, text, roots),
    pushTags: (root, _fields, text, roots, _options, signal) => pushTags(root, text, roots, signal),
    cherryPick: (root, fields, text, roots, _options, signal) =>
        cherryPick(root, fields.ref, text, roots, signal),
    checkoutDetached: (root, fields, text, roots, _options, signal) =>
        switchDetached(root, fields.ref, text, roots, signal),
    deleteBranch: (root, fields, text, roots) => deleteBranch(root, fields.name, text, roots),
    deleteBranchAnyway: (root, fields, text, roots) =>
        deleteBranchAnyway(root, fields.name, text, roots),
    ignore: (root, fields, text, roots, options) =>
        ordered(options, () => addToGitignore(root, fields.paths, text, roots)),
    trashUntracked: (root, fields, text, roots, options) => {
        const guard = options.guard;
        if (guard === undefined) {
            return Promise.resolve(failed(words(text, 'server.git.no_guard')));
        }
        const trash = options.trash ?? ((path, flags) => trashLibrary(path, flags));
        return ordered(options, () =>
            trashUntracked(root, fields.paths, { trash, guard }, text, roots)
        );
    }
};

async function operate(
    root: string,
    fields: GitBody,
    text: Record<string, string>,
    roots: string[],
    options: GitOptions,
    signal: AbortSignal
): Promise<Outcome> {
    const operation = byKey(OPERATIONS, fields.action);
    if (operation === undefined) {
        return failed(words(text, 'server.git.no_action_named', fields.action));
    }
    return operation(root, fields, text, roots, options, signal);
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
    const text = textCatalog(options.config);
    const shaped = await shapedBody(request, token, gitBodyShape, text, () => notAnAction(text));
    if (shaped instanceof Response) return shaped;
    const { body } = shaped;
    const { action, root } = shaped.read;
    const roots = (options.rootsFor ?? allowedRoots)();
    const running = options.running ?? createRunningGit();
    if (!permitted(root, roots)) {
        return json(
            { error: words(text, 'server.git.unknown_directory') },
            { status: 400, headers: NO_STORE }
        );
    }
    const refused = unconfirmed(CONFIRMED, action, body, text);
    if (refused !== null) return refused;

    if (action === 'suggest') {
        const answer = await (
            options.suggest ??
            ((selected, allowed) =>
                suggestFor(
                    selected,
                    allowed,
                    options.config,
                    text,
                    options.claudeBin,
                    options.message
                ))
        )(root, roots);
        if (!answer.ok) return json({ error: answer.error }, { status: 400, headers: NO_STORE });
        return json({ ok: true, output: answer.output }, { headers: NO_STORE });
    }

    if (action === 'cancel') {
        running.cancel(root);
        return json({ ok: true, output: '' }, { headers: NO_STORE });
    }

    const signal = running.begin(root);
    let outcome: Outcome;
    try {
        outcome = await (
            options.run ??
            ((_action, selected, _body, allowed, held) =>
                operate(selected, shaped.read, text, allowed, options, held ?? signal))
        )(action, root, body, roots, signal);
    } finally {
        running.end(root, signal);
    }
    // The watcher would find this at its next event, up to two seconds later and only if the write
    // touched a path it watches; re-reading here, and answering once the read has landed, is what
    // makes the panel answer the click with the state the write left. A write git refused may still
    // have moved the repository (a merge that stopped on conflicts leaves them in the index), so it
    // is read again either way.
    await options.refresh?.(root);
    if (!outcome.ok) {
        const refusal = outcome.code === undefined ? {} : { code: outcome.code };
        const error =
            outcome.failure === undefined ? outcome.error : failureLine(outcome.failure, text);
        return json({ error, ...refusal }, { status: 400, headers: NO_STORE });
    }
    return json({ ok: true, output: outcome.output }, { headers: NO_STORE });
}
