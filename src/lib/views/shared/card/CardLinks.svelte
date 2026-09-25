<script lang="ts">
    // Layer 3, shared view. The project cross-link tag groups live here because relationship
    // navigation changes independently of the project-card frame.
    //
    // Each kind that has entries is its own labelled line, so a card with many tags is read by kind
    // rather than as one wrapping run; a kind longer than SHOWN draws that many and a control that
    // draws the rest in place.
    //
    // The software kind is the one link between two projects, so its entries open a project tab
    // rather than a registered view, and its label says which end of the link the card is on: a
    // paper lists the software that implements it, and a software project lists the papers it
    // names.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { BoardItem, BoardTag } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';
    import { goto, linkView, shownTags } from './card';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { openView }
    } = client;

    /** The kind whose entries are projects, opened as a tab rather than in a view of their own. */
    const SOFTWARE = 'software';

    /** The kind whose entries are people, each opening the Person view for its own key. */
    const COLLABORATORS = 'collaborators';

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
            key: 'pillars',
            label: t('board.facet_pillar'),
            glyph: t('project.card.pillar_glyph'),
            tags: item.pillars
        },
        {
            key: 'datasets',
            label: t('board.facet_dataset'),
            glyph: t('project.card.dataset_glyph'),
            tags: item.datasets
        },
        {
            key: COLLABORATORS,
            label: t('project.card.collaborators'),
            glyph: t('project.card.collaborator_glyph'),
            tags: item.collaborators
        },
        {
            key: SOFTWARE,
            label:
                item.project.tier === 'software'
                    ? t('project.card.software_papers')
                    : t('project.card.software'),
            glyph: t('project.card.software_glyph'),
            tags: item.software
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

    /** What pressing one entry does, and nothing for a kind whose entries are not cross-links. */
    function press(kind: Kind, tag: BoardTag): (() => void) | null {
        if (kind.key === SOFTWARE)
            return () => openView('project', { id: tag.id, label: tag.label });
        if (kind.key === COLLABORATORS)
            return () => openView('person', { key: tag.id, label: tag.label });
        if (linkView(kind.key) === '') return null;
        return () => goto(client, linkView(kind.key), tag.label);
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
                        {@const onpress = press(kind, tag)}
                        {#if onpress === null}
                            <Tag label={tag.label} glyph={kind.glyph} />
                        {:else}
                            <button
                                type="button"
                                class="crosslink"
                                title={t('project.card.open_in', kind.label)}
                                onclick={onpress}
                            >
                                <Tag label={tag.label} glyph={kind.glyph} />
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

    .crosslink {
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

    .crosslink:hover {
        background: var(--chip);
    }
</style>
