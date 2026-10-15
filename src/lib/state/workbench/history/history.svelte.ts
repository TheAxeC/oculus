// Layer 2, client state. The navigation history of one window, which the window strip's Back and
// Forward, their chords and their palette commands walk (history.ts holds the steps). It lives in
// the page's memory only, so each window of the app, a float's window included, walks its own,
// and a reload starts it empty.
//
// It follows the layout store rather than being told: an effect reads the tab the window has
// active (the active tab of the pane the reader is in, or the active tab of a float that changed;
// in a float's window, that float's), the state of that tab, which carries a source tab's ask of a
// place (`asked`, a jump the page made: Go to Definition, a search result, a problem opened), and
// the caret line the tab last said (navigation/editor-status.svelte.ts). A caret said while the
// tab's ask is still to be gone to (`asked` differs from `wentTo`) is not a move, since the
// editor has not gone there yet.
//
// A walk shows the step's tab where it is, putting its page on screen when the screen draws it
// nowhere, and points a source tab at the step's line through a new ask. A step whose tab was
// closed is opened again in the page or float and the pane it was closed from, at its index there,
// or in the focused pane of the page on screen when that pane is gone
// (layout/tabs/reopen.svelte.ts), and is then shown as an open tab is; a step whose file is gone,
// or whose tab is gone with nothing kept to reopen, is skipped. The walk then reads what it did as
// the new baseline, so its own changes are no steps.

import { untrack } from 'svelte';
import type { LayoutStore } from '../layout.svelte.ts';
import type { EditorStatusStore } from '../navigation/editor-status.svelte.ts';
import type { SourceStore } from '../../sessions/source/source.svelte.ts';
import { isPage } from '../layout/model.ts';
import { showsPage } from '../layout/nested.ts';
import {
    EMPTY_HISTORY,
    canBack,
    canForward,
    caretMoved,
    movedTo,
    refreshed,
    renamed,
    visited,
    type History,
    type Step
} from './history.ts';

export type HistoryStore = {
    /** Whether Back has a step to go to, which draws the strip's Back enabled. */
    canBack: () => boolean;
    /** Whether Forward has a step to go to. */
    canForward: () => boolean;
    /** Go to the step before; answers whether a step was shown. */
    back: () => Promise<boolean>;
    /** Go to the step after; answers whether a step was shown. */
    forward: () => Promise<boolean>;
};

/** The part of the layout store the history reads and walks. */
type HistoryLayout = Pick<
    LayoutStore,
    | 'openingInstance'
    | 'floats'
    | 'holding'
    | 'instanceLayoutState'
    | 'instanceView'
    | 'restateInstance'
    | 'activateInstance'
    | 'currentPage'
    | 'pages'
    | 'switchPage'
    | 'closedTab'
    | 'reopenTab'
>;

/**
 * What the history last read: the window's active tab, the active tab of the reader's pane, each
 * float's active tab, and the active tab's ask.
 */
type Seen = {
    tab: string | null;
    page: string | null;
    floats: Map<string, string>;
    asked: number | null;
};

/** What one reading finds: the active tab, its line asked, its caret and whether an ask waits. */
type Reading = Seen & { line: number | null; caret: number | null; waiting: boolean };

