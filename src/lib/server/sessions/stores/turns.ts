// Layer 2, server. The turns of one session: the conversation itself, read from the transcript on
// demand rather than folded into the snapshot.
//
// The sessions channel folds a transcript into counts, a timeline, the agents and the touched
// files, and the turn text never reaches the page through that path. It is read here instead, by
// the line reading the incremental cache uses, in foldYielding() so a read gives the server's
// thread back between pieces, and a session already read is followed by asking for the bytes
// appended since the last read rather than parsing the file again.
//
// A record becomes at most one said turn plus one turn per tool call. A thinking block is dropped:
// it is the model talking to itself and is not part of the conversation. A tool call and its result
// are one turn, paired by `tool_use_id`; a result whose call was read in an earlier batch cannot
// reach that turn from here, so it travels in `results` and the client patches the turn it holds.
//
// The Markdown of an assistant turn is rendered here, by renderTurns() once a read has settled
// which turns it answers, and filtered on the page, the way server/content/docs.ts renders a
// README: views/shared/prose/Markdown.svelte runs ui/html.ts's sanitise over the HTML as it draws
// an answer of the Terminal view's transcript, so the rendering and the filtering stay one each and
// in one place. Its fenced code is painted by the highlighter's extension (data/prose/languages.ts,
// `codeColour`), as a document's is.

import { setImmediate as nextMacrotask } from 'node:timers/promises';
import { Marked } from 'marked';
import { z } from 'zod';
import { codeColour } from '../../../data/prose/languages.ts';
import { escapeAttribute } from '../../../data/prose/markdown/markdown.ts';
import { mapShape, quickly } from '../../../data/shapes/shapes.ts';
import { stampShape, textShape } from '../record.ts';
import { foldYielding, type YieldingRead } from './transcripts.ts';
import { promptFields, saidByHuman } from '../fold.ts';
import type { SessionTool, Turn, TurnTool } from '../../../data/model/index.ts';

/** The longest text one turn carries. A longer one is cut and says so. */
export const TURN_CHARS = 20000;

/** The longest one-line summary of a tool call. */
const SUMMARY_CHARS = 120;

/** Codex items that are the model thinking, which is dropped as a Claude thinking block is. */
const CODEX_SILENT = ['Reasoning'];

/**
 * What one read answers with: the turns of the bytes read, the byte offset to ask from next, and
 * the outcomes of calls whose turn was read earlier.
 */
export type TurnsAnswer = {
    turns: Turn[];
    offset: number;
    /** `tool_use_id` to whether the call ended well, for a call not in `turns`. */
    results: Record<string, boolean>;
};

/** The text of a block list, the calls it makes and the results it brings, in the order read. */
type Content = {
    said: string;
    calls: { id: string; name: string; summary: string }[];
    results: { id: string; ok: boolean }[];
};

const noContent = (): Content => ({ said: '', calls: [], results: [] });

/**
 * One line of a tool call's input: the first of the fields it carries that holds a text, the ones
 * nearest what a call acts on before the ones that only describe it.
 */
const summaryShape = z
    .object({
        file_path: textShape,
        command: textShape,
        pattern: textShape,
        description: textShape,
        query: textShape,
        url: textShape,
        skill: textShape,
        summary: textShape,
        reason: textShape,
        task_id: textShape,
        action: textShape
    })
    .transform((input) => {
        const fields = [
            input.file_path,
            input.command,
            input.pattern,
            input.description,
            input.query,
            input.url,
            input.skill,
            input.summary,
            input.reason,
            input.task_id,
            input.action
        ];
        for (const value of fields) {
            if (value) return oneLine(value);
        }
        return '';
    })
    .catch('');

/** A content block, by its type: the words of a text block, a call, or the result of a call. */
const blockShape = z.discriminatedUnion('type', [
    z.object({ type: z.enum(['text', 'Text']), text: z.string().catch('') }),
    z.object({
        type: z.literal('tool_result'),
        tool_use_id: z.string().catch(''),
        is_error: z.boolean().optional().catch(undefined)
    }),
    z.object({
        type: z.literal('tool_use'),
        id: z.string().catch(''),
        name: z.string().catch(''),
        input: summaryShape
    })
]);

