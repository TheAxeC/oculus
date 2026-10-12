// Layer 2, server. The accumulator both folds write into, and the record they both finish into.
//
// A session is one pass over a line-delimited file, so nothing is held but a running total: what
// was said, which tools ran, which files were touched, which subagents were dispatched and what
// the turn cost. The accumulator is JSON-safe on purpose, because the transcript cache stores it
// and resumes the next pass from it (cache.ts), and any change to its shape bumps CACHE_VERSION.
//
// The caps below are what stops a long session growing without bound: they are applied when the
// accumulator is pruned, so the cache entry stays small, and again when the record is finished.

import { z } from 'zod';
import { byKey } from '../../data/helpers/guards.ts';
import type {
    SizedAgent,
    SessionCache,
    SessionEvent,
    SessionFile,
    SessionRecord,
    SessionTokens,
    SessionTool
} from '../../data/model/index.ts';

/** A file untouched for this long is idle, whatever its last record looks like. */
export const IDLE_AFTER_SECONDS = 30 * 60;
/** A cache creation above this, straight after a read above it, is a bust. */
export const CACHE_BUST_TOKENS = 10000;
export const MAX_FILES = 200;
export const MAX_TIMELINE = 200;
export const MAX_AGENTS = 100;
/** The prefix of a prompt that goes on the timeline. */
export const PROMPT_CHARS = 200;
/** The length the fallback title is cut to. */
export const TITLE_CHARS = 60;

/** The running state of one fold. Everything in it survives JSON.stringify and JSON.parse. */
export type Acc = {
    id: string;
    path: string;
    slug: string;
    tool: SessionTool;
    cwd: string | null;
    branch: string | null;
    version: string | null;
    permissionMode: string | null;
    entrypoint: string | null;
    model: string | null;
    effort: string | null;
    aiTitle: string | null;
    /** The name the session was started under (`claude --name`), from its `agent-name` record. */
    agentName: string | null;
    firstPrompt: string | null;
    lastPrompt: string;
    started: string | null;
    lastActivity: string | null;
    prompts: number;
    messages: number;
    /** How many records the fold understood. Zero means the state is unknown, not idle. */
    seen: number;
    tokens: SessionTokens;
    cache: SessionCache;
    /** The previous turn's cache read, which is what makes the next creation a bust or not. */
    prevCacheRead: number;
    context: number;
    contextWindow: number | null;
    tools: Record<string, number>;
    files: Record<string, SessionFile>;
    agents: Record<string, SizedAgent>;
    /**
     * The subagents started in the background, by tool-use id, each with the agent id its launch
     * answer named ('' until it names one). A launch answers at once while the subagent works on,
     * so such an agent stays running until its completion notice or its own transcript says more.
     */
    background: Record<string, string>;
    timeline: SessionEvent[];
    /** Tool-use ids with no result yet, which is what makes a Claude session look busy. */
    pending: Record<string, number>;
    lastKind: string | null;
    lastToolIds: string[];
    /** Codex only: a turn started and neither completed nor aborted since. */
    turnOpen: boolean;
    /**
     * Codex only: the rollout's own `session_meta` has been folded. A forked rollout carries the
     * parent's meta after its own, and the second one must not rename the session.
     */
    metaSeen: boolean;
};

export function newAcc(id: string, path: string, slug: string, tool: SessionTool): Acc {
    return {
        id,
        path,
        slug,
        tool,
        cwd: null,
        branch: null,
        version: null,
        permissionMode: null,
        entrypoint: null,
        model: null,
        effort: null,
        aiTitle: null,
        agentName: null,
        firstPrompt: null,
        lastPrompt: '',
        started: null,
        lastActivity: null,
        prompts: 0,
        messages: 0,
        seen: 0,
        tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, thinking: 0 },
        cache: { ttl: null, lastCreation: null, lastRead: null, busts: 0 },
        prevCacheRead: 0,
        context: 0,
        contextWindow: null,
        tools: {},
        files: {},
        agents: {},
        background: {},
        timeline: [],
        pending: {},
        lastKind: null,
        lastToolIds: [],
        turnOpen: false,
        metaSeen: false
    };
}

const nullableTextShape = z.string().nullable();
const countsShape = z.record(z.string(), z.number());

/**
 * A stored accumulator, as the cache file holds it. Every field is optional, since an entry
 * written before a field existed lacks it and `rehydrate` fills it in; a field that is present
 * has the type `Acc` declares.
 */
