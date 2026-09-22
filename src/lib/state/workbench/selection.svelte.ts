// Layer 2, client state. The workbench's current session: one id, or none.
//
// It is not saved. A reload subscribes again and the sessions payload arrives whole, so the rail
// picks a session the same way it picked one the first time; remembering an id across a reload would
// only mean remembering one that has since gone.
//
// DESIGN.md, "sessions are six views, not one": the list sets this and the other five follow it, so
// a click in the rail moves the detail, the timeline, the changes and the agents together. A view
// whose own instance state pins a session (`{ session: <id> }`) reads that instead and stops
// following, which is how two detail views show two sessions side by side.

// A terminal selects the same way. The server puts a record per terminal in the `sessions` payload,
// and a terminal's id cannot collide with a session's, so one store holds both and the two readers
// below are the whole of the difference.

import { isTerminalId } from '../sessions/terminals.svelte.ts';

/**
 * The session a view instance pinned, from the state it saved, or null when it follows the
 * selection. Pure over what it is handed, so a view reads it out of the layout instance and
 * nothing about the pin needs a second store.
 */
export function pinnedSession(state: unknown): string | null {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
    const held = (state as Record<string, unknown>).session;
    return typeof held === 'string' && held !== '' ? held : null;
}

/** The terminal a view instance pinned, out of the same `session` field pinnedSession reads. */
export function pinnedTerminal(state: unknown): string | null {
    const held = pinnedSession(state);
    return isTerminalId(held) ? held : null;
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

    /** The current selection when it names a terminal, and null when it names a session or nothing. */
    function selectedTerminal(): string | null {
        return isTerminalId(store.id) ? store.id : null;
    }

    return { select, selected, selectedTerminal };
}
