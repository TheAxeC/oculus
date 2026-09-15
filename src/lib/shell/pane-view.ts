// Layer 3, shell. The pane menu's page items, apart from the component so the numbering they draw
// and the pages they offer can be read by a test.

import type { MenuItem as Item } from '$lib/ui/menu-items';
import { fold, showable, type Layout, type Page } from '$lib/state/layout';

/** What tells a move-to-page item from the menu's fixed items. */
export const PAGE = 'page:';

/** What tells a show-a-page-here item from the menu's fixed items. */
export const EMBED = 'embed:';

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

/**
 * Every page that may be shown beside a pane of `host` while `screen` is the page the strip is on,
 * as the item that shows it there: not the page the pane is in, not a page that would then draw
 * itself, and not one already drawn somewhere on the screen. A page with no name of its own is
 * numbered by its place in the strip, as the move items number it.
 */
export function embedPageItems(
    pages: readonly Page[],
    screen: string,
    host: string,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    return pages
        .map((page, at) => ({
            id: `${EMBED}${page.id}`,
            page: page.id,
            label: t('ui.embed_page', page.label === '' ? t('ui.page_default', at + 1) : page.label)
        }))
        .filter((item) => showable(pages, screen, host, item.page))
        .map(({ id, label }) => ({ id, label }));
}

/** Whether the pane at `path` can be collapsed: the root cannot, nor the last open child of a split. */
export function foldable(layout: Layout, path: number[]): boolean {
    return path.length > 0 && fold(layout, path) !== layout;
}
