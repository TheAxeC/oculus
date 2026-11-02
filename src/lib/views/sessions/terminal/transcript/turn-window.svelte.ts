// Layer 3, view support. Which rows of a transcript the page holds: the flat rows in view and
// OVERSCAN rows past each edge (ui/tree/list/virtual.ts), through @tanstack/virtual-core's
// virtualizer driven from this state, so a session of any size keeps only the turns near the view
// in the page. It is made in TranscriptBody.svelte rather than in the list, so the heights outlive
// the error box that takes the list away. ui/tree/list/VirtualRows.svelte draws `li` elements at a
// tree's row height, which a Transcript's rows are not, so this file shares its rules and none of
// its markup.
//
// Heights. The ResizeObserver the virtualizer keeps is the trigger, and the value is a row's
// `getBoundingClientRect`, since an observer's entry leaves CSS `zoom` out and the default rounds.
// `zoom` stands on each row's box, so a spacer's px are the column's px. A row not yet measured
// stands at an estimate from its own kind and length, taken once for its key and never changed by a
// measurement, so measuring one row moves no other row. After a change of width or zoom the drawn
// rows measure again and the others stand at the height they had until they draw. A column with
// no height keeps its last window and measures nothing, since the virtualizer gives no rows there
// and a hidden row would read 0. The virtualizer's own correction of `scrollTop` is off:
// reader-place.ts is the one owner of it.
//
// Rows that stay drawn outside the window. A selection keeps every row between its two ends, so
// Copy carries the whole text however far it spans, and a selection covering the list, which Cmd+A
// is, draws every held row; that costs a slow moment on a very long list. A collapsed caret, the
// focus, the rows the reader's place stands on and a row asked for (`showRow`) stay drawn too, each
// counted apart from the selection: a caret's row stays because a shift-click extends from it.
//
// A row that leaves the page loses what it held, so an open `details` and a code block's or a
// table's sideways scroll are noted by the row's key as they change, since a removed element reads
// a scroll of 0, and restored when the row draws again.
//
// Tab reaches a row that is not drawn. From the last stop of a row, Tab and Shift+Tab move to the
// next row that holds one, known from its data (turn-rows.ts, `nextStopRow`), drawing it first, and
// past the last such row the key is left to the browser, which leaves the list.
//
// Every height, estimate and held look is dropped with the target and when a read from the start
// replaces the list (`drop`), since a key then names another turn.

