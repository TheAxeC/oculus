// Layer 2, server. What the server keeps from a hook after routes/api/hook/+server.ts has parsed
// it: one event per session, merged back into the sessions payload two ways.
//
// A rescan rebuilds every SessionRecord from the transcript stores, which know nothing of hooks, so
// server/sessions/index.ts's sessions() calls mergeHooks() on the fresh records before they are
// grouped; that is how a permission prompt survives past the rescan that happens moments after it
// (a hook usually fires right when the assistant turn that triggered it is appended). The 24 hour
// expiry is what stops a Stop event from a session nobody reopens turning into a permanent chip.
//
// The immediate half, patchPayload(), is pure: given the payload already published and the new
// event, it answers a payload with only the matching record changed, so the caller can push it
// without waiting for the next debounced rescan. Nothing here runs a rescan or touches a file.

import type {
    GitPayload,
    HookEvent,
    Project,
    SessionRecord,
    SessionsPayload,
    Snapshot,
    Workspace
} from '../../data/model.ts';

/** How long a hook keeps showing on its session before it is treated as if it never arrived. */
export const HOOK_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Keyed `${session}:${kind ?? event}`, the quiet-window dedup key for one notification's push. */
function pushKey(event: HookEvent): string {
    return `${event.session}:${event.kind ?? event.event}`;
}

/**
 * The latest hook per session, with a 24 hour expiry. One process holds one store; sharedStore()
 * below is how the route and the watcher, which load this module as two separate copies once the
 * app is built, end up reading and writing the same instance.
 */
export class HookStore {
    #events = new Map<string, HookEvent>();
    #lastPush = new Map<string, number>();

    /** Record an event as the session's latest, replacing whatever it had. */
    record(event: HookEvent): void {
        this.#events.set(event.session, event);
    }

    /** The session's event, or null when it has none or the one it had has expired. */
    latest(session: string, now: number): HookEvent | null {
        const event = this.#events.get(session);
        if (event === undefined) return null;
        if (now - Date.parse(event.at) > HOOK_EXPIRY_MS) return null;
        return event;
    }

    /**
     * Whether this event is due a push: the first of its kind for the session, or the first since
     * the quiet window closed. Recording it here is what makes the next call inside the window say
     * no, so a caller asks once per event and acts on the answer rather than checking twice.
     */
    duePush(event: HookEvent, now: number, quietSeconds: number): boolean {
        const key = pushKey(event);
        const last = this.#lastPush.get(key);
        if (last !== undefined && now - last < quietSeconds * 1000) return false;
        this.#lastPush.set(key, now);
        return true;
    }

    /** Every session id with a live (unexpired) event, for a caller that wants to sweep. */
    prune(now: number): void {
        for (const [session, event] of this.#events) {
            if (now - Date.parse(event.at) > HOOK_EXPIRY_MS) this.#events.delete(session);
        }
    }
}

/**
 * Every record with its `hook` field set from the store, or left null when the session has none or
 * it expired. Called once per rescan, before group() sees the records, so a GroupedSession's `hook`
 * is the same field carried through the spread.
 */
export function mergeHooks(
    records: SessionRecord[],
    store: HookStore,
    now: number
): SessionRecord[] {
    return records.map((record) => ({ ...record, hook: store.latest(record.id, now) }));
}

/**
 * The payload with one record's `hook` field replaced, everything else the same object it was. A
 * session the payload does not hold (a hook for one the last scan has not found yet) leaves the
 * payload untouched, since there is no record to attach it to until the next rescan finds one.
 */
export function patchPayload(payload: SessionsPayload, event: HookEvent): SessionsPayload {
    let touched = false;
    const records = payload.records.map((record) => {
        if (record.id !== event.session) return record;
        touched = true;
        return patchRecord(record, event);
    });
    if (!touched) return payload;
    const workspaces: Workspace[] = payload.workspaces.map((workspace) => ({
        ...workspace,
        areas: workspace.areas.map((area) => ({
            ...area,
            sessions: area.sessions.map((session) =>
                session.id === event.session ? patchRecord(session, event) : session
            )
        }))
    }));
    return { ...payload, records, workspaces };
}

/**
 * One record with the event on it. A Stop is the assistant's turn ending, so a live record reads
 * `idle` from then until the next rescan reads the transcript's own tail; a record that is not
 * live keeps its state, since `ended` is not undone by a hook.
 */
function patchRecord<T extends SessionRecord>(record: T, event: HookEvent): T {
    if (event.event === 'stop' && record.live) return { ...record, hook: event, state: 'idle' };
    return { ...record, hook: event };
}

