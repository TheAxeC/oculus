// Layer 2, server. Which hub a write goes to. Every record of the portfolio has the internal id
// `<hub>:<key>` (data/snapshot/hubs/merge.ts and hubs/feeds.ts), the primary hub's included, and a
// write names its record by that id. The writers look a record up by the key its own hub's file
// gives it, so a write that names a record is first given the hub of that record, with that hub's
// settings and the key inside it. An id with no hub part, a bare key, is refused as a request that
// lacks the hub; an id whose hub part no workspace folder carries is refused as naming no hub. A
// write from an app reaches the primary hub's records alone, so with no primary an app writes no
// record and makes none. A write that makes or renames a record answers with the record's id.
//
// The target a writer is handed for a hub is the request's own target with that hub's folder,
// settings and projects in place of the primary's, so the writers know one hub and never see the
// others. The change log and the answer stay with the request's own target, which is why a file of
// another hub is recorded by its absolute path and the undo of it finds the hub by the folder that
// holds the file.

import { isAbsolute, resolve } from 'node:path';
import { json } from '@sveltejs/kit';
import { addressOfId, hubId, ofHub, splitHubId } from '../../../data/helpers/hub-names.ts';
import { words } from '../../core/words.ts';
import { inside, realPath } from '../../core/paths.ts';
import { hubManifests, type HubTarget } from '../../files/roots.ts';
import type { HeldApp } from '../../machine/apps/read/held.ts';
import { engineLiteraturePath, literatureFile } from '../feeds/literature.ts';
import type { PrimaryTarget, WriteOutcome, WriteTarget } from '../writes.ts';
import type { SubtaskTarget } from './subtasks.ts';

/** The target a writer is given for the hub `one`: that hub's folder, settings and records. */
function within(into: WriteTarget, one: HubTarget): PrimaryTarget {
    return {
        ...into,
        hub: one.hub,
        config: one.config,
        projects: () => ofHub(into.projects(), one.key),
        primary: one.key,
        hubs: []
    };
}

/** The keys of every hub of the workspace, the primary's among them. */
function hubKeysOf(into: WriteTarget): string[] {
    const keys = (into.hubs ?? []).map((one) => one.key);
    return into.primary === null || keys.includes(into.primary) ? keys : [into.primary, ...keys];
}

/**
 * The request's target as a target over the primary hub, its projects those of the primary under
 * their keys, or null while the workspace has none.
 */
export function primaryOf(into: WriteTarget): PrimaryTarget | null {
    if (into.hub === null || into.primary === null) return null;
    const { primary } = into;
    return {
        ...into,
        hub: into.hub,
        primary,
        projects: () => ofHub(into.projects(), primary)
    };
}

/**
 * The refusal of a write whose record ids reach no hub, or null when each id has a hub part that a
 * hub of the workspace carries. An id with no hub part is a bad request (400): the write needs the
 * record's hub. A hub part no workspace folder carries names no hub (404). Neither sentence shows a
 * joined id: the first names the key, the second the hub.
 */
export function routeRefusal(into: WriteTarget, ids: readonly string[]): Response | null {
    const keys = hubKeysOf(into);
    for (const id of ids) {
        const { hub, key } = addressOfId(id);
        if (hub === '') {
            const error = words(into.config.text, 'server.write_route.no_hub_part', key);
            return json({ error }, { status: 400 });
        }
        if (!keys.includes(hub)) {
            const error = words(into.config.text, 'server.workspace.no_hub_named', hub);
            return json({ error }, { status: 404 });
        }
    }
    return null;
}

/**
 * A writer's outcome with the id it gives, the key inside the hub of `into`, made the record's
 * internal id, which the answer carries so the page opens and settles the record of that hub.
 */
export function withHubId(outcome: WriteOutcome, into: PrimaryTarget): WriteOutcome {
    return outcome.id === undefined ? outcome : { ...outcome, id: hubId(into.primary, outcome.id) };
}