import { tick, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import {
    Virtualizer,
    elementScroll,
    observeElementOffset,
    observeElementRect
} from '@tanstack/virtual-core';
import {
    OVERSCAN,
    firstWindow,
    keptRange,
    offsetIn,
    rowWindow,
    type RowWindow
} from '$lib/ui/tree/list/virtual';
import { rowBox, rowKey } from './reader-place';
import { nextStopRow, rowEstimate, rowPlace, type FlatRow } from './turn-rows';

/** An end of a selection that stands before the list. */
export const BEFORE_LIST = 'before';

/** An end of a selection that stands after the list. */
export const AFTER_LIST = 'after';

/** A selection as its two ends read: a row's key, or the side of the list an end stands on. */
export type RowSelection = { from: string; to: string; collapsed: boolean };

/** The index of the row an end stands for. A key gone reads as the last row at or before it. */
function endIndex(end: string, rows: readonly Pick<FlatRow, 'key' | 'at'>[]): number {
    if (end === BEFORE_LIST) return 0;
    if (end === AFTER_LIST) return rows.length - 1;
    const found = rows.findIndex((row) => row.key === end);
    if (found >= 0) return found;
    const place = rowPlace(end);
    return Math.max(
        0,
        rows.findLastIndex((row) => row.at <= place)
    );
}

/**
 * The indexes of the rows a selection keeps drawn: every row between its two ends, whichever way
 * round, none for a collapsed selection or one wholly on one side of the list. A selection covering
 * the list keeps every row, since its ends stand before and after it.
 */
export function selectionRows(
    selection: RowSelection | null,
    rows: readonly Pick<FlatRow, 'key' | 'at'>[]
): number[] {
    if (selection === null || selection.collapsed || rows.length === 0) return [];
    const { from, to } = selection;
    if (from === to && (from === BEFORE_LIST || from === AFTER_LIST)) return [];
    const one = endIndex(from, rows);
    const two = endIndex(to, rows);
    const first = Math.min(one, two);
    return Array.from({ length: Math.abs(one - two) + 1 }, (_, offset) => first + offset);
}

/** A child of the list as an element, a text or comment marker reading as the next element. */
function elementAt(child: ChildNode | null): Element | null {
    if (child instanceof Element) return child;
    return child instanceof CharacterData ? child.nextElementSibling : null;
}

/** The child of `list` a node stands in, or null for the list itself or a node outside it. */
function rowHolding(node: Node, list: Element): Element | null {
    for (let at: Node | null = node; at !== null && at !== list; at = at.parentNode) {
        if (at.parentNode === list) return elementAt(at as ChildNode);
    }
    return null;
}

/** The key of the row at or nearest a child of the list, searched past spacers, or null. */
function nearestKey(child: Element | null, list: Element): string | null {
    for (let at = child; at !== null; at = at.nextElementSibling) {
        const key = rowKey(at);
        if (key !== null) return key;
    }
    for (let at = child ?? list.lastElementChild; at !== null; at = at.previousElementSibling) {
        const key = rowKey(at);
        if (key !== null) return key;
    }
    return null;
}

/**
 * What one end of the page's selection stands for in `list`. An end inside the list with no row of
 * its own, on the list or on a spacer, reads as the nearest row drawn. An end that holds the list,
 * which is where Cmd+A leaves both, stands before or after it by its offset.
 */
function endOf(node: Node, offset: number, list: Element, span: Range): string {
    const side = span.comparePoint(node, offset);
    if (side < 0) return BEFORE_LIST;
    if (side > 0) return AFTER_LIST;
    const child = node === list ? elementAt(list.childNodes.item(offset)) : rowHolding(node, list);
    return nearestKey(child, list) ?? BEFORE_LIST;
}

/** What a row held that its element takes with it: by each element's place in the row. */
type RowLook = { open: Map<number, boolean>; sideways: Map<number, number> };

/** What scrolls sideways in an answer (shared/prose/Markdown.svelte). */
const SIDEWAYS = 'pre, table';

/** What takes the keyboard in a row. */
const STOPS =
    'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** The keyboard stops of a drawn row, in order, without those of a closed `details`. */
function stopsIn(row: Element): HTMLElement[] {
    return [...row.querySelectorAll<HTMLElement>(STOPS)].filter((stop) => stop.checkVisibility());
}

/** One drawn row: the row, its index in the flat rows, the height held before it. */
type DrawnTurn = { row: FlatRow; index: number; gap: number };

/** What the list draws: its rows, and the height held after the last of them. */
type DrawnTurns = { rows: DrawnTurn[]; after: number };

type WindowOptions = {
    /** The column that scrolls. */
    column: () => HTMLElement | null | undefined;
    /** The box the rows are drawn in. */
    list: () => HTMLElement | null | undefined;
    /** The flat rows of the list. */
    rows: () => readonly FlatRow[];
    /** The keys of the rows the reader's place stands on. */
    anchored: () => readonly string[];
};

/** The window of one transcript's column, made while its component initialises. */
export function turnWindow(options: WindowOptions) {
    /** The column once this window has started on it. */
    let scroller: HTMLElement | null = $state(null);
    /** The list's offset in its column, in px. */
    let margin = $state(0);
    /** Counts the virtualizer's word that its window moved, so the window is read again. */
    let moved = $state(0);
    /** The window read last, kept while the column has no height and to settle a draw. */
    let held: RowWindow = firstWindow(0);
    /** The page's selection, as it reads against the list. */
    let picked = $state.raw<RowSelection | null>(null);
    /** The key of the row the focus is in, or null. */
    let focused: string | null = $state(null);
    /** The key of a row asked for, drawn wherever the list is scrolled until it was used. */
    let asked: string | null = $state(null);

    /** Each row's estimate, by key, taken once. */
    const estimates = new Map<string, number>();
    /** What each row that left the page held, by key. */
    const looks = new Map<string, RowLook>();

    /** The rows the virtualizer was last handed. */
    let listed: readonly FlatRow[] = [];
    /** The key of an index in `listed`, a new function for each list, which measures it anew. */
    let keyOf = (index: number): string => listed[index].key;

    function estimate(row: FlatRow): number {
        const taken = estimates.get(row.key) ?? rowEstimate(row);
        estimates.set(row.key, taken);
        return taken;
    }

    const virtualizer = new Virtualizer<HTMLElement, HTMLElement>({
        count: 0,
        getScrollElement: () => scroller,
        estimateSize: (index) => estimate(listed[index]),
        overscan: OVERSCAN,
        observeElementRect,
        observeElementOffset,
        scrollToFn: elementScroll,
        measureElement: (node: HTMLElement): number => {
            if (scroller !== null && scroller.clientHeight > 0) {
                return node.getBoundingClientRect().height;
            }
            const row = listed[Number(node.getAttribute('data-index'))];
            return virtualizer.itemSizeCache.get(row.key) ?? estimate(row);
        },
        onChange: () => {
            moved += 1;
        }
    });
    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = () => false;

    /** Where each key stands in the flat rows. */
    const places = $derived(new Map(options.rows().map((row, index) => [row.key, index])));

    const selected = $derived(selectionRows(picked, options.rows()));

    /** The row of a collapsed caret, which a shift-click extends from. */
    const caret = $derived(picked?.collapsed === true ? picked.from : null);

    /** The indexes kept drawn wherever the list is scrolled. */
    function keptRows(): number[] {
        const keys = [caret, focused, asked, ...options.anchored()];
        return [...selected, ...keys.flatMap((key) => places.get(key ?? '') ?? [])];
    }

    /** Hand the virtualizer the list as it is now. */
    function configure(rows: readonly FlatRow[], offset: number): void {
        if (rows !== listed) {
            listed = rows;
            keyOf = (index) => rows[index].key;
        }
        const kept = keptRows();
        virtualizer.setOptions({
            ...virtualizer.options,
            count: rows.length,
            getItemKey: keyOf,
            scrollMargin: offset,
            rangeExtractor: (range) => keptRange(range, kept)
        });
    }

    /**
     * The window for the list as it is now, read here rather than written by an effect, so what
     * reads it never gets a window of a list that has since shrunk. The first rows stand until the
     * column is found, and a column with no height keeps the window it had.
     */
    const inView = $derived.by(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the read is the dependency
        moved;
        const rows = options.rows();
        if (scroller === null) return firstWindow(rows.length);
        configure(rows, margin);
        if ((virtualizer.scrollRect?.height ?? 0) > 0) held = rowWindow(virtualizer, held);
        return held;
    });

    const drawn: DrawnTurns = $derived.by(() => {
        const rows = options.rows();
        return {
            rows: inView.rows
                .filter(({ index }) => index < rows.length)
                .map(({ index, gap }) => ({ row: rows[index], index, gap })),
            after: inView.after
        };
    });

    // The column stands as long as the component, so one start covers its life; a list that comes
    // and goes around the error box finds the virtualizer still running.
    $effect(() => {
        const box = options.column();
        if (!box) return;
        return untrack(() => {
            scroller = box;
            const stop = virtualizer._didMount();
            virtualizer._willUpdate();
            return () => {
                stop();
                scroller = null;
            };
        });
    });

    /** Read what the page's selection stands on, which keeps rows drawn. */
    function readSelection(): void {
        const list = options.list();
        const selection = document.getSelection();
        const from = selection?.anchorNode ?? null;
        const to = selection?.focusNode ?? null;
        if (!list || !selection || from === null || to === null) {
            picked = null;
            return;
        }
        const span = document.createRange();
        span.selectNodeContents(list);
        const next = {
            from: endOf(from, selection.anchorOffset, list, span),
            to: endOf(to, selection.focusOffset, list, span),
            collapsed: selection.isCollapsed
        };
        const same =
            picked?.from === next.from &&
            picked.to === next.to &&
            picked.collapsed === next.collapsed;
        if (!same) picked = next;
    }

    $effect(() => {
        document.addEventListener('selectionchange', readSelection);
        return () => {
            document.removeEventListener('selectionchange', readSelection);
        };
    });

    /** The look held for a row, made at the first thing it holds. */
    function lookOf(key: string): RowLook {
        const look = looks.get(key) ?? { open: new Map(), sideways: new Map() };
        looks.set(key, look);
        return look;
    }

    /** An open or closed `details` of a row, noted by its place in the row. */
    function noteToggle(event: Event): void {
        const list = options.list();
        const target = event.target;
        if (!list || !(target instanceof HTMLDetailsElement)) return;
        const row = rowHolding(target, list);
        const key = row === null ? null : rowKey(row);
        if (row === null || key === null) return;
        const at = [...row.querySelectorAll('details')].indexOf(target);
        lookOf(key).open.set(at, target.open);
    }

    /** A sideways scroll in a row, noted as it happens, since a removed element reads none. */
    function noteScroll(event: Event): void {
        const list = options.list();
        const target = event.target;
        if (!list || !(target instanceof Element)) return;
        const row = rowHolding(target, list);
        const key = row === null ? null : rowKey(row);
        if (row === null || key === null) return;
        const at = [...row.querySelectorAll(SIDEWAYS)].indexOf(target);
        if (at >= 0) lookOf(key).sideways.set(at, target.scrollLeft);
    }

    /** Give a row that draws again what it held when it left. */
    function restore(row: HTMLElement): void {
        const look = looks.get(rowKey(row) ?? '');
        if (look === undefined) return;
        const details = [...row.querySelectorAll('details')];
        for (const [at, open] of look.open) {
            const box = details.at(at);
            if (box !== undefined) box.open = open;
        }
        const sideways = [...row.querySelectorAll(SIDEWAYS)];
        for (const [at, left] of look.sideways) {
            const box = sideways.at(at);
            if (box !== undefined) box.scrollLeft = left;
        }
    }

    /** Keep a row drawn and answer its element once the page holds it. */
    async function rowDrawn(key: string): Promise<Element | undefined> {
        asked = key;
        await tick();
        const list = options.list();
        return list ? rowBox(list, key) : undefined;
    }

    /** Move the focus to the next row past `from` that really takes it. */
    async function moveFocus(from: number, step: 1 | -1): Promise<void> {
        const rows = options.rows();
        for (let at = nextStopRow(rows, from, step); at >= 0; at = nextStopRow(rows, at, step)) {
            const row = await rowDrawn(rows[at].key);
            const stops = row === undefined ? [] : stopsIn(row);
            const stop = step > 0 ? stops.at(0) : stops.at(-1);
            if (stop !== undefined) {
                stop.focus();
                break;
            }
        }
        asked = null;
    }

    /** Tab at the edge of a row goes to the next row that holds a stop, drawn or not. */
    function tabbed(event: KeyboardEvent): void {
        const plain = !event.altKey && !event.ctrlKey && !event.metaKey;
        const list = options.list();
        const key = focused;
        if (event.key !== 'Tab' || !plain || !list || key === null) return;
        const at = places.get(key);
        const row = rowBox(list, key);
        if (at === undefined || row === undefined) return;
        const step = event.shiftKey ? -1 : 1;
        const stops = stopsIn(row);
        const here = stops.indexOf(document.activeElement as HTMLElement);
        if (here + step >= 0 && here + step < stops.length) return;
        if (nextStopRow(options.rows(), at, step) < 0) return;
        event.preventDefault();
        void moveFocus(at, step);
    }

    /** Measure a row now. A spacer has no index, and a column with no height measures nothing. */
    function measureNow(row: Element): void {
        const index = row.getAttribute('data-index');
        if (index === null || scroller === null || scroller.clientHeight === 0) return;
        virtualizer.resizeItem(Number(index), row.getBoundingClientRect().height);
    }

    /** Measure the drawn rows again, for a change no observer need report. */
    function measureDrawn(): void {
        const list = options.list();
        if (list) [...list.children].forEach(measureNow);
    }

    return {
        /** What the list draws. */
        get drawn() {
            return drawn;
        },
        /** The attachment of the list, which hears what a row cannot be asked for once gone. */
        heard: ((list) => {
            const stop = new AbortController();
            const { signal } = stop;
            list.addEventListener(
                'focusin',
                (event) => {
                    const row = rowHolding(event.target as Node, list);
                    focused = row === null ? null : rowKey(row);
                },
                { signal }
            );
            list.addEventListener(
                'focusout',
                (event) => {
                    // A window losing focus gives it back to the same element, so its row stays.
                    const next = event.relatedTarget;
                    if (next === null && !document.hasFocus()) return;
                    if (!(next instanceof Node) || !list.contains(next)) focused = null;
                },
                { signal }
            );
            list.addEventListener('keydown', tabbed, { signal });
            list.addEventListener('toggle', noteToggle, { signal, capture: true });
            list.addEventListener('scroll', noteScroll, { signal, capture: true });
            return () => {
                stop.abort();
            };
        }) satisfies Attachment<HTMLElement>,
        /**
         * The attachment of a row's box, which restores it and has its height measured and watched.
         * A row drawn before the column is found runs it again then, since `scroller` is read here
         * and the virtualizer observes no row while its list is empty. The virtualizer does not
         * measure a row while the column scrolls and leaves it to its observer, which cannot report
         * inside a draw, and a row whose height the window does not hold moves the column when it
         * is drawn, so the words held then take it out of the window again, without end.
         */
        measured: ((row) => {
            if (scroller === null) return;
            untrack(() => {
                restore(row);
                virtualizer.measureElement(row);
                measureNow(row);
            });
        }) satisfies Attachment<HTMLElement>,
        /** Read the list's offset in its column again, which the line above the list moves. */
        readMargin: (): void => {
            const box = options.column();
            const list = options.list();
            if (!box || !list || box.clientHeight === 0) return;
            const next = Math.round(offsetIn(list, box));
            untrack(() => {
                if (next !== margin) margin = next;
            });
        },
        /** Measure the drawn rows again, for a zoom, which may fire no observer. */
        measureDrawn,
        /**
         * Tell the window where the column stands after a write, ahead of the scroll event, so the
         * rows under the new place draw in this frame.
         */
        sync: (): void => {
            const box = scroller;
            if (box === null || box.clientHeight === 0) return;
            if (virtualizer.scrollOffset === box.scrollTop) return;
            virtualizer.scrollOffset = box.scrollTop;
            untrack(() => {
                moved += 1;
            });
        },
        /** Draw a row, run `act`, and let the row go back to the window. */
        showRow: async (key: string, act: () => void): Promise<void> => {
            await rowDrawn(key);
            act();
            asked = null;
        },
        /** Drop every height, estimate and held look, whose keys no longer name these turns. */
        drop: (): void => {
            estimates.clear();
            looks.clear();
            picked = null;
            focused = null;
            virtualizer.measure();
            void tick().then(measureDrawn);
        }
    };
}

/** The window of one column. */
export type TurnWindow = ReturnType<typeof turnWindow>;
