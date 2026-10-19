// Layer 2, server. What the server keeps from a hook after routes/api/(sessions)/hook/+server.ts
// has parsed it: one event per session, merged back into the sessions payload two ways.
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
    Dataset,
    HookEvent,
    Project,
    SessionRecord,
    SessionsPayload,
    Workspace
} from '../../../data/model/index.ts';
import { isMap } from '../../../data/helpers/guards.ts';

/** How long a hook keeps showing on its session before it is treated as if it never arrived. */
export const HOOK_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * The latest hook per session, with a 24 hour expiry. ServerContext owns the process's one store
 * and passes it to both the route and the watcher.
 */
export class HookStore {
    #events = new Map<string, HookEvent>();

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
    if (!payload.records.some((record) => record.id === event.session)) return payload;
    const records = payload.records.map((record) =>
        record.id === event.session ? patchRecord(record, event) : record
    );
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

/**
 * The record of one session in the last published payload, for a route that acts on the session
 * (a resume, a transcript read).
 */
export function sessionRecord(hub: HubLike, session: string): SessionRecord | null {
    const message = hub.latest('sessions');
    if (message === undefined) return null;
    const payload = message.payload as SessionsPayload;
    return payload.records.find((record) => record.id === session) ?? null;
}

/**
 * The workspace roots the last published `git` payload names. They are what a git write may
 * address: server/git/git-write.ts refuses any other root, so the panel can only ever act on a
 * checkout the sessions views are already showing. An empty list is a process that has published
 * nothing yet.
 */
export function gitRoots(hub: HubLike): string[] {
    const message = hub.latest('git');
    if (message === undefined) return [];
    const payload = message.payload;
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return [];
    return Object.keys(payload);
}

/**
 * One entity map of the last published `portfolio` payload, and nothing when it holds no such map.
 */
function entityMap(hub: HubLike, kind: string): Record<string, unknown> | null {
    const message = hub.latest('portfolio');
    if (message === undefined) return null;
    const entities = isMap(message.payload) ? message.payload.entities : undefined;
    const held = isMap(entities) ? entities[kind] : undefined;
    return isMap(held) ? held : null;
}

/**
 * One entity map of the last published `portfolio` payload (the domains, the resources), for a
 * config write that checks a value against them; null while the process has published none.
 */
export function entities(
    hub: HubLike,
    kind: 'domains' | 'resources'
): Record<string, unknown> | null {
    return entityMap(hub, kind);
}

/**
 * The name of the person the last published `portfolio` payload marks `self: true`, the hub's
 * owner, or null when none is marked, the name is empty or no payload was published.
 */
export function ownerName(hub: HubLike): string | null {
    const people = entityMap(hub, 'people');
    if (people === null) return null;
    for (const person of Object.values(people)) {
        if (isMap(person) && person.self === true && typeof person.name === 'string') {
            return person.name === '' ? null : person.name;
        }
    }
    return null;
}

/**
 * The project ids the last published `portfolio` payload names. POST /api/deposit takes them as one
 * half of what a deposit may address, the hub's own manifests being the other; a process that has
 * published nothing yet names none, and the manifests answer alone.
 */
export function projectIds(hub: HubLike): string[] {
    const projects = entityMap(hub, 'projects');
    return projects === null ? [] : Object.keys(projects);
}

/**
 * One project in the last published portfolio payload, for a server action scoped by project id.
 */
export function project(hub: HubLike, id: string): Project | null {
    const projects = entityMap(hub, 'projects');
    const found = projects === null ? undefined : projects[id];
    // The payload is the server's own snapshot, so what sits under a project id is a project.
    return isMap(found) ? (found as Project) : null;
}

/**
 * Every project in the last published portfolio payload, for an action over the whole portfolio.
 */
export function projects(hub: HubLike): Project[] {
    const held = entityMap(hub, 'projects');
    return held === null
        ? []
        : Object.values(held)
              .filter(isMap)
              .map((one) => one as Project);
}

/**
 * A dataset of the last portfolio payload by its id, or null, for recovery requests to address by
 * snapshot only.
 */
export function dataset(hub: HubLike, id: string): Dataset | null {
    const datasets = entityMap(hub, 'datasets');
    const found = datasets === null || !Object.hasOwn(datasets, id) ? undefined : datasets[id];
    // The payload is the server's own snapshot, so what sits under a dataset id is a dataset.
    return isMap(found) ? (found as Dataset) : null;
}

/**
 * Every dataset of the last portfolio payload that Recover runs, as its hub, key and `path:`: an
 * id of the primary hub is the key, an id of another hub is `<hub>:<key>`.
 */
export function recoverPlaces(
    hub: HubLike,
    primary: string | null
): { hub: string; key: string; path: string | undefined }[] {
    const datasets = entityMap(hub, 'datasets') ?? {};
    return Object.entries(datasets).flatMap(([id, found]) => {
        // The payload is the server's own snapshot, so what sits under a dataset id is a dataset.
        const entry = isMap(found) ? (found as Dataset) : null;
        if (entry?.recover !== true) return [];
        const at = id.indexOf(':');
        if (at === -1) return primary === null ? [] : [{ hub: primary, key: id, path: entry.path }];
        return [{ hub: id.slice(0, at), key: id.slice(at + 1), path: entry.path }];
    });
}

/**
 * What routes/api/(sessions)/hook/+server.ts needs of the real Hub, without importing its class
 * identity.
 */
export type HubLike = {
    latest(channel: string): { payload: unknown } | undefined;
    publish(channel: string, payload: unknown): number;
};
