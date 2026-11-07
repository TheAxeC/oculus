<script lang="ts">
    // Layer 3, shared view. The body every record card draws on its own page, under the closed
    // card: two columns while each can be at least 320 px wide, the right one under the left in a
    // narrower pane, each holding the card's fields under their labels (RecordField.svelte beside
    // this file). The record card (RecordCard.svelte beside this file) draws it on the page of an
    // entry, a venue, a dataset, a domain and a pillar line from the two columns their cards hand
    // it, and the project card draws it in views/shared/card/project/CardDetails.svelte; the right
    // column ends with what the card puts after its fields, its subtasks, follow-ups and deadline
    // form, so every record page reads in one layout.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The fields of the left column. */
        left?: Snippet;
        /** The fields of the right column. */
        right?: Snippet;
        /** What the right column holds after its fields. */
        children?: Snippet;
    };

    let { left, right, children }: Props = $props();
</script>

<div class="more">
    <div class="column">
        {@render left?.()}
    </div>
    <div class="column">
        {@render right?.()}
        {@render children?.()}
    </div>
</div>

<style>
    /* The left column comes first in the page, so it stays on top when they stack. */
    .more {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
        column-gap: 20px;
        align-items: start;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .column {
        min-width: 0;
    }
</style>
