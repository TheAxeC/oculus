<script lang="ts">
    // Layer 3, Data view partial. The modality toggles with counts and registry display labels.
    // It owns no selection: the view passes disabled facets and receives each toggle.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import type { ThemeFacet } from '$lib/state/datasets';

    type Props = {
        facets: ThemeFacet[];
        off: string[];
        ontoggle: (theme: string) => void;
    };

    let { facets, off, ontoggle }: Props = $props();
</script>

{#if facets.length > 0}
    <div class="facets" role="group" aria-label={t('col.ds_modality_facet')}>
        <span class="label">{t('col.ds_modality_facet')}</span>
        {#each facets as facet (facet.theme)}
            <ToolButton
                label={`${facet.label} ${facet.count}`}
                active={!off.includes(facet.theme)}
                onclick={() => ontoggle(facet.theme)}
            />
        {/each}
    </div>
{/if}

<style>
    .facets {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin: 10px 0;
    }

    .label {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-xxs);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
</style>
