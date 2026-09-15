<script lang="ts">
    // Layer 3, shared view. The four project cross-link tag groups live here because relationship
    // navigation changes independently of the project-card frame.
    //
    // Each kind that has entries is its own labelled line, so a card with many tags is read by kind
    // rather than as one wrapping run; a kind longer than SHOWN draws that many and a control that
    // draws the rest in place.

    import Chip from '$lib/ui/Chip.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import type { BoardItem, BoardTag } from '$lib/state/board';
    import { t } from '$lib/state/text';
    import { goto, linkView, shownTags } from './card';
    import { useState } from '$lib/state/use';

    const client = useState();

    type Props = {
        /** The joined board item whose cross-links are shown. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    /** One line: which kind it is, what it is called, and the glyph its entries carry. */
    type Kind = {
        key: string;
        label: string;
        glyph: string;
        tags: BoardTag[];
    };

    const kinds = $derived<Kind[]>([
        {
            key: 'funding',
            label: t('board.facet_funding'),
            glyph: t('project.card.funding_glyph'),
            tags: item.funding
        },
        {
            key: 'programs',
            label: t('board.facet_program'),
            glyph: t('project.card.program_glyph'),
            tags: item.programs
        },
        {
            key: 'datasets',
            label: t('board.facet_dataset'),
            glyph: t('project.card.dataset_glyph'),
            tags: item.datasets
        },
        {
            key: 'collaborators',
            label: t('project.card.collaborations'),
            glyph: t('project.card.collaborator_glyph'),
            tags: item.collaborators
        }
    ]);

    const tagged = $derived(kinds.some((kind) => kind.tags.length > 0));

    // The expanded kinds are held with the project they were opened on, so the same card given
    // another project draws every kind cut back again without anything clearing the state by hand.
    let opened = $state<{ id: string; kinds: string[] }>({ id: '', kinds: [] });
    const expanded = $derived(opened.id === item.id ? opened.kinds : []);

    /** Draw the rest of one kind's entries. */
    function expand(key: string): void {
        opened = { id: item.id, kinds: [...expanded, key] };
    }
</script>

{#if tagged}
    <div class="links">
        {#each kinds as kind (kind.key)}
            {#if kind.tags.length > 0}
                {@const drawn = shownTags(kind.tags, expanded.includes(kind.key))}
                <div class="taglist">
                    <span class="kind">{kind.label}</span>
                    {#each drawn as tag (tag.id)}
                        {#if linkView(kind.key) === ''}
                            <Chip label={tag.label} glyph={kind.glyph} />
                        {:else}
                            <button
                                type="button"
                                class="tag"
                                title={t('project.card.open_in', kind.label)}
                                onclick={() => goto(client, linkView(kind.key), tag.label)}
                            >
                                <Chip label={tag.label} glyph={kind.glyph} />
                            </button>
                        {/if}
                    {/each}
                    {#if drawn.length < kind.tags.length}
                        <ToolButton
                            label={t('project.card.more_tags', kind.tags.length - drawn.length)}
                            title={t('project.card.more_tags_tip', kind.label)}
                            onclick={() => expand(kind.key)}
                        />
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
{/if}

<style>
    .links {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 6px;
    }

    .taglist {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .kind {
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
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
