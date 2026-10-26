// Layer 1, data, pure. The clusters of the Focus board as `focus_clusters` of the merged config
// lists them (config/catalogs/vocab.yml): the rows that read, each with its place in the list, and
// of those the rows the board draws, a key a row before it holds read from that row alone. The
// board draws its clusters from them through state/boards/focus.ts `clusters`, and the config check
// in data/sources/config/sections/vocab.ts counts a lane's cluster as known only when the board
// draws it, so the two read the list by one rule and a lane naming a cluster that is not drawn gets
// its finding.

import { z } from 'zod';
import { wordShape } from '../shapes.ts';

/** The list of the Focus board's clusters. */
export const FOCUS_CLUSTERS = 'focus_clusters';

/**
 * One row of `focus_clusters`: a map with a key and a `layout`, a `sort` that is `title` when the
 * row names one; a row of another `layout` or `sort`, or with no key, does not read, and the config
 * check reports it (data/shapes/catalog-files/vocab.ts).
 */
const clusterRowShape = z.object({
    key: wordShape.refine((key) => key !== ''),
    label: wordShape,
    glyph: wordShape,
    muted: z.boolean().catch(false),
    layout: z.enum(['columns', 'full_width']),
    sort: z.enum(['title']).optional(),
    awaiting: z.boolean().catch(false)
});

/** One row of `focus_clusters` that reads, as written. */
export type ClusterRow = z.infer<typeof clusterRowShape>;

/** The rows of `focus_clusters` that read, each with its index in the list, in the list's order. */
export function readClusterRows(value: unknown): { at: number; row: ClusterRow }[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry: unknown, at) => {
        const parsed = clusterRowShape.safeParse(entry);
        return parsed.success ? [{ at, row: parsed.data }] : [];
    });
}

/**
 * The rows of `focus_clusters` the board draws, in the list's order: the rows that read, a key a
 * row before it holds read from that row alone, as the config check's finding on the later row
 * says.
 */
export function drawnClusterRows(value: unknown): ClusterRow[] {
    const read = readClusterRows(value).map(({ row }) => row);
    return read.filter((one, at) => read.findIndex((row) => row.key === one.key) === at);
}
