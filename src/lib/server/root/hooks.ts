// Layer 2, server. The Notification and Stop hooks of Claude Code, posting to the server
// (the hook is the one request that carries neither header). An event updates
// the state of its session in the sessions payload at once, which the Sessions view draws as a
// chip; the server shows no notification of its own.
//
// routes/api/(sessions)/hook/+server.ts holds nothing but its POST, since a route module may export
// only its verbs (docs.ts's own comment names the pattern); everything the request does is here.
//
// A hook is `curl`, not a page: it carries no write token (nothing minted one for a process that
// starts before any page has loaded) and no Origin (curl never sends one), so its rules are not
// api/write's. A foreign Origin is refused before this route, by the origin guard in
// src/hooks.server.ts, whose HEADERLESS list lets this path's request naming neither header
// through. The two refusals here are the rate limit and the size; everything else, including a body
// this route cannot make sense of, is answered 200 so the hook's own `|| true` never has a real
// failure to hide. The first payload of each hook_event_name is written to stderr once per
// process, which is how the real shape gets recorded once a hook has actually fired. The body is
// read through a zod schema, so a field of the wrong type is read as absent.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { HookEvent, SessionsPayload } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { filledTextShape } from '../../data/shapes/shapes.ts';
import { HookStore, patchPayload, type HubLike } from '../sessions/stores/hooks.ts';

export const MAX_BODY_BYTES = 64 * 1024;
export const RATE_LIMIT_PER_SEC = 20;

/**
 * The two hook_event_name values this route understands; anything else answers 200 and records
 * nothing.
 */
const EVENT_NAMES: Record<string, HookEvent['event']> = {
    Notification: 'notification',
    Stop: 'stop'
};

/**
 * The fields of a hook body this route reads. A field of the wrong type is read as absent, and a
 * value that is no object at all is refused; the keys the schema does not name are not read.
 */
const hookBodyShape = z.object({
    hook_event_name: z.string().catch(''),
    session_id: filledTextShape,
    notification_type: filledTextShape,
    message: filledTextShape,
    title: filledTextShape,
    cwd: filledTextShape
});

/**
 * One hook body turned into the event the store keeps, or null when it does not carry a
 * hook_event_name this route knows or a session_id to key the store on. Pure over its two
 * arguments.
 */
export function handleHook(body: unknown, now: number): HookEvent | null {
    const parsed = hookBodyShape.safeParse(body);
    if (!parsed.success) return null;
    const fields = parsed.data;
    const kind = byKey(EVENT_NAMES, fields.hook_event_name);
    if (kind === undefined) return null;
    if (fields.session_id === undefined) return null;
    const event: HookEvent = {
        session: fields.session_id,
        event: kind,
        at: new Date(now).toISOString()
    };
    if (fields.notification_type !== undefined) event.kind = fields.notification_type;
    if (fields.message !== undefined) event.message = fields.message;
    if (fields.title !== undefined) event.title = fields.title;
    if (fields.cwd !== undefined) event.cwd = fields.cwd;
    return event;
}

/**
 * A fixed one-second window: at most `limit` calls to allow() in any rolling second answer true.
 * Good enough for a per-process guard against a runaway or hostile poster; it is not meant to be
 * fair across sessions, only to cap the total rate this one route accepts.
 */
export class RateLimiter {
    #stamps: number[] = [];
    readonly #limit: number;
    constructor(limit: number = RATE_LIMIT_PER_SEC) {
        this.#limit = limit;
    }

    allow(now: number): boolean {
        const floor = now - 1000;
        this.#stamps = this.#stamps.filter((stamp) => stamp > floor);
        if (this.#stamps.length >= this.#limit) return false;
        this.#stamps.push(now);
        return true;
    }
}

/** The first body of each hook_event_name, once, so the real shape is on record after it fires. */
function logFirstPayload(logged: Set<string>, name: string, body: unknown): void {
    if (logged.has(name)) return;
    logged.add(name);
    console.error(`hooks: first ${name} payload: ${JSON.stringify(body)}`);
}

/** What the server context holds for the hook endpoint: where events are kept and the real Hub. */
export type HookTarget = {
    store: HookStore;
    hub: HubLike | null;
    limiter: RateLimiter;
    /** Hook names already logged by this server context. */
    logged: Set<string>;
    now?: () => number;
};

/**
 * The whole endpoint. Order: the rate limit first, so an attacker cannot spend the size check's
 * parsing on every request; then the size; then the body is read and parsed, and from there almost
 * everything answers 200, per the module comment.
 */
export async function handleHookRequest(request: Request, into: HookTarget): Promise<Response> {
    const now = (into.now ?? Date.now)();
    if (!into.limiter.allow(now)) {
        return json({ error: 'too many hook requests' }, { status: 429 });
    }
    const contentLength = request.headers.get('content-length');
    if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
        return json({ error: 'the hook body is too large' }, { status: 413 });
    }
    let text: string;
    try {
        text = await request.text();
    } catch {
        return json({ ok: true });
    }
    if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
        return json({ error: 'the hook body is too large' }, { status: 413 });
    }
    let body: unknown;
    try {
        body = text === '' ? {} : JSON.parse(text);
    } catch {
        return json({ ok: true });
    }
    const named = hookBodyShape.safeParse(body);
    if (named.success && named.data.hook_event_name !== '') {
        logFirstPayload(into.logged, named.data.hook_event_name, body);
    }
    const event = handleHook(body, now);
    if (event === null) return json({ ok: true });

    into.store.record(event);
    republishHookOn(into, event);
    return json({ ok: true });
}

/**
 * Republish through the Hub carried by the request's ServerContext. A context fixture may use null
 * when a test only needs to inspect the store.
 */
function republishHookOn(into: HookTarget, event: HookEvent): void {
    if (into.hub !== null) {
        const message = into.hub.latest('sessions');
        if (message !== undefined) {
            into.hub.publish('sessions', patchPayload(message.payload as SessionsPayload, event));
        }
    }
}
