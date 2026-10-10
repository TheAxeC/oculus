// Layer 2, client state. The hub's documents a saved rail page is given when it is restored. A page
// made from the config has its documents from navigation/arrangement.ts (`withDocs`); a saved page
// that lacks a listed document gains that document's tab here, once, and the page records the paths
// it has been given (`Page.docs`), so a tab the reader closes stays closed.

import { docState, type DocEntry } from '../../navigation/catalogue.ts';
import { DOC_VIEW, instanceText, newInstance, panes, tabsOf } from '../instance.ts';
import type { Instance, Page, Pages } from '../model.ts';
import { activate, insertInstance } from '../tree.ts';

/** The documents a rail button's page lists: its arrangement key and the `docs:` entries of it. */
export type DocSource = { page: string; docs: readonly DocEntry[] };

/** The paths of the documents a tab in the page already shows. */
function shownPaths(page: Page): Set<string> {
    return new Set(
        tabsOf(page.workbench.root)
            .filter((tab) => tab.view === DOC_VIEW)
            .map((tab) => instanceText(tab.state, 'id'))
    );
}

/**
 * The page with the documents of `listed` it has not been given added after the first tab of its
 * first leaf pane, in the list's order, and recorded as given. A document the page already shows
 * adds no second tab. The active tab stays active. The page itself when it has been given every
 * document.
 */
function documented(page: Page, listed: readonly DocEntry[]): Page {
    const given = new Set(page.docs ?? []);
    const fresh = listed.filter((entry) => !given.has(entry.path));
    if (fresh.length === 0) return page;
    const shown = shownPaths(page);
    const tabs: Instance[] = [];
    for (const entry of fresh) {
        if (shown.has(entry.path)) continue;
        shown.add(entry.path);
        tabs.push(newInstance(DOC_VIEW, docState(entry)));
    }
    let root = page.workbench.root;
    const first = panes(root).at(0);
    if (first !== undefined) {
        tabs.forEach((tab, at) => {
            root = insertInstance(root, first.path, 1 + at, tab);
        });
        root = activate(root, first.pane.active);
    }
    const docs = [...new Set([...given, ...fresh.map((entry) => entry.path)])];
    return { ...page, workbench: { ...page.workbench, root }, docs };
}

/**
 * The pages with every rail page given the documents its source lists that it has not been given. A
 * page no source names, and a page with nothing new, stay as they are; the pages themselves when
 * none changed.
 */
export function giveDocuments(held: Pages, sources: readonly DocSource[]): Pages {
    const pages = held.pages.map((page) => {
        const source = sources.find((one) => one.page === page.rail);
        return source === undefined ? page : documented(page, source.docs);
    });
    return pages.some((page, at) => page !== held.pages[at]) ? { ...held, pages } : held;
}
