// Layer 3, view registration of Collection.svelte, its count. What a collection counts: one flagged
// `open_badge` its open entries in green, by its own rule, and every other collection the entries
// whose status is one of the `match` of its `counts` row in config/defaults/layout.yml, in the tone
// its tab has. Whether its tabs draw the count and whether the rail sums it is that row's `tab` and
// `rail`.

import type { Registration } from '$lib/state/workbench/navigation/registry';

/** The `countPart` hook of one collection's registration, `open` for one flagged `open_badge`. */
export function collectionCountPart(id: string, open: boolean): Pick<Registration, 'countPart'> {
    if (open) {
        return {
            countPart: (client) => ({
                count: client.railBadges.openCount(id),
                tone: 'green'
            })
        };
    }
    return {
        countPart: (client) => ({
            count: client.railBadges.collectionCount(id),
            tone: client.railBadges.collectionBadgeTone(id)
        })
    };
}