/** A write's target and the key inside the hub it names. */
export type Routed = { into: PrimaryTarget; id: string };

/**
 * The target of the hub named `root`: the primary's for its own name, another hub's for its name,
 * and null for a name no hub of the workspace carries and for a hub other than the primary when the
 * write comes from an app.
 */
function hubTarget(into: WriteTarget, root: string, app: HeldApp | null): PrimaryTarget | null {
    if (root !== '' && root === into.primary) return primaryOf(into);
    if (app !== null) return null;
    const one = (into.hubs ?? []).find((held) => held.key === root);
    return one === undefined ? null : within(into, one);
}

/**
 * The target for a write that names the record `id`, and the key inside that record's hub. Null
 * when the id names no hub of the workspace, and when the record is of a hub other than the primary
 * and the write comes from an app: it finds no such record.
 */
export function routed(into: WriteTarget, id: string, app: HeldApp | null): Routed | null {
    const named = splitHubId(id, hubKeysOf(into));
    const at = hubTarget(into, named.root, app);
    return at === null ? null : { into: at, id: named.id };
}

/** A write's target, the collection's key and the key inside it of the entry it names. */
export type RoutedEntry = Routed & { collection: string };

/**
 * The hub an entry write names and the keys of its entries inside that hub. A view names the
 * collection by its key and each entry by its id in the portfolio, whose hub is the hub of the
 * write; entries of two hubs name no one file, so the answer is null, as it is for an id that
 * names no hub.
 */
function hubOfEntries(
    into: WriteTarget,
    ids: readonly string[],
    app: HeldApp | null
): { into: PrimaryTarget; ids: string[] } | null {
    const keys = hubKeysOf(into);
    const entries = ids.map((id) => splitHubId(id, keys));
    const root = entries.at(0)?.root ?? '';
    if (entries.some((entry) => entry.root !== root)) return null;
    const at = hubTarget(into, root, app);
    return at === null ? null : { into: at, ids: entries.map((entry) => entry.id) };
}

/**
 * The target for a write that names an entry of the collection `collection` by its id, or null
 * when the id names no hub and when the write comes from an app and the hub is not the primary.
 */
export function routedEntry(
    into: WriteTarget,
    collection: string,
    id: string,
    app: HeldApp | null
): RoutedEntry | null {
    const held = hubOfEntries(into, [id], app);
    if (held === null) return null;
    return { into: held.into, collection, id: held.ids[0] };
}

/**
 * The target for a write that makes a record in the hub it names by its name (a new entry, a paper
 * saved to Literature, a new project): the primary for its own name, another hub for its name, and
 * null for a name no hub of the workspace carries and, for an app, which reaches the primary alone,
 * for any other hub.
 */
function routedRoot(into: WriteTarget, root: string, app: HeldApp | null): PrimaryTarget | null {
    return hubTarget(into, root, app);
}

/**
 * The target for a write that makes a record and may name the hub to make it in by `root`: the hub
 * it names (`routedRoot`), refused as naming no hub (404) when no hub of the workspace carries that
 * name or, for an app, when it is another hub than the primary; with no `root`, the target
 * `unnamed` gives, refused as `noHub` refuses when it gives none.
 */
export function rootedHome(
    into: WriteTarget,
    root: string | undefined,
    app: HeldApp | null,
    unnamed: () => PrimaryTarget | null
): PrimaryTarget | Response {
    const home = root === undefined ? unnamed() : routedRoot(into, root, app);
    if (home !== null) return home;
    if (root === undefined) return noHub(into, app);
    const error = words(into.config.text, 'server.workspace.no_hub_named', root);
    return json({ error }, { status: 404 });
}

/**
 * The target for a write that names no record and needs a hub (the career file, a new project or a
 * new entry with no root, a lead, a Lit Watch paper and a LinkedIn idea, and `homeOfLiterature`
 * when no hub holds the collection): the primary's, else, for the page, the workspace's one hub
 * when it lists one, and null when it lists none or several, since no order of the hubs decides
 * where a record goes, or for an app when it has no primary.
 */
