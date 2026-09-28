// Layer 2, client state. The folds the session views draw from: the session rows of the tree the
// selectors group, the tree cut to the rows a list keeps, how many rows a workspace or a list
// holds, where a terminal may start, a session's agents newest first, the list's filter, search
// and order, a relative time, a timeline cut into turns, and the rows of the Terminal view's list.
// Pure over the payloads they are handed, so every one is checked without a browser.

import type {
    Area,
    GroupedSession,
    ListedSession,
    SessionAgent,
    SessionEvent,
    SizedAgent,
    Terminal,
    Workspace
} from '../../data/model/index.ts';
import { t } from '../shared/words/text.ts';

/** Every session row of the tree, workspace by workspace and area by area. */
export function sessionRows(tree: Workspace[]): GroupedSession[] {
    return tree.flatMap((workspace) => workspace.areas.flatMap((area) => area.sessions));
}

/** The tree cut to the rows `keep` holds, an area or a workspace left with none dropped. */
export function pruneTree(tree: Workspace[], keep: (row: GroupedSession) => boolean): Workspace[] {
    const found: Workspace[] = [];
    for (const workspace of tree) {
        const areas: Area[] = [];
        for (const area of workspace.areas) {
            const sessions = area.sessions.filter(keep);
            if (sessions.length > 0) areas.push({ ...area, sessions });
        }
        if (areas.length > 0) found.push({ ...workspace, areas });
    }
    return found;
}

/** How many session rows one workspace's areas hold. */
export function sessionCount(workspace: Workspace): number {
    return workspace.areas.reduce((total, area) => total + area.sessions.length, 0);
}

/** How many of the rows are live. */
export function liveCount(rows: readonly { live: boolean }[]): number {
    return rows.filter((row) => row.live).length;
}

/** How many of the rows `hidden` says are hidden, and how many ended rows it leaves shown. */
export function hiddenCounts(
    rows: GroupedSession[],
    hidden: (row: GroupedSession) => boolean
): { dismissed: number; ended: number } {
    return {
        dismissed: rows.filter((row) => hidden(row)).length,
        ended: rows.filter((row) => !row.live && !hidden(row)).length
    };
}

/** Where a terminal may start: the hub and every workspace the tree names, once each, by name. */
export function terminalPlaces(hub: string, tree: Workspace[]): string[] {
    return [...new Set([hub, ...tree.map((one) => one.key)])].filter((key) => key !== '').sort();
}

/**
 * A session's subagents newest first by the moment each started, sorted by the stamps rather than
 * kept in the server's list order; an agent with no stamp goes last.
 */
export function newestFirst(agents: readonly SessionAgent[]): SessionAgent[] {
    return [...agents].sort((a, b) => (b.started ?? '').localeCompare(a.started ?? ''));
}

/** Whether any agent is still running, which is what keeps a running count moving. */
export function anyRunning(agents: readonly SessionAgent[]): boolean {
    return agents.some((agent) => agent.status === 'running');
}

/** The states the list's filter offers, in the order its menu lists them. */
export const LIST_STATES = ['input', 'working', 'idle', 'ended', 'archived'] as const;

/** One state of the list's filter. */
export type ListStateKey = (typeof LIST_STATES)[number];

/** The agents the list's filter offers. */
export const LIST_AGENTS = ['claude', 'codex'] as const;

/**
 * What one list keeps in its instance state: the states and agents its filter keeps (none kept
 * means every one), and the search text.
 */
export type ListFilter = { states: ListStateKey[]; agents: string[]; query: string };

/** The filter a list starts with: everything but what was archived, and no search. */
export const LIST_FILTER: ListFilter = { states: [], agents: [], query: '' };

/** The list's filter out of its instance state, anything malformed read as unset. */
export function listFilterOf(state: unknown): ListFilter {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return LIST_FILTER;
    const held: Record<string, unknown> = { ...state };
    const heldStates: unknown[] = Array.isArray(held.states) ? held.states : [];
    const heldAgents: unknown[] = Array.isArray(held.agents) ? held.agents : [];
    const states = LIST_STATES.filter((one) => heldStates.includes(one));
    const agents = LIST_AGENTS.filter((one) => heldAgents.includes(one));
    return { states, agents, query: typeof held.query === 'string' ? held.query : '' };
}

