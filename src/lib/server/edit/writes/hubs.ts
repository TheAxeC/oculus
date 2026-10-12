// Layer 2, server. Which hub a write goes to. A record of a hub other than the primary has the id
// `<hub name>:<id>` in the portfolio (data/snapshot/hubs/merge.ts), and with no primary every
// record has one. The writers look a record up by the id its own hub's file gives it, so a write
// that names a record is first given the hub of that record, with that hub's settings and the id
// inside it. A bare id names the primary's record and finds none when the workspace has no primary;
// a prefix no hub of the workspace carries is left as it is and finds no record, which is the
// answer for any other unknown id.
//
// The target a writer is handed for another hub is the request's own target with that hub's folder,
// settings and projects in place of the primary's, so the writers know one hub and never see the
// others. The change log and the answer stay with the request's own target, which is why a file of
// another hub is recorded by its absolute path and the undo of it finds the hub by the folder that
// holds the file.

import { isAbsolute, resolve } from 'node:path';
import { ofHub, splitHubId } from '../../../data/helpers/hub-names.ts';
import { inside } from '../../core/paths.ts';
import { hubManifests, type HubTarget } from '../../files/roots.ts';
import type { HeldApp } from '../../machine/apps/read/held.ts';
import type { PrimaryTarget, WriteTarget } from '../writes.ts';
import type { SubtaskTarget } from './subtasks.ts';

/** The target a writer is given for the hub `one`: that hub's folder, settings and records. */
function within(into: WriteTarget, one: HubTarget): PrimaryTarget {
    return {
        ...into,
        hub: one.hub,
        config: one.config,
        projects: () => ofHub(into.projects(), one.key, into.primary),
        primary: one.key,
        hubs: []
    };
}

/** The request's target as a target over the primary hub, or null while the workspace has none. */
export function primaryOf(into: WriteTarget): PrimaryTarget | null {
    if (into.hub === null || into.primary === null) return null;
    return { ...into, hub: into.hub, primary: into.primary };
}

/**
 * A write's target, the id inside the hub it names, and the key of that hub when it is not the
 * first.
 */
export type Routed = { into: PrimaryTarget; id: string; hubKey?: string };

/**
 * The hub an id names and the id inside it: no hub for the primary's own id, and null when the id
 * is of another hub and the write comes from an app, which reaches the primary's records alone, or
 * when the id is bare and the workspace has no primary.
 */
function hubNamed(
    into: WriteTarget,
    id: string,
    app: HeldApp | null
): { one: HubTarget | null; id: string } | null {
    const hubs = into.hubs ?? [];
    const named = splitHubId(
        id,
        hubs.map((one) => one.key),
        into.primary
    );
    if (into.primary !== null && named.root === into.primary) return { one: null, id };
    if (app !== null) return null;
    const one = hubs.find((held) => held.key === named.root);
    return one === undefined ? null : { one, id: named.id };
}

/**
 * The target for a write that names the record `id`, and the id inside that record's hub. An id
 * with no hub's prefix is the primary's own. Null when the record is of another hub and the write
 * comes from an app, and when the id names no hub: it finds no such record.
 */
export function routed(into: WriteTarget, id: string, app: HeldApp | null): Routed | null {
    const named = hubNamed(into, id, app);
    if (named === null) return null;
    if (named.one === null) {
        const own = primaryOf(into);
        return own === null ? null : { into: own, id };
    }
    return { into: within(into, named.one), id: named.id, hubKey: named.one.key };
}

/**
 * A write's target, the collection inside the hub it names and the id inside that collection, and
 * the key of the hub when it is not the first.
 */
export type RoutedEntry = Routed & { collection: string; hubKey?: string };

/**
 * The hub an entry write names and its ids inside the hub. The hub is the one the collection is
 * prefixed with (`<hub name>:<collection>`), else the one the entry's id is prefixed with, since a
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
    const named = splitHubId(collection, keys, into.primary);
    const entries = ids.map((id) => splitHubId(id, keys, into.primary));
    const root =
        named.root !== (into.primary ?? '') ? named.root : (entries.at(0)?.root ?? named.root);
    if (entries.some((entry) => entry.root !== root)) return null;
    if (into.primary !== null && root === into.primary) return { one: null, collection, ids };
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
    if (held.one === null) {
        const own = primaryOf(into);
        return own === null ? null : { into: own, collection, id };
    }
    return {
        into: within(into, held.one),
        collection: held.collection,
        id: held.ids[0],
        hubKey: held.one.key
    };
}

/**
 * The target for a write that names the hub itself by its name: the primary for no name or for its
 * own, another hub for its name, and null for a name no hub of the workspace carries, for an app,
 * which reaches the primary alone, and for no name when the workspace has no primary.
 */
export function routedRoot(
    into: WriteTarget,
    root: string | undefined,
    app: HeldApp | null
): PrimaryTarget | null {
    if (root === undefined || root === into.primary) return primaryOf(into);
    const one = (into.hubs ?? []).find((held) => held.key === root);
    return one === undefined || app !== null ? null : within(into, one);
}

/**
 * The target for a write that names no record and needs a hub (a new project, a new entry, a feed
 * entry, a host status): the primary's, else the first hub of the workspace, and null when the
 * workspace lists no hub.
 */
export function homeOf(into: WriteTarget): PrimaryTarget | null {
    const own = primaryOf(into);
    if (own !== null) return own;
    const first = (into.hubs ?? []).at(0);
    return first === undefined ? null : within(into, first);
}

/** A subtask write's target, and the record it names by the ids inside the hub. */
export type RoutedTarget = { into: PrimaryTarget; target: SubtaskTarget };

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
export type RoutedOrder = { into: PrimaryTarget; collection: string; order: string[] };

/** The target for a reorder of a collection, every id of the order of the one hub it names. */
export function routedOrder(
    into: WriteTarget,
    collection: string,
    order: string[],
    app: HeldApp | null
): RoutedOrder | null {
    const held = hubOfEntry(into, collection, order, app);
    if (held === null) return null;
    if (held.one === null) {
        const own = primaryOf(into);
        return own === null ? null : { into: own, collection, order };
    }
    return { into: within(into, held.one), collection: held.collection, order: held.ids };
}

/**
 * The target of the hub whose folder holds the file a change names, the request's own for a file of
 * the primary hub, of the reader's bookmarks or of a workspace folder read as a project of the
 * primary (its manifest, which lies outside the hub's folder), and null for a file that no hub
 * holds: the hub it was written in has left the workspace.
 */
export function holding(into: WriteTarget, file: string): PrimaryTarget | null {
    if (!isAbsolute(file)) return null;
    const path = resolve(file);
    const own = primaryOf(into);
    if (own !== null && inside(path, own.hub)) return own;
    if (own !== null && into.bookmarks !== undefined && path === resolve(into.bookmarks)) {
        return own;
    }
    const one = (into.hubs ?? []).find((held) => inside(path, held.hub));
    if (one !== undefined) return within(into, one);
    if (own === null) return null;
    const repositories = hubManifests(own.hub, own.config).filter((one) => one.workspaceFolder);
    return repositories.some((project) => resolve(project.file) === path) ? own : null;
}
