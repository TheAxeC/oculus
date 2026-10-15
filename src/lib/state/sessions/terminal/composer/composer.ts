// Layer 2, client state. The composer's own record and the words it puts into a prompt: what each
// picker last chose in one tab, where a session may start, a file attached as `@<path>`, and the
// start the composer sends. Pure over what it is handed, so every rule is checked without a
// browser; the component holds only the prompt being typed.
//
// The picks live in the tab's instance state under `composer`, one map of list key to value id per
// agent, so switching from Claude to Codex and back keeps both agents' choices, and a tab's next
// composer opens on the accounts and picks its last start used. Its folder and kind are what the
// last start used until New sets them back to a new composer's own (`freshComposer`) or a New with
// a prompt in a tab sets them to the tab's folder and the kind chosen (`splitState`). The folder
// the composer was opened in and the folder of the last worktree a start with New worktree made are
// kept apart (`split` and `worktree`), and the picker offers both. A value the catalog does not
// offer is dropped when it is read, so a pick never reaches a start the server would refuse.

import {
    confirmValues,
    type AgentAccount,
    type AgentChoices,
    type AgentId,
    type ComposeStart,
    type TaskRef,
    type Workspace
} from '../../../../data/model/index.ts';
import { z } from 'zod';
import { byKey, isMap } from '../../../../data/helpers/guards.ts';
import { validName, worktreePath } from '../../../../data/helpers/worktrees.ts';
import {
    filledTextShape,
    mapOfShape,
    readAs,
    stringItemsShape,
    taskRefOf
} from '../../../../data/shapes/shapes.ts';
import { t } from '../../../shared/words/text.ts';

/** What the composer starts: one of the two agents, or the reader's shell. */
export type ComposerAgent = AgentId | 'shell';

/** What one tab keeps of its composer. */
export type ComposerRecord = {
    workspace: string;
    agent: ComposerAgent;
    /** The account label per agent. */
    accounts: Partial<Record<AgentId, string>>;
    /** The value id per list key, per agent. */
    picks: Partial<Record<AgentId, Record<string, string>>>;
    /**
     * The folder a New with a prompt, or a start from a place or a task, opened the composer in,
     * offered as a place of its own whether or not a place holds it; absent on a composer opened
     * without one.
     */
    split?: string;
    /**
     * The folder of the last worktree a start with New worktree made, offered as a place of its
     * own beside the split whether or not a place holds it; absent until a start makes one.
     */
    worktree?: string;
    /**
     * The hub task the composer is seeded with, its reference only. The seed text the server
     * answered for it is held by the terminals store per tab and never saved with the layout.
     */
    task?: TaskRef;
};

/** The instance-state field the record is kept under. */
export const COMPOSER_FIELD = 'composer';

/** A tab that has not started anything yet. */
export const COMPOSER_EMPTY: ComposerRecord = {
    workspace: '',
    agent: 'claude',
    accounts: {},
    picks: {}
};

/** A map of keys to the filled texts it holds, and none for anything that is not a map. */
const wordsShape = mapOfShape(z.string().min(1)).catch({});

/** The picks of the two agents, a map each, and no picks for anything that is not a map. */
const picksShape = z
    .object({ claude: wordsShape, codex: wordsShape })
    .catch(() => ({ claude: {}, codex: {} }));

/**
 * The record a tab keeps, each field as typed or unset; the split and the worktree are absent
 * unless they are named.
 */
const composerShape = z
    .object({
        workspace: z.string().catch(''),
        agent: z.enum(['claude', 'codex', 'shell']).catch('claude'),
        accounts: wordsShape.transform((words) => ({ claude: words.claude, codex: words.codex })),
        picks: picksShape,
        split: filledTextShape,
        worktree: filledTextShape,
        task: z.unknown().optional().transform(taskRefOf)
    })
    .transform(({ split, worktree, task, ...record }) => ({
        ...record,
        ...(split === undefined ? {} : { split }),
        ...(worktree === undefined ? {} : { worktree }),
        ...(task === undefined ? {} : { task })
    })) satisfies z.ZodType<ComposerRecord>;

/** A tab's instance state as far as its composer: the record under `composer`, which is a map. */
const composerHolderShape = z.object({ [COMPOSER_FIELD]: composerShape });

/** The composer record out of a tab's instance state, with anything malformed read as unset. */
export function composerOf(state: unknown): ComposerRecord {
    return readAs(composerHolderShape, state)?.composer ?? COMPOSER_EMPTY;
}

