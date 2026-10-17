// Layer 2, client state. The rules over one Terminal tab's own layout state, the one shape every
// reader of a Terminal tab goes through: the terminals the tab owns in its own order, the row of
// them drawn side by side with a share of the width each, the one of the row that is shown (the
// focused one), whether the composer shows, and the label the tab strip draws.
//
// A Terminal tab is a terminal panel of its own: a terminal belongs to exactly one tab, and the
// store (state/sessions/terminals.svelte.ts) applies these rules to the layout when a terminal is
// shown, moved, started or ends. The row has no count: a Split puts a new terminal right of the one
// split, and the widths (`rowWidths`) keep each terminal at least ROW_MIN pixels wide, so a row
// wider than the pane scrolls sideways. The composer shows alone while nothing is shown, and right
// of the row while `shown` is set.
//
// Every rule is pure over what it is handed, so a rule is asserted without a layout. A saved state
// of any older shape is read into this one, so a reload keeps every Terminal tab: a tab that held
// `{ shown, beside, share }` reads as a row of both with the share and its rest, a tab pinned to a
// terminal keeps it, and a tab that followed the selection or held a fresh composer shows the
// composer. The tab's `id` is its identity for the layout, which opens a new tab for a state whose
// identity no tab carries (state/workbench/layout/instance.ts, `stateId`).

import { z } from 'zod';
import { anyNumberShape, rowsShape } from '../../../data/shapes/shapes.ts';
import { isTerminalId, TERMINAL_ID } from '../../../data/model/index.ts';

/** The view a Terminal tab is. */
export const TERMINAL_VIEW = 'terminal';

/** The fewest pixels a terminal of a row keeps, VS Code's least size of a split pane. */
export const ROW_MIN = 80;

/** The bounds an older tab's two-terminal share is kept in when it is read into the row. */
const SHARE_MIN = 0.1;
const SHARE_MAX = 0.9;

/** One Terminal tab's own state. */
export type TerminalTabState = {
    /** The tab's identity for the layout. */
    id: string;
    /** The terminals the tab owns, in the tab's own order. */
    terminals: string[];
    /** The terminals drawn side by side, left to right; empty while the composer shows alone. */
    row: string[];
    /** The share of the row's width each terminal of `row` takes; they sum to 1. */
    shares: number[];
    /** The focused terminal of the row; null while the composer shows alone. */
    shown: string | null;
    /** Whether the composer shows: alone while nothing is shown, else right of the row. */
    composing: boolean;
    /** The shown terminal's name, which the tab strip draws. */
    label: string;
};

/** The shape of a terminal id (data/model `TERMINAL_ID`), six hex digits and the kind. */
const terminalIdShape = z.string().regex(TERMINAL_ID);

/** Whether an id names a terminal, the rule the server tests by too (data/model). */
export { isTerminalId };

/** A tab that owns no terminal and shows the composer. */
export function emptyTab(id: string): TerminalTabState {
    return { id, terminals: [], row: [], shares: [], shown: null, composing: true, label: '' };
}

/** A fresh identity for a tab. */
function freshId(): string {
    return crypto.randomUUID();
}

/** Shares that fit a row of `count`: the ones given scaled to sum to 1, else equal shares. */
function mendedShares(shares: readonly number[], count: number): number[] {
    if (count === 0) return [];
    const fits = shares.length === count && shares.every((one) => Number.isFinite(one) && one > 0);
    if (!fits) return Array.from({ length: count }, () => 1 / count);
    const total = shares.reduce((sum, one) => sum + one, 0);
    return shares.map((one) => one / total);
}

/**
 * The state a tab carries, whole and consistent: `row` holds terminals the tab owns once each with
 * a share apiece, `shown` is one of the row, a tab that owns terminals and shows no composer shows
 * its first, and a tab that owns none shows the composer.
 */
