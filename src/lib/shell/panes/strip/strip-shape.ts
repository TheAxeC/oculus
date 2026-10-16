// Layer 3, shell. What a pane's top row draws under the two settings of config/appearance.yml,
// apart from the component so it can be read without a DOM: which tabs, whether the row is the tab
// row, a title row that holds the lock mark, or no row, whether the Split Right button and the pane
// menu opener are drawn in the row or handed up to the window's title bar strip, and whether the
// lock mark is.
//
// With the tab bar not drawn (`show_tabs: none`) the actions at their first place
// (`editor_actions: strip`) go up to the window strip, as VS Code's `editorActionsLocation`
// default shows them in the window title bar when `showTabs` is `none`; the strip draws the active
// pane's (shell/titlebar/strip-actions.svelte.ts). The pane then keeps a title row only while it is
// locked, since the mark that unlocks it is drawn in that row, as with the actions hidden. A
// window with no strip, which is every page in a browser, keeps the actions in a title row of the
// pane, the place they have when the tab bar is drawn.

import type { EditorActions, TabBar } from '$lib/state/shared/words/appearance';
import type { Tab } from '$lib/ui/tabs/tab-strip';

/** What the row draws. */
export type StripShape = {
    /** The tabs drawn: all of them, the active one alone, or none. */
    tabs: Tab[];
    /** `tabs` is the tab strip, `title` a row with no tab, `none` no row. */
    row: 'tabs' | 'title' | 'none';
    /** Whether the Split Right button and the `...` opener are drawn in the row. */
    actions: boolean;
    /** Whether they go up to the window strip, which draws the active pane's. */
    up: boolean;
    /** Whether the lock mark is drawn: on a locked pane, whatever the two settings say. */
    lock: boolean;
};

/**
 * The row of a pane under `show_tabs` (`bar`) and `editor_actions` (`place`), in a window that has
 * a title bar strip (`windowStrip`) or none. `none` sends the actions up to the window strip, or
 * with the actions hidden draws none, and keeps a title row only while the pane is locked, since
 * the mark that unlocks it is drawn in that row; with no window strip the actions stay in a title
 * row of the pane.
 */
export function stripShape(
    bar: TabBar,
    place: EditorActions,
    tabs: Tab[],
    active: string,
    locked: boolean,
    windowStrip: boolean
): StripShape {
    const actions = place === 'strip';
    if (bar === 'none' && actions && !windowStrip) {
        return { tabs: [], row: 'title', actions: true, up: false, lock: locked };
    }
    if (bar === 'none') {
        return {
            tabs: [],
            row: locked ? 'title' : 'none',
            actions: false,
            up: actions,
            lock: locked
        };
    }
    return {
        tabs: bar === 'single' ? tabs.filter((tab) => tab.id === active) : tabs,
        row: 'tabs',
        actions,
        up: false,
        lock: locked
    };
}