/**
 * The record a New with a prompt writes into the tab: the tab's folder, as the folder it was opened
 * in and as the one it starts in, and the kind chosen.
 */
export function splitRecord(folder: string, agent: ComposerAgent): ComposerRecord {
    return { ...COMPOSER_EMPTY, workspace: folder, agent, split: folder };
}

/**
 * The places a composer offers: its places as they are, with the folder it was opened in and then
 * the folder of the last worktree it made listed first, each when no place equals it. A composer
 * with neither offers its places unchanged.
 */
export function offeredPlaces(places: readonly string[], record: ComposerRecord): string[] {
    const own = [record.split ?? '', record.worktree ?? ''].filter(
        (folder, at, both) =>
            folder !== '' && !places.includes(folder) && both.indexOf(folder) === at
    );
    return [...own, ...places];
}

/**
 * The folder the composer starts in: the tab's choice while it is offered, else the primary hub's
 * folder. The empty text is the folder of a composer that has none picked, which the server starts
 * in the home folder.
 */
export function composerWorkspace(
    record: ComposerRecord,
    offered: readonly string[],
    hub: string | null
): string {
    if (record.workspace !== '' && offered.includes(record.workspace)) return record.workspace;
    return hub ?? '';
}

/** The tab's instance state with the composer record in place of the one it held. */
export function withComposer(state: unknown, record: ComposerRecord): Record<string, unknown> {
    return { ...(isMap(state) ? state : {}), [COMPOSER_FIELD]: record };
}

/**
 * The instance state of a tab once a New with a prompt shows its composer: the composer in the
 * tab's folder and the kind chosen, with the accounts and picks the tab's record already held
 * and the rest of the tab's instance state kept.
 */
export function splitState(
    folder: string,
    agent: ComposerAgent,
    held?: unknown
): Record<string, unknown> {
    const kept = composerOf(held);
    return withComposer(held, {
        ...splitRecord(folder, agent),
        accounts: kept.accounts,
        picks: kept.picks
    });
}

/**
 * The instance state of a tab once a start from a place or a task shows its composer: the folder
 * the start names, offered as a place of its own, the agent, that agent's lists back at the
 * catalog's defaults (its picks cleared; the other agent's kept), the account the tab held, and
 * the task when there is one.
 */
export function startedAt(
    held: unknown,
    at: { cwd: string; agent: AgentId; task?: TaskRef }
): Record<string, unknown> {
    const kept = composerOf(held);
    return withComposer(held, {
        ...splitRecord(at.cwd, at.agent),
        accounts: kept.accounts,
        picks: { ...kept.picks, [at.agent]: {} },
        ...(at.task === undefined ? {} : { task: at.task })
    });
}

/**
 * The instance state of a tab once New shows its composer: the folder and kind back to a new
 * composer's own (the hub, Claude) and no folder split from, with the accounts and picks the tab's
 * record already held and the rest of the tab's instance state kept, so the folder and kind of a
 * New with a prompt do not carry into a later New.
 */
export function freshComposer(held?: unknown): Record<string, unknown> {
    const kept = composerOf(held);
    return withComposer(held, { ...COMPOSER_EMPTY, accounts: kept.accounts, picks: kept.picks });
}

/**
 * One agent's picks as the pickers show them: the tab's choice where the catalog still offers it,
 * the list's default otherwise.
 */
export function picksFor(
    choices: AgentChoices | null,
    held: Record<string, string> | undefined
): Record<string, string> {
    const picks: Record<string, string> = {};
    for (const list of choices?.lists ?? []) {
        const chosen = held?.[list.key];
        picks[list.key] =
            chosen !== undefined && list.values.some((one) => one.id === chosen)
                ? chosen
                : list.default;
    }
    return picks;
}

/** The accounts of one agent, in the order local.yml names them. */
export function accountsOf(accounts: AgentAccount[], agent: ComposerAgent): AgentAccount[] {
    return agent === 'shell' ? [] : accounts.filter((one) => one.tool === agent);
}

/** The account label a start names: the tab's choice while it is still configured, else none. */
export function accountFor(
    accounts: AgentAccount[],
    agent: ComposerAgent,
    held: string | undefined
): string {
    const own = accountsOf(accounts, agent);
    return held !== undefined && own.some((one) => one.label === held)
        ? held
        : (own[0]?.label ?? '');
}

/**
 * Where a session may start: the primary hub's folder, every folder of the open workspace, and
 * every workspace a session sits in, once each, the primary's folder first.
 */
