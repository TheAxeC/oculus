<script lang="ts">
    // Layer 3, Pillars partial. Non-real work grouped by the types of `types` that carry a `dead`
    // number, in the order of those numbers, with one collapsible category at a time and project
    // links inside it.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        archivedCount,
        type ArchiveGroup,
        type Project
    } from '$lib/state/boards/structure/lines';
    import { inlineMarkdown } from '$lib/ui/html';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView }
    } = useState();

    type Props = { id: string; cursor: boolean; groups: ArchiveGroup[] };
    let { id, cursor, groups }: Props = $props();
    let shown = $state('');
    const count = $derived(archivedCount(groups));

    /** The short name when the manifest gives one, else the title; an empty short is none. */
    function labelOf(project: Project): string {
        const short = project.short?.trim() ?? '';
        return short === '' ? project.title : short;
    }
</script>

<div class="muted" data-pillar-archival>
    <Card {id} {cursor} title={t('pillars.archival')}>
        {#snippet meta()}
            <Glyph name="archived" />
            <Tag label={t('pillars.not_active', count)} />
        {/snippet}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p>{@html inlineMarkdown(t('pillars.archival_blurb'))}</p>
        <div class="groups">
            {#each groups as group (group.type)}
                <div class="group">
                    <Chip
                        label={`${group.type} ${group.count}`}
                        pressed={shown === group.type}
                        onclick={() => (shown = shown === group.type ? '' : group.type)}
                    />
                    {#if shown === group.type}
                        <div class="members">
                            {#each group.projects as project (project.id)}
                                <ToolButton
                                    small
                                    label={labelOf(project)}
                                    onclick={() =>
                                        openView('project', {
                                            id: project.id,
                                            label: labelOf(project)
                                        })}
                                />
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </Card>
</div>

<style>
    /* The archival card is faded as archival; while the pointer is over it or the keyboard focus
       is inside it the fade lifts, so it is read at full strength. */
    .muted {
        opacity: 0.62;
        transition: opacity 120ms ease;
    }

    .muted:hover,
    .muted:focus-within {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .muted {
            transition: none;
        }
    }

    p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }

    .groups,
    .group,
    .members {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .groups {
        margin-top: 8px;
    }

    /* A group and the members of an open group are rows of the tree's height. */
    .group,
    .members {
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .members {
        flex-basis: 100%;
    }
</style>
