<script lang="ts">
    // Layer 3, Map partial. The relationship legend under the heading: the two project types as
    // chips in their tones and the pillar line mark. It holds no control; the filters are the
    // bar's (Controls.svelte).

    import Chip from '$lib/ui/controls/Chip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { typeTone } from '$lib/state/shared/words/tones';
</script>

<div class="legend">
    <Chip label={t('map.legend_active')} tone={typeTone('active')} filled />
    <Chip label={t('map.legend_idea')} tone={typeTone('idea')} filled />
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
