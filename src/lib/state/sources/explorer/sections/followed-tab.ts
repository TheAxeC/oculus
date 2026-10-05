// Layer 2, client state, pure. The file tab the Outline follows: the one the reader looked at last
// on the page. A press in the Files pane makes the Files tab the page's active tab, and a terminal
// or any tab showing no file does the same, so the active tab alone would empty the Outline at
// the moment the reader looks for it. The layout already holds the order the tabs were shown in
// (`Pane.recent`, saved with it), so the tab is read from the panes and nothing is remembered here.

/** A tab as the follow reads it: its id, its view and its saved state. The layout's tab fits. */
export type FollowTab = { id: string; view: string; state: unknown };

/** A pane as the follow reads it; the layout's pane fits. */
export type FollowPane<T extends FollowTab> = {
    tabs: readonly T[];
    active: string;
    recent?: readonly string[];
};

/**
 * The first tab `accepts` takes, in this order: the tab shown in the pane the reader used last (the
 * pane `focused` names by its shown tab), then the tab shown in each other pane, then the tabs each
 * pane showed before, the one shown last first, the pane the reader used last first. A tab that
 * `accepts` refuses (the Files tab itself, a terminal) is passed over, and a tab that is closed is
 * not in the panes, so a tab that is gone is not followed.
 */
export function followedTab<T extends FollowTab>(
    panes: readonly FollowPane<T>[],
    focused: string | null,
    accepts: (tab: T) => boolean
): T | null {
    const used = panes.findIndex((pane) => pane.tabs.some((tab) => tab.id === focused));
    const ordered = used < 0 ? panes : [panes[used], ...panes.filter((_, at) => at !== used)];
    const shown = ordered.map((pane) => pane.tabs.find((tab) => tab.id === pane.active));
    const before = ordered.flatMap((pane) =>
        (pane.recent ?? []).map((id) => pane.tabs.find((tab) => tab.id === id))
    );
    for (const tab of [...shown, ...before]) {
        if (tab !== undefined && accepts(tab)) return tab;
    }
    return null;
}