export const accShape = z.object({
    id: z.string().optional(),
    path: z.string().optional(),
    slug: z.string().optional(),
    tool: z.enum(['claude', 'codex']).optional(),
    cwd: nullableTextShape.optional(),
    branch: nullableTextShape.optional(),
    version: nullableTextShape.optional(),
    permissionMode: nullableTextShape.optional(),
    entrypoint: nullableTextShape.optional(),
    model: nullableTextShape.optional(),
    effort: nullableTextShape.optional(),
    aiTitle: nullableTextShape.optional(),
    agentName: nullableTextShape.optional(),
    firstPrompt: nullableTextShape.optional(),
    lastPrompt: z.string().optional(),
    started: nullableTextShape.optional(),
    lastActivity: nullableTextShape.optional(),
    prompts: z.number().optional(),
    messages: z.number().optional(),
    seen: z.number().optional(),
    tokens: z
        .object({
            input: z.number(),
            output: z.number(),
            cacheRead: z.number(),
            cacheCreation: z.number(),
            thinking: z.number()
        })
        .optional(),
    cache: z
        .object({
            ttl: nullableTextShape,
            lastCreation: nullableTextShape,
            lastRead: nullableTextShape,
            busts: z.number()
        })
        .optional(),
    prevCacheRead: z.number().optional(),
    context: z.number().optional(),
    contextWindow: z.number().nullable().optional(),
    tools: countsShape.optional(),
    files: z
        .record(
            z.string(),
            z.object({
                path: z.string(),
                tool: z.string(),
                count: z.number(),
                last: nullableTextShape
            })
        )
        .optional(),
    agents: z
        .record(
            z.string(),
            z.object({
                id: z.string(),
                description: z.string(),
                subagentType: z.string(),
                model: nullableTextShape,
                started: nullableTextShape,
                ended: nullableTextShape,
                status: z.string(),
                resultChars: z.number(),
                tokens: z.number().optional()
            })
        )
        .optional(),
    background: z.record(z.string(), z.string()).optional(),
    timeline: z
        .array(z.object({ ts: nullableTextShape, kind: z.string(), text: z.string() }))
        .optional(),
    pending: countsShape.optional(),
    lastKind: nullableTextShape.optional(),
    lastToolIds: z.array(z.string()).optional(),
    turnOpen: z.boolean().optional(),
    metaSeen: z.boolean().optional()
}) satisfies z.ZodType<Partial<Acc>>;

/** A text field of a record, read as absent unless it is a string. */
export const textShape = z.string().optional().catch(undefined);

/** The stamp a record carries, or null when it carries none. */
export const stampShape = z.string().min(1).nullable().catch(null);

/**
 * Note the moment: the first stamp seen opens the session and every one moves its last activity.
 */
export function touch(acc: Acc, stamp: string | null): void {
    if (stamp === null) return;
    acc.started ??= stamp;
    acc.lastActivity = stamp;
}

export function addEvent(acc: Acc, ts: string | null, kind: string, text: string): void {
    acc.timeline.push({ ts, kind, text });
    // Trimmed at twice the cap rather than every push, so a long fold does not copy the list often.
    if (acc.timeline.length > 2 * MAX_TIMELINE) {
        acc.timeline = acc.timeline.slice(-MAX_TIMELINE);
    }
}

export function countTool(acc: Acc, name: string): void {
    if (!name) return;
    acc.tools[name] = (acc.tools[name] ?? 0) + 1;
}

/** Count one touched file under the tool that touched it, and return the entry that was updated. */
export function countFile(acc: Acc, path: string, tool: string, stamp: string | null): void {
    const entry = acc.files[path] ?? { path, tool, count: 0, last: null };
    entry.tool = tool;
    entry.count += 1;
    entry.last = stamp;
    acc.files[path] = entry;
}

/** Open, or update, one subagent entry. Keyed by tool-use id (Claude) or agent path (Codex). */
export function agentEntry(acc: Acc, id: string, stamp: string | null): SizedAgent {
    const existing = byKey(acc.agents, id);
    if (existing !== undefined) return existing;
    const agent: SizedAgent = {
        id,
        description: '',
        subagentType: '',
        model: null,
        started: stamp,
        ended: null,
        status: 'running',
        resultChars: 0
    };
    acc.agents[id] = agent;
    return agent;
}

