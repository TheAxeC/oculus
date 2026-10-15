// Layer 2, server. The /api/transcript endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(sessions)/transcript/+server.ts is the
// one line that joins them, the pattern lib/server/content/docs.ts already holds.
//
// The path read is never the request's. The id names a session the last published `sessions`
// payload holds, and the path and the tool come off that record, so the page can ask for a session
// it can already see and for nothing else. An `agent` beside the id names one subagent that record
// lists, by the agent's id there: a Claude agent's own transcript is the file its agent id names
// beside the session's (stores/background.ts `agentFile`), and a Codex agent's is the rollout of
// the Codex session record whose id is the agent's thread id. An agent the record does not list,
// one whose agent id is empty and one whose transcript is not there are refused as an unknown
// session is. A read, so it is same-origin and carries no write token.

import { existsSync } from 'node:fs';
import { json } from '@sveltejs/kit';
import { agentFile } from './stores/background.ts';
import { readTurns } from './stores/turns.ts';
import { words } from '../core/words.ts';
import type { SessionAgent, SessionRecord, SessionTool, Turn } from '../../data/model/index.ts';

/**
 * How many turns a first read answers with. A session that has run all day holds thousands, and the
 * page draws the tail of the conversation; sending the whole file costs the wire and the client's
 * memory for turns nobody scrolls back to. A later read asks from a byte offset and is not capped,
 * since it carries only what was appended since.
 */
export const FIRST_READ_TURNS = 200;

