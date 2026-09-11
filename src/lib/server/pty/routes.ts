// Layer 2, server. The /api/terminal endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/terminal/+server.ts is the two lines that
// join them, the pattern lib/server/docs.ts and lib/server/writes.ts already hold.
//
// A GET lists the terminals and is same-origin only, like every read. A POST starts, stops or
// resizes one and additionally carries the write token, since it is a write in DESIGN.md's "Auth"
// sense: it runs a process on the machine.

import { hasToken, sameOrigin } from '../auth.ts';
import { refreshTerminals } from './channel.ts';
import {
    KINDS,
    isTerminalId,
    listTerminals,
    resizeTerminal,
    startTerminal,
    stopTerminal,
    type StartOptions
} from './sessions.ts';
import type { TerminalKind } from '../../data/model.ts';

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** GET /api/terminal: every terminal oculus owns. */
export async function handleTerminalList(
    request: Request,
    options: StartOptions = {}
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    return json(200, { terminals: await listTerminals(options) });
}

/** POST /api/terminal: start, stop or resize one terminal. */
export async function handleTerminal(
    request: Request,
    token: string,
    options: StartOptions = {}
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return json(403, { error: 'the write token is missing or stale' });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json(400, { error: 'the body is not an action' });
    }
    const message = body as Record<string, unknown>;

    try {
        if (message.action === 'start') {
            const kind = message.kind as TerminalKind;
            if (!KINDS.includes(kind)) {
                return json(400, { error: `kind must be one of ${KINDS.join(', ')}` });
            }
            const terminal = await startTerminal(
                {
                    kind,
                    cwd: String(message.cwd ?? ''),
                    cols: message.cols as number,
                    rows: message.rows as number,
                    name: typeof message.name === 'string' ? message.name : undefined
                },
                options
            );
            refreshTerminals();
            return json(200, { ok: true, terminal });
        }
        if (message.action === 'stop') {
            if (!isTerminalId(message.id)) return json(400, { error: 'id is not a terminal id' });
            await stopTerminal(message.id, options);
            refreshTerminals();
            return json(200, { ok: true, id: message.id });
        }
        if (message.action === 'resize') {
            if (!isTerminalId(message.id)) return json(400, { error: 'id is not a terminal id' });
            await resizeTerminal(
                message.id,
                message.cols as number,
                message.rows as number,
                options
            );
            return json(200, { ok: true, id: message.id });
        }
    } catch (error) {
        return json(400, { error: reason(error) });
    }
    return json(400, { error: 'action must be start, stop or resize' });
}
