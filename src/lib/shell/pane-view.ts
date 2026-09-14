// Layer 3, shell. The pane menu's move-to-page items, apart from the component so the numbering
// they draw can be read by a test.

import type { MenuItem as Item } from '$lib/ui/menu-items';
import type { Page } from '$lib/state/layout';

/** What tells a move-to-page item from the menu's fixed items. */
export const PAGE = 'page:';

/**
 * Every page but the one on screen, as the item that moves the active tab onto it. A page with
 * no name of its own is numbered by its place in the whole strip, which is the number the page
 * strip draws for it, so the item names the page the reader sees rather than its place among
 * the others.
 */
export function pageMoveItems(
    pages: readonly Page[],
    current: string,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    return pages
        .map((page, at) => ({
            id: `${PAGE}${page.id}`,
            page: page.id,
            label: t(
                'ui.move_to_page',
                page.label === '' ? t('ui.page_default', at + 1) : page.label
            )
        }))
        .filter((item) => item.page !== current)
        .map(({ id, label }) => ({ id, label }));
}
