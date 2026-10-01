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
import { z } from 'zod';
import type { LiveEntry } from '../../../data/model/index.ts';
import {
    codexInfoShape,
    codexUsageOf,
    type UsageEvent,
    type UsageTotals
} from '../../transcripts/usage.ts';
import { mapShape, quickly, wholeShape } from '../../../data/shapes/shapes.ts';
import type { Acc } from '../record.ts';
import {
    PROMPT_CHARS,
    addEvent,
    agentEntry,
    countFile,
    countTool,
    stampShape,
    textShape,
    touch
} from '../record.ts';
import { filledTextShape } from '../../../data/shapes/shapes.ts';

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
 * The text of a content list: the `text` of each block that holds some, run together with nothing
 * between them, and nothing for a content that is no list. The Claude counterpart is
 * `contentTextShape` in background.ts, which joins by new lines and takes a string whole.
 */
const codexContentTextShape = z
    .array(z.object({ text: textShape }).catch(() => ({ text: undefined })))
    .transform((blocks) => blocks.map((block) => block.text ?? '').join(''))
    .optional()
    .catch('');

/** The payload of a `session_meta` record: the session's id and where and how it was started. */
const metaPayloadShape = z
    .object({
        id: filledTextShape,
        session_id: filledTextShape,
        cwd: textShape,
        cli_version: textShape,
        originator: textShape,
        git: z.object({ branch: textShape }).optional().catch(undefined)
    })
    .catch(() => ({
        id: undefined,
        session_id: undefined,
        cwd: undefined,
        cli_version: undefined,
        originator: undefined,
        git: undefined
    }));
type MetaPayload = z.output<typeof metaPayloadShape>;

/** The payload of a `turn_context` record: the model and mode the turn runs under. */
const contextPayloadShape = quickly(
    z
        .object({
            model: textShape,
            cwd: textShape,
            effort: textShape,
            collaboration_mode: z
                .object({
                    mode: textShape,
                    settings: z.object({ reasoning_effort: textShape }).optional().catch(undefined)
                })
                .optional()
                .catch(undefined)
        })
        .catch(() => ({
            model: undefined,
            cwd: undefined,
            effort: undefined,
            collaboration_mode: undefined
        }))
);
type ContextPayload = z.output<typeof contextPayloadShape>;

/** An item of a completed event, by its type: only the fields that type is read by. */
const itemShape = quickly(
    z
        .object({
            type: textShape,
            content: codexContentTextShape,
            changes: z.unknown().optional(),
            agent_path: textShape,
            kind: textShape,
            receiver_agents: z.array(filledTextShape).optional().catch(undefined),
            agents_states: mapShape.optional().catch(undefined)
        })
        .optional()
        .catch(undefined)
);
type Item = NonNullable<z.output<typeof itemShape>>;

/**
 * The payload of an `event_msg` record: the event's type, the window and the duration a
 * `task_started` and a `task_complete` carry as whole numbers (absent stays absent), and the
 * `info` and the `item` that the events holding them read. A payload that is no map gives every
 * field absent.
 */
const eventPayloadShape = quickly(
    z
        .object({
            type: textShape,
            model_context_window: wholeShape.optional(),
            duration_ms: wholeShape.optional(),
            info: z.unknown().optional(),
            item: z.unknown().optional()
        })
        .catch(() => ({
            type: undefined,
            model_context_window: undefined,
            duration_ms: undefined,
            info: undefined,
            item: undefined
        }))
);
type EventPayload = z.output<typeof eventPayloadShape>;

/** The `info` of a `token_count` event, read the quick way first. */
const tokenInfoShape = quickly(codexInfoShape);

/** The payload of a `response_item` record: a tool call, or a message between agents. */
const responsePayloadShape = quickly(
    z
        .object({ type: textShape, name: textShape, author: textShape, recipient: textShape })
        .catch(() => ({
            type: undefined,
            name: undefined,
            author: undefined,
            recipient: undefined
        }))
);
type ResponsePayload = z.output<typeof responsePayloadShape>;

/** The stamp of a record, with its payload read through the schema of the record's kind. */
const metaRecordShape = z.object({ timestamp: stampShape, payload: metaPayloadShape });
const contextRecordShape = z.object({ timestamp: stampShape, payload: contextPayloadShape });
const responseRecordShape = z.object({ timestamp: stampShape, payload: responsePayloadShape });
const eventRecordShape = z.object({ timestamp: stampShape, payload: z.unknown().optional() });

/**
 * Fold one record of a Codex rollout. Anything it does not understand changes nothing. The
 * records of any other type hold nothing the record has a place for: `world_state`,
 * `token_usage_record` (the same figures `token_count` carries), `compacted` and
 * `inter_agent_communication_metadata` among them.
 */
