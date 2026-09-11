// Layer 2, server. DESIGN.md's "Auth", in one module: which requests the server answers at all, and
// the token a write additionally carries.
//
// The server binds 127.0.0.1, but any page open in the browser can address 127.0.0.1, so a request
// is judged by where it came from: `Sec-Fetch-Site` when the browser sends one, and `Origin`
// otherwise. The rule is the socket's of O6, which lives here now and is imported there.
//
// The token is minted once per process and delivered to the page as its data. It is not a secret
// against the machine's owner; it is what stops another page in the same browser from posting a
// write, which the origin check alone cannot do for a client that sends neither header.

import { randomBytes } from 'node:crypto';

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
 * themselves (a typed address, a bookmark). Otherwise the Origin must name this machine, or the very
 * host the request was sent to. A request with neither header is refused: every browser sends one,
 * so their absence is a client this endpoint has no reason to answer.
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

// ------------------------------------------------------------------ the process-wide token
// The socket cannot import the token. hooks.server.ts mints it inside Kit's own module graph (the
// built build/ bundle, or Vite's SSR graph in dev), and src/server.ts imports socket.ts as plain
// TypeScript, so the same `import ... from './auth.ts'` is two module instances in one process.
// sessions/hooks.ts met this wall for the Hub and crossed it on globalThis; the token crosses the
// same way. A process where nothing published a token accepts no terminal input, which is what an
// empty string here means.

type TokenBridge = { token: string };

declare global {
    // eslint-disable-next-line no-var
    var __oculusTokenBridge: TokenBridge | undefined;
}

function bridge(): TokenBridge {
    globalThis.__oculusTokenBridge ??= { token: '' };
    return globalThis.__oculusTokenBridge;
}

/** Called once by hooks.server.ts with the token it minted. */
export function publishToken(token: string): void {
    bridge().token = typeof token === 'string' ? token : '';
}

/** The token this process minted, or an empty string when nothing published one. */
export function processToken(): string {
    return bridge().token;
}

/** Whether a value is this process's token. An empty token is never accepted, as with hasToken. */
export function isProcessToken(token: unknown): boolean {
    const held = processToken();
    return held !== '' && typeof token === 'string' && token === held;
}
