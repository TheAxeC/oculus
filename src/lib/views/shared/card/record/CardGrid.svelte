<script lang="ts">
    // Layer 3, shared view partial. The grid every list of cards is drawn in, so the cards of every
    // view stand in columns of one width and no view writes a grid of its own: columns of at least
    // 320 px in as many as the width holds, one in a narrower one, each keeping its width when a
    // row holds fewer cards than columns (`auto-fill`), so the rest of the row stays empty; a gap
    // of 10 px; the cards of one row one height, in their order, so no empty cell is left under a
    // short card and nothing is reordered to fill one; a card is never wider than its column. A
    // card inside its reveal box (views/shared/card/Reveal.svelte) fills the box, which is
    // stretched with it.
    //
    // The project boards (views/boards/projects/Projects.svelte), the collections
    // (views/boards/collection/Collection.svelte), Venues, Data, Pillars, Domains, Lit Watch's
    // buckets and Dismissed (views/feeds/radar/Bucket.svelte, Radar.svelte), Position Leads' live
    // cards and Expired, LinkedIn's Ideas and Posted, the Career page's groups and the project
    // sections of a page (sets/ProjectCards.svelte) draw their cards through it.

    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children'> & {
        /** The cards. */
        children: Snippet;
    };

    let { children, ...attributes }: Props = $props();
</script>

<div {...attributes} class="cards">
    {@render children()}
</div>

<style>
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        align-items: stretch;
    }

    /* A card is never wider than its column, so a card holding one long line shrinks with the pane
       rather than widening it. */
    .cards > :global(*) {
        min-width: 0;
    }

    .cards > :global([data-reveal]) {
        display: flex;
        flex-direction: column;
    }

    .cards > :global([data-reveal] > *) {
        flex: 1 1 auto;
    }
</style>