/** A list with one entry taken out when it holds it and put in when it does not. */
export function toggled<T>(list: readonly T[], one: T): T[] {
    return list.includes(one) ? list.filter((item) => item !== one) : [...list, one];
}

/** Whether a session is waiting on the reader: its latest hook is a notification. */
export function needsInput(row: GroupedSession): boolean {
    return row.live && row.hook?.event === 'notification';
}

/**
 * The one state a row shows at its left and the filter reads: archived when the reader archived
 * it, needs input when its latest hook asks for the reader, ended when its process is gone, and
 * otherwise what the registry says (working or idle).
 */
export function rowState(row: GroupedSession, archived: boolean): ListStateKey {
    if (archived) return 'archived';
    if (needsInput(row)) return 'input';
    if (!row.live) return 'ended';
    return row.state === 'working' || row.liveStatus === 'busy' ? 'working' : 'idle';
}

/** Whether a row holds the search text in its title, prompts, workspace or branch. */
export function matchesSearch(row: GroupedSession, query: string): boolean {
    const wanted = query.trim().toLowerCase();
    if (wanted === '') return true;
    const prompts = row.timeline.filter((one) => one.kind === 'prompt').map((one) => one.text);
    const haystack = [row.title, row.lastPrompt, ...prompts, row.workspace, row.branch ?? ''];
    return haystack.some((one) => one.toLowerCase().includes(wanted));
}

/**
 * Whether the filter keeps a row. No state picked keeps every state but archived; archived rows
 * are kept only when Archived is picked, which is where the reader finds them again.
 */
export function keptByFilter(row: GroupedSession, archived: boolean, filter: ListFilter): boolean {
    const state = rowState(row, archived);
    const states =
        filter.states.length === 0
            ? LIST_STATES.filter((one) => one !== 'archived')
            : filter.states;
    if (!states.includes(state)) return false;
    if (filter.agents.length > 0 && !filter.agents.includes(row.tool)) return false;
    return matchesSearch(row, filter.query);
}

/** One workspace's rows as the list draws them, pinned rows and rows needing input first. */
export type ListGroup = { key: string; name: string; rows: GroupedSession[] };

/** The moment a row last moved, for the order inside a group. */
function lastMoved(row: GroupedSession): string {
    return row.lastActivity ?? row.started ?? '';
}

/**
 * The tree's rows grouped by workspace, its areas flattened, each group ordered pinned first, then
 * needing input, then newest; a group the filter leaves empty is dropped. The groups keep the
 * tree's order, which is the newest workspace first.
 */
export function listGroups(
    tree: Workspace[],
    filter: ListFilter,
    archived: (row: GroupedSession) => boolean,
    top: (row: GroupedSession) => boolean
): ListGroup[] {
    const groups: ListGroup[] = [];
    for (const workspace of tree) {
        const rows = workspace.areas
            .flatMap((area) => area.sessions)
            .filter((row) => keptByFilter(row, archived(row), filter));
        if (rows.length === 0) continue;
        const rank = (row: GroupedSession): number =>
            (top(row) ? 0 : 2) + (needsInput(row) ? 0 : 1);
        rows.sort((a, b) => rank(a) - rank(b) || lastMoved(b).localeCompare(lastMoved(a)));
        groups.push({ key: workspace.key, name: workspace.name, rows });
    }
    return groups;
}

/** The seconds, minutes, hours and days a relative time is told in. */
const MINUTE_S = 60;
const HOUR_S = 3600;
const DAY_S = 86_400;

/**
 * How long ago a stamp was, as a count and its unit: `now` under a minute, else the largest unit
 * that fits. Null for a stamp that cannot be read or lies in the future by more than a minute.
 */
