// Layer 2, server. The Claude Code transcript fold: one JSON record in, the accumulator updated.
//
// A transcript is a line of JSON per record. Five kinds carry anything: `ai-title` names the
// session, `last-prompt` repeats what was last asked, a `system` record of subtype `turn_duration`
// closes a turn, and the `user` and `assistant` records are the conversation itself, with the tool
// calls, the touched files, the subagents and the token usage inside their content blocks.
//
// A subagent is a `tool_use` block named `Agent`, paired to its `tool_result` by id; `isSidechain`
// is false on every record of the store and says nothing, so nothing here reads it.

import type { Acc } from './record.ts';
import { claudeUsage, type UsageEvent } from '../transcripts/usage.ts';
import {
    CACHE_BUST_TOKENS,
    IDLE_AFTER_SECONDS,
    PROMPT_CHARS,
    addEvent,
    agentEntry,
    countFile,
    countTool,
    stampOf,
    touch
} from './record.ts';
import { isMap, list, whole } from './json.ts';

/** The tools whose call is an edit rather than a read. */
export const EDIT_TOOLS = ['Edit', 'Write', 'NotebookEdit', 'MultiEdit'];
/** The tools whose call names a file at all. */
export const FILE_TOOLS = [...EDIT_TOOLS, 'Read'];

/** The context fields a message record carries, and the accumulator field each one fills. */
const CONTEXT_FIELDS: [string, 'cwd' | 'branch' | 'version' | 'permissionMode' | 'entrypoint'][] = [
    ['cwd', 'cwd'],
    ['gitBranch', 'branch'],
    ['version', 'version'],
    ['permissionMode', 'permissionMode'],
    ['entrypoint', 'entrypoint']
];

/** Fold one record of a Claude transcript. Anything it does not understand changes nothing. */
export function foldClaude(acc: Acc, record: Record<string, unknown>): void {
    const kind = record.type;
    if (kind === 'ai-title') {
        if (typeof record.aiTitle === 'string' && record.aiTitle) acc.aiTitle = record.aiTitle;
        return;
    }
    if (kind === 'last-prompt') {
        if (typeof record.lastPrompt === 'string') acc.lastPrompt = record.lastPrompt;
        return;
    }
    if (kind === 'system') {
        if (record.subtype === 'turn_duration') {
            acc.seen += 1;
            acc.lastKind = 'turn';
            addEvent(acc, stampOf(record.timestamp), 'turn', String(whole(record.durationMs)));
        }
        return;
    }
    if (kind !== 'user' && kind !== 'assistant') return;

    acc.seen += 1;
    acc.messages += 1;
    const stamp = stampOf(record.timestamp);
    for (const [source, target] of CONTEXT_FIELDS) {
        const value = record[source];
        if (typeof value === 'string' && value) acc[target] = value;
    }
    touch(acc, stamp);

    const message = isMap(record.message) ? record.message : {};
    const content = message.content;
    if (kind === 'user') foldUser(acc, record, content, stamp);
    else foldAssistant(acc, record, message, content, stamp);
}

function foldUser(
    acc: Acc,
    record: Record<string, unknown>,
    content: unknown,
    stamp: string | null
): void {
    acc.lastKind = 'user';
    acc.lastToolIds = [];
    const origin = record.origin;
    if (isMap(origin) && origin.kind === 'human') {
        acc.prompts += 1;
        if (typeof content === 'string' && content) {
            if (acc.firstPrompt === null) acc.firstPrompt = content;
            addEvent(acc, stamp, 'prompt', content.slice(0, PROMPT_CHARS));
        }
    }
    for (const block of list(content)) {
        if (!isMap(block) || block.type !== 'tool_result') continue;
        const ident = typeof block.tool_use_id === 'string' ? block.tool_use_id : '';
        if (ident) delete acc.pending[ident];
        const agent = ident ? acc.agents[ident] : undefined;
        if (agent === undefined) continue;
        agent.ended = stamp;
        agent.status = block.is_error === true ? 'error' : 'done';
        agent.resultChars = length(block.content);
    }
}

