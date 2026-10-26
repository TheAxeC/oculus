// Layer 3, view registration of Collection.svelte. The generic collection component is registered
// once per collection view the page is given, each at the place its `collections:` entry names: its
// `group:` (a rail page or a `nav_groups` key) and its `order:` there. An entry with no group is
// placed in the group the page is given with the views, the page of the merged rail's entry that
// carries `unplaced_collections` (data/sources/config/rail.ts `unplacedGroup`), one place after
// another past the highest order of that group's placed collection views, in the order the views
// are given; with no such entry it is in no group, and the catalogue lists it with the views no
// group holds. It is named by the word its `label:` names, else by its file's `title:`, else by
// its key, and drawn with the glyph its `glyph:` names, else `views.collection_glyph`. What a
// collection counts is rail-part.ts's, and where the count is drawn is its row of `counts`.

import type { ListedCollection } from '$lib/state/boards/collection';
import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
import { collectionCountPart } from './rail-part';

/** The glyph word of a collection view whose entry names none. */
const COLLECTION_GLYPH = 'views.collection_glyph';

/**
 * The name a collection view is drawn by: its label word, else its file's title or its key as
 * `words`, which is drawn as it is and leaves the empty label unread.
 */
function named(entry: ListedCollection): Pick<ViewRegistration, 'label' | 'words'> {
    if (entry.label !== undefined) return { label: entry.label };
    return { label: '', words: entry.title ?? entry.key };
}

/**
 * The first order of the views no entry places: one past the highest order of the views placed in
 * `group`, an entry with a group and no order counting as 0, and 0 when the group holds none.
 */
function firstUnplaced(views: readonly ListedCollection[], group: string | null): number {
    const orders = views.filter((entry) => group !== null && entry.group === group);
    return orders.reduce((most, entry) => Math.max(most, (entry.order ?? 0) + 1), 0);
}

/**
 * The registrations of the collection views, one per entry given, in the order given, those whose
 * entry names no group placed in `unplaced` (the empty group, which no group of the catalogue is,
 * when it is null).
 */
export function registration(
    views: ListedCollection[],
    unplaced: string | null
): ViewRegistration[] {
    let next = firstUnplaced(views, unplaced);
    return views.map((entry) => {
        const id = entry.key;
        const open = entry.open_badge === true;
        const placed = entry.group !== undefined;
        return {
            id,
            ...named(entry),
            glyph: entry.glyph ?? COLLECTION_GLYPH,
            group: entry.group ?? unplaced ?? '',
            order: placed ? (entry.order ?? 0) : next++,
            badge: open
                ? (client) => client.railBadges.openBadge(id)
                : (client) => client.railBadges.collectionBadge(id),
            badgeTone: open ? () => 'green' : (client) => client.railBadges.collectionBadgeTone(id),
            badgeTitle: open ? undefined : (client) => client.railBadges.collectionBadgeTitle(id),
            ...collectionCountPart(id, open)
        };
    });
}
