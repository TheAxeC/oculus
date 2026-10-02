// Layer 3, view partial of tree/Tree.svelte. The drawn rows by the key the keyboard knows them by,
// and the label the type-ahead reads for each: a compacted folder chain is one row standing at its
// last folder, so its label is that folder's name.

import { rowKey, type TreeRow } from '$lib/state/sources/fs';

export type RowIndex = {
    /** The drawn row a key names. */
    rowOf: (id: string) => TreeRow | undefined;
    /** Where in the drawn rows a key stands, or -1. */
    indexOf: (id: string) => number;
    /** The text the type-ahead matches a row's key against. */
    labelOf: (id: string) => string | undefined;
};

/** The index over the rows now drawn. */
export function rowIndexOf(drawn: readonly TreeRow[]): RowIndex {
    const indexes = new Map(drawn.map((row, at) => [rowKey(row), at]));
    const rowOf = (id: string): TreeRow | undefined => {
        const at = indexes.get(id);
        return at === undefined ? undefined : drawn[at];
    };
    return { rowOf, indexOf: (id) => indexes.get(id) ?? -1, labelOf: (id) => rowOf(id)?.name };
}
