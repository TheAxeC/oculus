// Layer 3, view helper. The width of a Terminal tab's list of its terminals, taken as VS Code's
// terminal tabs list takes its own (terminalTabbedView.ts, TerminalTabsListSizes): the handle left
// of the list drags its width between LIST_NARROW and LIST_MAX pixels, a width short of
// LIST_MIDPOINT draws the list narrow, its rows as their marks alone, and one between the midpoint
// and LIST_WIDE_MIN is drawn at LIST_WIDE_MIN. A double click on the handle takes it back to
// LIST_DEFAULT.
//
// The grid keeps a usable width: beside the list the tab keeps GRID_ROOM pixels for its row of
// terminals, so in a pane too narrow for the width chosen the list is drawn as wide as the room
// left, narrow once that room is short of LIST_WIDE_MIN, and not at all once it is short of
// LIST_NARROW, when the bar names the shown terminal as it does for a tab with one.
//
// The width chosen is kept per tab in its ui record under `listWidth`, beside the composer's
// record, so a reload keeps it; the record holds the width dragged to, and the snap above is
// applied as it is drawn, so a drag follows the pointer through the narrow and the wide sizes.

import { z } from 'zod';
import { readAs } from '$lib/data/shapes/shapes';
import { instanceMap } from '$lib/state/workbench/layout';
import { SASH_PX } from '$lib/ui/frame/sash-size';

/** The narrow list's width, VS Code's `NarrowViewWidth`: a row's mark and its padding. */
const LIST_NARROW = 46;
/** Below this width the list is narrow, VS Code's `MidpointViewWidth`. */
const LIST_MIDPOINT = 63;
/** The least width a list that names its rows is drawn at, VS Code's `WideViewMinimumWidth`. */
const LIST_WIDE_MIN = 80;
/** The width of a list no handle was dragged on. */
const LIST_DEFAULT = 180;
/** The most the list is dragged to, VS Code's `MaximumWidth`. */
const LIST_MAX = 500;
/** The pixels the row of terminals keeps beside the list, about thirty columns of the grid. */
const GRID_ROOM = 240;

/** The ui record's field the chosen width is kept under. */
const WIDTH_FIELD = 'listWidth';

const widthShape = z.object({ [WIDTH_FIELD]: z.number().min(LIST_NARROW).max(LIST_MAX) });

/** How the list is drawn: its width, and whether its rows show their marks alone. */
export type ListFit = { width: number; narrow: boolean };

/** The width a drag left, as VS Code snaps it: narrow below the midpoint, else at least wide. */
function snapped(width: number): number {
    if (width < LIST_MIDPOINT) return LIST_NARROW;
    return Math.max(width, LIST_WIDE_MIN);
}

/** The pixels the list may take in a body `body` pixels wide: what the row and the handle leave. */
function roomIn(body: number): number {
    return Math.floor(body - GRID_ROOM - SASH_PX);
}

/**
 * How the list is drawn in a body `body` pixels wide (the content of the tab, before the handle and
 * the row): the width chosen, snapped, while the room holds it; else as wide as the room down to
 * LIST_WIDE_MIN, then narrow down to LIST_NARROW; null below that, when no list is drawn. A body
 * not yet measured (0) draws the width chosen.
 */
function listFit(chosen: number | null, body: number): ListFit | null {
    const wanted = snapped(chosen ?? LIST_DEFAULT);
    const room = body > 0 ? roomIn(body) : wanted;
    if (room >= wanted) return { width: wanted, narrow: wanted < LIST_WIDE_MIN };
    if (room >= LIST_WIDE_MIN) return { width: room, narrow: false };
    if (room >= LIST_NARROW) return { width: LIST_NARROW, narrow: true };
    return null;
}

/**
 * The width chosen after a drag of the handle by `delta` pixels (to the right shrinks the list),
 * from the width drawn: no less than LIST_NARROW, and no more than LIST_MAX or the room the body
 * leaves.
 */
function draggedWidth(chosen: number | null, delta: number, body: number): number {
    const room = body > 0 ? Math.max(roomIn(body), LIST_NARROW) : LIST_MAX;
    const from = Math.min(chosen ?? LIST_DEFAULT, room);
    return Math.max(LIST_NARROW, Math.min(LIST_MAX, room, from - delta));
}

/** The width a tab's ui record holds, or null for none, or one out of the bounds. */
function listWidthOf(record: unknown): number | null {
    return readAs(widthShape, record)?.[WIDTH_FIELD] ?? null;
}

/** A tab's ui record with the width chosen, or without it for null; the rest is kept. */
function withListWidth(record: unknown, width: number | null): Record<string, unknown> {
    const { [WIDTH_FIELD]: _dropped, ...rest } = instanceMap(record);
    return width === null ? rest : { ...rest, [WIDTH_FIELD]: width };
}

/** What the list's width reads and writes of the tab. */
export type ListWidthDeps = {
    /** The tab's ui record. */
    record: () => unknown;
    /** Replace it. */
    write: (record: Record<string, unknown>) => void;
    /** Whether the tab draws a list at all (terminal-list.ts, `listDrawn`). */
    listed: () => boolean;
    /** The width of the tab's content, in pixels, 0 before it is measured. */
    body: () => number;
};

/** The list's width of one tab: how it is drawn, and the handle's drag and double click. */
export function createListWidth(deps: ListWidthDeps): {
    fit: () => ListFit | null;
    moved: (delta: number) => void;
    reset: () => void;
} {
    const chosen = $derived(listWidthOf(deps.record()));
    const fit = $derived(deps.listed() ? listFit(chosen, deps.body()) : null);
    return {
        fit: () => fit,
        moved: (delta) =>
            deps.write(withListWidth(deps.record(), draggedWidth(chosen, delta, deps.body()))),
        reset: () => deps.write(withListWidth(deps.record(), null))
    };
}
