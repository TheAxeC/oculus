// Layer 2, client state. The rules over one Terminal tab's own layout state, the one shape every
// reader of a Terminal tab goes through: the terminals the tab owns in its own order, the one shown
// on the left or alone, the second terminal of a split, the left half's share of a split, whether
// the composer shows, and the label the tab strip draws.
//
// A Terminal tab is a terminal panel of its own: a terminal belongs to exactly one tab, and the
// store (state/sessions/terminals.svelte.ts) applies these rules to the layout when a terminal is
// shown, moved, started or ends. The composer shows alone while nothing is shown, and in the right
// half of a split while `shown` is set, which is how Split on a row and New in a split tab look.
//
// Every rule is pure over what it is handed, so a rule is asserted without a layout. A saved state
// of any older shape is read into this one, so a reload keeps every Terminal tab: a tab pinned to a
// terminal keeps it, and a tab that followed the selection or held a fresh composer shows the
// composer. The tab's `id` is its identity for the layout, which opens a new tab for a state whose
// identity no tab carries (state/workbench/layout/instance.ts, `stateId`).

import { isMap } from '../../../data/helpers/guards.ts';

/** The view a Terminal tab is. */
export const TERMINAL_VIEW = 'terminal';

/** The left half's share of a split at first, and the bounds a drag of the handle keeps it in. */
export const SPLIT_SHARE = 0.5;
const SHARE_MIN = 0.1;
const SHARE_MAX = 0.9;

/** One Terminal tab's own state. */
export type TerminalTabState = {
    /** The tab's identity for the layout. */
    id: string;
    /** The terminals the tab owns, in the tab's own order. */
    terminals: string[];
    /** The terminal on the left of a split, or alone; null while the composer shows alone. */
    shown: string | null;
    /** The second terminal of a split, or null. */
    beside: string | null;
    /** The left half's share of a split. */
    share: number;
    /** Whether the composer shows: alone while nothing is shown, else in the right half. */
    composing: boolean;
    /** The shown terminal's name, which the tab strip draws. */
    label: string;
};

/**
 * Whether an id names a terminal. It is the same shape the server's `isTerminalId` tests, six hex
 * digits and the kind, and it cannot collide with a Claude session id (a UUID) or a Codex slug (a
 * day path), which is why a terminal selects through the one selection the session views share.
 */
export function isTerminalId(id: unknown): id is string {
    return typeof id === 'string' && /^[0-9a-f]{6}-(claude|codex|shell)$/.test(id);
}

/** A tab that owns no terminal and shows the composer. */
export function emptyTab(id: string): TerminalTabState {
    return {
        id,
        terminals: [],
        shown: null,
        beside: null,
        share: SPLIT_SHARE,
        composing: true,
        label: ''
    };
}

/** A fresh identity for a tab. */
function freshId(): string {
    return crypto.randomUUID();
}

/** A share kept inside its bounds; anything that is not a number between them is the default. */
function shareOf(value: unknown): number {
    return typeof value === 'number' && value >= SHARE_MIN && value <= SHARE_MAX
        ? value
        : SPLIT_SHARE;
}

/**
 * The state a tab carries, whole and consistent: `shown` and `beside` are terminals the tab owns,
 * `beside` is never `shown`, a split half with no left half moves left, a tab that owns terminals
 * and shows no composer shows its first, and a tab that owns none shows the composer.
 */
function settled(state: TerminalTabState): TerminalTabState {
    const terminals = [...new Set(state.terminals.filter(isTerminalId))];
    let shown = state.shown !== null && terminals.includes(state.shown) ? state.shown : null;
    let beside =
        state.beside !== null && terminals.includes(state.beside) && state.beside !== shown
            ? state.beside
            : null;
    if (shown === null && beside !== null) {
        shown = beside;
        beside = null;
    }
    let composing = state.composing || terminals.length === 0;
    if (shown === null && !composing) shown = terminals[0];
    if (terminals.length === 0) composing = true;
    return { ...state, terminals, shown, beside, share: shareOf(state.share), composing };
}

/**
 * A saved state read into the tab's shape. An old `{ session, label }` reads as that one terminal
 * shown; an old `{}`, `{ id }` or `{ id, follow }` as a tab with no terminal, composing. Ids that
 * are not terminal ids are dropped and a repeated one is kept once. The tab's own `id` is kept, and
 * a state carrying none is given a fresh one.
 */
export function readTab(state: unknown): TerminalTabState {
    const held = isMap(state) ? state : {};
    const id = typeof held.id === 'string' && held.id !== '' ? held.id : freshId();
    const label = typeof held.label === 'string' ? held.label : '';
    if (!Array.isArray(held.terminals)) {
        const pinned = isTerminalId(held.session) ? held.session : null;
        const tab = emptyTab(id);
        if (pinned === null) return { ...tab, label };
        return { ...tab, terminals: [pinned], shown: pinned, composing: false, label };
    }
    return settled({
        id,
        terminals: held.terminals.filter(isTerminalId),
        shown: isTerminalId(held.shown) ? held.shown : null,
        beside: isTerminalId(held.beside) ? held.beside : null,
        share: shareOf(held.share),
        composing: held.composing === true,
        label
    });
}

/** The terminal ids a tab owns, out of any saved shape. */
export function tabTerminals(state: unknown): string[] {
    return readTab(state).terminals;
}

/** The tab owning a terminal among a list of tabs, or null when none owns it. */
export function ownerOf<T extends { state: unknown }>(
    tabs: readonly T[],
    terminal: string
): T | null {
    return tabs.find((tab) => tabTerminals(tab.state).includes(terminal)) ?? null;
}

