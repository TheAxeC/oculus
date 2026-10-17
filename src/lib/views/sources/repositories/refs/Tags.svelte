<script lang="ts">
    // Layer 3, partial of views/sources/repositories/repo/Repo.svelte. The Tags section: one row
    // per tag with the commit it points at, an annotated tag with its message's subject, and
    // Delete, which asks first. Pressing a row shows the commit in the graph. Creating a tag at
    // HEAD and pushing the tags are in the view's `...` menu, as VS Code puts them in its own.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { GitTag } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';
    import type { RefSectionProps } from './section';
    import { useState } from '$lib/state/client/use';
    import { askTagDelete } from '../menus/graph-menu';

    let { root, git, nav, open, ontoggle, ask }: RefSectionProps = $props();

    const { repositories } = useState();

    const busy = $derived(repositories.busy(root));

    function remove(tag: GitTag): void {
        askTagDelete(
            tag.name,
            { ask, deleteTag: (name: string) => void repositories.deleteTag(root, name) },
            t
        );
    }
</script>

<div data-group="tags">
    <TreeSection
        label={t('repositories.tags')}
        id="tags"
        {nav}
        count={git.tags.length}
        badge
        {open}
        {ontoggle}
    >
        {#if git.tags.length === 0}
            <li role="none">
                <TreeItem label={t('repositories.tags_empty')} depth={1} tone="muted" />
            </li>
        {/if}
        {#each git.tags as tag (tag.name)}
            <li role="none" data-tag={tag.name}>
                <TreeItem
                    label={tag.name}
                    id={`tag:${tag.name}`}
                    {nav}
                    level={2}
                    depth={1}
                    glyph="tag"
                    title={t('repositories.tag_title', tag.commit.slice(0, 7))}
                    onclick={() => repositories.openCommit(root, tag.commit)}
                >
                    {#snippet detail()}
                        {tag.annotated ? tag.subject : ''}
                    {/snippet}
                    {#snippet actions(reach: number)}
                        <ToolButton
                            label={t('repositories.tag_delete')}
                            glyph="trash"
                            compact
                            tabindex={reach}
                            disabled={busy}
                            onclick={() => remove(tag)}
                        />
                    {/snippet}
                    {#snippet end()}
                        <span class="hash">{tag.commit.slice(0, 7)}</span>
                    {/snippet}
                </TreeItem>
            </li>
        {/each}
    </TreeSection>
</div>

<style>
    .hash {
        font-family: var(--font-mono);
    }
</style>
