// Layer 2, server. The Claude Code transcript fold: one JSON record in, the accumulator updated.
//
// A transcript is a line of JSON per record. Six kinds carry anything: `ai-title` names the
// session, `agent-name` holds the name it was started under, `last-prompt` repeats what was last
// asked, a `system` record of subtype `turn_duration` closes a turn, and the `user` and `assistant`
// records are the conversation itself, with the tool calls, the touched files, the subagents and
// the token usage inside their content blocks.
//
// A subagent is a `tool_use` block named `Agent`, paired to its `tool_result` by id; `isSidechain`
// is false on every record of the store and says nothing, so nothing here reads it. A subagent
// started in the background is not ended by that result, which is only its launch notice
// (stores/background.ts).

import { z } from 'zod';
import { claudeMessageFields, usageOf, type UsageEvent } from '../transcripts/usage.ts';
import {
    CACHE_BUST_TOKENS,
    IDLE_AFTER_SECONDS,
    PROMPT_CHARS,
    addEvent,
    agentEntry,
    countFile,
    countTool,
    stampShape,
    textShape,
    touch,
    type Acc
} from './record.ts';
import { filledTextShape } from '../../data/shapes/shapes.ts';
import {
    contentTextShape,
    isLaunch,
    launchAnswerShape,
    takeLaunch,
    takeNotices
} from './stores/background.ts';
import { quickly, readAs, wholeShape } from '../../data/shapes/shapes.ts';

/** The tools whose call is an edit rather than a read. */
export const EDIT_TOOLS = ['Edit', 'Write', 'NotebookEdit', 'MultiEdit'];
/** The tools whose call names a file at all. */
export const FILE_TOOLS = [...EDIT_TOOLS, 'Read'];

/** A record of the `ai-title` kind: the title the session was given, when it has one. */
const aiTitleShape = z.object({ aiTitle: filledTextShape });

/** A record of the `agent-name` kind: the name the session was started under. */
const agentNameShape = z.object({ agentName: filledTextShape });

/** A record of the `last-prompt` kind: the prompt, which may be the empty text. */
const lastPromptShape = z.object({ lastPrompt: textShape });

/** A record of the `system` kind: only its `turn_duration` subtype says anything. */
const systemShape = z.object({
    subtype: textShape,
    timestamp: stampShape,
    durationMs: wholeShape.optional()
});

/**
 * A record of the `attachment` kind. A completion notice that reached a busy session is queued, and
 * the transcript carries it as an attachment of the queued command rather than as a user message.
 */
const attachmentShape = z.object({
    timestamp: stampShape,
    attachment: z
        .object({ commandMode: z.literal('task-notification'), prompt: z.string() })
        .optional()
        .catch(undefined)
});

/** The context fields every message record carries. */
const contextShape = {
    cwd: textShape,
    gitBranch: textShape,
    version: textShape,
    permissionMode: textShape,
    entrypoint: textShape
};

/** The block of a user message that matters: the answer to a tool call, and any text it holds. */
const userBlockShape = z
    .object({
        type: textShape,
        text: textShape,
        tool_use_id: textShape,
        content: z.unknown().optional(),
        is_error: z.boolean().optional().catch(undefined)
    })
    .catch(() => ({
        type: undefined,
        text: undefined,
        tool_use_id: undefined,
        content: undefined,
        is_error: undefined
    }));

/**
 * A user message's content: a prompt's text, or a list of blocks and the text they hold, one block
 * to a line.
 */
const userContentShape = z
    .union([
        z.array(userBlockShape).transform((blocks) => ({
            prompt: '',
            blocks,
            text: contentTextShape.parse(blocks)
        })),
        z.string().transform((text) => ({ prompt: text, blocks: [], text }))
    ])
    .optional()
    .catch(undefined);

/** What a user message without content holds, made fresh for each message. */
function noContent(): NonNullable<z.output<typeof userContentShape>> {
    return { prompt: '', blocks: [], text: '' };
}

/**
 * The fields of a user record that say whether a person wrote it (`saidByHuman`): its origin, the
 * meta and compaction-summary marks, and the entrypoint of the process that wrote it.
 */
export const promptFields = {
    origin: z.object({ kind: z.string() }).optional().catch(undefined),
    isMeta: z.boolean().optional().catch(undefined),
    isCompactSummary: z.boolean().optional().catch(undefined),
    entrypoint: textShape
};

