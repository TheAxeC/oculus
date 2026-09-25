<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. What is changed in one
    // repository, as the Changes section: the staged, changed and untracked groups, each a row that
    // opens and closes with its count at the right edge, and under each one explorer row per path.
    // An empty staged group is not drawn, and an empty changed or untracked group says so in one
    // muted row.
    //
    // A row is the file's name with its folder and its line counts after it, its status letter in
    // the column at the right edge, and pressing it opens that path's diff, staged or as the
    // worktree has it; the controls shown on the row are the diff again, the stage or unstage, and
    // the discard of a changed path. Every press is reported to the view, which owns the writes and
    // the confirm.
    //
    // The colour of a letter is state/sources/repositories.ts's statusStyle() and the line counts
    // are shared/changes/ChangeCounts.svelte, which is what the session views' Changes panel draws
    // them with, so the two lists agree.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ChangeCounts from '$lib/views/shared/changes/ChangeCounts.svelte';
    import { nameOf } from '$lib/state/sources/fs';
    import {
        changeCount,
        changeGroups,
        statusStyle,
        statusWordKey,
        type DiffSubject
    } from '$lib/state/sources/repositories';
    import type { GitEntry, GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        root: string;
        git: GitState;
        nav: TreeNav;
        /** The section and group ids the reader closed. */
        collapsed: string[];
        ontoggle: (id: string) => void;
        onstage: (path: string) => void;
        onunstage: (path: string) => void;
        ondiscard: (path: string) => void;
        ondiff: (subject: DiffSubject, label: string) => void;
    };

    let { root, git, nav, collapsed, ontoggle, onstage, onunstage, ondiscard, ondiff }: Props =
        $props();

    /** The words one change group is headed with. */
    function labelOf(id: string): string {
        if (id === 'staged') return t('sessions.ch_staged');
        if (id === 'changed') return t('sessions.ch_changed');
        return t('sessions.ch_untracked');
    }

    const groups = $derived(changeGroups(git));

    const total = $derived(changeCount(git));

    /** The folder a path sits in, which a row says after the file's own name. */
    function folderOf(path: string): string {
        const at = path.lastIndexOf('/');
        return at < 0 ? '' : path.slice(0, at);
    }

    function diff(entry: GitEntry, kind: string): void {
        ondiff({ root, path: entry.path, staged: kind === 'staged', worktree: false }, entry.path);
    }
</script>

<div data-group="changes">
    <TreeSection
        label={t('repositories.changes')}
        id="changes"
        {nav}
        count={total}
        open={!collapsed.includes('changes')}
        ontoggle={() => ontoggle('changes')}
    >
        {#each groups as group (group.id)}
            {@const open = !collapsed.includes(group.id)}
            <li role="none" data-changes={group.id}>
                <TreeItem
                    label={labelOf(group.id)}
                    id={`group:${group.id}`}
                    {nav}
                    level={2}
                    count={group.entries.length}
                    expanded={open}
                    onclick={() => ontoggle(group.id)}
                />
            </li>
            {#if open && group.entries.length === 0}
                <li role="none">
                    <TreeItem label={t('sessions.ch_group_empty')} depth={1} tone="muted" />
                </li>
            {/if}
            {#if open}
                {#each group.entries as entry (entry.path)}
                    {@const title =
                        group.id === 'staged'
                            ? t('repositories.diff_staged_title')
                            : t('repositories.diff_title')}
                    <li role="none" data-entry={entry.path}>
                        <TreeItem
                            label={nameOf(entry.path)}
                            name={t(
                                'repositories.change_name',
                                entry.path,
                                t(statusWordKey(entry.status))
                            )}
                            id={`change:${group.id}:${entry.path}`}
                            {nav}
                            level={3}
                            depth={1}
                            {title}
                            onclick={() => diff(entry, group.id)}
                        >
                            {#snippet detail()}
                                <span class="folder">{folderOf(entry.path)}</span>
                                <span class="detail-counts"><ChangeCounts {entry} /></span>
                            {/snippet}
                            {#snippet actions(reach: number)}
                                <ToolButton
                                    label={t('repositories.diff')}
                                    {title}
                                    glyph="diff"
                                    compact
                                    tabindex={reach}
                                    onclick={() => diff(entry, group.id)}
                                />
                                {#if group.id === 'staged'}
                                    <ToolButton
                                        label={t('git.unstage')}
                                        title={t('git.unstage_title')}
                                        glyph="collapse"
                                        compact
                                        tabindex={reach}
                                        onclick={() => onunstage(entry.path)}
                                    />
                                {:else}
                                    <ToolButton
                                        label={t('git.stage')}
                                        title={t('git.stage_title')}
                                        glyph="expand"
                                        compact
                                        tabindex={reach}
                                        onclick={() => onstage(entry.path)}
                                    />
                                {/if}
                                {#if group.id === 'changed'}
                                    <ToolButton
                                        label={t('git.discard')}
                                        title={t('git.discard_title')}
                                        glyph="note_back"
                                        compact
                                        tabindex={reach}
                                        onclick={() => ondiscard(entry.path)}
                                    />
                                {/if}
                            {/snippet}
                            {#snippet end()}
                                <span class="st" style={statusStyle(entry.status)}>
                                    {entry.status}
                                </span>
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
            {/if}
        {/each}
    </TreeSection>
</div>

<style>
    .folder {
        margin-right: 4px;
    }

    .detail-counts {
        display: inline-flex;
        gap: 4px;
    }

    .st {
        display: inline-block;
        width: 1.2em;
        text-align: center;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }
</style>
