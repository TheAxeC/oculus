// Layer 2, server. DESIGN.md's "Auth", in one module: which requests the server answers at all, and
// the token a write additionally carries.
//
// The server binds 127.0.0.1, but any page open in the browser can address 127.0.0.1, so a request
// is judged by where it came from, by one rule, `sameOrigin`. `Sec-Fetch-Site: same-origin` or
// `none` admits; an `Origin` header admits when it names this machine or the request's own host and
// refuses otherwise; a request naming no `Origin` whose `Sec-Fetch-Site` says another site sent it
// is refused; a request with neither header is refused too, since a browser without Fetch Metadata,
// or one addressing a host that is not potentially trustworthy, sends neither on a cross-site
// request. `handle` in src/hooks.server.ts applies the rule to every request under /api/ before a
// route sees it, except the two OAuth callbacks (`/api/calendar/callback`, `/api/mail/callback`),
// which a provider's redirect reaches cross-site and which the `state` this process minted guards.
// Its HEADERLESS list names the five paths that admit a request with neither header: the hook,
// which Claude Code's `curl` posts, the three picture routes the command line fetches, and the
// health route the desktop host asks. The socket checks `allowedOrigin` on its upgrade, which does
// not pass through `handle`.
//
// The token is minted once per process and delivered to the page as its data. It is not a secret
// against the machine's owner; it is what stops another page in the same browser from posting a
// write, which the origin rule alone cannot do.

import { randomBytes } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { isMap } from '../../data/helpers/guards.ts';
import { words } from './words.ts';

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
 * Whether a request came from this application's own page, by DESIGN.md's one "Auth" rule.
 *
 * `Sec-Fetch-Site: same-origin` is the browser saying so, and `none` is a request the user made
 * themselves (a typed address, a bookmark). An Origin must name this machine or the very host the
 * request was sent to. No Origin and any other `Sec-Fetch-Site` is a browser sending from another
 * page. Neither header is refused: a browser that sends no Fetch Metadata sends neither on a
 * cross-site request, so the two cannot be told apart.
 */
export function sameOrigin(headers: Headers, host: string): boolean {
    const site = headers.get('sec-fetch-site');
    if (site === 'same-origin' || site === 'none') return true;
    const origin = headers.get('origin');
    if (origin === null) return false;
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

/**
 * Whether a value is the process's token, the one comparison both the routes and the socket make.
 * An empty expected token never matches, whatever the value is.
 */
export function carriesToken(token: unknown, expected: string): boolean {
    return expected !== '' && token === expected;
}

/** Whether a request carries the process's token. An empty token is never accepted. */
export function hasToken(request: Request, token: string): boolean {
    return carriesToken(request.headers.get(TOKEN_HEADER), token);
}

/**
 * What a write route puts into each refusal of tokenedBody: its headers, fields of its body, and
 * its own `error` words for a missing token and for a body that is not JSON.
 */
export type RefusalShape = {
    headers?: Record<string, string>;
    fields?: Record<string, unknown>;
} & (
    | { words: { token: string; json: string }; text?: undefined }
    | { text: () => Record<string, string>; words?: undefined }
);

/**
 * The parsed body of a write request, or the answer that refuses it: 403 for a request without the
 * process token, 400 for a body that is not JSON, each in the route's words when the shape names
 * them and in the text catalog's (`server.auth`) when it names the catalog. What the body must hold
 * is the route's own check.
 */
export async function tokenedBody(
    request: Request,
    token: string,
    shape: RefusalShape
): Promise<{ body: unknown } | Response> {
    const refuse = (error: string, status: number): Response =>
        json({ ...shape.fields, error }, { status, headers: shape.headers });
    // A route that names its own words answers them; any other has the sentences worded from the
    // catalog its `text` reads, and only when a refusal is made.
    if (!hasToken(request, token)) {
        return refuse(
            shape.words === undefined
                ? words(shape.text(), 'server.auth.token_refused')
                : shape.words.token,
            403
        );
    }
    try {
        return { body: (await request.json()) as unknown };
    } catch {
        return refuse(
            shape.words === undefined
                ? words(shape.text(), 'server.auth.body_not_json')
                : shape.words.json,
            400
        );
    }
}

/**
 * The body of a write request as a JSON object, or the answer that refuses it: 403 for a request
 * without the process token, 400 for a body that is not a JSON object. Where the request came from
 * was answered before the route, by the origin guard in `handle`.
 */
export async function gatedBody(
    request: Request,
    token: string
): Promise<Record<string, unknown> | Response> {
    const read = await tokenedBody(request, token, {
        words: { token: 'forbidden', json: 'bad body' }
    });
    if (read instanceof Response) return read;
    return isMap(read.body) ? read.body : json({ error: 'bad body' }, { status: 400 });
}
