// Layer 3, view registration of Collection.svelte, its part for the rail. What a collection gives
// the button of the rail page its tab is on: Applications its active count in green, and Funding,
// Education, Joint Work and Tasks each their `nav_live` count in the tone their tab has. Every
// other collection gives the rail nothing, whatever its tab draws.

import type { Registration } from '$lib/state/workbench/navigation/registry';

/** The collections whose `nav_live` count is given to their rail button. */
const RAIL_COLLECTIONS: readonly string[] = ['funding', 'education', 'joint-work', 'tasks'];

/** The `railPart` hook of one collection's registration, absent for one that gives nothing. */
export function collectionRailPart(id: string): Pick<Registration, 'railPart'> {
    if (id === 'applications') {
        return {
            railPart: (client) => ({ count: client.railBadges.applicationsCount(), tone: 'green' })
        };
    }
    if (!RAIL_COLLECTIONS.includes(id)) return {};
    return {
        railPart: (client) => ({
            count: client.railBadges.collectionCount(id),
            tone: client.railBadges.collectionBadgeTone(id)
        })
    };
}
