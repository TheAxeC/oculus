// Layer 2, client state. What the Timeline section holds that no read holds: the file it follows
// and the commits past the first page.
//
// The followed file is the one selected in the tree, else the file of the file tab the page showed
// last. A press in the Files pane makes the Files tab the page's active tab, and a terminal or any
// tab showing no file does the same, so the active tab alone would lose the file at the moment the
// reader looks for its history. The layout already holds the order the tabs were shown in
// (`Pane.recent`, saved with it), so the file is read from the panes and nothing is remembered
// here, and a Files tab shown for the first time after a reload follows the file tab the pane
// showed last.
//
// The pages after the first are held under a key that names everything the first page was read
// under (the repository, the path, the repository's HEAD, how many times Refresh was pressed). An
// answer that arrives under another key was asked for a list that is no longer the one drawn and is
// dropped, so a page never lands in the rows of another file, of a HEAD that has moved or of a list
// Refresh has started again.

import type { GitFileCommit } from '../../../../data/model/index.ts';
import type { CommitPage } from '../../fs-history.ts';
import type { RowRef } from '../view/place.ts';

/**
 * A tab as the follow reads it: its id, its view and its saved state. The layout's tab fits.
 */
type FollowTab = { id: string; view: string; state: unknown };

/** A pane as the follow reads it; the layout's pane fits. */
type FollowPane = { tabs: readonly FollowTab[]; active: string; recent?: readonly string[] };

/**
 * The file the page's editor is on: the file of the first file tab in this order. The tab shown in
 * the pane the reader used last (the pane `focused` names by its shown tab), then the tab shown in
 * each other pane, then the tabs each pane showed before, the one shown last first, the pane the
 * reader used last first. A tab that shows no file (the Files tab itself, a terminal) is passed
 * over, and a tab that is closed is not in the panes, so a file whose tab is gone is not followed.
 */
export function followedFile(
    panes: readonly FollowPane[],
    focused: string | null,
    fileOf: (tab: FollowTab) => RowRef | null
): RowRef | null {
    const used = panes.findIndex((pane) => pane.tabs.some((tab) => tab.id === focused));
    const ordered = used < 0 ? panes : [panes[used], ...panes.filter((_, at) => at !== used)];
    const shown = ordered.map((pane) => pane.tabs.find((tab) => tab.id === pane.active));
    const before = ordered.flatMap((pane) =>
        (pane.recent ?? []).map((id) => pane.tabs.find((tab) => tab.id === id))
    );
    for (const tab of [...shown, ...before]) {
        const file = tab === undefined ? null : fileOf(tab);
        if (file !== null) return file;
    }
    return null;
}

/** The pages read after the first, as far as they are read. */
export type MorePages = {
    commits: GitFileCommit[];
    /** Whether older commits remain after the last page read, once a page after the first was. */
    more: boolean;
    loading: boolean;
    failed: boolean;
    /** Whether a page after the first was asked for under this key. */
    started: boolean;
};

/** Pages not asked for, built per call so no caller holds an array another one holds. */
function noPages(): MorePages {
    return { commits: [], more: false, loading: false, failed: false, started: false };
}

/**
 * The pages after the first of the list a key names. `next` is given the read of one page, so a
 * press that finds a page being read or failed asks for nothing.
 */
export function createPages() {
    let held: MorePages & { key: string } = $state({ ...noPages(), key: '' });
    let pressed = $state(0);

    /** Read the page after the last commit of the list `key` names, unless one is out or failed. */
    async function next(key: string, read: () => Promise<CommitPage>): Promise<void> {
        const now = held.key === key ? held : null;
        if (now !== null && (now.loading || now.failed)) return;
        held = {
            ...(now ?? noPages()),
            key,
            more: true,
            started: true,
            loading: true,
            failed: false
        };
        const page = await read();
        if (held.key !== key) return;
        held = page.ok
            ? {
                  key,
                  commits: [...held.commits, ...page.commits],
                  more: page.more,
                  loading: false,
                  failed: false,
                  started: true
              }
            : { ...held, more: false, loading: false, failed: true };
    }

    return {
        /** How many times Refresh was pressed, which every key carries. */
        pressed: () => pressed,
        /** Start every list again from its first page. */
        refresh(): void {
            pressed += 1;
        },
        /** The pages read under a key, and none for a key another list holds. */
        of(key: string): MorePages {
            return held.key === key ? held : noPages();
        },
        next
    };
}