/** What `promptFields` read off a user record. */
type PromptHead = z.output<z.ZodObject<typeof promptFields>>;

/** A record of the `user` kind. */
const userShape = quickly(
    z.object({
        timestamp: stampShape,
        ...contextShape,
        ...promptFields,
        message: z.object({ content: userContentShape }).catch(() => ({ content: undefined })),
        toolUseResult: z.unknown().optional()
    })
);

/** What an Agent call's input says about the subagent, and which file a file tool names. */
const toolInputShape = z
    .object({
        description: textShape,
        subagent_type: textShape,
        model: filledTextShape,
        run_in_background: z.boolean().optional().catch(undefined),
        file_path: z.unknown().optional(),
        notebook_path: z.unknown().optional()
    })
    .optional()
    .catch(undefined);

/** The block of an assistant message that matters: a tool call and what it asks for. */
const toolUseShape = z
    .object({
        type: textShape,
        id: filledTextShape,
        name: textShape,
        input: toolInputShape
    })
    .catch(() => ({ type: undefined, id: undefined, name: undefined, input: undefined }));

/** A record of the `assistant` kind. */
const assistantShape = quickly(
    z.object({
        timestamp: stampShape,
        ...contextShape,
        effort: z.unknown().optional(),
        message: z
            .object({
                ...claudeMessageFields,
                content: z.array(toolUseShape).optional().catch(undefined),
                effort: z.unknown().optional()
            })
            .catch(() => ({
                model: undefined,
                usage: undefined,
                content: undefined,
                effort: undefined
            }))
    })
);

type UserRecord = z.output<typeof userShape>;
type AssistantRecord = z.output<typeof assistantShape>;
type ToolUse = z.output<typeof toolUseShape>;

/** Fold one record of a Claude transcript. Anything it does not understand changes nothing. */
export function foldClaude(acc: Acc, record: Record<string, unknown>): void {
    // The kind of a record decides the shape the rest of it is read through.
    const kind = record.type;
    if (kind === 'ai-title') {
        const title = aiTitleShape.parse(record).aiTitle;
        if (title) acc.aiTitle = title;
    } else if (kind === 'agent-name') {
        const name = agentNameShape.parse(record).agentName;
        if (name) acc.agentName = name;
    } else if (kind === 'last-prompt') {
        const prompt = lastPromptShape.parse(record).lastPrompt;
        if (prompt !== undefined) acc.lastPrompt = prompt;
    } else if (kind === 'system') {
        const found = systemShape.parse(record);
        if (found.subtype !== 'turn_duration') return;
        acc.seen += 1;
        acc.lastKind = 'turn';
        addEvent(acc, found.timestamp, 'turn', String(found.durationMs ?? 0));
    } else if (kind === 'attachment') {
        const found = attachmentShape.parse(record);
        if (found.attachment !== undefined) {
            takeNotices(acc, found.attachment.prompt, found.timestamp);
        }
    } else if (kind === 'user') {
        const found = userShape.parse(record);
        foldContext(acc, found);
        foldUser(acc, found);
    } else if (kind === 'assistant') {
        const found = assistantShape.parse(record);
        foldContext(acc, found);
        foldAssistant(acc, found);
    }
}

/** A message record counts as seen and carries the context its session runs in. */
function foldContext(acc: Acc, found: UserRecord | AssistantRecord): void {
    acc.seen += 1;
    acc.messages += 1;
    if (found.cwd) acc.cwd = found.cwd;
    if (found.gitBranch) acc.branch = found.gitBranch;
    if (found.version) acc.version = found.version;
    if (found.permissionMode) acc.permissionMode = found.permissionMode;
    if (found.entrypoint) acc.entrypoint = found.entrypoint;
    touch(acc, found.timestamp);
}

/** The entrypoint a headless Claude session (`claude -p`, the SDK) writes on its records. */
const HEADLESS_ENTRYPOINT = 'sdk-cli';

/**
 * Whether a user record is a prompt a person wrote. A compaction summary never is. An interactive
 * session marks a prompt with the origin `human`, and its other user records with an origin of
 * their own kind (a task notification, a message from another session) or with none (a command
 * and its output, a shell line); a headless session writes its prompts with no origin at all, so a
 * record with no origin is a prompt only in a headless transcript, told by its entrypoint, and only
 * when it is no meta record and holds words.
 */
