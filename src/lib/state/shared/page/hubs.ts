// Layer 2, client state. The views' way in to the hub names, which live in the data layer
// (data/helpers/hub-names.ts) because the server, the snapshot merge and the write routes read the
// same ones. The state row of the layer table lets state import that data module, and a view
// imports state, so a view that names the hub a record is of, or the file under a root a path is
// in, or where a project's folder is, imports it from here.
//
// It also holds the one rule for which hubs could take a new record, which every path that makes
// one reads (a collection's Add, Literature's Add, Save to Literature, Add Task, the apply control
// of a lead and New Project), so the hub is asked the same way everywhere: with more than one, the
// path asks which, the primary first; with one, it writes there, primary or not. The hubs a Hub
// list offers to filter by come in the same order (`hubList`).

import { rootOf } from '../../../data/helpers/hub-names.ts';

export {
    addressOfId,
    bareId,
    fileUnder,
    holdersOf,
    keyOf,
    resolvedId,
    rootOf
} from '../../../data/helpers/hub-names.ts';
export { placeOf } from '../../../data/snapshot/place.ts';

/**
 * The hubs that could take a new record, by name: the hubs of `holders`, each once, the primary
 * first and the others in the order given, which is the workspace's. A new entry of a collection is
 * taken by the hubs whose file of that collection the portfolio holds, given as the collections of
 * that key, each carrying its hub's name in `root`; a new project by every hub of the workspace,
 * given as their names. A holder of no hub is no hub a write can name and is left out.
 */
export function hubsTaking(
    holders: readonly (string | { root?: string })[],
    primary: string | null
): string[] {
    const names = holders.map((one) => (typeof one === 'string' ? one : rootOf(one)));
    const unique = [...new Set(names.filter((name) => name !== ''))];
    const own = unique.filter((name) => name === primary);
    return [...own, ...unique.filter((name) => name !== primary)];
}

/**
 * The hubs a Hub list names, the Focus filter's, a project board's group and a collection view's
 * chips: the names of the workspace's folders that are hubs (`hub: true` of `roots`), the primary
 * first and the others in the workspace's order, while there is more than one, and none while
 * there is one or none, since a list of one hub could hide nothing worth asking for. A record's
 * hub is its `root`.
 */
export function hubList(
    roots: readonly { key: string; hub?: true }[],
    primary: string | null
): string[] {
    const hubs = hubsTaking(
        roots.filter((one) => one.hub === true).map((one) => one.key),
        primary
    );
    return hubs.length > 1 ? hubs : [];
}