function recency(entry: SessionFile): string {
    return entry.last ?? '';
}

/** Hold the accumulator at its published caps, so the cache entry it becomes stays small. */
export function prune(acc: Acc): void {
    const paths = Object.keys(acc.files);
    if (paths.length > MAX_FILES) {
        const keep = Object.values(acc.files)
            .sort((a, b) => (recency(a) < recency(b) ? 1 : recency(a) > recency(b) ? -1 : 0))
            .slice(0, MAX_FILES);
        acc.files = {};
        for (const entry of keep) acc.files[entry.path] = entry;
    }
    const ids = Object.keys(acc.agents);
    if (ids.length > MAX_AGENTS) {
        const keep = ids.slice(-MAX_AGENTS);
        const agents: Record<string, SizedAgent> = {};
        for (const id of keep) agents[id] = acc.agents[id];
        acc.agents = agents;
    }
    // A background launch is kept only while its agent is.
    for (const id of Object.keys(acc.background)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- the accumulator is plain JSON the cache stores
        if (!(id in acc.agents)) delete acc.background[id];
    }
    if (acc.timeline.length > MAX_TIMELINE) acc.timeline = acc.timeline.slice(-MAX_TIMELINE);
}

/**
 * The command a prompt that opens a slash command runs, with its arguments on one line: the prompt
 * the harness writes for `/spec 38.2 20b` is its `<command-name>` and `<command-args>` tags, which
 * read as markup at the head of a title. Only a prompt that starts with a `<command-` tag counts,
 * so a prompt that quotes the markup mid-sentence keeps its own words. Null for any other prompt.
 */
function slashCommand(prompt: string): string | null {
    const text = prompt.trimStart();
    if (!text.startsWith('<command-')) return null;
    const name = /<command-name>([\s\S]*?)<\/command-name>/.exec(text)?.[1].trim();
    if (!name) return null;
    const args = /<command-args>([\s\S]*?)<\/command-args>/.exec(text)?.[1].replace(/\s+/g, ' ');
    const words = args?.trim() ?? '';
    return words === '' ? name : `${name} ${words}`;
}

/**
 * The AI title, else the opening of the first prompt, else the session id. The opening of a prompt
 * that runs a slash command is the command and its arguments, cut to the same length.
 */
export function title(acc: Acc): string {
    if (acc.aiTitle) return acc.aiTitle;
    const prompt = acc.firstPrompt ?? '';
    const opening = (slashCommand(prompt) ?? prompt).slice(0, TITLE_CHARS).trim();
    return opening || acc.id;
}

/**
 * The record, from the accumulator and the state its own fold worked out. The live fields are the
 * not-live defaults; registry.ts fills them in when the session's process is running.
 */
export function finish(acc: Acc, state: string): SessionRecord {
    const files = Object.values(acc.files)
        .sort((a, b) => (recency(a) < recency(b) ? 1 : recency(a) > recency(b) ? -1 : 0))
        .slice(0, MAX_FILES);
    const agents = Object.values(acc.agents).slice(-MAX_AGENTS).reverse();
    return {
        id: acc.id,
        path: acc.path,
        slug: acc.slug,
        tool: acc.tool,
        cwd: acc.cwd,
        branch: acc.branch,
        title: title(acc),
        lastPrompt: acc.lastPrompt,
        model: acc.model,
        effort: acc.effort,
        permissionMode: acc.permissionMode,
        version: acc.version,
        entrypoint: acc.entrypoint,
        started: acc.started,
        lastActivity: acc.lastActivity,
        state,
        live: false,
        liveStatus: null,
        pid: null,
        registryName: null,
        hidden: false,
        prompts: acc.prompts,
        messages: acc.messages,
        tokens: { ...acc.tokens },
        contextTokens: acc.context,
        // The accumulator's prevCacheRead is the read of the turn it last folded, which is the last
        // turn of the whole transcript once the fold has finished.
        lastCacheRead: acc.prevCacheRead,
        contextWindow: acc.contextWindow,
        cache: { ...acc.cache },
        tools: { ...acc.tools },
        files: files.map((entry) => ({ ...entry })),
        agents: agents.map((agent) => ({ ...agent })),
        timeline: acc.timeline.slice(-MAX_TIMELINE).map((event) => ({ ...event })),
        truncated: false,
        hook: null
    };
}
