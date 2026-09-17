// Layer 3, shell. The page strip's contract: one named arrangement of config/layout.yml, its key,
// the words a page of it carries, and its tree, with the one rule for what a page is called.

import { tabsOf, type Page } from '$lib/state/layout';
import { t } from '$lib/state/text';

/** One named arrangement of config/layout.yml: its key, the words a page of it carries, and its tree. */
export type Arrangement = { name: string; label: string; node: unknown };

/**
 * What a page is called: its own name, or its position in the strip when it has none. Every place a
 * page is named reads this, so the strip, a pane menu, a shown page's header and a folded strip all
 * call one page the same thing.
 */
export function pageName(page: Page, index: number): string {
    return page.label === '' ? t('ui.page_default', index + 1) : page.label;
}

/** What the page with this id is called, by its place among the pages the strip holds. */
export function pageNameOf(pages: readonly Page[], id: string): string {
    const at = pages.findIndex((page) => page.id === id);
    return at < 0 ? '' : pageName(pages[at], at);
}

/**
 * Every instance a page holds, pane by pane in the tree's own order. Closing the page closes all of
 * them at once, so it is the list the close question is asked over.
 */
export function pageInstanceIds(page: Page): string[] {
    return tabsOf(page.workbench.root).map((instance) => instance.id);
}