export function saidByHuman(head: PromptHead, words: string): boolean {
    if (head.isCompactSummary === true) return false;
    if (head.origin !== undefined) return head.origin.kind === 'human';
    return head.entrypoint === HEADLESS_ENTRYPOINT && head.isMeta !== true && words !== '';
}

function foldUser(acc: Acc, record: UserRecord): void {
    const stamp = record.timestamp;
    const { prompt, blocks, text } = record.message.content ?? noContent();
    acc.lastKind = 'user';
    acc.lastToolIds = [];
    if (saidByHuman(record, prompt)) {
        acc.prompts += 1;
        if (prompt) {
            acc.firstPrompt ??= prompt;
            addEvent(acc, stamp, 'prompt', prompt.slice(0, PROMPT_CHARS));
        }
    }
    for (const block of blocks) {
        if (block.type !== 'tool_result') continue;
        const ident = block.tool_use_id ?? '';
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (ident) delete acc.pending[ident];
        const agent = ident ? acc.agents[ident] : undefined;
        if (agent === undefined) continue;
        const answer = launchAnswerShape.parse(record.toolUseResult);
        if (isLaunch(acc, ident, answer)) {
            takeLaunch(acc, ident, answer, block.content);
            continue;
        }
        agent.ended = stamp;
        agent.status = block.is_error === true ? 'error' : 'done';
        agent.resultChars = resultLength(block.content);
        agent.agentId = answer?.agentId ?? '';
        const spent = spentTokens(record.toolUseResult);
        if (spent !== null) agent.tokens = spent;
    }
    takeNotices(acc, text, stamp);
}

/** `totalTokens` of the result Claude Code writes beside an Agent call's answer. */
const spentShape = z.object({ totalTokens: z.number().min(0) });

/**
 * The tokens an Agent call's result says the subagent spent, `totalTokens` on the result Claude
 * Code writes beside it, or null where the result carries no such count.
 */
export function spentTokens(answer: unknown): number | null {
    return readAs(spentShape, answer)?.totalTokens ?? null;
}

function foldAssistant(acc: Acc, parsed: AssistantRecord): void {
    const stamp = parsed.timestamp;
    acc.lastKind = 'assistant';
    const usage = usageOf(stamp, parsed.message);
    if (usage.model) acc.model = usage.model;
    const effort = filledTextShape.parse(parsed.effort ?? parsed.message.effort);
    if (effort) acc.effort = effort;
    if (usage.context !== undefined) foldUsage(acc, usage, stamp);
    const ids: string[] = [];
    for (const block of parsed.message.content ?? []) {
        if (block.type !== 'tool_use') continue;
        foldToolUse(acc, block, stamp);
        if (block.id) {
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

function foldToolUse(acc: Acc, block: ToolUse, stamp: string | null): void {
    const name = block.name;
    if (!name) return;
    countTool(acc, name);
    const args = block.input;
    if (name === 'Agent' && block.id) {
        const agent = agentEntry(acc, block.id, stamp);
        agent.description = args?.description ?? '';
        agent.subagentType = args?.subagent_type ?? '';
        agent.model = args?.model ?? null;
        if (args?.run_in_background === true) acc.background[block.id] = '';
    }
    const kind = EDIT_TOOLS.includes(name) ? 'edit' : 'tool';
    const path = filledTextShape.parse(args?.file_path ?? args?.notebook_path);
    if (FILE_TOOLS.includes(name) && path) {
        countFile(acc, path, name, stamp);
        addEvent(acc, stamp, kind, path);
    } else {
        addEvent(acc, stamp, kind, name);
    }
}

/** The length of a tool result, whether it came back as text or as a list of blocks. */
const resultLengthShape = z
    .union([
        z
            .array(z.object({ text: textShape }).catch(() => ({ text: undefined })))
            .transform((blocks) =>
                blocks.reduce((total, block) => total + (block.text ?? '').length, 0)
            ),
        z.string().transform((text) => text.length)
    ])
    .catch(0);

function resultLength(content: unknown): number {
    return resultLengthShape.parse(content);
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