export function composerPlaces(
    hub: string | null,
    folders: { dir: string }[],
    tree: Workspace[]
): string[] {
    const rest = new Set<string>();
    for (const folder of folders) rest.add(folder.dir);
    for (const one of tree) rest.add(one.key);
    if (hub !== null) rest.delete(hub);
    rest.delete('');
    return [...(hub === null ? [] : [hub]), ...[...rest].sort()];
}

/** The extensions Codex takes as an image with `-i`. */
const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

/** Whether a path names an image, by its extension. */
export function isImage(path: string): boolean {
    const dot = path.lastIndexOf('.');
    return dot >= 0 && IMAGES.includes(path.slice(dot + 1).toLowerCase());
}

/**
 * The path of a file relative to the workspace, or null for a file outside it. Both are absolute
 * and use forward slashes, which is what the file server's roots and paths are.
 */
export function relativeIn(workspace: string, file: string): string | null {
    const base = workspace.endsWith('/') ? workspace.slice(0, -1) : workspace;
    if (base === '' || !file.startsWith(`${base}/`)) return null;
    const rest = file.slice(base.length + 1);
    return rest === '' ? null : rest;
}

/** The mention a file becomes in the prompt. */
export function mention(relative: string): string {
    return `@${relative}`;
}

/**
 * The prompt with a mention put in at the caret: a space on each side where the text beside it is
 * not already a space, and the caret after the mention and its trailing space.
 */
export function insertMention(
    text: string,
    caret: number,
    word: string
): { text: string; caret: number } {
    const at = Math.max(0, Math.min(caret, text.length));
    const before = text.slice(0, at);
    const after = text.slice(at);
    const lead = before === '' || /\s$/.test(before) ? '' : ' ';
    const tail = after.startsWith(' ') ? '' : ' ';
    const next = `${before}${lead}${word}${tail}${after}`;
    return { text: next, caret: before.length + lead.length + word.length + tail.length };
}

/**
 * The start the composer sends. A shell takes no picks, account or images; an image is attached
 * only for Codex, which is the one agent whose CLI takes one on its command line. `task` is the
 * hub task the start is seeded with and the seed text the page showed for it, and `confirm` is
 * true once the reader answered the question a permission mode that skips what the agent asks
 * raises.
 */
export function composeStart(
    agent: ComposerAgent,
    cwd: string,
    account: string,
    picks: Record<string, string>,
    prompt: string,
    attached: string[],
    task?: { ref: TaskRef; seed: string },
    confirm = false
): ComposeStart {
    if (agent === 'shell') {
        return { agent, cwd, account: '', picks: {}, prompt, images: [], seed: '', confirm: false };
    }
    const images = agent === 'codex' ? [...new Set(attached.filter(isImage))] : [];
    return {
        agent,
        cwd,
        account,
        picks,
        prompt,
        images,
        seed: task?.seed ?? '',
        confirm,
        ...(task === undefined ? {} : { task: task.ref })
    };
}

/** The question a start asks before it runs, and the values it is about. */
export type SkipQuestion = { message: string; detail: string };

/**
 * The sentence of one value that skips what the agent asks, picked by the agent, the list and the
 * value; a value this table does not name has the generic sentence.
 */
function skipSentence(agent: AgentId, list: string, value: string, who: string, label: string) {
    if (agent === 'claude' && list === 'mode') {
        if (value === 'acceptEdits') return t('composer.confirm_claude_accept_edits', who, label);
        if (value === 'auto') return t('composer.confirm_claude_auto', who, label);
        if (value === 'bypassPermissions') return t('composer.confirm_claude_bypass', who, label);
    }
    if (agent === 'codex' && list === 'sandbox' && value === 'danger-full-access') {
        return t('composer.confirm_codex_full_access', who, label);
    }
    if (agent === 'codex' && list === 'approval' && value === 'never') {
        return t('composer.confirm_codex_never', who, label);
    }
    return t('composer.confirm_skip_detail', who, label);
}

/**
 * The question a start asks first, or null when none of the values it resolves to carries
 * `confirm`: the message names the agent and the values' labels, and the detail is each value's
 * sentence joined by a space.
 */
export function skipQuestion(
    agent: AgentId,
    agentLabel: string,
    choices: AgentChoices | null,
    picks: Record<string, string>
): SkipQuestion | null {
    if (choices === null) return null;
    const asked = confirmValues(choices, picks);
    if (asked.length === 0) return null;
    const labels = asked.map((one) => one.value.label).join(', ');
    return {
        message: t('composer.confirm_skip', agentLabel, labels),
        detail: asked
            .map((one) =>
                skipSentence(agent, one.list.key, one.value.id, agentLabel, one.value.label)
            )
            .join(' ')
    };
}

