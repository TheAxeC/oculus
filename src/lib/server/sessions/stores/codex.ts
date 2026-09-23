// Layer 2, server. The Codex CLI rollout fold, into the same record the Claude transcripts make.
//
// A rollout is `<dir>/sessions/YYYY/MM/DD/rollout-<stamp>-<uuid>.jsonl` under every `tool: codex`
// account in config/local.yml's `accounts`, a line of JSON per record shaped
// `{timestamp, type, payload}`. Four record types carry anything: `session_meta` opens the session,
// `turn_context` says which model and mode the turn ran under, `event_msg` carries the turn
// boundaries, the token counts and every completed item, and `response_item` carries the raw model
// calls, of which the tool calls and the inter-agent messages are read.
//
// Codex keeps no registry of running sessions, so liveness is the pair of facts available: a
// `codex` process is running, and the rollout was written in the last two minutes. That is
// coarser than the Claude registry, which names the pid of each session.

import { basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { LiveEntry } from '../../../data/model.ts';
import { codexUsage, type UsageEvent, type UsageTotals } from '../../transcripts/usage.ts';
import { isMap, list, text, whole } from './json.ts';
import type { Acc } from '../record.ts';
import {
    PROMPT_CHARS,
    addEvent,
    agentEntry,
    countFile,
    countTool,
    stampOf,
    touch
} from '../record.ts';

/** A rollout written more recently than this, with a codex process up, counts as live. */
export const CODEX_FRESH_SECONDS = 120;
export const PS_TIMEOUT_SEC = 3;
/** The agent path of the root session; every other path is a subagent. */
export const ROOT_AGENT = '/root';
/** Item types that are a tool call, counted under their own type name. */
export const CODEX_TOOL_ITEMS = ['CommandExecution', 'McpToolCall', 'Extension', 'ImageView'];

/**
 * The id a rollout's filename carries, which is the uuid after the timestamp. It is a fallback:
 * the session's own `session_meta` names the id and overrides this.
 */
export function rolloutId(path: string): string {
    const name = basename(path).replace(/\.jsonl$/, '');
    const match = /^rollout-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-(.+)$/.exec(name);
    return match === null ? name : match[1];
}

/** The store-relative folder of a rollout, `2026/09/07`, which is the Codex answer to a slug. */
export function rolloutSlug(store: string, path: string): string {
    const prefix = store.endsWith('/') ? store : `${store}/`;
    const folder = path.slice(0, path.lastIndexOf('/'));
    return folder.startsWith(prefix) ? folder.slice(prefix.length) : basename(folder);
}

/**
 * The text of a Codex content list, whose blocks carry `text` under a `type` of `text` or `Text`.
 */
function contentText(content: unknown): string {
    const pieces: string[] = [];
    for (const block of list(content)) {
        if (isMap(block) && typeof block.text === 'string') pieces.push(block.text);
    }
    return pieces.join('');
}

/** Fold one record of a Codex rollout. Anything it does not understand changes nothing. */
export function foldCodex(acc: Acc, record: Record<string, unknown>): void {
    const kind = record.type;
    const stamp = stampOf(record.timestamp);
    const payload = isMap(record.payload) ? record.payload : {};
    if (kind === 'session_meta') {
        acc.seen += 1;
        touch(acc, stamp);
        openSession(acc, payload);
        return;
    }
    if (kind === 'turn_context') {
        acc.seen += 1;
        touch(acc, stamp);
        turnContext(acc, payload);
        return;
    }
    if (kind === 'event_msg') {
        acc.seen += 1;
        touch(acc, stamp);
        foldEvent(acc, record, payload, stamp);
        return;
    }
    if (kind === 'response_item') {
        acc.seen += 1;
        touch(acc, stamp);
        foldResponseItem(acc, payload, stamp);
    }
    // world_state, token_usage_record (the same figures token_count carries), compacted and
    // inter_agent_communication_metadata hold nothing the record has a place for.
}

/**
 * The rollout's own meta opens it. A forked rollout carries the meta of the session it forked from
 * after its own, so only the first one is read: the second would rename the session to its parent.
 */
function openSession(acc: Acc, payload: Record<string, unknown>): void {
    if (acc.metaSeen) return;
    acc.metaSeen = true;
    const ident = text(payload.id) || text(payload.session_id);
    if (ident) acc.id = ident;
    if (text(payload.cwd)) acc.cwd = text(payload.cwd);
    if (text(payload.cli_version)) acc.version = text(payload.cli_version);
    if (text(payload.originator)) acc.entrypoint = text(payload.originator);
    const git = payload.git;
    if (isMap(git) && text(git.branch)) acc.branch = text(git.branch);
}

/** Each turn declares the model it runs and the collaboration mode it runs under. */
function turnContext(acc: Acc, payload: Record<string, unknown>): void {
    if (text(payload.model)) acc.model = text(payload.model);
    if (text(payload.cwd)) acc.cwd = text(payload.cwd);
    if (text(payload.effort)) acc.effort = text(payload.effort);
    const mode = payload.collaboration_mode;
    if (!isMap(mode)) return;
    if (text(mode.mode)) acc.permissionMode = text(mode.mode);
    const settings = mode.settings;
    if (isMap(settings) && text(settings.reasoning_effort)) {
        acc.effort = text(settings.reasoning_effort);
    }
}

function foldEvent(
    acc: Acc,
    record: Record<string, unknown>,
    payload: Record<string, unknown>,
    stamp: string | null
): void {
    const type = payload.type;
    if (type === 'task_started') {
        acc.turnOpen = true;
        const window = whole(payload.model_context_window);
        if (window) acc.contextWindow = window;
        return;
    }
    if (type === 'task_complete') {
        acc.turnOpen = false;
        addEvent(acc, stamp, 'turn', String(whole(payload.duration_ms)));
        return;
    }
    if (type === 'turn_aborted') {
        acc.turnOpen = false;
        return;
    }
    if (type === 'token_count') {
        const totals: UsageTotals = { ...acc.tokens };
        const usage = codexUsage(record, totals);
        if (usage !== null) foldTokens(acc, usage, totals);
        return;
    }
    if (type === 'item_completed') foldItem(acc, payload.item, stamp);
    // thread_settings_applied repeats the model and cwd turn_context already carries.
}

/**
 * Codex reports lifetime sums rather than a per-turn delta, so the totals are assigned rather than
 * added: folding the same record twice cannot inflate them. The context occupancy is the last
 * turn's input plus what of it came from the cache, which is what the meter measures.
 */
function foldTokens(acc: Acc, usage: UsageEvent, totals: UsageTotals): void {
    acc.tokens = totals;
    if (usage.context !== undefined) acc.context = usage.context;
    if (usage.contextWindow !== undefined) acc.contextWindow = usage.contextWindow;
}

function foldItem(acc: Acc, item: unknown, stamp: string | null): void {
    if (!isMap(item)) return;
    const type = text(item.type);
    if (type === 'UserMessage') {
        acc.prompts += 1;
        acc.messages += 1;
        const said = contentText(item.content);
        if (said) {
            acc.firstPrompt ??= said;
            acc.lastPrompt = said;
            addEvent(acc, stamp, 'prompt', said.slice(0, PROMPT_CHARS));
        }
        return;
    }
    if (type === 'AgentMessage') {
        acc.messages += 1;
        return;
    }
    if (type === 'FileChange') {
        for (const path of changedPaths(item.changes)) {
            countFile(acc, path, type, stamp);
            addEvent(acc, stamp, 'edit', path);
        }
        return;
    }
    if (type === 'ContextCompaction') {
        addEvent(acc, stamp, 'compaction', '');
        return;
    }
    if (type === 'SubAgentActivity') {
        subAgent(acc, item, stamp);
        return;
    }
    if (type === 'CollabAgentToolCall') {
        collabAgents(acc, item, stamp);
        return;
    }
    if (CODEX_TOOL_ITEMS.includes(type)) {
        countTool(acc, type);
        addEvent(acc, stamp, 'tool', type);
    }
    // Reasoning is the model thinking aloud and touches nothing the record holds.
}

/**
 * The paths a FileChange touched. The store writes `changes` as a map of path to the diff; the
 * list of entries carrying a `path` is accepted as well, since both readings have been described.
 */
function changedPaths(changes: unknown): string[] {
    const paths: string[] = [];
    if (isMap(changes)) {
        for (const path of Object.keys(changes)) if (path) paths.push(path);
        return paths;
    }
    for (const change of list(changes)) {
        if (isMap(change) && text(change.path)) paths.push(text(change.path));
    }
    return paths;
}

/** A subagent's own activity, keyed by its path. `/root` is the session itself, not a subagent. */
function subAgent(acc: Acc, item: Record<string, unknown>, stamp: string | null): void {
    const path = text(item.agent_path);
    if (!path || path === ROOT_AGENT) return;
    const agent = agentEntry(acc, path, stamp);
    if (!agent.subagentType) agent.subagentType = basename(path);
    if (text(item.kind) === 'completed') {
        agent.status = 'done';
        agent.ended = stamp;
    }
}

/** The agents a collaboration tool call is waiting on, each of them a subagent of the rollout. */
function collabAgents(acc: Acc, item: Record<string, unknown>, stamp: string | null): void {
    const paths = new Set<string>();
    for (const name of list(item.receiver_agents)) if (text(name)) paths.add(text(name));
    if (isMap(item.agents_states))
        for (const path of Object.keys(item.agents_states)) paths.add(path);
    for (const path of paths) {
        if (!path || path === ROOT_AGENT) continue;
        const agent = agentEntry(acc, path, stamp);
        if (!agent.subagentType) agent.subagentType = basename(path);
    }
}

function foldResponseItem(acc: Acc, payload: Record<string, unknown>, stamp: string | null): void {
    const type = payload.type;
    if (type === 'custom_tool_call' || type === 'function_call') {
        countTool(acc, text(payload.name));
        return;
    }
    if (type !== 'agent_message') return;
    // A message from a subagent names it; one from the root names the subagent it is talking to.
    const author = text(payload.author);
    const recipient = text(payload.recipient);
    const path = author && author !== ROOT_AGENT ? author : recipient;
    if (!path || path === ROOT_AGENT) return;
    const agent = agentEntry(acc, path, stamp);
    if (!agent.subagentType) agent.subagentType = basename(path);
}

/** What a rollout alone says the session is doing: a turn is open, or it is not. */
export function codexState(acc: Acc): string {
    if (!acc.seen) return 'unknown';
    return acc.turnOpen ? 'working' : 'idle';
}

/** What the Codex liveness check asks of the system: the command of every running process. */
export type CodexProbe = {
    commands(): string[];
};

export const systemCodexProbe: CodexProbe = {
    commands(): string[] {
        // List arguments, never a shell, and a timeout. Nothing is signalled and nothing is read
        // but the command names.
        const done = spawnSync('ps', ['-axo', 'comm='], {
            encoding: 'utf8',
            timeout: PS_TIMEOUT_SEC * 1000
        });
        if (done.error !== undefined || typeof done.stdout !== 'string') return [];
        return done.stdout.split('\n');
    }
};

/**
 * Whether the Codex CLI is running. The name must be exactly `codex`, which leaves out the desktop
 * app's `Codex (Renderer)`, `Codex (Service)` and `codex-code-mode-host` helpers, and a path inside
 * an application bundle is left out as well, which is where the desktop app keeps its own copy of
 * the binary under the same name.
 */
export function codexRunning(probe: CodexProbe = systemCodexProbe): boolean {
    for (const line of probe.commands()) {
        const command = line.trim();
        if (!command || command.includes('.app/')) continue;
        if (basename(command) === 'codex') return true;
    }
    return false;
}

/**
 * The live entry a rollout gets, or none. Codex names no pid, so the entry carries none; the
 * status is the transcript's own reading, which is the only thing that can tell working from idle.
 */
export function codexLive(
    state: string,
    mtimeSeconds: number | null,
    running: boolean,
    now: number = Date.now()
): LiveEntry | undefined {
    if (!running || mtimeSeconds === null) return undefined;
    if (now / 1000 - mtimeSeconds > CODEX_FRESH_SECONDS) return undefined;
    return {
        pid: null,
        status: state === 'working' ? 'busy' : 'idle',
        name: '',
        kind: 'codex',
        entrypoint: '',
        cwd: '',
        startedAt: 0
    };
}
