// Layer 3, view helper. The menu of a slide: what a right-click on the slide in the Present pane or
// on its tile in the overview offers, in the groups of VS Code's menus, and the same items as the
// commands the pane offers the palette for the slide on screen. The acts a slide offers are
// state/life/present.ts's; this builds their words.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import { slideActs, type SlideAct } from '$lib/state/life/present';
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
    return id === 'edit' || id === 'new' || id === 'duplicate' || id === 'delete';
}
