// Layer 2, server. DESIGN.md's step 5: "the Notification and Stop hooks posting to the server and
// the server firing a macOS notification through osascript the moment a session wants you."
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
// failure to hide, and Axel loses no notification to a shape this route did not expect. The first
// payload of each hook_event_name is written to stderr once per process, which is how the real
// shape gets recorded once a hook has actually fired.

import { json } from '@sveltejs/kit';
import { execFile as execFileCb } from 'node:child_process';
import { basename } from 'node:path';
import type { HookEvent, SessionRecord, SessionsPayload } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { HookStore, patchPayload, type HubLike } from '../sessions/stores/hooks.ts';

export const MAX_BODY_BYTES = 64 * 1024;
export const RATE_LIMIT_PER_SEC = 20;
const OSASCRIPT = '/usr/bin/osascript';
const NOTIFY_TIMEOUT_MS = 2000;
const APP_TITLE = 'oculus';

/**
 * The two hook_event_name values this route understands; anything else answers 200 and records
 * nothing.
 */
const EVENT_NAMES: Record<string, HookEvent['event']> = {
    Notification: 'notification',
    Stop: 'stop'
};

/**
 * A non-empty string field of the body, or undefined for anything else (absent, empty, wrong type).
 * Not data/helpers/guards' `str`: it takes the body and a key, and an empty string is not a value
 * here.
 */
function str(body: Record<string, unknown>, key: string): string | undefined {
    const value = body[key];
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * One hook body turned into the event the store keeps, or null when it does not carry a
 * hook_event_name this route knows or a session_id to key the store on. Pure over its two
 * arguments, which is what lets tests/server/root/hooks.test.ts cover every case without a request.
 */
export function handleHook(body: unknown, now: number): HookEvent | null {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
    const record = body as Record<string, unknown>;
    const name = typeof record.hook_event_name === 'string' ? record.hook_event_name : '';
    const kind = byKey(EVENT_NAMES, name);
    if (kind === undefined) return null;
    const session = str(record, 'session_id');
    if (session === undefined) return null;
    const event: HookEvent = { session, event: kind, at: new Date(now).toISOString() };
    const notificationType = str(record, 'notification_type');
    if (notificationType !== undefined) event.kind = notificationType;
    const message = str(record, 'message');
    if (message !== undefined) event.message = message;
    const title = str(record, 'title');
    if (title !== undefined) event.title = title;
    const cwd = str(record, 'cwd');
    if (cwd !== undefined) event.cwd = cwd;
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

export type NotifyConfig = { enabled: boolean; events: string[]; quietSeconds: number };

const DEFAULT_NOTIFY: NotifyConfig = {
    enabled: true,
    events: ['permission_prompt', 'idle_prompt', 'stop'],
    quietSeconds: 3
};

/** `notify:` of config/behavior.yml, defensively: a malformed or absent key answers the default. */
export function notifyConfig(config: Record<string, unknown>): NotifyConfig {
    const held = config.notify;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return DEFAULT_NOTIFY;
    const raw = held as Record<string, unknown>;
    const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_NOTIFY.enabled;
    const events = Array.isArray(raw.events)
        ? raw.events.filter((one): one is string => typeof one === 'string')
        : DEFAULT_NOTIFY.events;
    const quietSeconds =
        typeof raw.quiet_seconds === 'number' && raw.quiet_seconds >= 0
            ? raw.quiet_seconds
            : DEFAULT_NOTIFY.quietSeconds;
    return { enabled, events, quietSeconds };
}

/**
 * Which config key an event pushes under: the notification_type for a Notification, "stop" for a
 * Stop.
 */
function eventKey(event: HookEvent): string {
    return event.event === 'stop' ? 'stop' : (event.kind ?? '');
}

/** `"` and `\` escaped so the string sits safely inside an AppleScript double-quoted literal. */
export function escapeAppleScript(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * The `execFile` shape notify() needs; node:child_process's own signature, narrowed to what is
 * used.
 */
export type ExecFile = (
    file: string,
    args: string[],
    options: { timeout: number },
    callback: (error: Error | null) => void
) => void;

/**
 * The catalog's notify.stop when the caller did not load one; matches the catalog's own default.
 */
const FALLBACK_STOP_MESSAGE = 'Session finished';

/**
 * Push one macOS notification for the event, unless the machine has no osascript. Never throws: a
 * spawn failure or a non-zero exit is one stderr line, since a missed notification is not worth
 * failing the request that is answering the hook's own curl. `stopMessage` is the catalog's
 * notify.stop, read by the caller: notify() is server-only and never imports
 * state/shared/words/text.ts, which is client-side, so the string reaches it as a parameter rather
 * than through t().
 */
export function notify(
    event: HookEvent,
    record: SessionRecord | null,
    stopMessage: string = FALLBACK_STOP_MESSAGE,
    exec: ExecFile = execFileCb
): void {
    const subtitle =
        record !== null && record.title !== ''
            ? record.title
            : event.cwd !== undefined
              ? basename(event.cwd)
              : '';
    const message = event.event === 'stop' ? stopMessage : (event.message ?? stopMessage);
    const script = `display notification "${escapeAppleScript(message)}" with title "${escapeAppleScript(APP_TITLE)}" subtitle "${escapeAppleScript(subtitle)}"`;
    exec(OSASCRIPT, ['-e', script], { timeout: NOTIFY_TIMEOUT_MS }, (error) => {
        if (error !== null) console.error(`hooks: osascript failed: ${error.message}`);
    });
}

/** The first body of each hook_event_name, once, so the real shape is on record after it fires. */
function logFirstPayload(logged: Set<string>, name: string, body: unknown): void {
    if (logged.has(name)) return;
    logged.add(name);
    console.error(`hooks: first ${name} payload: ${JSON.stringify(body)}`);
}

/**
 * What handleHookRequest needs: where events are kept, the real Hub when one is bound, and config.
 */
export type HookTarget = {
    store: HookStore;
    hub: HubLike | null;
    limiter: RateLimiter;
    /** Hook names already logged by this server context. */
    logged: Set<string>;
    config: NotifyConfig;
    /** The catalog's notify.stop; notify()'s own fallback is used when this is absent. */
    stopMessage?: string;
    exec?: ExecFile;
    now?: () => number;
    /**
     * The session's record, for the notification's subtitle; null when the route has none to offer.
     */
    recordFor?: (session: string) => SessionRecord | null;
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
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
        const name = (body as Record<string, unknown>).hook_event_name;
        if (typeof name === 'string' && name !== '') logFirstPayload(into.logged, name, body);
    }
    const event = handleHook(body, now);
    if (event === null) return json({ ok: true });

    into.store.record(event);
    republishHookOn(into, event);

    if (into.config.enabled && into.config.events.includes(eventKey(event))) {
        if (into.store.duePush(event, now, into.config.quietSeconds)) {
            const record = into.recordFor?.(event.session) ?? null;
            notify(event, record, into.stopMessage, into.exec);
        }
    }
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
