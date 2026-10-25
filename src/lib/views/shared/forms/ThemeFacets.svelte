<script lang="ts">
    // Layer 3, shared view partial. The theme toggles with their count, each a pressable Chip,
    // drawn inside a view's bar under its header: the Data view's modalities and the Venues view's
    // themes. It owns no selection: the view passes what is off and receives what is off after each
    // press (`toggled` of state/shared/lists/lists.ts), so the two views turn a toggle over by one
    // rule. What the view puts after the toggles (the Venues concentration legend) is drawn at the
    // bar's end, so it wraps with them and never lands alone.

    import type { Snippet } from 'svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import { toggled } from '$lib/state/shared/lists/lists';
    import type { ThemeFacet } from '$lib/state/shared/words/themes';

    type Props = {
        facets: ThemeFacet[];
        /** The caption before the toggles. */
        caption: string;
        off: string[];
        /** Keep the theme words that are off after a press. */
        onchange: (off: string[]) => void;
        /** What the view draws at the end of the same wrapping bar. */
        children?: Snippet;
    };

    let { facets, caption, off, onchange, children }: Props = $props();
</script>

{#if facets.length > 0}
    <span class="label">{caption}</span>
    {#each facets as facet (facet.theme)}
        <Chip
            label={`${facet.label} ${facet.count}`}
            pressed={!off.includes(facet.theme)}
            onclick={() => onchange(toggled(off, facet.theme))}
        />
    {/each}
{/if}
{#if children}
    <span class="end">{@render children()}</span>
{/if}

<style>
    .label {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-xs);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .end {
        margin-left: auto;
    }
</style>
