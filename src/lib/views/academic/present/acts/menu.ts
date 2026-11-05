// Layer 3, view helper. The menu of a slide: what a right-click on the slide in the Present pane or
// on its tile in the overview offers, in the groups of VS Code's menus, and the same items as the
// commands the pane offers the palette for the slide on screen. The acts a slide offers are
// state/life/present.ts's; this builds their words.
//
// A tile of the overview and a group's header also offer the arranging acts: Move Earlier and Move
// Later, and Remove from Group for a deck its group names. Their ids are their own, apart from the
// slide acts', so the overview hands a pick of one to its arranging (arrange/arrange.svelte.ts)
// and a pick of a slide act to the pane's acts.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import { SLIDE_ACTS, slideActs, type SlideAct } from '$lib/state/life/present';
import { t } from '$lib/state/shared/words/text';
import type { Deck, DeckSlide } from '$lib/state/life/present';

/** The words of one act, from the catalog's literal keys. */
export function actLabel(act: SlideAct): string {
    switch (act) {
        case 'edit':
            return t('present.menu_edit');
        case 'new':
            return t('present.menu_new');
        case 'duplicate':
            return t('present.menu_duplicate');
        default:
            return t('present.menu_delete');
    }
}

/** The menu of one slide: Edit, then New and Duplicate, then Delete, those the slide offers. */
export function slideMenu(deck: Deck | null, row: DeckSlide | null): MenuItem[] {
    const offered = slideActs(deck, row);
    const item = (act: SlideAct): MenuItem[] =>
        offered.includes(act) ? [{ id: act, label: actLabel(act) }] : [];
    return grouped([item('edit'), [...item('new'), ...item('duplicate')], item('delete')]);
}

/** Whether an id a menu picked is one of the acts. */
export function isAct(id: string): id is SlideAct {
    return SLIDE_ACTS.some((act) => act === id);
}

/** The arranging acts a tile or a header offers, by their menu ids. */
const ARRANGE_ACTS = ['arrange-earlier', 'arrange-later', 'arrange-remove'] as const;

export type ArrangeAct = (typeof ARRANGE_ACTS)[number];

/** Whether an id a menu picked is one of the arranging acts. */
export function isArrange(id: string): id is ArrangeAct {
    return ARRANGE_ACTS.some((act) => act === id);
}

/** Where a tile or a header stands in the list it moves in, and what its menu offers. */
type ArrangePlace = {
    /** Whether it is first or last, where Move Earlier or Move Later has no place to go. */
    first: boolean;
    last: boolean;
    /** Whether it is a deck its group's `slides:` names, which Remove from Group takes out. */
    removable: boolean;
    /** Whether a write is in flight, which holds every arranging act. */
    busy: boolean;
};

/** The arranging items: Move Earlier and Move Later, then Remove from Group where it applies. */
export function arrangeMenu(place: ArrangePlace): MenuItem[] {
    return grouped([
        [
            {
                id: 'arrange-earlier',
                label: t('present.menu_earlier'),
                disabled: place.busy || place.first
            },
            {
                id: 'arrange-later',
                label: t('present.menu_later'),
                disabled: place.busy || place.last
            }
        ],
        place.removable
            ? [{ id: 'arrange-remove', label: t('present.menu_remove'), disabled: place.busy }]
            : []
    ]);
}

/** A tile's whole menu: the slide's acts, then the arranging ones, each run after a rule. */
export function tileMenu(
    deck: Deck,
    row: DeckSlide | null,
    place: ArrangePlace | null
): MenuItem[] {
    const acts = row === null ? [] : slideMenu(deck, row);
    return place === null ? acts : grouped([acts, arrangeMenu(place)]);
}
