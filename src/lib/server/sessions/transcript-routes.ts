// Layer 2, server. The /api/transcript endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(sessions)/transcript/+server.ts is the
// one line that joins them, the pattern lib/server/content/docs.ts already holds.
//
// The path read is never the request's. The id names a session the last published `sessions` payload
// holds, and the path and the tool come off that record, so the page can ask for a session it can
// already see and for nothing else. A read, so it is same-origin and carries no write token.

import { sameOrigin } from '../core/auth.ts';
import { readTurns } from './stores/turns.ts';
import type { SessionRecord } from '../../data/model.ts';

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
};

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

/** GET /api/transcript: the turns of one session from a byte offset, and the offset to ask next. */
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
    const read = readTurns(record.path, record.tool, from);
    if (from > 0 || read.turns.length <= FIRST_READ_TURNS) return json(200, read);
    // The offset is the file's end either way, so the client's append path continues from the same
    // place; what is dropped is the oldest turns, which is the end of the conversation nobody is
    // looking at.
    return json(200, { ...read, turns: read.turns.slice(-FIRST_READ_TURNS) });
}