/** The record of one session in the last published payload, for the notification's subtitle. */
export function bridgedRecord(session: string): SessionRecord | null {
    const { hub } = bridge();
    if (hub === null) return null;
    const message = hub.latest('sessions');
    if (message === undefined) return null;
    const payload = message.payload as SessionsPayload;
    return payload.records.find((record) => record.id === session) ?? null;
}

/**
 * The workspace roots the last published `git` payload names. They are what a git write may address:
 * server/git-write.ts refuses any other root, so the panel can only ever act on a checkout the
 * sessions views are already showing. An empty list is a process that has published nothing yet.
 */
export function bridgedGitRoots(): string[] {
    const { hub } = bridge();
    if (hub === null) return [];
    const message = hub.latest('git');
    if (message === undefined) return [];
    const payload = message.payload;
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return [];
    return Object.keys(payload as GitPayload);
}

/**
 * The project ids the last published `portfolio` payload names. POST /api/deposit takes them as one
 * half of what a deposit may address, the hub's own manifests being the other; a process that has
 * published nothing yet names none, and the manifests answer alone.
 */
export function bridgedProjectIds(): string[] {
    const { hub } = bridge();
    if (hub === null) return [];
    const message = hub.latest('portfolio');
    if (message === undefined) return [];
    const payload = message.payload;
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return [];
    const entities = (payload as Snapshot).entities;
    if (typeof entities !== 'object' || entities === null) return [];
    return Object.keys(entities.projects ?? {});
}

/** One project in the last published portfolio payload, for a server action scoped by project id. */
export function bridgedProject(id: string): Project | null {
    const { hub } = bridge();
    if (hub === null) return null;
    const message = hub.latest('portfolio');
    if (message === undefined) return null;
    const payload = message.payload;
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null;
    const entities = (payload as Snapshot).entities;
    if (typeof entities !== 'object' || entities === null) return null;
    return entities.projects?.[id] ?? null;
}

/** Dataset keys in the last portfolio payload, for recovery requests to address by snapshot only. */
export function bridgedDatasetIds(): string[] {
    const { hub } = bridge();
    if (hub === null) return [];
    const message = hub.latest('portfolio');
    if (message === undefined) return [];
    const payload = message.payload;
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return [];
    const entities = (payload as Snapshot).entities;
    if (typeof entities !== 'object' || entities === null) return [];
    return Object.keys(entities.datasets ?? {});
}

/** What routes/api/hook/+server.ts needs of the real Hub, without importing its class identity. */
export type HubLike = {
    latest(channel: string): { payload: unknown } | undefined;
    publish(channel: string, payload: unknown): number;
};

type Bridge = { store: HookStore; hub: HubLike | null };

declare global {
    // eslint-disable-next-line no-var
    var __oculusHookBridge: Bridge | undefined;
}

/**
 * The one HookStore this process holds, reached the same way by every copy of this module. Node's
 * built server bundles routes into build/ separately from the plain TypeScript src/server.ts (and
 * Vite's dev SSR graph) imports for the watcher, so two `import ... from './hooks.ts'` sites can be
 * two different module instances even in one process; globalThis is the one object guaranteed to be
 * the same object regardless, which is why the store and the hub reference both live on it rather
 * than as ordinary module-level state.
 */
function bridge(): Bridge {
    globalThis.__oculusHookBridge ??= { store: new HookStore(), hub: null };
    return globalThis.__oculusHookBridge;
}

/** The shared store: what a hook is recorded into, and what a rescan's merge reads from. */
export function sharedHookStore(): HookStore {
    return bridge().store;
}

/**
 * Called once by src/server.ts and vite.config.ts's dev plugin, right after the real Hub is built,
 * so a hook that arrives while the page is open republishes at once. Before this is called (a
 * process that never started a watcher, or a route test that supplies its own hub instead), a hook
 * is still recorded and still merged in at the next rescan; only the immediate push is unavailable.
 */
export function bindHookHub(hub: HubLike): void {
    bridge().hub = hub;
}

/**
 * Patch the event into the last published `sessions` payload and republish it on the bound Hub. A
 * no-op when nothing is bound yet or nothing has been published on the channel yet; the merge at the
 * next rescan is what carries the event from there.
 */
export function republishHook(event: HookEvent): void {
    const { hub } = bridge();
    if (hub === null) return;
    const message = hub.latest('sessions');
    if (message === undefined) return;
    hub.publish('sessions', patchPayload(message.payload as SessionsPayload, event));
}
