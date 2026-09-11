// Layer 2, server. The /api/transcript endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/transcript/+server.ts is the one line that
// joins them, the pattern lib/server/docs.ts already holds.
//
// The path read is never the request's. The id names a session the last published `sessions` payload
// holds, and the path and the tool come off that record, so the page can ask for a session it can
// already see and for nothing else. A read, so it is same-origin and carries no write token.

import { sameOrigin } from './auth.ts';
import { bridgedRecord } from './sessions/hooks.ts';
import { readTurns } from './sessions/turns.ts';
import type { SessionRecord } from '../data/model.ts';

export type TranscriptOptions = {
    /**
     * The session record a read is about, from the last published `sessions` payload. Defaulted to
     * bridgedRecord; tests/routes/transcript.test.ts passes a source the test owns.
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
    const record = (options.recordFor ?? bridgedRecord)(id);
    if (record === null) return json(404, { error: `no session with the id ${id}` });
    return json(200, readTurns(record.path, record.tool, from));
}
