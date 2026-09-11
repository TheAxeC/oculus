<script lang="ts">
    // Layer 3, Programs partial. Non-real work grouped in archive_dead order, with one collapsible
    // category at a time and project links inside it.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { type ArchiveGroup, type Project } from '$lib/state/lines';
    import { inlineMarkdown } from '$lib/state/collection';
    import { t } from '$lib/state/text';

    type Props = { groups: ArchiveGroup[] };
    let { groups }: Props = $props();
    let shown = $state('');
    const count = $derived(groups.reduce((sum, group) => sum + group.count, 0));

    /** The short name when the manifest gives one, else the title; an empty short is none. */
    function labelOf(project: Project): string {
        const short = project.short?.trim() ?? '';
        return short === '' ? project.title : short;
    }
</script>

<div class="muted" data-program-archival>
    <Card title={t('col.archival')}>
        {#snippet meta()}
            <Glyph name="archived" />
            <Chip label={t('col.not_active', count)} />
        {/snippet}
        <p>{@html inlineMarkdown(t('col.archival_blurb'))}</p>
        <div class="groups">
            {#each groups as group (group.type)}
                <div class="group">
                    <ToolButton
                        label={group.type}
                        active={shown === group.type}
                        onclick={() => (shown = shown === group.type ? '' : group.type)}
                    />
                    <Chip label={String(group.count)} />
                    {#if shown === group.type}
                        <div class="members">
                            {#each group.projects as project (project.id)}
                                <ToolButton
                                    label={labelOf(project)}
                                    onclick={() =>
                                        openView('project', 'main', {
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
