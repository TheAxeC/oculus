<script lang="ts">
    // Layer 3, shared view. The four project cross-link tag groups live here because relationship
    // navigation changes independently of the project-card frame.

    import Chip from '$lib/ui/Chip.svelte';
    import type { BoardItem } from '$lib/state/board';
    import { t } from '$lib/state/text';
    import { goto } from './card';
    import { useState } from '$lib/state/use';

    const client = useState();

    type Props = {
        /** The joined board item whose cross-links are shown. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    const tagged = $derived(
        item.funding.length +
            item.programs.length +
            item.datasets.length +
            item.collaborators.length >
            0
    );
</script>

{#if tagged}
    <div class="tags">
        {#each item.funding as tag (tag.id)}
            <button
                type="button"
                class="tag"
                title={t('project.card.open_in', t('board.facet_funding'))}
                onclick={() => goto(client, 'funding', tag.label)}
            >
                <Chip label={tag.label} glyph={t('project.card.funding_glyph')} />
            </button>
        {/each}
        {#each item.programs as tag (tag.id)}
            <Chip label={tag.label} glyph={t('project.card.program_glyph')} />
        {/each}
        {#each item.datasets as tag (tag.id)}
            <Chip label={tag.label} glyph={t('project.card.dataset_glyph')} />
        {/each}
        {#each item.collaborators as tag (tag.id)}
            <button
                type="button"
                class="tag"
                title={t('project.card.open_in', t('project.card.collaborations'))}
                onclick={() => goto(client, 'collaborations', tag.label)}
            >
                <Chip label={tag.label} glyph={t('project.card.collaborator_glyph')} />
            </button>
        {/each}
    </div>
{/if}

<style>
    .tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        max-width: 100%;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        background: none;
        color: inherit;
        font: inherit;
        padding: 0;
        cursor: pointer;
        text-align: left;
    }

    .tag:hover {
        background: var(--chip);
    }
</style>