/** A message's content: a string whole, and a block list as its text blocks joined. */
const contentShape = z
    .union([
        z.string().transform((said): Content => ({ said, calls: [], results: [] })),
        z.array(blockShape.optional().catch(undefined)).transform((blocks): Content => {
            const content = noContent();
            for (const block of blocks) {
                if (block === undefined) continue;
                if (block.type === 'tool_result') {
                    if (block.tool_use_id !== '') {
                        content.results.push({ id: block.tool_use_id, ok: !block.is_error });
                    }
                } else if (block.type === 'tool_use') {
                    content.calls.push({ id: block.id, name: block.name, summary: block.input });
                } else content.said += block.text;
            }
            return content;
        })
    ])
    .optional()
    .catch(noContent);

/**
 * What a Claude record that is a turn is read for: its stamp, the message, and whether a person
 * wrote it.
 */
const claudeHeadShape = z.object({
    timestamp: stampShape,
    message: z.unknown().optional(),
    ...promptFields
});

/** The `message` of a Claude turn record, read for its content; usage.ts reads its usage. */
const claudeTurnMessageShape = quickly(
    z.object({ content: contentShape }).catch(() => ({
        content: noContent()
    }))
);

/**
 * The turns of one transcript from byte `from`, each said turn cut at `cap` characters and none
 * rendered yet (`renderTurns`), read by foldYielding, so `insideLine` and `signal` mean what they
 * mean there. An unreadable file, or one with nothing appended, answers with no turns and the
 * offset it was asked from. The export asks with no cap, since a file handed to the reader is the
 * whole conversation. A read holds every turn of the bytes it reads while it reads, which cost
 * about 460 MiB more for a 629 MB transcript when measured, so the Markdown export is streamed a
 * turn at a time (`markdownStream` of server/sessions/transcript-routes.ts) and a transcript whose
 * text passes the longest string is one download as well.
 */
export async function readTurns(
    path: string,
    tool: SessionTool,
    from = 0,
    { cap = TURN_CHARS, ...how }: YieldingRead & { cap?: number } = {}
): Promise<TurnsAnswer> {
    const answer: TurnsAnswer = { turns: [], offset: from, results: {} };
    /** The tool turns of this read, by call id, so a result in the same read fills its own turn. */
    const calls = new Map<string, Turn>();
    const apply = (record: Record<string, unknown>): void => {
        if (tool === 'codex') codexRecord(answer, record, cap);
        else claudeRecord(answer, calls, record, cap);
    };
    answer.offset = from + (await foldYielding(path, from, apply, how));
    return answer;
}

/**
 * One line of a Claude transcript: a said turn, its tool calls, or the results of earlier calls.
 */
function claudeRecord(
    answer: TurnsAnswer,
    calls: Map<string, Turn>,
    record: Record<string, unknown>,
    cap: number
): void {
    const type = record.type;
    if (type !== 'user' && type !== 'assistant') return;
    const head = claudeHeadShape.parse(record);
    const at = head.timestamp;
    const content = claudeTurnMessageShape.parse(head.message).content ?? noContent();
    if (type === 'user') {
        if (content.said !== '' && saidByHuman(head, content.said)) {
            answer.turns.push(saidTurn(at, 'user', content.said, cap));
        }
        for (const { id, ok } of content.results) {
            const held = calls.get(id);
            if (held?.tool === null || held?.tool === undefined) answer.results[id] = ok;
            else held.tool.ok = ok;
        }
        return;
    }
    if (content.said !== '') answer.turns.push(saidTurn(at, 'assistant', content.said, cap));
    for (const call of content.calls) {
        const turn = toolTurn(at, call.id, call.name, call.summary);
        answer.turns.push(turn);
        if (call.id !== '') calls.set(call.id, turn);
    }
}

/**
 * The one line a Codex item is about: the command it ran. A string is taken unless it is empty. A
 * list is taken whenever it holds a string, joined by spaces, even when that joins to nothing, and
 * a list with no string in it is no command.
 */
const commandShape = z
    .union([
        z.string().transform((command) => (command === '' ? undefined : command)),
        z.array(z.string().nullable().catch(null)).transform((parts) => {
            const named = parts.filter((part) => part !== null);
            return named.length > 0 ? named.join(' ') : undefined;
        })
    ])
    .optional()
    .catch(undefined);

/**
 * A completed Codex item: its type, the words of a message item, and what a tool item is about.
 */
