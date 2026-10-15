// Layer 3, partial of views/sources/repositories/graph/Graph.svelte. The rows of the Graph as the
// keyboard walks them, and which loaded commit's item draws a row: each commit of the history
// once, Incoming Changes and Outgoing Changes above the first commit of their side with the files
// of their range under them when open, a commit's files under it when it is the open one, and Load
// More last. A commit drawn above the history (the blame's commit the loaded pages do not reach)
// comes first.

import type { KeyRow } from '$lib/ui/tree/tree-keys';
import type { GraphSide } from '$lib/state/sources/repositories/graph-lanes';

/** What the rows are read from: the graph's lists and what is open in it. */
export type GraphRowsOf = {
    commits: readonly { hash: string }[];
    /** The entries drawn above each commit, by the commit's index. */
    places: ReadonlyMap<number, readonly GraphSide[]>;
    /** The open commit, the empty string for none. */
    commit: string;
    /** The entry whose range's files are open, the empty string for none. */
    ranged: GraphSide | '';
    /** Whether the open commit is drawn above the history. */
    missing: boolean;
    more: boolean;
    /** The file and folder rows drawn under the open commit or entry, by where they are drawn. */
    files: Partial<Record<string, readonly KeyRow[]>>;
};

/** The rows of the Graph, in the order they are drawn. */
export function graphRows(of: GraphRowsOf): KeyRow[] {
    const rows: KeyRow[] = [];
    /** A row that opens by a press, and the rows drawn under it while it is open. */
    const opening = (id: string, open: boolean, place: string): void => {
        rows.push({ id, parent: 'graph', open, fixed: true });
        if (open)
            for (const file of of.files[place] ?? [])
                rows.push({ ...file, parent: file.parent ?? id });
    };
    const side = (kind: GraphSide): void => opening(`graph:${kind}`, of.ranged === kind, kind);
    if (of.missing) opening(`commit:${of.commit}`, true, 'outside');
    of.commits.forEach((one, at) => {
        for (const kind of of.places.get(at) ?? []) side(kind);
        opening(`commit:${one.hash}`, one.hash === of.commit, 'log');
    });
    if (of.commits.length === 0) for (const kind of of.places.get(0) ?? []) side(kind);
    if (of.more) rows.push({ id: 'graph:more', parent: 'graph' });
    return rows;
}

/** The index of the commit an entry is drawn above, or -1 when the entry is not drawn. */
function placeOf(places: ReadonlyMap<number, readonly GraphSide[]>, kind: GraphSide): number {
    for (const [at, kinds] of places) if (kinds.includes(kind)) return at;
    return -1;
}

/**
 * The index of the loaded commit whose item draws the row `id`: its own, a file of the open one,
 * or an entry drawn above it or a file of that entry's range; -1 for a row no item draws.
 */
export function itemOf(of: GraphRowsOf, id: string): number {
    for (const kind of ['incoming', 'outgoing'] as const) {
        const own = id === `graph:${kind}`;
        if (own || (of.files[kind] ?? []).some((file) => file.id === id)) {
            return placeOf(of.places, kind);
        }
    }
    const hash = id.startsWith('commit:') ? id.slice('commit:'.length) : '';
    const held = (of.files.log ?? []).some((file) => file.id === id) ? of.commit : hash;
    return held === '' ? -1 : of.commits.findIndex((one) => one.hash === held);
}

/**
 * The items kept drawn wherever the list is scrolled, so their files are read once: the open
 * commit's, and the one whose entry's range is open.
 */
export function keptItems(of: GraphRowsOf): number[] {
    const at = of.commits.findIndex((one) => one.hash === of.commit);
    const held = of.ranged === '' ? -1 : placeOf(of.places, of.ranged);
    return [at, held].filter((one, index, all) => one >= 0 && all.indexOf(one) === index);
}
