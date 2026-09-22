<script lang="ts">
    // Layer 3, primitive. A row of controls. It is a strip and a name and nothing else: the
    // buttons, the segments and the search boxes in it are the caller's snippet.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The strip's accessible name, already translated by the view. */
        label: string;
        children?: Snippet;
    };

    let { label, children }: Props = $props();
</script>

<div class="toolbar" role="toolbar" aria-label={label}>
    {#if children}
        {@render children()}
    {/if}
</div>

<style>
    .toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 0;
    }
</style>
