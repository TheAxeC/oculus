// Layer 3, shell. The pane menu's page items, apart from the component so the numbering they draw,
// the pages they offer and the two choices they are gathered under can be read by a test.

import type { MenuItem as Item } from '$lib/ui/menu/menu-items';
import { fold, showable, type Layout, type Page } from '$lib/state/workbench/layout';

/** What tells a move-to-page item from the menu's fixed items. */
export const PAGE = 'page:';

/** What tells a show-a-page-here item from the menu's fixed items. */
export const EMBED = 'embed:';

/**
 * Every page but the one on screen, as the item that moves the active tab onto it. A page with
 * no name of its own is numbered by its place in the whole page list, which is the number the
 * Pages view draws for it, so the item names the page the reader sees rather than its place among
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
 * Every page that may be shown beside a pane of `host` while `screen` is the page on screen,
 * as the item that shows it there: not the page the pane is in, not a page that would then draw
 * itself, and not one already drawn somewhere on the screen. A page with no name of its own is
 * numbered by its place in the page list, as the move items number it.
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

/** The choice that holds the move-to-page items. */
export const MOVE_LIST = 'move-to-page';

/** The choice that holds the show-a-page-here items. */
export const EMBED_LIST = 'show-a-page';

/**
 * The pane menu's page choices: one that lists the pages the active tab can move to and one that
 * lists the pages that can be shown beside the pane, each present only when it has a page to offer.
 * The menu shows a choice's pages in place of its own list, so the menu is its fixed items and at
 * most these two however many pages the layout holds. `host` is the page the pane is in and
 * `screen` the page on screen.
 */
export function pageListItems(
    pages: readonly Page[],
    screen: string,
    host: string,
    t: (key: string, ...args: (string | number)[]) => string
): Item[] {
    const moves = pageMoveItems(pages, host, t);
    const shows = embedPageItems(pages, screen, host, t);
    return [
        ...(moves.length > 0
            ? [{ id: MOVE_LIST, label: t('ui.move_to_page_list'), items: moves }]
            : []),
        ...(shows.length > 0
            ? [{ id: EMBED_LIST, label: t('ui.embed_page_list'), items: shows }]
            : [])
    ];
}

/**
 * Whether the pane at `path` can be collapsed: the root cannot, nor the last open child of a split.
 */
export function foldable(layout: Layout, path: number[]): boolean {
    return path.length > 0 && fold(layout, path) !== layout;
}