const codexItemShape = quickly(
    z.object({
        type: z.string().catch(''),
        content: contentShape,
        text: textShape,
        command: commandShape,
        changes: mapShape.transform(Object.keys).optional().catch(undefined),
        path: textShape,
        name: textShape,
        description: textShape,
        query: textShape,
        server: textShape,
        tool: textShape,
        status: textShape,
        exit_code: z.number().nullish().catch(null)
    })
);

/** What a Codex event is read for: its stamp and its payload. */
const codexHeadShape = z.object({
    timestamp: stampShape,
    payload: z.unknown().optional()
});

/** The payload of a Codex event, read for its type and its item; usage.ts reads type and info. */
const codexItemPayloadShape = quickly(
    z
        .object({ type: z.string().catch(''), item: z.unknown().optional() })
        .catch(() => ({ type: '', item: undefined }))
);

/**
 * One line of a Codex rollout. Only a completed item says anything: the two message items are the
 * conversation, everything else the model did is a tool turn under its own type name.
 */
function codexRecord(answer: TurnsAnswer, record: Record<string, unknown>, cap: number): void {
    if (record.type !== 'event_msg') return;
    const head = codexHeadShape.parse(record);
    const payload = codexItemPayloadShape.parse(head.payload);
    if (payload.type !== 'item_completed') return;
    const parsed = codexItemShape.safeParse(payload.item);
    if (!parsed.success) return;
    const item = parsed.data;
    const at = head.timestamp;
    const type = item.type;
    if (type === 'UserMessage' || type === 'AgentMessage') {
        const said = [item.content?.said, item.text].find((one) => one) ?? '';
        if (said === '') return;
        answer.turns.push(saidTurn(at, type === 'UserMessage' ? 'user' : 'assistant', said, cap));
        return;
    }
    if (type === '' || CODEX_SILENT.includes(type)) return;
    answer.turns.push(toolTurn(at, '', type, codexSummary(item), codexOk(item)));
}

/** A said turn, cut at the cap, with no HTML until `renderTurns` gives it its own. */
function saidTurn(at: string | null, role: 'user' | 'assistant', said: string, cap: number): Turn {
    const cut = said.length > cap;
    return { at, role, text: cut ? said.slice(0, cap) : said, html: '', cut, tool: null };
}

/**
 * Fill in the HTML of each assistant turn of `turns`: its Markdown rendered, its code painted. A
 * read leaves this to the caller because a render costs far more than the fold of its record, so a
 * first read renders only the turns it keeps and an export, which writes the text, renders none.
 * The thread is given back after every turn, so a tail dense in answers does not hold it. Text the
 * renderer cannot take, nested past what its recursion survives, keeps its words as preformatted
 * text, so one turn never fails the read that holds it.
 */
export async function renderTurns(turns: Turn[]): Promise<Turn[]> {
    const marked = new Marked(codeColour);
    for (const turn of turns) {
        if (turn.role !== 'assistant') continue;
        try {
            turn.html = marked.parse(turn.text, { async: false });
        } catch {
            turn.html = `<pre>${escapeAttribute(turn.text)}</pre>`;
        }
        await nextMacrotask();
    }
    return turns;
}

function toolTurn(
    at: string | null,
    id: string,
    name: string,
    summary: string,
    ok: boolean | null = null
): Turn {
    const tool: TurnTool = { id, name, summary, ok };
    return { at, role: 'tool', text: '', html: '', cut: false, tool };
}

/**
 * What a Codex item is about: the command it ran, the paths it changed, its path, its query, the
 * tool of a server it called, or what it calls itself.
 */
function codexSummary(item: z.output<typeof codexItemShape>): string {
    if (item.command !== undefined) return oneLine(item.command);
    const paths = (item.changes ?? []).filter((path) => path !== '');
    if (paths.length > 0) return oneLine(paths.join(' '));
    const called = [item.server, item.tool].filter((part) => part).join('.');
    for (const value of [item.path, item.query, called, item.name, item.description]) {
        if (value) return oneLine(value);
    }
    return '';
}

/**
 * Whether a Codex item ended well. It is read from `item_completed`, so the item has ended, and
 * only a failed status or a non-zero exit code says it went wrong.
 */
function codexOk(item: z.output<typeof codexItemShape>): boolean {
    return item.status !== 'failed' && (item.exit_code ?? 0) === 0;
}

function oneLine(value: string): string {
    const flat = value.replace(/\s+/g, ' ').trim();
    return flat.length > SUMMARY_CHARS ? flat.slice(0, SUMMARY_CHARS) : flat;
}
