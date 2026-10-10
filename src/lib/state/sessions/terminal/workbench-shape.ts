// Layer 2, client state. What the terminals store needs of the workbench, handed in by
// state/client/context.ts: the tabs of every page as the layout holds them and the calls that
// change them. The store in state/sessions/terminals.svelte.ts and terminal-lists.ts read it.

import type { TerminalTabState } from './terminal-tabs.ts';

/** One tab of any page, as the layout holds it: its view is read to find the Terminal tabs. */
export type TerminalTab = { id: string; page: string; view: string; state: unknown };

/**
 * What the terminals store needs of the workbench to keep which tab owns which terminal: the tabs
 * of every page in page and tab order (a hidden page mounts no view, so no view can be the one that
 * keeps it), a tab's state replaced, a tab activated, a page switched to, the page on screen, the
 * active tab of a page's focused pane, a tab opened on a page with a state (answering its id), a
 * tab closed, and the selection as it stands.
 */
export type TerminalTabs = {
    /**
     * Whether this client closes the Terminal tabs of terminals that ended. The page of a window
     * that draws one float leaves it to the main window's page, which sees every tab.
     */
    upkeep?: boolean;
    tabs: () => TerminalTab[];
    restate: (id: string, page: string, state: TerminalTabState) => void;
    activate: (id: string, page: string) => void;
    switchPage: (page: string) => void;
    currentPage: () => string;
    activeTab: (page: string) => string | null;
    /** Open a Terminal tab on a page, in its documents pane when `documents` is set. */
    open: (page: string, state: TerminalTabState, documents?: boolean) => string;
    close: (id: string, page: string) => void;
    /** A tab's instance state, which holds its composer record. */
    instanceState: (id: string) => unknown;
    setInstanceState: (id: string, state: unknown) => void;
    selected: () => string | null;
    select: (id: string | null) => void;
    /** The hub's absolute path, or the empty string before the first portfolio snapshot. */
    hubRoot: () => string;
    /** Whether the first portfolio snapshot has arrived, so an empty hub root is final. */
    portfolioHeard: () => boolean;
    /** The Terminal tab of the pane at a path of a page that a New there starts in, or null. */
    paneTab: (page: string, path: number[]) => string | null;
    /** A new Terminal tab in the pane at a path of a page, answering its id. */
    openIn: (page: string, path: number[], state: TerminalTabState) => string;
};
