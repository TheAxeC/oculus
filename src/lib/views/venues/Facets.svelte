<script lang="ts">
    // Layer 3, Venues view partial. The theme toggle row, with counts from the pure venue state.
    // It owns no selection: the view passes what is off and receives each toggle.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import type { ThemeFacet } from '$lib/state/venues';

    type Props = {
        facets: ThemeFacet[];
        off: string[];
        ontoggle: (theme: string) => void;
    };

    let { facets, off, ontoggle }: Props = $props();
</script>

{#if facets.length > 0}
    <div class="facets" role="group" aria-label={t('col.ven_themes_facet')}>
        <span class="label">{t('col.ven_themes_facet')}</span>
        {#each facets as facet (facet.theme)}
            <ToolButton
                label={`${facet.theme} ${facet.count}`}
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
        margin-bottom: 10px;
    }

    .label {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-xs);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
</style>