/** What a key pressed in the prompt box does: start on Enter, a new line with Shift. */
export function promptKey(event: {
    key: string;
    shiftKey: boolean;
    isComposing?: boolean;
}): 'send' | 'type' {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing === true) return 'type';
    return 'send';
}

/**
 * The repository a folder lies in: the deepest root of the `git` channel that holds it, or nothing
 * when no watched root holds it. A folder inside a worktree under that root's worktrees folder
 * (`<root>/.agents/worktrees/<name>`) lies in that worktree, which is a repository of its own, as
 * the Repositories view takes it.
 */
function repositoryOf(workspace: string, git: Readonly<Record<string, unknown>> | null): string {
    if (git === null || workspace === '') return '';
    let best = '';
    for (const root of Object.keys(git)) {
        if (inside(workspace, root) && root.length > best.length) best = root;
    }
    if (best === '') return '';
    const folder = worktreePath(best, '');
    if (!workspace.startsWith(folder)) return best;
    const name = workspace.slice(folder.length).split('/')[0];
    return validName(name) ? worktreePath(best, name) : best;
}

/**
 * The repository the composer's New worktree makes a worktree of: the folder's repository when the
 * `git` channel watches it, since a git write names only a root of the channel's last payload, and
 * nothing otherwise.
 */
export function worktreeRoot(
    workspace: string,
    git: Readonly<Record<string, unknown>> | null
): string {
    const root = repositoryOf(workspace, git);
    return git !== null && byKey(git, root) !== undefined ? root : '';
}

/**
 * Whether the repository at `root` keeps its worktrees out of its history (its .gitignore names
 * the worktrees folder), as the `git` channel reads it; a repository the channel does not hold is
 * taken as keeping them out, so no warning is drawn for it.
 */
export function keepsWorktreesOut(
    git: Readonly<Record<string, { ignoresWorktrees?: boolean }>> | null,
    root: string
): boolean {
    return byKey(git ?? {}, root)?.ignoresWorktrees ?? true;
}

/** Whether a folder is the root or lies under it. */
function inside(folder: string, root: string): boolean {
    return folder === root || folder.startsWith(root.endsWith('/') ? root : `${root}/`);
}

/**
 * The branch the composer shows beside its workspace, read only: the branch of the repository the
 * workspace lies in (`repositoryOf`), read from the worktree list of the repository it belongs to
 * when the channel does not watch that worktree itself, or nothing when no watched root holds the
 * workspace or git named no branch there.
 */
export function branchOf(
    workspace: string,
    git: Readonly<
        Record<string, { branch: string; worktrees?: readonly { path: string; branch: string }[] }>
    > | null
): string {
    const root = repositoryOf(workspace, git);
    if (root === '' || git === null) return '';
    const own = byKey(git, root);
    if (own !== undefined) return own.branch;
    const listed = Object.values(git).flatMap((one) => one.worktrees ?? []);
    return listed.find((one) => one.path === root)?.branch ?? '';
}

/**
 * What the Customizations section keeps in its list's instance state under `custom`: whether it
 * is open, the agent, account and workspace it reads, and which of its rows list their items.
 */
export type CustomizationScopeState = {
    open: boolean;
    agent: AgentId;
    account: string;
    workspace: string;
    expanded: string[];
};

/** The section's field of the list's instance state. */
export const CUSTOM_FIELD = 'custom';

/** The section's scope as the list keeps it, each field as typed or at its default. */
const scopeShape = z.object({
    open: z.boolean().catch(true),
    agent: z.enum(['claude', 'codex']).catch('claude'),
    account: z.string().catch(''),
    workspace: z.string().catch(''),
    expanded: stringItemsShape.catch([])
}) satisfies z.ZodType<CustomizationScopeState>;

/** A list's instance state as far as the section's scope: the scope under `custom`, a map. */
const scopeHolderShape = z.object({ [CUSTOM_FIELD]: scopeShape });

/** The section's scope out of the list's instance state, anything malformed read as unset. */
export function customizationScopeOf(state: unknown): CustomizationScopeState {
    return readAs(scopeHolderShape, state)?.custom ?? scopeShape.parse({});
}

/** The list's instance state with the section's scope in place of the one it held. */
export function withCustomizationScope(
    state: unknown,
    scope: CustomizationScopeState
): Record<string, unknown> {
    return { ...(isMap(state) ? state : {}), [CUSTOM_FIELD]: scope };
}
