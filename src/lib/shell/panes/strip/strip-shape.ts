// Layer 3, shell. What a pane's top row draws under the two settings of config/appearance.yml,
// apart from the component so it can be read without a DOM: which tabs, whether the row is the tab
// row, a title row that holds the actions alone, or no row, whether the Split Right button and the
// pane menu opener are drawn, and whether the lock mark is.

import type { EditorActions, TabBar } from '$lib/state/shared/words/appearance';
import type { Tab } from '$lib/ui/tabs/tab-strip';

/** What the row draws. */
export type StripShape = {
    /** The tabs drawn: all of them, the active one alone, or none. */
    tabs: Tab[];
    /** `tabs` is the tab strip, `title` a row with no tab, `none` no row. */
    row: 'tabs' | 'title' | 'none';
    /** Whether the Split Right button and the `...` opener are drawn. */
    actions: boolean;
    /** Whether the lock mark is drawn: on a locked pane, whatever the two settings say. */
    lock: boolean;
};

/**
 * The row of a pane under `show_tabs` (`bar`) and `editor_actions` (`place`). `none` keeps a title
 * row for the actions, and with the actions hidden as well it keeps the row only while the pane is
 * locked, since the mark that unlocks it is drawn in that row, or while the active tab hands up
 * actions of its own (`own`), which the pane's setting for its own actions does not hide.
 */
export function stripShape(
    bar: TabBar,
    place: EditorActions,
    tabs: Tab[],
    active: string,
    locked: boolean,
    own = false
): StripShape {
    const actions = place === 'strip';
    if (bar === 'none') {
        return {
            tabs: [],
            row: actions || locked || own ? 'title' : 'none',
            actions,
            lock: locked
        };
    }
    return {
        tabs: bar === 'single' ? tabs.filter((tab) => tab.id === active) : tabs,
        row: 'tabs',
        actions,
        lock: locked
    };
}
