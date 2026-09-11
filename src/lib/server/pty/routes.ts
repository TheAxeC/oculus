// Layer 2, server. The /api/terminal endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/terminal/+server.ts is the two lines that
// join them, the pattern lib/server/docs.ts and lib/server/writes.ts already hold.
//
// A GET lists the terminals and is same-origin only, like every read. A POST starts, stops, resizes
// or resumes one and additionally carries the write token, since it is a write in DESIGN.md's "Auth"
// sense: it runs a process on the machine.
//
// The resume action is DESIGN.md's one explicit migration: an observed session becomes a terminal
// oculus holds by running `claude --resume <id>` or `codex resume <id>` in its own cwd. Nothing is
// signalled: a session whose process is still running is refused until it has ended, since two
// processes writing one transcript is what the rule against signalling exists to prevent.
//
// A refusal the page has words for travels as the catalog key of those words, so the endpoint holds
// no English the page would have to show raw. The page maps the two keys back through t().

import { hasToken, sameOrigin } from '../auth.ts';
import { bridgedRecord } from '../sessions/hooks.ts';
import { refreshTerminals } from './channel.ts';
import {
    KINDS,
    RESUME_TOOLS,
    isSessionId,
    isTerminalId,
    listTerminals,
    resizeTerminal,
    startTerminal,
    stopTerminal,
    type StartOptions
} from './sessions.ts';
import type { SessionRecord, TerminalKind, TerminalResume } from '../../data/model.ts';

/** The catalog keys the page has words for; every other refusal is the server's own sentence. */
const UNKNOWN = 'sessions.resume_unknown';
const LIVE = 'sessions.resume_live';

/** The longest name a terminal may carry, which is what sessions.ts `label` accepts. */
const NAME_MAX = 80;

export type TerminalOptions = StartOptions & {
    /**
     * The session record a resume is about, from the last published `sessions` payload. Defaulted
     * to bridgedRecord; tests/routes/terminal.test.ts passes a source the test owns.
     */
    recordFor?: (id: string) => SessionRecord | null;
};

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
    options: TerminalOptions = {}
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    return json(200, { terminals: await listTerminals(options) });
}

/**
 * The terminal that continues one session, or the refusal. The record is read rather than trusted
 * from the page: the cwd the tmux session starts in is the record's own, and a live record is
 * refused here even though the page does not offer the control for one, since the page's payload
 * can be one rescan out of date.
 */
async function resumeSession(
    resume: TerminalResume,
    cols: unknown,
    rows: unknown,
    options: TerminalOptions
): Promise<Response> {
    const record = (options.recordFor ?? bridgedRecord)(resume.id);
    if (record === null) return json(400, { error: UNKNOWN });
    if (record.live) return json(400, { error: LIVE });
    const title = record.title === '' ? record.id : record.title;
    const terminal = await startTerminal(
        {
            kind: resume.tool,
            cwd: record.cwd ?? '',
            cols: cols as number,
            rows: rows as number,
            name: title.slice(0, NAME_MAX),
            resume
        },
        options
    );
    refreshTerminals();
    return json(200, { ok: true, terminal });
}

/** POST /api/terminal: start, stop, resize or resume one terminal. */
export async function handleTerminal(
    request: Request,
    token: string,
    options: TerminalOptions = {}
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
        if (message.action === 'resume') {
            const tool = message.tool as TerminalResume['tool'];
            if (!RESUME_TOOLS.includes(tool)) {
                return json(400, { error: `tool must be one of ${RESUME_TOOLS.join(', ')}` });
            }
            if (!isSessionId(message.id)) return json(400, { error: 'id is not a session id' });
            return await resumeSession(
                { tool, id: message.id },
                message.cols,
                message.rows,
                options
            );
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
    return json(400, { error: 'action must be start, stop, resize or resume' });
}
