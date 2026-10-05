// Layer 2, server. The /api/transcript endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(sessions)/transcript/+server.ts is the
// one line that joins them, the pattern lib/server/content/docs.ts already holds.
//
// The path read is never the request's. The id names a session the last published `sessions`
// payload holds, and the path and the tool come off that record, so the page can ask for a session
// it can already see and for nothing else. A read, so it is same-origin and carries no write token.

import { json } from '@sveltejs/kit';
import { readTurns } from './stores/turns.ts';
import { words } from '../core/words.ts';
import type { SessionRecord, Turn } from '../../data/model/index.ts';

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
    const record = (options.recordFor ?? (() => null))(id);
    if (record === null)
        return json({ error: `no session with the id ${id}` }, { status: 404, headers: NO_STORE });
    if (url.searchParams.get('format') === 'markdown') {
        if (options.catalogFor === undefined) throw new Error('an export needs the text catalog');
        return exported(record, options.catalogFor());
    }
    const read = readTurns(record.path, record.tool, from);
    if (from > 0 || read.turns.length <= FIRST_READ_TURNS) return json(read, { headers: NO_STORE });
    // The offset is the file's end either way, so the client's append path continues from the same
    // place; what is dropped is the oldest turns, which is the end of the conversation nobody is
    // looking at.
    return json({ ...read, turns: read.turns.slice(-FIRST_READ_TURNS) }, { headers: NO_STORE });
}

/** The file name an export is offered under: the title's letters and digits, else the id. */
export function exportName(record: SessionRecord): string {
    const stem = record.title
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

/** The export's answer: the Markdown as a file the browser saves, streamed. */
function exported(record: SessionRecord, catalog: Record<string, string>): Response {
    const read = readTurns(record.path, record.tool, 0, Number.POSITIVE_INFINITY);
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
            'content-disposition': `attachment; filename="${exportName(record)}"`,
            'cache-control': 'no-store'
        }
    });
}
