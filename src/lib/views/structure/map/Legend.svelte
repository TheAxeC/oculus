<script lang="ts">
    // Layer 3, Map partial. The relationship legend under the heading: each project type the graph
    // draws, as a chip in the tone its nodes are drawn in, and the pillar line mark. It holds no
    // control; the filters are the bar's (Controls.svelte).

    import Chip from '$lib/ui/controls/Chip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { typeTone } from '$lib/state/shared/words/tones';

    type Props = {
        /** The types of the projects the graph draws, in the order of the bar's type chips. */
        types: string[];
    };
    let { types }: Props = $props();
</script>

<div class="legend">
    {#each types as type (type)}
        <Chip label={type} tone={typeTone(type)} filled />
    {/each}
    <span class="line-dot"></span>
    <span>{t('map.legend_line')}</span>
</div>

<style>
    .legend {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .line-dot {
        width: 0;
        height: 0;
        border: 5px solid var(--map-line);
    }
</style>