/** A whole positive number a tab's state holds under `key`, or null. */
function numberOf(state: unknown, key: string): number | null {
    if (typeof state !== 'object' || state === null) return null;
    const value = (state as Record<string, unknown>)[key];
    return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * The history of the window, over the layout store, the caret each source tab says (`editor`), the
 * asks of a place (`source`), and the float the window draws alone (`own`, null for a main window).
 */
export function createHistory(
    layout: HistoryLayout,
    editor: Pick<EditorStatusStore, 'statusOf'>,
    source: Pick<SourceStore, 'nextAsked'>,
    own: string | null
): HistoryStore {
    let history: History = $state(EMPTY_HISTORY);
    let seen: Seen = { tab: null, page: null, floats: new Map(), asked: null };
    let walking = false;

    /** The floats this window draws and their active tabs: a float's window, its own alone. */
    function floatTabs(): Map<string, string> {
        const drawn = layout
            .floats()
            .filter((one) => (own === null ? one.place.kind !== 'window' : one.id === own));
        return new Map(drawn.map((one) => [one.id, one.pane.active]));
    }

    /**
     * The tab the window has active: in a float's window that float's; else, once a first tab was
     * read, the tab a float changed to, then the tab the reader's pane changed to, then the tab
     * read last; on the first reading the reader's pane's.
     */
    function activeTab(floats: Map<string, string>, page: string | null): string | null {
        if (own !== null) {
            const drawn = floats.get(own) ?? '';
            return drawn === '' ? null : drawn;
        }
        if (seen.tab === null) return page;
        for (const [id, active] of floats) {
            if (active !== '' && seen.floats.get(id) !== active) return active;
        }
        if (page !== null && page !== seen.page) return page;
        return seen.tab;
    }

    function read(): Reading {
        const floats = floatTabs();
        const page = layout.openingInstance()?.id ?? null;
        const tab = activeTab(floats, page);
        const state = tab === null ? undefined : layout.instanceLayoutState(tab);
        const asked = numberOf(state, 'asked');
        return {
            tab,
            page,
            floats,
            asked,
            line: numberOf(state, 'line'),
            caret: tab === null ? null : (editor.statusOf(tab)?.caret?.line ?? null),
            waiting: asked !== null && asked !== numberOf(state, 'wentTo')
        };
    }

    /** A step of the tab `tab` at `line`, with the tab as a reopen would bring it back. */
    function stepOf(tab: string, line: number | null): Step {
        return { tab, line, kept: layout.closedTab(tab) };
    }

    /** Put a step, with every step of a tab still open given its newest form. */
    function push(step: Step): void {
        history = refreshed(visited(history, step), layout.closedTab);
    }

    /** What one reading says: a tab made active, a jump in the tab, or its caret moved. */
    function take(now: Reading): void {
        if (now.tab === null) return;
        const jumped = now.asked !== null && now.asked !== seen.asked && now.line !== null;
        if (now.tab !== seen.tab) push(stepOf(now.tab, jumped ? now.line : now.caret));
        else if (jumped) push(stepOf(now.tab, now.line));
        else if (!now.waiting && now.caret !== null) {
            history = caretMoved(history, now.tab, now.caret);
        }
    }

    /** Read the window and take what changed; `quiet` reads it as the baseline and takes none. */
    function observe(quiet: boolean): void {
        const now = read();
        untrack(() => {
            if (!quiet) take(now);
            seen = { tab: now.tab, page: now.page, floats: now.floats, asked: now.asked };
        });
    }

    $effect.root(() => {
        $effect(() => observe(walking));
    });

    /** Show a tab where it is held, putting its page on screen when the screen draws it nowhere. */
    function reveal(id: string): void {
        const host = layout.holding(id);
        if (host === null) return;
        const screen = layout.currentPage().id;
        if (isPage(host) && host.id !== screen && !showsPage(layout.pages(), screen, host.id)) {
            layout.switchPage(host.id);
        }
        layout.activateInstance(id, host.id);
    }

    /** Point a source tab at a line through a new ask of that place. */
    function point(id: string, line: number | null): void {
        const state = layout.instanceLayoutState(id);
        if (line === null || layout.instanceView(id) !== 'source') return;
        if (typeof state !== 'object' || state === null) return;
        const {
            column: _column,
            endLine: _line,
            endColumn: _end,
            ...rest
        } = state as Record<string, unknown>;
        layout.restateInstance(id, { ...rest, line, asked: source.nextAsked() });
    }

    /** Show one step: the id of the tab shown, or null when its tab is gone for good. */
    async function show(step: Step): Promise<string | null> {
        const id =
            layout.holding(step.tab) !== null
                ? step.tab
                : step.kept === null
                  ? null
                  : await layout.reopenTab(step.kept);
        if (id === null) return null;
        reveal(id);
        point(id, step.line);
        return id;
    }

    /** Walk one step back or forward, skipping a step that cannot be shown. */
    async function walk(by: 1 | -1): Promise<boolean> {
        if (walking) return false;
        walking = true;
        try {
            for (let at = history.at + by; at >= 0 && at < history.steps.length; at += by) {
                const step = history.steps[at];
                const id = await show(step);
                if (id === null) continue;
                history = movedTo(renamed(history, step.tab, id), at);
                observe(true);
                return true;
            }
            return false;
        } finally {
            walking = false;
        }
    }

    return {
        canBack: () => canBack(history),
        canForward: () => canForward(history),
        back: () => walk(-1),
        forward: () => walk(1)
    };
}
