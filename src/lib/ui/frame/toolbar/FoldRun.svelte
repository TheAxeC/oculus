<script lang="ts" generics="T">
    // Layer 3, primitive. A run of controls in a bar line that stays one line at any width: the
    // controls the line has no room for fold, last in, first out, into an opener the caller draws
    // after the run, as many as fit.ts's `fit` gives over their measured widths. A folded control
    // stays in the run, hidden and out of the tab order, so its width is measured again whenever
    // the line or a control changes (watch.ts), and the run is cut to the width of the controls
    // shown. The measuring needs a layout, so a render with none draws every control.
    //
    // The caller gives the line the run sits in (`box`), whose width is the room, and what room
    // the run has beside the line's other controls and how wide its opener is (`room`); `keep`
    // lowers the count drawn, for a run whose last drawn control must not be a heading. `shown` is
    // bound back, so the caller draws its opener and fills it with what folded. The fold is
    // written once here so every line that folds measures the same way.

    import type { Snippet } from 'svelte';
    import { fit } from './fit';
    import { watchToolbar } from './watch';

    type Props = {
        /** The run's items, one control each, in the order drawn. */
        items: T[];
        /** Each item's key in the run. */
        key: (item: T) => string;
        /** Draws one item's control. */
        item: Snippet<[T]>;
        /** The line the run sits in, whose width is the room; null while it is not drawn. */
        box: HTMLElement | null;
        /**
         * The room the run has in `box` beside the line's other controls, given the gap between
         * two controls of the line, and the width of the opener drawn after the run while some
         * controls fold; null while a box the room is read from is not drawn, which measures
         * nothing.
         */
        room: (gap: number) => { room: number; opener: number } | null;
        /** How many controls are drawn, given how many fit; all that fit by default. */
        keep?: (fits: number) => number;
        /** How many controls the run draws while some fold, and null while all are drawn. */
        shown?: number | null;
    };

    let {
        items,
        key,
        item,
        box,
        room,
        keep = (fits: number) => fits,
        shown = $bindable(null)
    }: Props = $props();

    let run = $state<HTMLElement | null>(null);
    /** The widths of the controls, for the run's width while some fold. */
    let widths: number[] = $state([]);

    /** The space between two controls of the line. */
    function gapOf(line: HTMLElement): number {
        return parseFloat(getComputedStyle(line).columnGap) || 0;
    }

    const width = $derived.by(() => {
        if (shown === null) return undefined;
        const gap = box === null ? 0 : gapOf(box);
        const kept = widths.slice(0, shown);
        return kept.reduce((sum, one) => sum + one, 0) + gap * Math.max(0, kept.length - 1);
    });

    /** How many controls fit in the room the caller gives, with the opener after them. */
    function measure(): void {
        if (box === null || run === null) return;
        if (box.getClientRects().length === 0) return;
        const gap = gapOf(box);
        const space = room(gap);
        if (space === null) return;
        widths = Array.from(run.children)
            .filter((one): one is HTMLElement => one instanceof HTMLElement)
            .map((one) => one.getBoundingClientRect().width);
        const result = fit(widths, space.room, space.opener, gap);
        shown = result.opener ? keep(result.shown) : null;
    }

    /** Whether the control at `at` is folded into the opener. */
    function clipped(at: number): boolean {
        return shown !== null && at >= shown;
    }

    $effect(() => {
        if (box === null || run === null) return;
        const line = box;
        const stopRun = watchToolbar(line, run, measure);
        const stopLine = watchToolbar(line, line, measure);
        return () => {
            stopRun();
            stopLine();
        };
    });
</script>

<div class="run" bind:this={run} style:width={width === undefined ? undefined : `${width}px`}>
    {#each items as one, at (key(one))}
        <span class="slot" class:clipped={clipped(at)} inert={clipped(at)}>
            {@render item(one)}
        </span>
    {/each}
</div>

<style>
    /* The controls: those past the room are hidden whole and out of the tab order, and the run is
       cut to the width of those shown, so the hidden ones keep their measured width. */
    .run {
        display: flex;
        flex: none;
        align-items: center;
        gap: 6px;
        min-width: 0;
        overflow: hidden;
    }

    .slot {
        display: inline-flex;
        flex: none;
    }

    .slot.clipped {
        visibility: hidden;
    }
</style>
