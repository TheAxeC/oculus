// Layer 3, view registration of Collection.svelte, its count. What a collection counts:
// Applications its open applications in green, by its own rule, and every other collection the
// entries whose status is one of the `match` of its `counts` row in config/layout.yml, in the tone
// its tab has. Whether its tabs draw the count and whether the rail sums it is that row's `tab`
// and `rail`.

import type { Registration } from '$lib/state/workbench/navigation/registry';

/** The `countPart` hook of one collection's registration. */
export function collectionCountPart(id: string): Pick<Registration, 'countPart'> {
    if (id === 'applications') {
        return {
            countPart: (client) => ({ count: client.railBadges.applicationsCount(), tone: 'green' })
        };
    }
    return {
        countPart: (client) => ({
            count: client.railBadges.collectionCount(id),
            tone: client.railBadges.collectionBadgeTone(id)
        })
    };
}