/**
 * The tab with a terminal added at `index` of its order, clamped to the order's ends, and shown
 * alone; a terminal the tab owns already is moved there. An id that is not a terminal changes
 * nothing.
 */
export function withTerminal(
    state: TerminalTabState,
    terminal: string,
    index: number
): TerminalTabState {
    if (!isTerminalId(terminal)) return state;
    const rest = state.terminals.filter((one) => one !== terminal);
    const at = Math.max(0, Math.min(rest.length, index));
    return settled({
        ...state,
        terminals: [...rest.slice(0, at), terminal, ...rest.slice(at)],
        shown: terminal,
        beside: null,
        composing: false
    });
}

/**
 * The tab with a terminal removed. When it was the shown one, the next row in the tab's order is
 * shown, else the previous; when it was either half of a split, the other half is shown alone. A
 * terminal the tab does not own changes nothing.
 */
export function withoutTerminal(state: TerminalTabState, terminal: string): TerminalTabState {
    const at = state.terminals.indexOf(terminal);
    if (at < 0) return state;
    const terminals = state.terminals.filter((one) => one !== terminal);
    if (state.beside === terminal) return settled({ ...state, terminals, beside: null });
    if (state.shown !== terminal) return settled({ ...state, terminals });
    if (state.beside !== null) {
        return settled({ ...state, terminals, shown: state.beside, beside: null });
    }
    const next = at < terminals.length ? terminals[at] : at > 0 ? terminals[at - 1] : null;
    return settled({
        ...state,
        terminals,
        shown: next,
        composing: state.composing || next === null
    });
}

/**
 * The tab with the order the reader dragged: the ids it names that the tab owns, in its order, and
 * any the order leaves out after them in the order they had.
 */
export function reordered(state: TerminalTabState, order: readonly string[]): TerminalTabState {
    const named = order.filter((one) => state.terminals.includes(one));
    const kept = [...new Set(named)];
    return settled({
        ...state,
        terminals: [...kept, ...state.terminals.filter((one) => !kept.includes(one))]
    });
}

/**
 * The tab split: `beside` is set, the shown terminal stays on the left and the composer goes. A
 * terminal the tab does not own, or the shown one itself, splits nothing.
 */
export function splitWith(state: TerminalTabState, beside: string): TerminalTabState {
    if (!state.terminals.includes(beside) || beside === state.shown) return state;
    return settled({ ...state, beside, composing: false });
}

/** The tab showing one of its rows alone: no split, no composer. */
export function showingOne(state: TerminalTabState, terminal: string): TerminalTabState {
    if (!state.terminals.includes(terminal)) return state;
    return settled({ ...state, shown: terminal, beside: null, composing: false });
}

/**
 * What a press on a row does: a half of the split the tab draws keeps the split, and any other row
 * is shown alone.
 */
export function showingRow(state: TerminalTabState, terminal: string): TerminalTabState {
    const inSplit = splitDrawn(state) && (terminal === state.shown || terminal === state.beside);
    return inSplit ? state : showingOne(state, terminal);
}

/** Split on a row: that row on the left, the composer on the right. */
export function splitAt(state: TerminalTabState, terminal: string): TerminalTabState {
    if (!state.terminals.includes(terminal)) return state;
    return settled({ ...state, shown: terminal, beside: null, composing: true });
}

/**
 * New in a tab: a split tab keeps both halves with the composer in the right half, and any other
 * tab shows the composer alone.
 */
export function composingIn(state: TerminalTabState): TerminalTabState {
    if (splitDrawn(state)) return { ...state, composing: true };
    return { ...state, shown: null, beside: null, composing: true };
}

/**
 * The tab once its composer started a terminal: in the right half of a split it is inserted after
 * the shown one and becomes `beside`; from a composer shown alone it joins at the end of the tab's
 * order and is shown. The label is what the tab is called until the terminal's own name arrives.
 */
export function withStarted(
    state: TerminalTabState,
    terminal: string,
    label: string
): TerminalTabState {
    if (!isTerminalId(terminal)) return state;
    const rest = state.terminals.filter((one) => one !== terminal);
    if (state.shown !== null && state.composing) {
        const at = rest.indexOf(state.shown) + 1;
        return settled({
            ...state,
            terminals: [...rest.slice(0, at), terminal, ...rest.slice(at)],
            beside: terminal,
            composing: false
        });
    }
    return { ...withTerminal(state, terminal, rest.length), label };
}

/** The tab carrying the shown terminal's name as its label. */
export function withLabel(state: TerminalTabState, label: string): TerminalTabState {
    return { ...state, label };
}

/** The tab with the left half's share of its split moved, kept inside its bounds. */
export function withShare(state: TerminalTabState, share: number): TerminalTabState {
    return { ...state, share: Math.min(SHARE_MAX, Math.max(SHARE_MIN, share)) };
}

/**
 * Whether the tab draws a split: a shown terminal with a second one, or the composer, beside it.
 */
export function splitDrawn(state: TerminalTabState): boolean {
    return state.shown !== null && (state.beside !== null || state.composing);
}

/**
 * The Terminal tab of a page that takes a terminal no tab owns, and New's composer: the active tab
 * of the page's focused pane when it is a Terminal tab, else the first Terminal tab of the page in
 * tab order, else none, and a new tab is opened.
 */
export function pageTarget(
    tabs: readonly { id: string; view: string }[],
    active: string | null
): string | null {
    const terminals = tabs.filter((tab) => tab.view === TERMINAL_VIEW);
    if (active !== null && terminals.some((tab) => tab.id === active)) return active;
    return terminals[0]?.id ?? null;
}
