// Layer 2, server. DESIGN.md's "Auth", in one module: which requests the server answers at all, and
// the token a write additionally carries.
//
// The server binds 127.0.0.1, but any page open in the browser can address 127.0.0.1, so a request
// is judged by where it came from: `Sec-Fetch-Site` when the browser sends one, and `Origin`
// otherwise. The rule is the socket's too: it lives here and server/root/socket.ts imports it.
//
// The token is minted once per process and delivered to the page as its data. It is not a secret
// against the machine's owner; it is what stops another page in the same browser from posting a
// write, which the origin check alone cannot do for a client that sends neither header.

import { randomBytes } from 'node:crypto';
import { isMap } from '../../data/helpers/guards.ts';

/** The header a write carries the token in. */
export const TOKEN_HEADER = 'x-oculus-token';

/** Whether an Origin header names this machine. Any port, since dev and the built server differ. */
export function allowedOrigin(origin: string | undefined): boolean {
    if (origin === undefined || origin === '') return false;
    let url: URL;
    try {
        url = new URL(origin);
    } catch {
        return false;
    }
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost';
}

/**
 * Whether a request came from this application's own page.
 *
 * `Sec-Fetch-Site: same-origin` is the browser saying so, and `none` is a request the user made
 * themselves (a typed address, a bookmark). Otherwise the Origin must name this machine, or the
 * very host the request was sent to. A request with neither header is refused: every browser sends
 * one, so their absence is a client this endpoint has no reason to answer.
 */
export function sameOrigin(request: Request, host: string): boolean {
    const site = request.headers.get('sec-fetch-site');
    if (site === 'same-origin' || site === 'none') return true;
    const origin = request.headers.get('origin') ?? undefined;
    if (origin === undefined) return false;
    if (allowedOrigin(origin)) return true;
    if (host === '') return false;
    try {
        return new URL(origin).host === host;
    } catch {
        return false;
    }
}

/** A fresh write token: 32 random bytes as hex. */
export function mintToken(): string {
    return randomBytes(32).toString('hex');
}

/** Whether a request carries the process's token. An empty token is never accepted. */
export function hasToken(request: Request, token: string): boolean {
    if (token === '') return false;
    return request.headers.get(TOKEN_HEADER) === token;
}

/** A JSON answer with its status. */
function answer(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/**
 * The body of a write request as a JSON object, or the answer that refuses it: 403 for a request
 * from another origin or without the process token, 400 for a body that is not a JSON object.
 */
export async function gatedBody(
    request: Request,
    token: string
): Promise<Record<string, unknown> | Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '') || !hasToken(request, token)) {
        return answer(403, { error: 'forbidden' });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return answer(400, { error: 'bad body' });
    }
    return isMap(body) ? body : answer(400, { error: 'bad body' });
}
