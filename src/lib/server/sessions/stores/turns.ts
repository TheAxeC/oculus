// Layer 2, server. The turns of one session: the conversation itself, read from the transcript on
// demand rather than folded into the snapshot.
//
// DESIGN.md's "Sessions" folds a transcript into counts, a timeline, the agents and the touched
// files, and the turn text never reaches the page through that path. It is read here instead, with
// the same foldFrom() the incremental cache uses, so a session already read is followed by asking
// for the bytes appended since the last read rather than parsing the file again.
//
// A record becomes at most one said turn plus one turn per tool call. A thinking block is dropped:
// it is the model talking to itself and is not part of the conversation. A tool call and its result
// are one turn, paired by `tool_use_id`; a result whose call was read in an earlier batch cannot
// reach that turn from here, so it travels in `results` and the client patches the turn it holds.
//
// The Markdown of an assistant turn is rendered here and filtered on the page, the way
// server/content/docs.ts renders a README: ui/html.ts's sanitise runs over the HTML before
// views/sessions/transcript/Transcript.svelte draws it, so the rendering and the filtering stay one
// each and in one place.

import { marked } from 'marked';
import { isMap, list, text } from '../../core/json.ts';
import { stampOf } from '../record.ts';
import { foldFrom } from './transcripts.ts';
import type { SessionTool, Turn, TurnTool } from '../../../data/model/index.ts';

/** The longest text one turn carries. A longer one is cut and says so. */
export const TURN_CHARS = 20000;

/** The longest one-line summary of a tool call. */
const SUMMARY_CHARS = 120;

/** The input fields a Claude tool call is summarised by, in the order they are looked for. */
const SUMMARY_FIELDS = ['file_path', 'command', 'pattern', 'description'];

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

/**
 * The turns of one transcript from byte `from`, each said turn cut at `cap` characters. An
 * unreadable file, or one with nothing appended, answers with no turns and the offset it was asked
 * from. The export asks with no cap, since a file handed to the reader is the whole conversation.
 */
export function readTurns(
    path: string,
    tool: SessionTool,
    from = 0,
    cap: number = TURN_CHARS
): TurnsAnswer {
    const answer: TurnsAnswer = { turns: [], offset: from, results: {} };
    /** The tool turns of this read, by call id, so a result in the same read fills its own turn. */
    const calls = new Map<string, Turn>();
    const read = foldFrom(path, from, (record) => {
        if (tool === 'codex') codexRecord(answer, record, cap);
        else claudeRecord(answer, calls, record, cap);
    });
    answer.offset = from + read;
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
    const kind = record.type;
    if (kind !== 'user' && kind !== 'assistant') return;
    const at = stampOf(record.timestamp);
    const message = isMap(record.message) ? record.message : {};
    const content = message.content;
    if (kind === 'user') {
        const origin = record.origin;
        if (isMap(origin) && origin.kind === 'human') {
            const said = blockText(content);
            if (said !== '') answer.turns.push(saidTurn(at, 'user', said, cap));
        }
        for (const block of list(content)) {
            if (!isMap(block) || block.type !== 'tool_result') continue;
            const id = text(block.tool_use_id);
            if (id === '') continue;
            const ok = block.is_error !== true;
            const held = calls.get(id);
            if (held?.tool === null || held?.tool === undefined) answer.results[id] = ok;
            else held.tool.ok = ok;
        }
        return;
    }
    const said = blockText(content);
    if (said !== '') answer.turns.push(saidTurn(at, 'assistant', said, cap));
    for (const block of list(content)) {
        if (!isMap(block) || block.type !== 'tool_use') continue;
        const id = text(block.id);
        const turn = toolTurn(at, id, text(block.name), summaryOf(block.input));
        answer.turns.push(turn);
        if (id !== '') calls.set(id, turn);
    }
}

/**
 * One line of a Codex rollout. Only a completed item says anything: the two message items are the
 * conversation, everything else the model did is a tool turn under its own type name.
 */
function codexRecord(answer: TurnsAnswer, record: Record<string, unknown>, cap: number): void {
    if (record.type !== 'event_msg') return;
    const payload = isMap(record.payload) ? record.payload : {};
    if (payload.type !== 'item_completed') return;
    const item = payload.item;
    if (!isMap(item)) return;
    const at = stampOf(record.timestamp);
    const type = text(item.type);
    if (type === 'UserMessage' || type === 'AgentMessage') {
        const said = blockText(item.content) || text(item.text);
        if (said === '') return;
        answer.turns.push(saidTurn(at, type === 'UserMessage' ? 'user' : 'assistant', said, cap));
        return;
    }
    if (type === '' || CODEX_SILENT.includes(type)) return;
    answer.turns.push(toolTurn(at, '', type, codexSummary(item), codexOk(item)));
}

/** The words of a message: a string content whole, and a block list as its `text` blocks joined. */
function blockText(content: unknown): string {
    if (typeof content === 'string') return content;
    const pieces: string[] = [];
    for (const block of list(content)) {
        if (!isMap(block)) continue;
        const kind = block.type;
        if (kind !== 'text' && kind !== 'Text') continue;
        if (typeof block.text === 'string') pieces.push(block.text);
    }
    return pieces.join('');
}

/** A said turn, cut at the cap. The assistant's Markdown is rendered; nothing else is. */
function saidTurn(at: string | null, role: 'user' | 'assistant', said: string, cap: number): Turn {
    const cut = said.length > cap;
    const body = cut ? said.slice(0, cap) : said;
    return {
        at,
        role,
        text: body,
        html: role === 'assistant' ? marked.parse(body, { async: false }) : '',
        cut,
        tool: null
    };
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

/** What a Claude call is about, in one line: the first of the four fields its input carries. */
function summaryOf(input: unknown): string {
    if (!isMap(input)) return '';
    for (const field of SUMMARY_FIELDS) {
        const value = text(input[field]);
        if (value !== '') return oneLine(value);
    }
    return '';
}

/**
 * What a Codex item is about: the command it ran, the paths it changed, or what it calls itself.
 */
function codexSummary(item: Record<string, unknown>): string {
    const command = text(item.command);
    if (command !== '') return oneLine(command);
    const parts = list(item.command).filter((one) => typeof one === 'string');
    if (parts.length > 0) return oneLine(parts.join(' '));
    const changes = item.changes;
    if (isMap(changes)) {
        const paths = Object.keys(changes).filter((path) => path !== '');
        if (paths.length > 0) return oneLine(paths.join(' '));
    }
    for (const field of ['path', 'name', 'description']) {
        const value = text(item[field]);
        if (value !== '') return oneLine(value);
    }
    return '';
}

/** Whether a Codex item ended well. Only an exit code says so; anything else stays unknown. */
function codexOk(item: Record<string, unknown>): boolean | null {
    const code = item.exit_code;
    return typeof code === 'number' && Number.isFinite(code) ? code === 0 : null;
}

function oneLine(value: string): string {
    const flat = value.replace(/\s+/g, ' ').trim();
    return flat.length > SUMMARY_CHARS ? flat.slice(0, SUMMARY_CHARS) : flat;
}
