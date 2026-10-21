// Layer 2, client state. The workbench's current session: one id, or none.
//
// The selection is the page's and is not saved, so a reload starts with none. A view that follows
// it keeps the session it shows in its own saved state (`{ shown: <id> }`, written by `keepShown`)
// and reads that while the selection names none (`followedSession`), so after a reload each
// Session, Transcript and Timeline tab, and each Files tab in follow mode, shows what it showed, as
// VS Code restores what each editor showed; the next pick in the rail moves them all together
// again. A remembered session the payload does not hold reads as none, the view's empty state.
//
// Sessions are six views, not one: the list sets this and the other five follow it, so
// a click in the rail moves the detail, the timeline, the changes and the agents together. A view
// whose own instance state pins a session (`{ session: <id> }`) reads that instead and stops
// following, which is how two detail views show two sessions side by side.

// A terminal selects the same way. The server puts a record per terminal in the `sessions` payload,
// and a terminal's id cannot collide with a session's, so one store holds both and the two readers
// below are the whole of the difference. Which Terminal tab shows a terminal is not the
// selection's: a Terminal tab owns its terminals (state/sessions/terminal/terminal-tabs.ts).

import { untrack } from 'svelte';
import { z } from 'zod';
import { isMap } from '../../data/helpers/guards.ts';
import { filledTextShape, readAs } from '../../data/shapes/shapes.ts';
import { isTerminalId } from '../../data/model/index.ts';

/** The one field of a view's saved state that pins a session. */
const pinShape = z.object({ session: filledTextShape });

/**
 * The session a view instance pinned, from the state it saved, or null when it follows the
 * selection. Pure over what it is handed, so a view reads it out of the layout instance and
 * nothing about the pin needs a second store.
 */
export function pinnedSession(state: unknown): string | null {
    return readAs(pinShape, state)?.session ?? null;
}

/** The field of a following view's saved state that names the session it showed last. */
const shownShape = z.object({ shown: filledTextShape });

/** The session a following view showed last, from the state it saved, or null for none. */
function shownSession(state: unknown): string | null {
    return readAs(shownShape, state)?.shown ?? null;
}

/** A view's saved state naming `session` as the one it shows, the rest of the state kept. */
function withShown(state: unknown, session: string): Record<string, unknown> {
    return { ...(isMap(state) ? state : {}), shown: session };
}

/**
 * The session or terminal a view follows, from its saved state and the selection: the one it pins,
 * else the one selected, else the one it showed last.
 */
export function followedSession(state: unknown, selected: string | null): string | null {
    return pinnedSession(state) ?? selected ?? shownSession(state);
}

/** What `keepShown` reads of a following view and how it writes the view's saved state. */
export type ShownDeps = {
    /** The view's saved state. */
    state: () => unknown;
    /** The workbench's selection. */
    selected: () => string | null;
    /** The session or terminal the view shows now, or null while it shows none. */
    shown: () => string | null;
    /** Replace the view's saved state. */
    write: (state: Record<string, unknown>) => void;
};

/**
 * Keep in a following view's saved state the session the selection shows it, while the view's
 * component lives, since it holds an effect. A pinned view, and a view while the selection names
 * none (after a reload, when the view shows what it kept), write nothing.
 */
export function keepShown(deps: ShownDeps): void {
    $effect(() => {
        const id = deps.shown();
        const state = deps.state();
        if (id === null || deps.selected() === null || pinnedSession(state) !== null) return;
        if (shownSession(state) === id) return;
        untrack(() => deps.write(withShown(state, id)));
    });
}

/** The workbench's current session or terminal, for one client. */
export type SelectionStore = {
    select: (id: string | null) => void;
    selected: () => string | null;
    selectedTerminal: () => string | null;
};

export function createSelection(): SelectionStore {
    const store: { id: string | null } = $state({ id: null });

    /** Make one session the current one. An empty id and null both mean none. */
    function select(id: string | null): void {
        store.id = id === null || id === '' ? null : id;
    }

    /** The current session's id, or null when none is picked. */
    function selected(): string | null {
        return store.id;
    }

    /**
     * The current selection when it names a terminal, and null when it names a session or nothing.
     */
    function selectedTerminal(): string | null {
        return isTerminalId(store.id) ? store.id : null;
    }

    return { select, selected, selectedTerminal };
}