function settled(state: TerminalTabState): TerminalTabState {
    const terminals = [...new Set(state.terminals.filter(isTerminalId))];
    const kept: number[] = [];
    const row: string[] = [];
    state.row.forEach((one, at) => {
        if (!terminals.includes(one) || row.includes(one)) return;
        row.push(one);
        kept.push(state.shares[at]);
    });
    // Shares that were written for a longer row (an entry was dropped) do not fit; mendedShares
    // takes equal ones then.
    const whole = kept.length === state.row.length;
    let shown = state.shown !== null && terminals.includes(state.shown) ? state.shown : null;
    const composing = state.composing || terminals.length === 0;
    if (row.length === 0 && shown === null && !composing) shown = terminals[0];
    if (row.length === 0 && shown !== null) row.push(shown);
    if (row.length > 0 && (shown === null || !row.includes(shown))) shown = row[0];
    const fitted = row.length === kept.length && whole ? kept : [];
    return { ...state, terminals, row, shares: mendedShares(fitted, row.length), shown, composing };
}

/**
 * The fields a saved state is read from, each as typed or unset. `terminals` and `row` are absent
 * unless the state holds a list, since the shape of the state is told by which of them it holds;
 * a list holds the terminal ids it names. `shares` are the numbers a row was saved with, and a
 * share that is no number is NaN, which `mendedShares` refuses. `share` is an older tab's left
 * half, half unless it is a number inside the bounds.
 */
const savedTabShape = z.object({
    id: z
        .string()
        .min(1)
        .catch(() => freshId()),
    label: z.string().catch(''),
    terminals: rowsShape(terminalIdShape).optional().catch(undefined),
    session: terminalIdShape.optional().catch(undefined),
    shown: terminalIdShape.nullable().catch(null),
    composing: z.boolean().catch(false),
    row: rowsShape(terminalIdShape).optional().catch(undefined),
    shares: z.array(anyNumberShape.catch(Number.NaN)).catch([]),
    beside: terminalIdShape.optional().catch(undefined),
    share: z.number().min(SHARE_MIN).max(SHARE_MAX).catch(0.5)
});

/**
 * A saved state read into the tab's shape. An old `{ session, label }` reads as that one terminal
 * shown; an old `{}`, `{ id }` or `{ id, follow }` as a tab with no terminal, composing; an old
 * `{ shown, beside, share }` as a row of both, `share` the left one's. Ids that are not terminal
 * ids are dropped and a repeated one is kept once. The tab's own `id` is kept, and a state carrying
 * none is given a fresh one.
 */
