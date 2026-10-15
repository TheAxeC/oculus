// Layer 2, client state. The pure operations over folder pages: the page that belongs to a folder,
// the layouts kept of closed ones, and a page made again from a kept layout. Each takes the pages
// and answers new pages, or the pages it was given when it names nothing to change.
//
// A folder page is a page with a `folder`. At most one page belongs to a folder. When it is closed
// its arrangement is kept by the folder (`KeptWorkbench`), at most `KEPT_MAX` of them, the one
// closed longest ago dropped first. A kept layout is not a holder of a unique view: the page made
// from it leaves out each unique view another page or a float holds, as a page made from the
// default does (`withoutHeld`), and makes no copy of it. A kept layout whose tab ids a page or a
// float holds is given ids of its own (`withFreshIds`) and then makes its page, so a kept layout
// leaves only by a reader's Forget, by a reset of its folder or as the oldest of twenty.

import { emptyTab, TERMINAL_VIEW } from '../../../../sessions/terminal/terminal-tabs.ts';
import { tabsOf } from '../../instance.ts';
import {
    KEPT_MAX,
    hostsOf,
    sameFolder,
    type FolderRef,
    type KeptWorkbench,
    type Page,
    type Pages
} from '../../model.ts';
import { renameInstance, restate } from '../../tree.ts';
import { settleFocus } from '../../workbench.ts';
import { withoutHeld, type Builds } from './pages.ts';

/** The page that belongs to a folder, or null when none is open. */
export function folderPageOf(held: Pages, folder: FolderRef): Page | null {
    return (
        held.pages.find((page) => page.folder !== undefined && sameFolder(page.folder, folder)) ??
        null
    );
}

/** The layout kept for a folder, or null when none is. */
export function keptFor(held: Pages, folder: FolderRef): KeptWorkbench | null {
    return held.kept?.find((one) => sameFolder(one.folder, folder)) ?? null;
}

/**
 * The pages with a layout kept: the newest, replacing any kept for the same folder, and only the
 * last `KEPT_MAX` held.
 */
export function withKept(held: Pages, entry: KeptWorkbench): Pages {
    const others = (held.kept ?? []).filter((one) => !sameFolder(one.folder, entry.folder));
    return { ...held, kept: [...others, entry].slice(-KEPT_MAX) };
}

/** The pages with the layout kept for a folder dropped; the pages given when none is kept. */
export function withoutKept(held: Pages, folder: FolderRef): Pages {
    if (keptFor(held, folder) === null) return held;
    const kept = (held.kept ?? []).filter((one) => !sameFolder(one.folder, folder));
    const { kept: _, ...rest } = held;
    return kept.length === 0 ? rest : { ...rest, kept };
}

/**
 * The page a kept layout makes: `page` (its id, words, folder and item) around the kept
 * arrangement, with each unique view another page or a float holds left out of it. Null when a tab
 * of the kept arrangement has an id a page or a float already holds, which no page may share.
 */
export function pageFromKept(
    held: Pages,
    entry: KeptWorkbench,
    page: Page,
    builds: Builds
): Page | null {
    const taken = new Set(
        hostsOf(held).flatMap((host) => tabsOf(host.workbench.root).map((tab) => tab.id))
    );
    if (tabsOf(entry.workbench.root).some((tab) => taken.has(tab.id))) return null;
    const left = withoutHeld(held, { ...page, workbench: { root: entry.workbench.root } }, builds);
    return { ...page, workbench: settleFocus({ ...entry.workbench, root: left.workbench.root }) };
}

/**
 * The kept layout with every tab given an id nobody holds, and the states kept for the tabs filed
 * under the new ids. A Terminal tab carries its own id in its state, which is made again for the
 * new id as the close made it for the old one.
 */
export function withFreshIds(entry: KeptWorkbench, fresh: () => string): KeptWorkbench {
    let root = entry.workbench.root;
    const states: Record<string, unknown> = {};
    for (const tab of tabsOf(entry.workbench.root)) {
        const id = fresh();
        root = renameInstance(root, tab.id, id);
        if (tab.view === TERMINAL_VIEW) root = restate(root, id, emptyTab(id));
        if (Object.hasOwn(entry.states, tab.id)) states[id] = entry.states[tab.id];
    }
    return { ...entry, workbench: { ...entry.workbench, root }, states };
}