export function homeOf(into: WriteTarget, app: HeldApp | null): PrimaryTarget | null {
    const own = primaryOf(into);
    if (own !== null || app !== null) return own;
    const hubs = into.hubs ?? [];
    return hubs.length === 1 ? within(into, hubs[0]) : null;
}

/**
 * The refusal of a write that needs a hub when `homeOf` or `homeOfLiterature` gives none: an app
 * writes to a workspace with no primary, the workspace lists several hubs and the write names none
 * of them, or it lists no hub.
 */
export function noHub(into: WriteTarget, app: HeldApp | null): Response {
    const text = into.config.text;
    const error =
        app !== null
            ? words(text, 'server.workspace.no_primary')
            : hubKeysOf(into).length > 1
              ? words(text, 'server.workspace.which_hub')
              : words(text, 'server.workspace.no_hub');
    return json({ error }, { status: 409 });
}

/**
 * The target for a write to the Literature collection that names no hub: the primary's when it
 * holds the collection, else the one other hub's that does when one does, null when several do, and
 * `homeOf`'s when none does; for an app, the primary's alone. A hub holds it when an entry of its
 * `collections:` names the `literature` registry, or when its list leaves it to oculus's entry and
 * it holds the file there (`literatureFile`, the file Save to Literature writes).
 */
export function homeOfLiterature(into: WriteTarget, app: HeldApp | null): PrimaryTarget | null {
    if (app !== null) return primaryOf(into);
    const enginePath = engineLiteraturePath(into.engineConfig());
    const holds = (hub: string, config: WriteTarget['config']): boolean =>
        config.collections.some((one) => one.registry === 'literature') ||
        (enginePath !== undefined && literatureFile(hub, config, enginePath) !== null);
    const own = primaryOf(into);
    if (own !== null && holds(own.hub, own.config)) return own;
    const holding = (into.hubs ?? []).filter(
        (held) => held.key !== into.primary && holds(held.hub, held.config)
    );
    if (holding.length === 0) return homeOf(into, null);
    return holding.length === 1 ? within(into, holding[0]) : null;
}

/** A subtask write's target, and the record it names by the keys inside the hub. */
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

/** A reorder's target, the collection's key and the order by the keys inside the hub. */
export type RoutedOrder = { into: PrimaryTarget; collection: string; order: string[] };

/** The target for a reorder of a collection, every id of the order of the one hub it names. */
export function routedOrder(
    into: WriteTarget,
    collection: string,
    order: string[],
    app: HeldApp | null
): RoutedOrder | null {
    const held = hubOfEntries(into, order, app);
    return held === null ? null : { into: held.into, collection, order: held.ids };
}

/**
 * The target of the hub a change's file belongs to: the request's own for a file inside the primary
 * hub's folder, for the reader's bookmarks and for the manifest of a workspace folder read as a
 * project of the primary, wherever that folder lies, inside another hub's folder included; another
 * hub's for any other file inside that hub's folder; and null for a file that no hub holds, since
 * the hub it was written in has left the workspace. A manifest is matched by its real path, so a
 * link or a second spelling of the path is the same file.
 */
export function holding(into: WriteTarget, file: string): PrimaryTarget | null {
    if (!isAbsolute(file)) return null;
    const path = resolve(file);
    const own = primaryOf(into);
    if (own !== null && inside(path, own.hub)) return own;
    if (own !== null && into.bookmarks !== undefined && path === resolve(into.bookmarks)) {
        return own;
    }
    if (own !== null) {
        const place = realPath(path) ?? path;
        const repositories = hubManifests(own.hub, own.config).filter((one) => one.workspaceFolder);
        const read = repositories.some(
            (project) => (realPath(project.file) ?? project.file) === place
        );
        if (read) return own;
    }
    const one = (into.hubs ?? []).find((held) => inside(path, held.hub));
    return one === undefined ? null : within(into, one);
}