export function ago(
    iso: string | null,
    now: number
): { unit: 'now' | 'm' | 'h' | 'd'; count: number } | null {
    if (iso === null || iso === '') return null;
    const at = Date.parse(iso);
    if (Number.isNaN(at)) return null;
    const secs = Math.round((now - at) / 1000);
    if (secs < -MINUTE_S) return null;
    if (secs < MINUTE_S) return { unit: 'now', count: 0 };
    if (secs < HOUR_S) return { unit: 'm', count: Math.floor(secs / MINUTE_S) };
    if (secs < DAY_S) return { unit: 'h', count: Math.floor(secs / HOUR_S) };
    return { unit: 'd', count: Math.floor(secs / DAY_S) };
}

/** One turn of a timeline: the prompt that opened it, when, and what followed. */
export type TimelineTurn = {
    at: string | null;
    prompt: SessionEvent | null;
    events: SessionEvent[];
};

/**
 * The timeline cut into turns, one per prompt, each carrying the prompt's time. What came before
 * the first prompt (a resumed session's tail) is a turn with no prompt, timed by its first event.
 */
export function timelineTurns(events: readonly SessionEvent[]): TimelineTurn[] {
    const turns: TimelineTurn[] = [];
    for (const event of events) {
        if (event.kind === 'prompt') {
            turns.push({ at: event.ts, prompt: event, events: [] });
            continue;
        }
        if (turns.length === 0) turns.push({ at: event.ts, prompt: null, events: [] });
        turns[turns.length - 1].events.push(event);
    }
    return turns;
}

/** The tokens an agent spent where its result reports them, else null. */
export function agentTokens(agent: SizedAgent): number | null {
    const tokens = agent.tokens;
    return typeof tokens === 'number' && Number.isFinite(tokens) && tokens >= 0 ? tokens : null;
}

/** Whether the reader pinned a session to the top of its group, from the overrides file. */
export function isTop(row: ListedSession): boolean {
    return row.top === true;
}

/**
 * One row of the Terminal view's list: a terminal oculus runs, the id a press selects (the session
 * running in it, else the terminal), its kind, the title it is named by after what runs in it, the
 * description drawn muted after the title, and when it was started, which orders the list.
 */
export type TerminalChoice = {
    id: string;
    terminal: string;
    kind: Terminal['kind'];
    title: string;
    description: string;
    created: string;
};

/** The last segment of a folder, or the folder itself when it has none (the root). */
function folderName(path: string): string {
    const last = path
        .split('/')
        .filter((part) => part !== '')
        .pop();
    return last ?? path;
}

/**
 * The terminals a Terminal tab can show, in the order the payload lists them. An agent terminal is
 * titled by its agent, since what tmux reports running in its pane says nothing of it, and is
 * described by the session running in it (its resume, else its process), else by its own name. A
 * shell is titled by the command running in it, or by the word for a shell when tmux reports none,
 * and is described by the last segment of its folder. A terminal oculus did not start is left out,
 * since the tab cannot attach to it.
 */
export function terminalChoices(
    terminals: readonly Pick<
        Terminal,
        'id' | 'name' | 'kind' | 'command' | 'cwd' | 'created' | 'pid' | 'foreign' | 'resumes'
    >[],
    sessions: readonly Pick<GroupedSession, 'id' | 'title' | 'pid'>[]
): TerminalChoice[] {
    return terminals
        .filter((one) => one.foreign !== true)
        .map((one) => {
            const row = { terminal: one.id, kind: one.kind, created: one.created };
            if (one.kind === 'shell') {
                const title = one.command === '' ? t('sessions.terminal_title_shell') : one.command;
                return { ...row, id: one.id, title, description: folderName(one.cwd) };
            }
            const title =
                one.kind === 'claude' ? t('sessions.kind_claude') : t('sessions.kind_codex');
            const running = sessions.find(
                (session) =>
                    one.resumes?.id === session.id ||
                    (session.pid !== null && one.pid !== 0 && session.pid === one.pid)
            );
            if (running !== undefined) {
                const description = running.title === '' ? running.id : running.title;
                return { ...row, id: running.id, title, description };
            }
            return { ...row, id: one.id, title, description: one.name === '' ? one.id : one.name };
        });
}
