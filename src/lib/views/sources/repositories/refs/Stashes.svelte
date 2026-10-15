<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repo.svelte. The Stashes section: one row per
    // stash, newest first, its message and when it was made, with View, Apply, Pop and Drop, as
    // VS Code's Stashes view offers them. Pressing a row views it: the stash's whole diff in a diff
    // pane. Drop asks first, since a dropped stash is not listed anywhere afterwards; an apply or a
    // pop that conflicts leaves its conflicts under Merge Changes, which the server says.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import type { GitStash } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';
    import type { RefSectionProps } from './section';
    import { useState } from '$lib/state/client/use';

    let { root, git, nav, open, ontoggle, ask }: RefSectionProps = $props();

    const { repositories } = useState();

    const busy = $derived(repositories.busy(root));

    function view(stash: GitStash): void {
        repositories.openDiff(
            { root, path: '', staged: false, worktree: false, stash: stash.ref },
            t('repositories.stash_label', stash.ref)
        );
    }

    function drop(stash: GitStash): void {
        ask(t('repositories.stash_drop_confirm', stash.ref), stash.message, () => {
            void repositories.stashAct(root, 'drop', stash.ref);
        });
    }
</script>

<div data-group="stashes">
    <TreeSection
        label={t('repositories.stashes')}
        id="stashes"
        {nav}
        count={git.stashes.length}
        badge
        {open}
        {ontoggle}
    >
        {#if git.stashes.length === 0}
            <li role="none">
                <TreeItem label={t('repositories.stashes_empty')} depth={1} tone="muted" />
            </li>
        {/if}
        {#each git.stashes as stash (stash.ref)}
            <li role="none" data-stash={stash.ref}>
                <TreeItem
                    label={stash.message}
                    id={`stash:${stash.ref}`}
                    {nav}
                    level={2}
                    depth={1}
                    glyph="stash"
                    title={t('repositories.stash_view_title', stash.ref)}
                    onclick={() => view(stash)}
                >
                    {#snippet detail()}
                        {stash.ref}
                    {/snippet}
                    {#snippet actions(reach: number)}
                        <ToolButton
                            label={t('repositories.stash_apply')}
                            glyph="stash_apply"
                            compact
                            tabindex={reach}
                            disabled={busy}
                            onclick={() => void repositories.stashAct(root, 'apply', stash.ref)}
                        />
                        <ToolButton
                            label={t('repositories.stash_pop')}
                            glyph="expand"
                            compact
                            tabindex={reach}
                            disabled={busy}
                            onclick={() => void repositories.stashAct(root, 'pop', stash.ref)}
                        />
                        <ToolButton
                            label={t('repositories.stash_drop')}
                            glyph="trash"
                            compact
                            tabindex={reach}
                            disabled={busy}
                            onclick={() => drop(stash)}
                        />
                    {/snippet}
                    {#snippet end()}
                        {stamp(stash.when)}
                    {/snippet}
                </TreeItem>
            </li>
        {/each}
    </TreeSection>
</div>
