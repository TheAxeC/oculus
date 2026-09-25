// Layer 2, client state. What a page is called, which tabs it holds, and what a close asks before
// it happens. The shell's pane menus and page leaves and the Pages view on the Views and Settings
// page all name a page and close one, so the rules live here, where both of them may read them.
//
// Whether an instance holds unsaved text is not decided here. The caller passes the ui store's
// answer for an instance id, so a view that keeps unsaved text registers its rule once and none of
// the closes is edited for it.

import { tabsOf, type Page } from '../layout/index.ts';
import { t } from '../../words/text.ts';
import { parseArrangement } from './arrangement.ts';

/**
 * What a page is called: its own name, or its position in the page list when it has none. Every
 * place a page is named reads this, so the Pages view, a pane menu, a shown page's header and a
 * folded strip all call one page the same thing.
 */
export function pageName(page: Page, index: number): string {
    return page.label === '' ? t('ui.page_default', index + 1) : page.label;
}

/** What the page with this id is called, by its place in the page list. */
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

/** What a close asks: nothing, the unsaved-text question, or the caller's own how-much question. */
export type CloseQuestion = 'none' | 'dirty' | 'many';

/**
 * The question closing these instances asks. One instance with nothing unsaved in it goes at once,
 * since a close control pressed over a saved tab is the reader saying exactly what they meant; one
 * holding unsaved text asks about the text; more than one asks the caller's own question, which
 * already says how much is about to go whether or not any of it is unsaved. A tab's own close, a
 * pane's and a page's all ask it, so the same press over the same tabs asks the same question
 * wherever it is made.
 */
export function closeQuestion(ids: string[], unsaved: (id: string) => boolean): CloseQuestion {
    if (ids.length > 1) return 'many';
    return ids.some((id) => unsaved(id)) ? 'dirty' : 'none';
}

/**
 * The first tab holding text no save has taken, in page order and then tree order, with the page
 * it is on; null when no tab holds any. The status bar's unsaved count opens this one.
 */
export function firstUnsaved(
    pages: readonly Page[],
    unsaved: (id: string) => boolean
): { page: string; instance: string } | null {
    for (const page of pages) {
        const found = pageInstanceIds(page).find(unsaved);
        if (found !== undefined) return { page: page.id, instance: found };
    }
    return null;
}

/** How many tabs across every page hold text no save has taken. */
export function unsavedCount(pages: readonly Page[], unsaved: (id: string) => boolean): number {
    return pages.reduce((sum, page) => sum + pageInstanceIds(page).filter(unsaved).length, 0);
}

/**
 * The views a rail button's page holds, in the order of that page's tabs, each once: the page that
 * carries the button's key when it has been made, and the arrangement it will be made from when it
 * has not, so a button draws the badges of its page before its first press. An arrangement that
 * does not parse holds none.
 */
export function railPageViews(pages: readonly Page[], key: string, node: unknown): string[] {
    const made = pages.find((page) => page.rail === key);
    const root = made?.workbench.root ?? parseArrangement(node)?.root;
    if (root === undefined) return [];
    return [...new Set(tabsOf(root).map((instance) => instance.view))];
}

/** Whether any tab of a page holds text no save has taken. */
export function pageUnsaved(page: Page, unsaved: (id: string) => boolean): boolean {
    return pageInstanceIds(page).some(unsaved);
}