export function foldCodex(acc: Acc, record: Record<string, unknown>): void {
    const kind = record.type;
    if (kind === 'event_msg') {
        const { timestamp: stamp, payload } = eventRecordShape.parse(record);
        acc.seen += 1;
        touch(acc, stamp);
        foldEvent(acc, eventPayloadShape.parse(payload), stamp);
    } else if (kind === 'response_item') {
        const { timestamp: stamp, payload } = responseRecordShape.parse(record);
        acc.seen += 1;
        touch(acc, stamp);
        foldResponseItem(acc, payload, stamp);
    } else if (kind === 'turn_context') {
        const { timestamp: stamp, payload } = contextRecordShape.parse(record);
        acc.seen += 1;
        touch(acc, stamp);
        turnContext(acc, payload);
    } else if (kind === 'session_meta') {
        const { timestamp: stamp, payload } = metaRecordShape.parse(record);
        acc.seen += 1;
        touch(acc, stamp);
        openSession(acc, payload);
    }
}

/**
 * The rollout's own meta opens it. A forked rollout carries the meta of the session it forked from
 * after its own, so only the first one is read: the second would rename the session to its parent.
 */
function openSession(acc: Acc, payload: MetaPayload): void {
    if (acc.metaSeen) return;
    acc.metaSeen = true;
    const ident = payload.id ?? payload.session_id;
    if (ident) acc.id = ident;
    if (payload.cwd) acc.cwd = payload.cwd;
    if (payload.cli_version) acc.version = payload.cli_version;
    if (payload.originator) acc.entrypoint = payload.originator;
    if (payload.git?.branch) acc.branch = payload.git.branch;
}

/** Each turn declares the model it runs and the collaboration mode it runs under. */
function turnContext(acc: Acc, payload: ContextPayload): void {
    if (payload.model) acc.model = payload.model;
    if (payload.cwd) acc.cwd = payload.cwd;
    if (payload.effort) acc.effort = payload.effort;
    const mode = payload.collaboration_mode;
    if (mode === undefined) return;
    if (mode.mode) acc.permissionMode = mode.mode;
    if (mode.settings?.reasoning_effort) acc.effort = mode.settings.reasoning_effort;
}

function foldEvent(acc: Acc, payload: EventPayload, stamp: string | null): void {
    const type = payload.type;
    if (type === 'task_started') {
        acc.turnOpen = true;
        if (payload.model_context_window) acc.contextWindow = payload.model_context_window;
        return;
    }
    if (type === 'task_complete') {
        acc.turnOpen = false;
        addEvent(acc, stamp, 'turn', String(payload.duration_ms ?? 0));
        return;
    }
    if (type === 'turn_aborted') {
        acc.turnOpen = false;
        return;
    }
    if (type === 'token_count') {
        const totals: UsageTotals = { ...acc.tokens };
        foldTokens(acc, codexUsageOf(stamp, tokenInfoShape.parse(payload.info), totals), totals);
        return;
    }
    if (type === 'item_completed') foldItem(acc, itemShape.parse(payload.item), stamp);
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

function foldItem(acc: Acc, item: Item | undefined, stamp: string | null): void {
    if (item === undefined) return;
    const type = item.type ?? '';
    if (type === 'UserMessage') {
        acc.prompts += 1;
        acc.messages += 1;
        const said = item.content;
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
        for (const path of changedPathsShape.parse(item.changes)) {
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
const changedPathsShape = z
    .union([
        mapShape.transform((changes) => Object.keys(changes).filter(Boolean)),
        z
            .array(z.object({ path: filledTextShape }).catch(() => ({ path: undefined })))
            .transform((all) => all.flatMap((change) => (change.path ? [change.path] : [])))
    ])
    .catch(() => []);

/** A subagent's own activity, keyed by its path. `/root` is the session itself, not a subagent. */
function subAgent(acc: Acc, item: Item, stamp: string | null): void {
    const path = item.agent_path;
    if (!path || path === ROOT_AGENT) return;
    const agent = agentEntry(acc, path, stamp);
    if (!agent.subagentType) agent.subagentType = basename(path);
    if (item.kind === 'completed') {
        agent.status = 'done';
        agent.ended = stamp;
    }
}

/** The agents a collaboration tool call is waiting on, each of them a subagent of the rollout. */
function collabAgents(acc: Acc, item: Item, stamp: string | null): void {
    const paths = new Set<string>();
    for (const name of item.receiver_agents ?? []) if (name) paths.add(name);
    for (const path of Object.keys(item.agents_states ?? {})) paths.add(path);
    for (const path of paths) {
        if (!path || path === ROOT_AGENT) continue;
        const agent = agentEntry(acc, path, stamp);
        if (!agent.subagentType) agent.subagentType = basename(path);
    }
}

function foldResponseItem(acc: Acc, payload: ResponsePayload, stamp: string | null): void {
    const type = payload.type;
    if (type === 'custom_tool_call' || type === 'function_call') {
        countTool(acc, payload.name ?? '');
        return;
    }
    if (type !== 'agent_message') return;
    // A message from a subagent names it; one from the root names the subagent it is talking to.
    const author = payload.author ?? '';
    const recipient = payload.recipient ?? '';
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
