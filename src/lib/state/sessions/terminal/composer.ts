// Layer 2, client state. The composer's own record and the words it puts into a prompt: what each
// picker last chose in one tab, where a session may start, a file attached as `@<path>`, and the
// start the composer sends. Pure over what it is handed, so every rule is checked without a
// browser; the component holds only the prompt being typed.
//
// The picks live in the tab's instance state under `composer`, one map of list key to value id per
// agent, so switching from Claude to Codex and back keeps both agents' choices, and a tab's next
// composer opens on the accounts and picks its last start used. Its folder and kind are what the
// last start used until New sets them back to a new composer's own (`freshComposer`) or a Split
// sets them to the split row's (`splitState`). A value the catalog no longer offers is dropped
// when it is read, so a pick never reaches a start the server would refuse.

import type {
    AgentAccount,
    AgentChoices,
    AgentId,
    ComposeStart,
    Workspace
} from '../../../data/model/index.ts';
import { isMap } from '../../../data/helpers/guards.ts';

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
     * The folder of the terminal this tab was split from, offered as a place of its own whether or
     * not a place holds it; absent on a composer no Split opened.
     */
    split?: string;
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

/** A plain map, or null. */
function mapOf(value: unknown): Record<string, unknown> | null {
    return isMap(value) ? value : null;
}

function wordsOf(value: unknown): Record<string, string> {
    const map = mapOf(value);
    if (map === null) return {};
    const kept: Record<string, string> = {};
    for (const [key, one] of Object.entries(map)) {
        if (typeof one === 'string' && one !== '') kept[key] = one;
    }
    return kept;
}

/** The composer record out of a tab's instance state, with anything malformed read as unset. */
export function composerOf(state: unknown): ComposerRecord {
    const held = mapOf(mapOf(state)?.[COMPOSER_FIELD]);
    if (held === null) return COMPOSER_EMPTY;
    const agent = held.agent;
    const accounts = wordsOf(held.accounts);
    const picks = mapOf(held.picks) ?? {};
    const record: ComposerRecord = {
        workspace: typeof held.workspace === 'string' ? held.workspace : '',
        agent: agent === 'codex' || agent === 'shell' ? agent : 'claude',
        accounts: { claude: accounts.claude, codex: accounts.codex },
        picks: { claude: wordsOf(picks.claude), codex: wordsOf(picks.codex) }
    };
    if (typeof held.split === 'string' && held.split !== '') record.split = held.split;
    return record;
}

/**
 * The record a Split writes into the tab it opens: the terminal's own folder, as the folder it was
 * split from and as the one it starts in, and the terminal's kind.
 */
export function splitRecord(folder: string, agent: ComposerAgent): ComposerRecord {
    return { ...COMPOSER_EMPTY, workspace: folder, agent, split: folder };
}

/**
 * The places a composer offers: its places as they are, with the folder it was split from listed
 * first when no place equals it. A composer no Split opened offers its places unchanged.
 */
export function offeredPlaces(places: readonly string[], record: ComposerRecord): string[] {
    const split = record.split ?? '';
    return split === '' || places.includes(split) ? [...places] : [split, ...places];
}

/** The folder the composer starts in: the tab's choice while it is offered, else the hub. */
export function composerWorkspace(
    record: ComposerRecord,
    offered: readonly string[],
    hub: string
): string {
    return record.workspace !== '' && offered.includes(record.workspace) ? record.workspace : hub;
}

/** The tab's instance state with the composer record in place of the one it held. */
export function withComposer(state: unknown, record: ComposerRecord): Record<string, unknown> {
    return { ...(mapOf(state) ?? {}), [COMPOSER_FIELD]: record };
}

/**
 * The instance state of a tab once Split on one of its rows puts the composer beside that row: the
 * composer in the row's folder and kind, with the accounts and picks the tab's record already held
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
 * The instance state of a tab once New shows its composer: the folder and kind back to a new
 * composer's own (the hub, Claude) and no folder split from, with the accounts and picks the tab's
 * record already held and the rest of the tab's instance state kept, so a Split's folder and kind
 * do not carry into a later New.
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
 * Where a session may start: the hub, every root of every saved workspace (the configured roots
 * are in each of them), and every workspace a session sits in, once each, the hub first.
 */
export function composerPlaces(
    hub: string,
    workspaces: { roots: { dir: string }[] }[],
    tree: Workspace[]
): string[] {
    const rest = new Set<string>();
    for (const workspace of workspaces) for (const root of workspace.roots) rest.add(root.dir);
    for (const one of tree) rest.add(one.key);
    rest.delete(hub);
    rest.delete('');
    return [...(hub === '' ? [] : [hub]), ...[...rest].sort()];
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
 * only for Codex, which is the one agent whose CLI takes one on its command line.
 */
export function composeStart(
    agent: ComposerAgent,
    cwd: string,
    account: string,
    picks: Record<string, string>,
    prompt: string,
    attached: string[]
): ComposeStart {
    if (agent === 'shell') {
        return { agent, cwd, account: '', picks: {}, prompt, images: [] };
    }
    const images = agent === 'codex' ? [...new Set(attached.filter(isImage))] : [];
    return { agent, cwd, account, picks, prompt, images };
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
 * The branch the composer shows beside its workspace, read only: the branch of the deepest root of
 * the `git` channel that holds the workspace, or nothing when no watched root holds it or git named
 * no branch there.
 */
export function branchOf(
    workspace: string,
    git: Readonly<Record<string, { branch: string }>> | null
): string {
    if (git === null || workspace === '') return '';
    let best = '';
    for (const root of Object.keys(git)) {
        const holds =
            workspace === root || workspace.startsWith(root.endsWith('/') ? root : `${root}/`);
        if (holds && root.length > best.length) best = root;
    }
    return best === '' ? '' : git[best].branch;
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

/** The section's scope out of the list's instance state, anything malformed read as unset. */
export function customizationScopeOf(state: unknown): CustomizationScopeState {
    const held = mapOf(mapOf(state)?.[CUSTOM_FIELD]);
    const expanded = held?.expanded;
    return {
        open: held?.open !== false,
        agent: held?.agent === 'codex' ? 'codex' : 'claude',
        account: typeof held?.account === 'string' ? held.account : '',
        workspace: typeof held?.workspace === 'string' ? held.workspace : '',
        expanded: Array.isArray(expanded)
            ? expanded.filter((one): one is string => typeof one === 'string')
            : []
    };
}

/** The list's instance state with the section's scope in place of the one it held. */
export function withCustomizationScope(
    state: unknown,
    scope: CustomizationScopeState
): Record<string, unknown> {
    return { ...(mapOf(state) ?? {}), [CUSTOM_FIELD]: scope };
}
