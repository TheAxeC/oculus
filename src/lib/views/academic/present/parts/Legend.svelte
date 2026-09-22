<script lang="ts">
    // Layer 3, Present partial. The row of hue chips under an opening or a section slide. The deck
    // writes each one's colour and the state layer resolves it to a palette hue, so the chip is the
    // app's own chip in one of the app's own hues.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import type { DeckChip } from '$lib/state/life/present';

    type Props = { chips: DeckChip[] };

    let { chips }: Props = $props();
</script>

{#if chips.length > 0}
    <div class="legend">
        {#each chips as chip (chip.label)}
            <Tag label={chip.label} tone={chip.tone} />
        {/each}
    </div>
{/if}

<style>
    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 20px 0 6px;
    }
</style>
