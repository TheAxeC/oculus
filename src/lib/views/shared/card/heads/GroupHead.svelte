<script lang="ts">
    // Layer 3, view partial shared by the project boards, the Focus board and the Venues view. The
    // heading of a group of cards that folds: the fold control (FoldControl.svelte beside it), a
    // bare button named "Fold <name>" or "Unfold <name>" with the fold glyph of the state, then the
    // group's glyph, where it has one, then its label at the medium size in the group's hue, in the
    // muted text colour where it has none, then its count as plain text at the small size in the
    // same colour. A project board heads each category's section of its cards and its list with
    // it, in the category's colour (views/boards/projects/Projects.svelte); the Focus board heads
    // each `columns` cluster, each lane's section of a `full_width` cluster, in the lane's colour,
    // and the band of funding, positions and teaching with it
    // (views/boards/focus/lanes/Lanes.svelte, views/boards/focus/Band.svelte); the Venues view
    // heads each section of `venue_categories` (views/sources/venues/Venues.svelte). It holds no
    // state: each of them keeps which of its groups are folded. FoldHead.svelte beside it heads a
    // box instead, with its count as a badge: the Career banner, the command center and the tasks
    // section of Focus.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import FoldControl from './FoldControl.svelte';

    type Props = {
        /** The words of the heading. */
        label: string;
        /** The words the fold control is named with, after "Fold" or "Unfold". */
        name: string;
        /** Whether the group is open, and the press of the fold control. */
        open: boolean;
        ontoggle: () => void;
        /**
         * A hue name the label and the count are drawn in, or nothing for the muted text colour.
         */
        tone?: string;
        /** The glyph name drawn before the label, or nothing for a group with none. */
        glyph?: string;
        /** How many the group holds, drawn after the label, or nothing. */
        count?: number;
    };

    let { label, name, open, ontoggle, tone, glyph, count }: Props = $props();
</script>

<h3 class="group" style={tone === undefined ? undefined : `--group: var(--c-${tone}-txt)`}>
    <FoldControl {name} {open} {ontoggle} />
    <span class="words">
        {#if glyph !== undefined}
            <Glyph name={glyph} />
        {/if}
        <span class="label">{label}</span>
        {#if count !== undefined}
            <span class="count">{count}</span>
        {/if}
    </span>
</h3>

<style>
    /* The fold control stands on the heading's centre line; the label and the count share a
       baseline after it. */
    .group {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin: 0;
        font-size: var(--fs-md);
        color: var(--group, var(--muted-txt));
    }

    .words {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
    }

    /* A label longer than the pane is cut with an ellipsis, so the heading stays one line. */
    .label {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .count {
        font-size: var(--fs-sm);
    }
</style>