function foldAssistant(
    acc: Acc,
    record: Record<string, unknown>,
    message: Record<string, unknown>,
    content: unknown,
    stamp: string | null
): void {
    acc.lastKind = 'assistant';
    const usage = claudeUsage(record);
    if (usage !== null && usage.model) acc.model = usage.model;
    const effort = record.effort ?? message.effort;
    if (typeof effort === 'string' && effort) acc.effort = effort;
    if (usage !== null && usage.context !== undefined) foldUsage(acc, usage, stamp);
    const ids: string[] = [];
    for (const block of list(content)) {
        if (!isMap(block) || block.type !== 'tool_use') continue;
        foldToolUse(acc, block, stamp);
        if (typeof block.id === 'string' && block.id) {
            ids.push(block.id);
            acc.pending[block.id] = 1;
        }
    }
    acc.lastToolIds = ids;
}

function foldUsage(acc: Acc, usage: UsageEvent, stamp: string | null): void {
    acc.tokens.input += usage.input;
    acc.tokens.output += usage.output;
    acc.tokens.cacheRead += usage.cacheRead;
    acc.tokens.cacheCreation += usage.cacheCreation;
    acc.tokens.thinking += usage.thinking;
    // What the model actually carried on this turn. The sums above are lifetime totals and run
    // into the hundreds of millions, so they say nothing about how full the window is right now.
    if (usage.context !== undefined) acc.context = usage.context;

    if (usage.ttl !== null && usage.ttl !== undefined) acc.cache.ttl = usage.ttl;
    if (usage.cacheCreation) acc.cache.lastCreation = stamp;
    if (usage.cacheRead) acc.cache.lastRead = stamp;
    // A large fresh write straight after a large read means the cached prefix was thrown away. It
    // is the most expensive thing that happens in a session, so it goes on the timeline as well,
    // carrying the number of tokens that had to be written again.
    if (usage.cacheCreation > CACHE_BUST_TOKENS && acc.prevCacheRead > CACHE_BUST_TOKENS) {
        acc.cache.busts += 1;
        addEvent(acc, stamp, 'bust', String(usage.cacheCreation));
    }
    acc.prevCacheRead = usage.cacheRead;
}

function foldToolUse(acc: Acc, block: Record<string, unknown>, stamp: string | null): void {
    const name = typeof block.name === 'string' ? block.name : '';
    if (!name) return;
    countTool(acc, name);
    const args = isMap(block.input) ? block.input : {};
    if (name === 'Agent' && typeof block.id === 'string' && block.id) {
        const agent = agentEntry(acc, block.id, stamp);
        agent.description = typeof args.description === 'string' ? args.description : '';
        agent.subagentType = typeof args.subagent_type === 'string' ? args.subagent_type : '';
        agent.model = typeof args.model === 'string' && args.model ? args.model : null;
    }
    const kind = EDIT_TOOLS.includes(name) ? 'edit' : 'tool';
    const path = args.file_path ?? args.notebook_path;
    if (FILE_TOOLS.includes(name) && typeof path === 'string' && path) {
        countFile(acc, path, name, stamp);
        addEvent(acc, stamp, kind, path);
    } else {
        addEvent(acc, stamp, kind, name);
    }
}

/** The length of a tool result, whether it came back as text or as a list of blocks. */
function length(content: unknown): number {
    if (typeof content === 'string') return content.length;
    let total = 0;
    for (const block of list(content)) {
        if (isMap(block) && typeof block.text === 'string') total += block.text.length;
    }
    return total;
}

/**
 * What the transcript alone says the session is doing. It is a guess: the file records what
 * happened, not what is happening, and a session whose last record is a tool call with no result
 * looks exactly like one whose process died there. registry.ts overrules it wherever it can.
 */
export function claudeState(
    acc: Acc,
    mtimeSeconds: number | null,
    now: number = Date.now()
): string {
    if (!acc.seen) return 'unknown';
    if (mtimeSeconds !== null && now / 1000 - mtimeSeconds > IDLE_AFTER_SECONDS) return 'idle';
    if (acc.lastKind === 'user') return 'working';
    if (acc.lastKind === 'assistant') {
        return acc.lastToolIds.some((id) => id in acc.pending) ? 'working' : 'idle';
    }
    return 'idle';
}
