<script lang="ts">
    // Layer 3, Venues view partial. The theme toggle row, each with its venue_themes label and count
    // from the pure venue state. It owns no selection: the view passes what is off and receives each
    // toggle.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/words/text';
    import type { ThemeFacet } from '$lib/state/words/themes';

    type Props = {
        facets: ThemeFacet[];
        off: string[];
        ontoggle: (theme: string) => void;
        /** What the view draws at the end of the same wrapping row, so it never lands alone. */
        children?: Snippet;
    };

    let { facets, off, ontoggle, children }: Props = $props();
</script>

{#if facets.length > 0 || children !== undefined}
    <div class="facets" role="group" aria-label={t('venues.themes_facet')}>
        <span class="label">{t('venues.themes_facet')}</span>
        {#each facets as facet (facet.theme)}
            <ToolButton
                label={`${facet.label} ${facet.count}`}
                active={!off.includes(facet.theme)}
                onclick={() => ontoggle(facet.theme)}
            />
        {/each}
        {#if children}
            {@render children()}
        {/if}
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
        font-size: var(--fs-xxs);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
</style>
