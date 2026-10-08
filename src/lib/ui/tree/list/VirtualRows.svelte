<script lang="ts">
    // Layer 3, primitive. A long list of explorer rows that draws only the rows in view, through
    // @tanstack/virtual-core's virtualizer driven from this component's state. It sits inside the
    // caller's `ul` and draws `li` elements: before each drawn row a spacer holding the height of
    // the rows not drawn above it, the rows through the caller's snippet, and after the last a
    // spacer holding the height of the rows below it, so the list keeps its full height and the
    // scroll box's bar and the rows after the list are where they would be with every row drawn
    // (ui/tree/list/virtual.ts).
    //
    // The list keeps its place in its view: the box that scrolls is the pane body around it
    // (`data-scroll`, ui/frame/Pane.svelte), and the list's offset in that box is the virtualizer's
    // scroll margin, read again whenever the box scrolls or something around the list changes size.
    // A row's height is estimated from a hidden probe drawn at `--tree-row` times the text scale,
    // the height ui/tree/TreeItem.svelte draws a row at, so a text scale change keeps the window
    // right; each drawn row is then measured, which is what a row taller than one line (a gap above
    // it, a commit with its files open under it) is drawn at. A few rows past each edge are drawn
    // as well, and a box with no height draws no row until it has one. Until the list has found
    // its scroll box, as on the server and at the first render in the page, it draws its first
    // rows (two overscans) and holds the rest at `--tree-row` times the text scale.
    //
    // A list in a ui/tree/TreeView.svelte registers with it through `nav`: a key that moves the
    // focus to a row the list holds but has not drawn has the list scroll the row into view and
    // focus it once it is drawn, and the type-ahead reads the labels of rows not drawn from it.
    // The rows the tree keeps (`nav.kept`: the row holding its stop and the row the focus is in),
    // and the items the caller keeps, stay drawn wherever the list is scrolled, so Tab always finds
    // the tree's stop and a scroll never takes the focus out of the page.

    import { tick, untrack, type Snippet } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import {
        Virtualizer,
        elementScroll,
        type Range,
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
    } from './virtual.ts';
    import type { TreeNav } from '../tree-keys.ts';

    type Props = {
        /** How many items the list holds. */
        count: number;
        /** The key of one item, which keeps its measured height while items come and go. */
        key: (index: number) => string;
        /** The tree the rows are drawn in, which the list registers with. */
        nav?: TreeNav;
        /** The index of the item drawing the row `id`, or -1 for a row the list does not hold. */
        owns?: (id: string) => number;
        /** The label of a row the list holds, for the type-ahead. */
        label?: (id: string) => string | undefined;
        /** The items the caller keeps drawn wherever the list is scrolled. */
        keep?: readonly number[];
        /**
         * One item, handed its index and the attachment its outermost element carries so its height
         * is measured.
         */
        item: Snippet<[number, Attachment<HTMLElement>]>;
    };

    let { count, key, nav, owns, label, keep = [], item }: Props = $props();

    /** The spacer before the first drawn row, which is where the list starts in its scroll box. */
    let top: HTMLLIElement | undefined = $state();
    let probe: HTMLLIElement | undefined = $state();
    /** The scroll box, once the list is on the page and has found it. */
    let box: HTMLElement | null = $state(null);
    /** A row's height as drawn at the current text scale, in px. */
    let size = $state(0);
    /** The list's offset in its scroll box, in px. */
    let margin = $state(0);
    /** Counts the virtualizer's word that its window moved, so the window is read again. */
    let moved = $state(0);
    /** The window read last, handed back to `rowWindow` so an unchanged window keeps its value. */
    let held: RowWindow = firstWindow(0);
    /** A row a key moved to that is not drawn yet, focused once it is. */
    let pending = $state('');

    const virtualizer = new Virtualizer<HTMLElement, HTMLElement>({
        count: 0,
        getScrollElement: () => box,
        estimateSize: () => size,
        overscan: OVERSCAN,
        observeElementRect,
        observeElementOffset,
        scrollToFn: elementScroll,
        onChange: () => {
            place();
            moved += 1;
        }
    });

    /**
     * The rows drawn: the first ones until the list has found its scroll box, then the window the
     * virtualizer gives for the list as it is now. The window is read here rather than written by
     * an effect, so whatever reads the rows (the each below, run by Svelte ahead of this
     * component's effects when the caller's list changes inside an effect of its own) never gets a
     * window of a list that has since shrunk.
     */
    const drawn = $derived.by(() => {
        if (box === null) return firstWindow(count);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the read is the dependency
        moved;
        configure(count, size, margin, key, kept);
        held = rowWindow(virtualizer, held);
        return held;
    });
    /** How many rows are not drawn, held after the first window at the tokens' row height. */
    const rest = $derived(count - drawn.rows.length);
    /** The items kept drawn: the caller's, and those holding the rows the tree keeps. */
    const kept = $derived([
        ...keep,
        ...(nav?.kept() ?? []).map((id) => owns?.(id) ?? -1).filter((index) => index >= 0)
    ]);

    /** Hand the virtualizer the list as it is now. */
    function configure(
        rows: number,
        height: number,
        offset: number,
        keyOf: (index: number) => string,
        keptRows: readonly number[]
    ): void {
        virtualizer.setOptions({
            ...virtualizer.options,
            count: rows,
            getItemKey: keyOf,
            estimateSize: () => height,
            scrollMargin: offset,
            rangeExtractor: (range: Range) => keptRange(range, keptRows)
        });
    }

    /** Read the list's offset in its scroll box again, which moves when anything above it does. */
    function place(): void {
        if (box === null || top === undefined) return;
        const next = Math.round(offsetIn(top, box));
        if (next !== margin) margin = next;
    }

    /** The attachment that has an item's height measured, keyed by its index. */
    function measureAt(index: number): Attachment<HTMLElement> {
        return (node: HTMLElement) => {
            node.dataset.index = String(index);
            virtualizer.measureElement(node);
        };
    }

    /** Nothing to measure while the list has no scroll box. */
    const idle: Attachment<HTMLElement> = () => undefined;

    /**
     * Find the scroll box and start windowing against it: read a row's height off the probe, read
     * the list's offset, and follow both from then on. Returns what stops it.
     */
    function mount(start: HTMLLIElement, sizer: HTMLLIElement): (() => void) | undefined {
        const found = start.closest<HTMLElement>('[data-scroll]');
        if (found === null) return undefined;
        const read = (): void => {
            const height = sizer.getBoundingClientRect().height;
            if (height > 0 && height !== size) {
                size = height;
                virtualizer.measure();
            }
        };
        read();
        box = found;
        place();
        configure(count, size, margin, key, kept);
        const stop = virtualizer._didMount();
        virtualizer._willUpdate();
        // The probe follows the text scale; each box from the list up to the scroll box grows or
        // shrinks when anything above the list does, which moves the list in the box.
        const scaled = new ResizeObserver(read);
        scaled.observe(sizer);
        const around = new ResizeObserver(place);
        for (let at = start.parentElement; at !== null && at !== found; at = at.parentElement) {
            around.observe(at);
        }
        return () => {
            scaled.disconnect();
            around.disconnect();
            stop();
            box = null;
        };
    }

    $effect(() => {
        const start = top;
        const sizer = probe;
        if (start === undefined || sizer === undefined) return;
        return untrack(() => mount(start, sizer));
    });

    /** Scroll the row `id` into view when the list holds it, and focus it once it is drawn. */
    function reveal(id: string): boolean {
        if (box === null || owns === undefined) return false;
        const index = owns(id);
        if (index < 0) return false;
        pending = id;
        virtualizer.scrollToIndex(index, { align: 'auto' });
        return true;
    }

    $effect(() => {
        if (nav === undefined) return;
        return nav.list({ reveal, label: (id: string) => label?.(id) });
    });

    $effect(() => {
        const id = pending;
        if (id === '' || owns === undefined) return;
        const index = owns(id);
        if (!drawn.rows.some((row) => row.index === index)) return;
        void tick().then(() => {
            if (pending !== id) return;
            pending = '';
            nav?.focus(id);
        });
    });
</script>

<li
    class="spacer"
    aria-hidden="true"
    data-virtual="before"
    style:height="{drawn.rows.at(0)?.gap ?? 0}px"
    bind:this={top}
></li>
<li class="probe" aria-hidden="true" bind:this={probe}></li>
{#each drawn.rows as row, at (key(row.index))}
    {#if at > 0 && row.gap > 0}
        <li class="spacer" aria-hidden="true" data-virtual="gap" style:height="{row.gap}px"></li>
    {/if}
    {@render item(row.index, box === null ? idle : measureAt(row.index))}
{/each}
{#if box === null}
    <li
        class="spacer"
        aria-hidden="true"
        data-virtual="after"
        style:height="calc({rest} * var(--tree-row) * var(--text-scale, 1))"
    ></li>
{:else}
    <li class="spacer" aria-hidden="true" data-virtual="after" style:height="{drawn.after}px"></li>
{/if}

<style>
    .spacer {
        flex: 0 0 auto;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* Drawn at a row's height and never seen, so the list reads that height off the page. */
    .probe {
        position: absolute;
        width: 0;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        margin: 0;
        padding: 0;
        overflow: hidden;
        list-style: none;
        visibility: hidden;
        pointer-events: none;
    }
</style>