export type TranscriptOptions = {
    /**
     * The session record a read is about, from the last published `sessions` payload. Defaulted to
     * Tests and the route pass the source they own.
     */
    recordFor?: (id: string) => SessionRecord | null;
    /** The text catalog the export's headings are worded from; an export without one is refused. */
    catalogFor?: () => Record<string, string>;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The characters of an agent id Claude Code names a subagent's transcript file with. */
const CLAUDE_AGENT_ID = /^[A-Za-z0-9_-]+$/;

/** The transcript one request reads: its file and the tool that wrote it. */
type Source = { path: string; tool: SessionTool };

/**
 * The transcript of the agent `agent` of `record`, or null when the record lists no such agent,
 * its agent id is empty, or its transcript is not there. The path comes off the record, or off the
 * record of the agent's own Codex rollout, never off the request.
 */
function agentSource(
    record: SessionRecord,
    agent: SessionAgent | undefined,
    recordFor: (id: string) => SessionRecord | null
): Source | null {
    if (agent === undefined || agent.agentId === '') return null;
    if (record.tool === 'codex') {
        const own = recordFor(agent.agentId);
        return own?.tool === 'codex' ? { path: own.path, tool: own.tool } : null;
    }
    if (!CLAUDE_AGENT_ID.test(agent.agentId)) return null;
    const path = agentFile(record.path, record.id, agent.agentId);
    return existsSync(path) ? { path, tool: record.tool } : null;
}

/**
 * GET /api/transcript: the turns of one session from a byte offset, and the offset to ask next;
 * with `format=markdown`, the whole conversation as a Markdown file to save.
 */
export function handleTranscript(request: Request, options: TranscriptOptions = {}): Response {
    const url = new URL(request.url);
    const asked = url.searchParams.get('from') ?? '';
    const from = asked === '' ? 0 : Number(asked);
    if (!Number.isInteger(from) || from < 0) {
        return json({ error: `not a byte offset: ${asked}` }, { status: 400, headers: NO_STORE });
    }
    const id = url.searchParams.get('id') ?? '';
    const recordFor = options.recordFor ?? (() => null);
    const record = recordFor(id);
    if (record === null)
        return json({ error: `no session with the id ${id}` }, { status: 404, headers: NO_STORE });
    const named = url.searchParams.get('agent');
    const agent = named === null ? undefined : record.agents.find((one) => one.id === named);
    const source =
        named === null
            ? { path: record.path, tool: record.tool }
            : agentSource(record, agent, recordFor);
    if (source === null) {
        return json(
            { error: `no agent transcript of the session ${id}` },
            { status: 404, headers: NO_STORE }
        );
    }
    if (url.searchParams.get('format') === 'markdown') {
        if (options.catalogFor === undefined) throw new Error('an export needs the text catalog');
        return exported(record, agent, source, options.catalogFor());
    }
    const read = readTurns(source.path, source.tool, from);
    if (from > 0 || read.turns.length <= FIRST_READ_TURNS) return json(read, { headers: NO_STORE });
    // The offset is the file's end either way, so the client's append path continues from the same
    // place; what is dropped is the oldest turns, which is the end of the conversation nobody is
    // looking at.
    return json({ ...read, turns: read.turns.slice(-FIRST_READ_TURNS) }, { headers: NO_STORE });
}

/**
 * The file name an export is offered under: the title's letters and digits, else the id; for an
 * agent's transcript, the agent's description joined after them.
 */
export function exportName(record: SessionRecord, agent?: SessionAgent): string {
    const words = agent === undefined ? record.title : `${record.title} ${agent.description}`;
    const stem = words
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    return `${stem === '' ? record.id : stem}.md`;
}

/**
 * One session's whole conversation as Markdown, in pieces: a heading with the session's facts, then
 * each turn under who said it and when, an assistant turn as the Markdown it was written in, a user
 * turn as a quoted block so its own line breaks stand, and a tool call as one line naming the tool.
 * Every heading is worded by the server's one `words` of server/core/words.ts, which throws on a
 * key the catalog lacks. The pieces joined are the text `lines.join('\n')` of the whole file, and
 * the file is those pieces with every run of three or more line feeds cut to two and the end
 * trimmed: `markdownStream` applies both one piece at a time, so no string holds the file.
 */
function* transcriptPieces(
    record: SessionRecord,
    turns: Iterable<Turn>,
    catalog: Record<string, string>
): Generator<string> {
    yield [
        `# ${record.title === '' ? record.id : record.title}`,
        '',
        `- ${words(catalog, 'server.export.session', record.id)}`,
        `- ${words(catalog, 'server.export.agent', record.tool)}`,
        `- ${words(catalog, 'server.export.folder', record.cwd ?? '')}`,
        `- ${words(catalog, 'server.export.started', record.started ?? '')}`,
        ''
    ].join('\n');
    for (const turn of turns) {
        if (turn.role === 'tool' && turn.tool !== null) {
            const state =
                turn.tool.ok === null
                    ? words(catalog, 'server.export.running')
                    : turn.tool.ok
                      ? words(catalog, 'server.export.ok')
                      : words(catalog, 'server.export.error');
            const line = words(
                catalog,
                'server.export.tool',
                turn.tool.name,
                turn.tool.summary,
                state
            );
            yield `\n- ${line}`;
            continue;
        }
        const who =
            turn.role === 'user'
                ? words(catalog, 'server.export.user')
                : words(catalog, 'server.export.assistant');
        const body =
            turn.role === 'user'
                ? turn.text.split('\n').map((line) => `> ${line}`.trimEnd())
                : [turn.text];
        yield ['', '', `## ${who} ${turn.at ?? ''}`.trimEnd(), '', ...body, ''].join('\n');
    }
}

/**
 * The file's text from its pieces, a piece at a time. The whitespace at the end of each piece is
 * held back and joined to the next, because a run of line feeds that a piece ends with goes on into
 * the next piece, and the end of the file is trimmed.
 */
function* markdownStream(pieces: Iterable<string>): Generator<string> {
    let held = '';
    for (const piece of pieces) {
        const text = (held + piece).replace(/\n{3,}/g, '\n\n');
        const kept = text.trimEnd().length;
        held = text.slice(kept);
        if (kept > 0) yield text.slice(0, kept);
    }
    yield '\n';
}

/**
 * The export's answer: the Markdown of the transcript `source` as a file the browser saves,
 * streamed, headed with the session's facts.
 */
function exported(
    record: SessionRecord,
    agent: SessionAgent | undefined,
    source: Source,
    catalog: Record<string, string>
): Response {
    const read = readTurns(source.path, source.tool, 0, Number.POSITIVE_INFINITY);
    const pieces = markdownStream(transcriptPieces(record, read.turns, catalog));
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
        pull(controller) {
            const next = pieces.next();
            if (next.done === true) controller.close();
            else controller.enqueue(encoder.encode(next.value));
        }
    });
    return new Response(body, {
        status: 200,
        headers: {
            'content-type': 'text/markdown; charset=utf-8',
            'content-disposition': `attachment; filename="${exportName(record, agent)}"`,
            'cache-control': 'no-store'
        }
    });
}