export function readTab(state: unknown): TerminalTabState {
    // A state that is no map is read as an empty one.
    const held = savedTabShape.safeParse(state).data ?? savedTabShape.parse({});
    const { id, label, composing, shown } = held;
    if (held.terminals === undefined) {
        const pinned = held.session ?? null;
        const tab = emptyTab(id);
        if (pinned === null) return { ...tab, label };
        return settled({ ...tab, terminals: [pinned], shown: pinned, composing: false, label });
    }
    const { terminals } = held;
    if (held.row !== undefined) {
        return settled({
            id,
            terminals,
            row: held.row,
            shares: held.shares,
            shown,
            composing,
            label
        });
    }
    // The older two-terminal shape: `beside` is the second half and `share` the left half's.
    const beside = held.beside !== undefined && held.beside !== shown ? held.beside : null;
    const left = held.share;
    const paired = shown !== null && beside !== null && terminals.includes(beside);
    return settled({
        id,
        terminals,
        row: paired ? [shown, beside] : [],
        shares: paired ? [left, 1 - left] : [],
        shown,
        composing,
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
 * The folder a new terminal in this tab starts in: the shown terminal's, else the first terminal
 * of the tab that has one, else null (the caller then takes the hub root). `cwdOf` answers the
 * folder of a terminal id, or null when the payload does not list it.
 */
export function tabFolder(
    state: TerminalTabState,
    cwdOf: (id: string) => string | null
): string | null {
    const order = state.shown === null ? state.terminals : [state.shown, ...state.terminals];
    for (const id of order) {
        const folder = cwdOf(id);
        if (folder !== null && folder !== '') return folder;
    }
    return null;
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
        row: [terminal],
        shares: [1],
        shown: terminal,
        composing: false
    });
}

/** A row and its shares without one terminal, the rest scaled to sum to 1. */
function outOfRow(
    row: readonly string[],
    shares: readonly number[],
    terminal: string
): { row: string[]; shares: number[] } {
    const at = row.indexOf(terminal);
    if (at < 0) return { row: [...row], shares: [...shares] };
    const left = row.filter((one) => one !== terminal);
    const rest = shares.filter((_, index) => index !== at);
    return { row: left, shares: mendedShares(rest, left.length) };
}

/**
 * The tab with a terminal removed. When it was the shown one, the next of the row is shown, else
 * the previous, else the next of the tab's order; the others of the row keep their order and their
 * shares are scaled to sum to 1. A terminal the tab does not own changes nothing.
 */
export function withoutTerminal(state: TerminalTabState, terminal: string): TerminalTabState {
    const at = state.terminals.indexOf(terminal);
    if (at < 0) return state;
    const terminals = state.terminals.filter((one) => one !== terminal);
    const place = state.row.indexOf(terminal);
    const left = outOfRow(state.row, state.shares, terminal);
    if (state.shown !== terminal) return settled({ ...state, terminals, ...left });
    const beside =
        place >= 0 && left.row.length > 0 ? left.row[Math.min(place, left.row.length - 1)] : null;
    const next =
        beside ?? (at < terminals.length ? terminals[at] : at > 0 ? terminals[at - 1] : null);
    return settled({
        ...state,
        terminals,
        ...left,
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
 * The tab with a terminal put right of `of` in the row. A terminal the tab does not own joins its
 * order right after `of`; the new one takes half of `of`'s share. When `of` is not in the row the
 * row becomes `of` and the new terminal, `of` shown, the composer gone.
 */
export function splitRight(
    state: TerminalTabState,
    of: string,
    terminal: string
): TerminalTabState {
    if (!isTerminalId(terminal) || !state.terminals.includes(of) || of === terminal) return state;
    const rest = state.terminals.filter((one) => one !== terminal);
    const place = rest.indexOf(of) + 1;
    const terminals = [...rest.slice(0, place), terminal, ...rest.slice(place)];
    const base = state.row.includes(of)
        ? outOfRow(state.row, state.shares, terminal)
        : { row: [of], shares: [1] };
    const at = base.row.indexOf(of);
    const half = base.shares[at] / 2;
    const row = [...base.row.slice(0, at + 1), terminal, ...base.row.slice(at + 1)];
    const shares = [...base.shares.slice(0, at), half, half, ...base.shares.slice(at + 1)];
    const shown = state.row.includes(of) && state.shown !== null ? state.shown : of;
    return settled({ ...state, terminals, row, shares, shown, composing: false });
}

/**
 * The tab with a terminal it owns added to the end of the row (Join), taking an equal share and
 * the others scaled down to make room; one already in the row changes nothing.
 */
export function joined(state: TerminalTabState, terminal: string): TerminalTabState {
    if (!state.terminals.includes(terminal) || state.row.includes(terminal)) return state;
    const count = state.row.length + 1;
    const shares = [...state.shares.map((one) => (one * (count - 1)) / count), 1 / count];
    return settled({ ...state, row: [...state.row, terminal], shares, composing: false });
}

/**
 * The tab with a terminal taken out of the row (Unsplit); it stays in the tab and the others'
 * shares are scaled to sum to 1. A row of one, or a terminal not in the row, changes nothing.
 */
export function unsplit(state: TerminalTabState, terminal: string): TerminalTabState {
    if (state.row.length <= 1 || !state.row.includes(terminal)) return state;
    const left = outOfRow(state.row, state.shares, terminal);
    const place = state.row.indexOf(terminal);
    const shown = state.shown === terminal ? (left.row[place] ?? left.row[place - 1]) : state.shown;
    return settled({ ...state, ...left, shown });
}

/** The tab showing one of its terminals alone: a row of one, no composer. */
export function showingOne(state: TerminalTabState, terminal: string): TerminalTabState {
    if (!state.terminals.includes(terminal)) return state;
    return settled({ ...state, row: [terminal], shares: [1], shown: terminal, composing: false });
}

/**
 * What a press on a terminal does: a terminal of the row the tab draws becomes the focused one and
 * keeps the row, and any other terminal is shown alone.
 */
export function showingRow(state: TerminalTabState, terminal: string): TerminalTabState {
    const inRow = splitDrawn(state) && state.row.includes(terminal);
    if (!inRow) return showingOne(state, terminal);
    return state.shown === terminal ? state : { ...state, shown: terminal };
}

/**
 * New with a prompt in a tab: a tab drawing a row keeps it with the composer right of it, and any
 * other tab shows the composer alone.
 */
export function composingIn(state: TerminalTabState): TerminalTabState {
    if (splitDrawn(state)) return { ...state, composing: true };
    return { ...state, shown: null, row: [], shares: [], composing: true };
}

/**
 * The tab once its composer started a terminal: from the composer right of a row it joins the end
 * of the row, and from a composer shown alone it joins at the end of the tab's order and is shown.
 * The label is what the tab is called until the terminal's own name arrives.
 */
export function withStarted(
    state: TerminalTabState,
    terminal: string,
    label: string
): TerminalTabState {
    if (!isTerminalId(terminal)) return state;
    if (state.shown !== null && state.composing && state.row.length > 0) {
        return splitRight(state, state.row[state.row.length - 1], terminal);
    }
    const rest = state.terminals.filter((one) => one !== terminal);
    return { ...withTerminal(state, terminal, rest.length), label };
}

/** The tab carrying the shown terminal's name as its label. */
export function withLabel(state: TerminalTabState, label: string): TerminalTabState {
    return { ...state, label };
}

/** The tab with the row's shares replaced, scaled to sum to 1. */
export function withShares(state: TerminalTabState, shares: readonly number[]): TerminalTabState {
    return { ...state, shares: mendedShares(shares, state.row.length) };
}

/** Whether the tab draws more than one terminal, or the composer beside one. */
export function splitDrawn(state: TerminalTabState): boolean {
    return state.shown !== null && (state.row.length > 1 || state.composing);
}

/**
 * The width in pixels of each terminal of a row in a pane `pane` pixels wide, of which `handles`
 * pixels are the handles between the terminals (a row of n holds n - 1 of them). A share below
 * ROW_MIN pixels is lifted to ROW_MIN and the others share what is left, so the widths and the
 * handles fill the pane; a row that cannot fit ROW_MIN each gives every terminal ROW_MIN, wider
 * than the pane.
 */
export function rowWidths(shares: readonly number[], pane: number, handles = 0): number[] {
    const count = shares.length;
    if (count === 0) return [];
    const room = pane - handles;
    if (!(room > count * ROW_MIN)) return shares.map(() => ROW_MIN);
    const widths = shares.map(() => 0);
    const fixed = new Set<number>();
    for (;;) {
        const free = shares.map((_, at) => at).filter((at) => !fixed.has(at));
        const space = room - fixed.size * ROW_MIN;
        const total = free.reduce((sum, at) => sum + shares[at], 0);
        const low = free.filter((at) => (shares[at] / total) * space < ROW_MIN);
        if (low.length === 0) {
            for (const at of free) widths[at] = (shares[at] / total) * space;
            break;
        }
        for (const at of low) fixed.add(at);
    }
    for (const at of fixed) widths[at] = ROW_MIN;
    return widths;
}

/**
 * The shares after a drag moves the boundary right of terminal `index` by `delta` pixels in a
 * pane `pane` wide with `handles` pixels of handles. Neither side goes under ROW_MIN; a row wider
 * than the pane keeps its shares, since its terminals are already at their least.
 */
export function resizedShares(
    shares: readonly number[],
    index: number,
    delta: number,
    pane: number,
    handles = 0
): number[] {
    const room = pane - handles;
    if (index < 0 || index + 1 >= shares.length || !(room > shares.length * ROW_MIN)) {
        return [...shares];
    }
    const widths = rowWidths(shares, pane, handles);
    const pair = widths[index] + widths[index + 1];
    const left = Math.min(pair - ROW_MIN, Math.max(ROW_MIN, widths[index] + delta));
    widths[index] = left;
    widths[index + 1] = pair - left;
    return widths.map((one) => one / room);
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
