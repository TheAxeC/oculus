// Layer 2, server. Which hub a write goes to. A record of a hub other than the first has the id
// `<root key>:<id>` in the portfolio (data/snapshot/hubs/merge.ts), and the writers look a record
// up by the id its own hub's file gives it, so a write that names a record is first given the hub
// of that record, with that hub's settings and the id inside it. A write that names a prefix no hub
// carries is left as it is and finds no record, which is the answer for any other unknown id.
//
// The target a writer is handed for another hub is the request's own target with that hub's folder,
// settings, projects and side projects in place of the first hub's, so the writers know one hub and
// never see the others. The change log and the answer stay with the request's own target, which is
// why a file of another hub is recorded by its absolute path and the undo of it finds the hub by
// the folder that holds the file.

import { isAbsolute, join, resolve } from 'node:path';
import { HUB_ROOT, ofHub, splitHubId } from '../../../data/helpers/hub-names.ts';
import { inside } from '../../core/paths.ts';
import type { HubTarget } from '../../files/roots.ts';
import type { HeldApp } from '../../machine/apps/held.ts';
import type { WriteTarget } from '../writes.ts';
import type { SubtaskTarget } from './subtasks.ts';

/** The target a writer is given for the hub `one`: that hub's folder, settings and records. */
function within(into: WriteTarget, one: HubTarget): WriteTarget {
    return {
        ...into,
        hub: one.hub,
        config: one.config,
        projects: () => ofHub(into.projects(), one.key),
        sideProjects: () => ofHub(into.sideProjects(), one.key),
        hubs: []
    };
}

/**
 * A write's target, the id inside the hub it names, and the key of that hub when it is not the
 * first.
 */
export type Routed = { into: WriteTarget; id: string; hubKey?: string };

/**
 * The hub an id names and the id inside it: no hub for the first hub's own id, and null when the id
 * is of another hub and the write comes from an app, which reaches the first hub's records alone.
 */
function hubNamed(
    into: WriteTarget,
    id: string,
    app: HeldApp | null
): { one: HubTarget | null; id: string } | null {
    const hubs = into.hubs ?? [];
    const named = splitHubId(
        id,
        hubs.map((one) => one.key)
    );
    if (named.root === HUB_ROOT) return { one: null, id };
    if (app !== null) return null;
    return { one: hubs.find((held) => held.key === named.root) ?? null, id: named.id };
}

/**
 * The target for a write that names the record `id`, and the id inside that record's hub. An id
 * with no hub's prefix is the first hub's own. Null when the record is of another hub and the write
 * comes from an app: it finds no such record.
 */
export function routed(into: WriteTarget, id: string, app: HeldApp | null): Routed | null {
    const named = hubNamed(into, id, app);
    if (named === null) return null;
    if (named.one === null) return { into, id };
    return { into: within(into, named.one), id: named.id, hubKey: named.one.key };
}

/**
 * The same for a caller that is no app, which finds every hub: the first hub for an unknown key.
 */
export function owned(into: WriteTarget, id: string): Routed {
    return routed(into, id, null) ?? { into, id };
}

/**
 * A write's target, the collection inside the hub it names and the id inside that collection, and
 * the key of the hub when it is not the first.
 */
export type RoutedEntry = Routed & { collection: string; hubKey?: string };

/**
 * The hub an entry write names and its ids inside the hub. The hub is the one the collection is
 * prefixed with (`<root key>:<collection>`), else the one the entry's id is prefixed with, since a
 * view names the collection by its key and the entry by the id the portfolio gives it. A prefixed
 * collection holding an entry named without the prefix is no entry, so the answer is null, as it is
 * for an app and for an id naming two hubs.
 */
function hubOfEntry(
    into: WriteTarget,
    collection: string,
    ids: string[],
    app: HeldApp | null
): { one: HubTarget | null; collection: string; ids: string[] } | null {
    const keys = (into.hubs ?? []).map((one) => one.key);
    const named = splitHubId(collection, keys);
    const entries = ids.map((id) => splitHubId(id, keys));
    const root = named.root !== HUB_ROOT ? named.root : (entries.at(0)?.root ?? HUB_ROOT);
    if (entries.some((entry) => entry.root !== root)) return null;
    if (root === HUB_ROOT) return { one: null, collection, ids };
    if (app !== null) return null;
    const one = (into.hubs ?? []).find((held) => held.key === root);
    if (one === undefined) return null;
    return { one, collection: named.id, ids: entries.map((entry) => entry.id) };
}

/**
 * The target for a write that names an entry of a collection, or null when the entry is of another
 * hub than the collection and when the write comes from an app and the hub is not the first.
 */
export function routedEntry(
    into: WriteTarget,
    collection: string,
    id: string,
    app: HeldApp | null
): RoutedEntry | null {
    const held = hubOfEntry(into, collection, [id], app);
    if (held === null) return null;
    if (held.one === null) return { into, collection, id };
    return {
        into: within(into, held.one),
        collection: held.collection,
        id: held.ids[0],
        hubKey: held.one.key
    };
}

/**
 * The target for a write that names the hub itself by the key of its root: the first hub for no key
 * or for `hub`, another hub for its key, and null for a key no hub carries or for an app, which
 * reaches the first hub alone.
 */
export function routedRoot(
    into: WriteTarget,
    root: string | undefined,
    app: HeldApp | null
): WriteTarget | null {
    if (root === undefined || root === HUB_ROOT) return into;
    const one = (into.hubs ?? []).find((held) => held.key === root);
    return one === undefined || app !== null ? null : within(into, one);
}

/** A subtask write's target, and the record it names by the ids inside the hub. */
export type RoutedTarget = { into: WriteTarget; target: SubtaskTarget };

/** The target for a subtask write on a manifest by its id or on an entry of a collection. */
export function routedTarget(
    into: WriteTarget,
    target: SubtaskTarget,
    app: HeldApp | null
): RoutedTarget | null {
    if (target.collection === undefined) {
        const named = routed(into, target.id, app);
        return named === null ? null : { into: named.into, target: { id: named.id } };
    }
    const named = routedEntry(into, target.collection, target.id, app);
    if (named === null) return null;
    return { into: named.into, target: { id: named.id, collection: named.collection } };
}

/** A reorder's target, the collection inside the hub it names and the order by the ids inside. */
export type RoutedOrder = { into: WriteTarget; collection: string; order: string[] };

/** The target for a reorder of a collection, every id of the order of the one hub it names. */
export function routedOrder(
    into: WriteTarget,
    collection: string,
    order: string[],
    app: HeldApp | null
): RoutedOrder | null {
    const held = hubOfEntry(into, collection, order, app);
    if (held === null) return null;
    if (held.one === null) return { into, collection, order };
    return { into: within(into, held.one), collection: held.collection, order: held.ids };
}

/**
 * The target of the hub whose folder holds the file a change names, the request's own for a file of
 * the first hub, of the reader's bookmarks or of a side project, and null for a file that no hub
 * holds: the hub it was written in has left `roots:`.
 */
export function holding(into: WriteTarget, file: string): WriteTarget | null {
    const path = resolve(isAbsolute(file) ? file : join(into.hub, file));
    if (inside(path, into.hub) || path === resolve(into.bookmarks)) return into;
    const one = (into.hubs ?? []).find((held) => inside(path, held.hub));
    if (one !== undefined) return within(into, one);
    return into.sideProjects().some((side) => resolve(side.file) === path) ? into : null;
}
