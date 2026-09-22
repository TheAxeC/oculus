<script lang="ts">
    // Layer 3, Pillars partial. Non-real work grouped in archive_dead order, with one collapsible
    // category at a time and project links inside it.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { ArchiveGroup, Project } from '$lib/state/words/lines';
    import { inlineMarkdown } from '$lib/ui/html';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView }
    } = useState();

    type Props = { id: string; cursor: boolean; groups: ArchiveGroup[] };
    let { id, cursor, groups }: Props = $props();
    let shown = $state('');
    const count = $derived(groups.reduce((sum, group) => sum + group.count, 0));

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
                    <ToolButton
                        label={group.type}
                        active={shown === group.type}
                        onclick={() => (shown = shown === group.type ? '' : group.type)}
                    />
                    <Tag label={String(group.count)} />
                    {#if shown === group.type}
                        <div class="members">
                            {#each group.projects as project (project.id)}
                                <ToolButton
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
    .muted {
        opacity: 0.62;
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

    .members {
        flex-basis: 100%;
    }
</style>
