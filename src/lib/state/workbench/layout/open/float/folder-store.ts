// Layer 2, client state. The operations that open, remake and keep folder pages, built beside the
// layout factory and handed its access object. A folder page is a page with a `folder`
// (folder-pages.ts holds the pure half); the state each of its tabs holds in the ui store goes with
// it, since the Files root, the Search folder and the other limits of a tab live there: `states`,
// by instance id.
//
// A folder page opened for a folder that has one open is shown. One opened for a folder with a
// layout kept is made from that layout, its tabs' ui states written back under the same ids. Any
// other is made from the arrangement the caller builds. Closing a folder page keeps its layout and
// the states its tabs held, except the source tabs, whose draft is the file's text and is read from
// the disk again, and the tabs holding unsaved text. A Terminal tab is kept without the terminals
// its close ended.

import { emptyTab, TERMINAL_VIEW } from '../../../../sessions/terminal/terminal-tabs.ts';
import { tabsOf } from '../../instance.ts';
import type { LayoutAccess } from '../../access.ts';
import {
    emptyPane,
    newPage,
    type FolderItem,
    type FolderRef,
    type Instance,
    type KeptWorkbench,
    type Page,
    type Pages,
    type Workbench
} from '../../model.ts';
import { settlePageLeaves } from '../../nested.ts';
import { restate } from '../../tree.ts';
import { folderPageOf, keptFor, pageFromKept, withKept, withoutKept } from './folder-pages.ts';
import { rebuiltPage, withPage, type Builds } from './pages.ts';

/** The view of a source tab, whose draft holds the text of its file. */
const SOURCE_VIEW = 'source';

/** An arrangement for a folder page with the ui state each of its tabs starts with, by tab id. */
export type FolderLayout = { workbench: Workbench; states: Record<string, unknown> };

/** What opening a folder page is asked for. */
type FolderSpec = {
    folder: FolderRef;
    /** The page's words when it is made. */
    label: string;
    /** The view that opens first in the documents pane, which the opener opens on a new page. */
    item?: FolderItem;
    /** The arrangement of a page made from nothing, asked only when nothing is open or kept. */
    make: () => FolderLayout | null;
};

/**
 * How a folder page came to be on screen: `open` when the folder's page was open and is shown,
 * `kept` when it was made from its kept layout, `made` when it was made from the arrangement.
 */
type FolderOpened = { id: string; how: 'open' | 'kept' | 'made' };

/** The folder page operations of a layout store. */
export type FolderOps = {
    /**
     * Show the page of a folder: the open one, else one made from the layout kept for the folder,
     * else one made from the arrangement `make` builds, with the unique views it names taken in
     * from where they are held. Null when nothing could be made.
     */
    openFolderPage: (spec: FolderSpec) => FolderOpened | null;
    /**
     * Make a folder page again from an arrangement: its tabs fresh, its id, words, folder and item
     * kept, the layout kept for its folder dropped. Answers whether it was remade; an id naming no
     * folder page changes nothing.
     */
    resetFolderPage: (id: string, layout: FolderLayout) => boolean;
    /** The page that belongs to a folder, or null. */
    folderPage: (folder: FolderRef) => Page | null;
    /** The pages with the layout of a folder page that is about to close kept for its folder. */
    keepClosed: (held: Pages, closing: Page) => Pages;
};

/** What the folder operations need of the factory beside the access object. */
export type FolderHooks = {
    /** Forget which pane the reader last touched. */
    forgetTouched: () => void;
    /** Forget what closed tabs held. */
    forgetTabs: (tabs: readonly Instance[]) => void;
    /** Forget what a page that is gone held. */
    forgetPage: (id: string) => void;
};

export function createFolderOps(
    access: LayoutAccess,
    builds: Builds,
    hooks: FolderHooks
): FolderOps {
    /** Write the states of the tabs a tree holds into the ui store, under the tabs' ids. */
    function write(root: Workbench['root'], states: Record<string, unknown>): void {
        for (const tab of tabsOf(root)) {
            if (Object.hasOwn(states, tab.id)) access.ui.setInstanceState(tab.id, states[tab.id]);
        }
    }

    function openFolderPage(spec: FolderSpec): FolderOpened | null {
        const held = access.held();
        const open = folderPageOf(held, spec.folder);
        hooks.forgetTouched();
        if (open !== null) {
            if (held.current !== open.id) access.save({ ...held, current: open.id });
            return { id: open.id, how: 'open' };
        }
        const item = spec.item === undefined ? {} : { item: spec.item };
        const page: Page = {
            ...newPage(spec.label, { root: emptyPane() }),
            folder: spec.folder,
            ...item
        };
        const entry = keptFor(held, spec.folder);
        const restored = entry === null ? null : pageFromKept(held, entry, page, builds);
        if (entry !== null && restored !== null) {
            write(restored.workbench.root, entry.states);
            const next = withoutKept(held, spec.folder);
            access.save(
                settlePageLeaves({
                    ...next,
                    pages: [...next.pages, restored],
                    current: restored.id
                })
            );
            return { id: restored.id, how: 'kept' };
        }
        const layout = spec.make();
        if (layout === null) return null;
        const made: Page = { ...page, workbench: layout.workbench };
        const next = withoutKept(withPage(held, made, builds), spec.folder);
        const placed = next.pages.find((one) => one.id === made.id);
        if (placed === undefined) return null;
        write(placed.workbench.root, layout.states);
        access.save(next);
        return { id: made.id, how: 'made' };
    }

    function resetFolderPage(id: string, layout: FolderLayout): boolean {
        const held = access.held();
        const found = held.pages.find((one) => one.id === id);
        if (found?.folder === undefined) return false;
        hooks.forgetPage(id);
        hooks.forgetTouched();
        const next = withoutKept(
            rebuiltPage(held, id, found.label, layout.workbench, builds),
            found.folder
        );
        const placed = next.pages.find((one) => one.id === id);
        if (placed === undefined) return false;
        hooks.forgetTabs(tabsOf(found.workbench.root));
        write(placed.workbench.root, layout.states);
        access.save(next);
        return true;
    }

    /** Whether a tab's ui state is kept with the layout: not a file's draft, not unsaved text. */
    function keepsState(tab: Instance): boolean {
        return tab.view !== SOURCE_VIEW && !access.ui.unsaved(tab.id);
    }

    function keepClosed(held: Pages, closing: Page): Pages {
        if (closing.folder === undefined) return held;
        const tabs = tabsOf(closing.workbench.root);
        const states: Record<string, unknown> = {};
        for (const tab of tabs) {
            const state = access.ui.instanceState(tab.id);
            if (state !== undefined && keepsState(tab)) states[tab.id] = state;
        }
        let root = closing.workbench.root;
        for (const tab of tabs) {
            if (tab.view === TERMINAL_VIEW) root = restate(root, tab.id, emptyTab(tab.id));
        }
        const entry: KeptWorkbench = {
            folder: closing.folder,
            workbench: { ...closing.workbench, root },
            states
        };
        return withKept(held, entry);
    }

    return {
        openFolderPage,
        resetFolderPage,
        folderPage: (folder) => folderPageOf(access.held(), folder),
        keepClosed
    };
}
