<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. What is changed in one
    // repository, as the Changes section: Merge Changes while anything is unmerged, then the
    // staged, changed and untracked groups, each a row that opens and closes with its count at the
    // right edge, and under each one explorer row per path. An empty merge or staged group is not
    // drawn, and an empty changed or untracked group says so in one muted row.
    //
    // A group's head carries what acts on the whole group, as VS Code's do: Unstage All on the
    // staged group, Stage All Changes and Discard All Changes on the changed group, and Stage All
    // on the untracked one. A discard of the whole group asks first, naming how many paths it
    // throws away.
    //
    // A row is the file's name with its folder and its line counts after it and its status at the
    // right edge. Pressing it opens what it stands for (state/sources/repositories/
    // repositories.svelte.ts's openChange): the three-way merge editor for a conflict, the file for
    // an untracked path, and the diff for the rest. A conflict's status is its unmerged pair,
    // worded and coloured as a conflict.
    //
    // The colour of a status is state/sources/repositories/repositories.ts's statusStyle() and the
    // line counts are shared/changes/ChangeCounts.svelte, which is what the session views' Changes
    // panel draws them with, so the two lists agree.
    //
    // A group's paths have no cap, so each group draws them through ui/tree/VirtualRows.svelte,
    // which draws only the rows in view of the pane and holds the height of the rest; a key moving
    // to a row not drawn has it scrolled in first, and the type-ahead reads every file's name.
    //
    // A file row of Changes, Staged and Untracked, and the head of each of those groups, opens a
    // right-click menu of what its controls do (menus/change-menu.ts), with Reveal in Explorer View
    // besides; the merge group keeps its own controls and has none. A Discard picked there asks the
    // question the row's Discard control asks.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import VirtualRows from '$lib/ui/tree/VirtualRows.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import ChangeCounts from '$lib/views/shared/changes/ChangeCounts.svelte';
    import { nameOf } from '$lib/state/sources/fs';
    import {
        changeCount,
        changeGroups,
        statusStyle,
        statusWordKey
    } from '$lib/state/sources/repositories/repositories';
    import type { GitEntry, GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        GROUP_DISCARD_ALL,
        GROUP_STAGE_ALL,
        GROUP_STAGE_UNTRACKED,
        GROUP_UNSTAGE_ALL,
        askDiscard,
        changeMenu,
        changePicked,
        groupMenu,
        hasMenu
    } from './menus/change-menu';

    type Props = {
        root: string;
        git: GitState;
        nav: TreeNav;
        /** The section and group ids the reader closed. */
        collapsed: string[];
        ontoggle: (id: string) => void;
        /** Ask before a write that loses work, in the view's own dialog. */
        ask: (message: string, detail: string, act: () => void) => void;
    };

    let { root, git, nav, collapsed, ontoggle, ask }: Props = $props();

    const { repositories } = useState();

    const groups = $derived(changeGroups(git));
    const total = $derived(changeCount(git));
    const busy = $derived(repositories.busy(root));

    /** The words one change group is headed with. */
    function labelOf(id: string): string {
        if (id === 'merge') return t('repositories.merge_changes');
        if (id === 'staged') return t('sessions.ch_staged');
        if (id === 'changed') return t('sessions.ch_changed');
        return t('sessions.ch_untracked');
    }

    /** The folder a path sits in, which a row says after the file's own name. */
    function folderOf(path: string): string {
        const at = path.lastIndexOf('/');
        return at < 0 ? '' : path.slice(0, at);
    }

    /** What pressing a row of this group opens, as its hover words. */
    function titleOf(group: string): string {
        if (group === 'merge') return t('repositories.merge_open_title');
        if (group === 'untracked') return t('repositories.open_file_title');
        return group === 'staged'
            ? t('repositories.diff_staged_title')
            : t('repositories.diff_title');
    }

    /** The row id of one path of a group, which is what the tree and the keys know it by. */
    function rowId(group: string, path: string): string {
        return `change:${group}:${path}`;
    }

    /** The index of the path a row id names in its group's paths, or -1 for another group's row. */
    function indexIn(group: string, entries: GitEntry[], id: string): number {
        const prefix = rowId(group, '');
        if (!id.startsWith(prefix)) return -1;
        const path = id.slice(prefix.length);
        return entries.findIndex((entry) => entry.path === path);
    }

    /** The calls a pick from a row's menu runs, the row's own controls' among them. */
    const deps = {
        ask: (message: string, detail: string, act: () => void) => ask(message, detail, act),
        discard: (at: string, path: string) => void repositories.discard(at, path),
        openChange: (at: string, group: string, path: string) =>
            repositories.openChange(at, group, path),
        openFile: (at: string, path: string) => void repositories.openFile(at, path),
        stage: (at: string, path: string) => void repositories.stage(at, path),
        unstage: (at: string, path: string) => void repositories.unstage(at, path),
        reveal: (at: string, path: string) => void repositories.revealFile(at, path)
    };

    function discard(path: string): void {
        askDiscard(root, path, deps, t);
    }

    /** A pick from a group head's menu: what the head's control of the same name does. */
    function groupPicked(pick: string): void {
        if (pick === GROUP_UNSTAGE_ALL) void repositories.unstageAll(root);
        else if (pick === GROUP_STAGE_ALL) void repositories.stageAll(root, 'changed');
        else if (pick === GROUP_STAGE_UNTRACKED) void repositories.stageAll(root, 'untracked');
        else if (pick === GROUP_DISCARD_ALL) discardAll();
    }

    function discardAll(): void {
        const count = git.unstaged.length;
        ask(t('git.discard_all_confirm', count), t('git.discard_all_detail'), () => {
            void repositories.discardAll(root);
        });
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
                {#if hasMenu(group.id)}
                    <ContextMenu
                        label={labelOf(group.id)}
                        items={groupMenu(group.id, group.entries.length, busy, t)}
                        onpick={groupPicked}
                    >
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render groupHead(group, open)}
                    </ContextMenu>
                {:else}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render groupHead(group, open)}
                {/if}
            </li>
            {#if open && group.entries.length === 0}
                <li role="none">
                    <TreeItem label={t('sessions.ch_group_empty')} depth={1} tone="muted" />
                </li>
            {/if}
            {#if open}
                <VirtualRows
                    count={group.entries.length}
                    key={(at: number) => group.entries[at].path}
                    {nav}
                    owns={(id: string) => indexIn(group.id, group.entries, id)}
                    label={(id: string) => {
                        const at = indexIn(group.id, group.entries, id);
                        return at < 0 ? undefined : nameOf(group.entries[at].path);
                    }}
                >
                    {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render row(group.entries[at], group.id, measure)}
                    {/snippet}
                </VirtualRows>
            {/if}
        {/each}
    </TreeSection>
</div>

{#snippet row(entry: GitEntry, group: string, measure: Attachment<HTMLElement>)}
    <li role="none" data-entry={entry.path} {@attach measure}>
        {#if hasMenu(group)}
            <ContextMenu
                label={entry.path}
                items={changeMenu(group, busy, t)}
                onpick={(pick: string) =>
                    changePicked(pick, { root, group, path: entry.path }, deps, t)}
            >
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render rowItem(entry, group)}
            </ContextMenu>
        {:else}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render rowItem(entry, group)}
        {/if}
    </li>
{/snippet}

{#snippet groupHead(group: { id: string; entries: GitEntry[] }, open: boolean)}
    <TreeItem
        label={labelOf(group.id)}
        id={`group:${group.id}`}
        {nav}
        level={2}
        count={group.entries.length}
        expanded={open}
        tone={group.id === 'merge' ? 'error' : undefined}
        onclick={() => ontoggle(group.id)}
    >
        {#snippet actions(reach: number)}
            {#if group.id === 'staged'}
                <ToolButton
                    label={t('git.unstage_all')}
                    glyph="collapse"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.unstageAll(root)}
                />
            {:else if group.id === 'changed' && group.entries.length > 0}
                <ToolButton
                    label={t('git.discard_all')}
                    glyph="note_back"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={discardAll}
                />
                <ToolButton
                    label={t('git.stage_all')}
                    glyph="expand"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.stageAll(root, 'changed')}
                />
            {:else if group.id === 'untracked' && group.entries.length > 0}
                <ToolButton
                    label={t('git.stage_all_untracked')}
                    glyph="expand"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.stageAll(root, 'untracked')}
                />
            {/if}
        {/snippet}
    </TreeItem>
{/snippet}

{#snippet rowItem(entry: GitEntry, group: string)}
    <TreeItem
        label={nameOf(entry.path)}
        name={t('repositories.change_name', entry.path, t(statusWordKey(entry.status)))}
        id={rowId(group, entry.path)}
        {nav}
        level={3}
        depth={1}
        title={titleOf(group)}
        onclick={() => repositories.openChange(root, group, entry.path)}
    >
        {#snippet detail()}
            <span class="folder">{folderOf(entry.path)}</span>
            {#if group !== 'merge'}
                <span class="detail-counts"><ChangeCounts {entry} /></span>
            {/if}
        {/snippet}
        {#snippet actions(reach: number)}
            {#if group === 'merge'}
                <ToolButton
                    label={t('repositories.merge_open')}
                    glyph="merge"
                    compact
                    tabindex={reach}
                    onclick={() => repositories.openMerge(root, entry.path)}
                />
            {:else if group !== 'untracked'}
                <ToolButton
                    label={t('repositories.diff')}
                    title={titleOf(group)}
                    glyph="diff"
                    compact
                    tabindex={reach}
                    onclick={() => repositories.openChange(root, group, entry.path)}
                />
            {/if}
            <ToolButton
                label={t('repositories.open_file')}
                glyph="open_file"
                compact
                tabindex={reach}
                onclick={() => repositories.openFile(root, entry.path)}
            />
            {#if group === 'staged'}
                <ToolButton
                    label={t('git.unstage')}
                    title={t('git.unstage_title')}
                    glyph="collapse"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.unstage(root, entry.path)}
                />
            {:else}
                <ToolButton
                    label={group === 'merge' ? t('repositories.merge_mark') : t('git.stage')}
                    title={group === 'merge'
                        ? t('repositories.merge_mark_title')
                        : t('git.stage_title')}
                    glyph="expand"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() =>
                        void (group === 'merge'
                            ? repositories.markResolved(root, entry.path)
                            : repositories.stage(root, entry.path))}
                />
            {/if}
            {#if group === 'changed'}
                <ToolButton
                    label={t('git.discard')}
                    title={t('git.discard_title')}
                    glyph="note_back"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => discard(entry.path)}
                />
            {/if}
        {/snippet}
        {#snippet end()}
            <span class="st" style={statusStyle(entry.status)}>
                {entry.status}
            </span>
        {/snippet}
    </TreeItem>
{/snippet}

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
        min-width: 1.2em;
        text-align: center;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }
</style>
