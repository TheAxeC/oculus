// Layer 2, server. The /api/transcript endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(sessions)/transcript/+server.ts is the
// one line that joins them, the pattern lib/server/content/docs.ts already holds.
//
// The path read is never the request's. The id names a session the last published `sessions`
// payload holds, and the path and the tool come off that record, so the page can ask for a session
// it can already see and for nothing else. A read, so it is same-origin and carries no write token.

import { sameOrigin } from '../core/auth.ts';
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

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

/**
 * GET /api/transcript: the turns of one session from a byte offset, and the offset to ask next;
 * with `format=markdown`, the whole conversation as a Markdown file to save.
 */
export function handleTranscript(request: Request, options: TranscriptOptions = {}): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const url = new URL(request.url);
    const asked = url.searchParams.get('from') ?? '';
    const from = asked === '' ? 0 : Number(asked);
    if (!Number.isInteger(from) || from < 0) {
        return json(400, { error: `not a byte offset: ${asked}` });
    }
    const id = url.searchParams.get('id') ?? '';
    const record = (options.recordFor ?? (() => null))(id);
    if (record === null) return json(404, { error: `no session with the id ${id}` });
    if (url.searchParams.get('format') === 'markdown') {
        if (options.catalogFor === undefined) throw new Error('an export needs the text catalog');
        return exported(record, options.catalogFor());
    }
    const read = readTurns(record.path, record.tool, from);
    if (from > 0 || read.turns.length <= FIRST_READ_TURNS) return json(200, read);
    // The offset is the file's end either way, so the client's append path continues from the same
    // place; what is dropped is the oldest turns, which is the end of the conversation nobody is
    // looking at.
    return json(200, { ...read, turns: read.turns.slice(-FIRST_READ_TURNS) });
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
 * One session's whole conversation as Markdown: a heading with the session's facts, then each turn
 * under who said it and when, an assistant turn as the Markdown it was written in, a user turn as
 * a quoted block so its own line breaks stand, and a tool call as one line naming the tool. Every
 * heading is worded by the server's one `words` of server/core/words.ts, which throws on a key the
 * catalog lacks.
 */
export function transcriptMarkdown(
    record: SessionRecord,
    turns: Turn[],
    catalog: Record<string, string>
): string {
    const lines: string[] = [
        `# ${record.title === '' ? record.id : record.title}`,
        '',
        `- ${words(catalog, 'server.export.session', record.id)}`,
        `- ${words(catalog, 'server.export.agent', record.tool)}`,
        `- ${words(catalog, 'server.export.folder', record.cwd ?? '')}`,
        `- ${words(catalog, 'server.export.started', record.started ?? '')}`,
        ''
    ];
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
            lines.push(`- ${line}`);
            continue;
        }
        const who =
            turn.role === 'user'
                ? words(catalog, 'server.export.user')
                : words(catalog, 'server.export.assistant');
        lines.push('', `## ${who} ${turn.at ?? ''}`.trimEnd(), '');
        if (turn.role === 'user') {
            lines.push(...turn.text.split('\n').map((line) => `> ${line}`.trimEnd()));
        } else lines.push(turn.text);
        lines.push('');
    }
    return `${lines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd()}\n`;
}

/** The export's answer: the Markdown as a file the browser saves. */
function exported(record: SessionRecord, catalog: Record<string, string>): Response {
    const read = readTurns(record.path, record.tool, 0, Number.POSITIVE_INFINITY);
    return new Response(transcriptMarkdown(record, read.turns, catalog), {
        status: 200,
        headers: {
            'content-type': 'text/markdown; charset=utf-8',
            'content-disposition': `attachment; filename="${exportName(record)}"`,
            'cache-control': 'no-store'
        }
    });
}
