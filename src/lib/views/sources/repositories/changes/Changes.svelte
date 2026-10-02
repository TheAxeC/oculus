<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. What is changed in one
    // repository, as the Changes section: Merge Changes while anything is unmerged, then the
    // staged, changed and untracked groups, each a row that opens and closes with its count as a
    // badge at the right edge, and under each one explorer row per path. An empty merge or staged
    // group is not drawn, and an empty changed or untracked group says so in one muted row.
    //
    // A group's head carries what acts on the whole group, as VS Code's do: Open Changes (the diff
    // pane over every path of the group; the untracked group has none), Unstage All on the staged
    // group, Discard All Changes and Stage All Changes on the changed group, and Stage All on the
    // untracked one. A discard of the whole group asks first, naming how many paths it throws away.
    //
    // In the view's list mode a group's rows are its files, each with its folder after its name. In
    // tree mode the staged, changed and untracked groups fall into folder rows
    // (state/sources/repositories/change-tree.ts) that open and close; the merge group stays a
    // list. A folder closes by its id in the instance's list of closed rows, and a folder that
    // closes with the focus inside it takes the focus. A file row is changes/ChangeRow.svelte and a
    // folder row changes/FolderRow.svelte.
    //
    // A group's paths have no cap, so each group draws them through
    // ui/tree/list/VirtualRows.svelte, which draws only the rows in view of the pane and holds the
    // height of the rest; a key moving to a row not drawn has it scrolled in first, and the
    // type-ahead reads every row's name.
    //
    // A group's head opens a right-click menu of what its controls do (menus/change-menu.ts), with
    // Reveal in Explorer View on a file row; the merge group keeps its own controls and has none.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import ChangeRow from './ChangeRow.svelte';
    import FolderRow from './FolderRow.svelte';
    import {
        changeTree,
        folderId,
        insideFolder,
        leafOf,
        visibleRows,
        type TreeRow
    } from '$lib/state/sources/repositories/change-tree';
    import { changeCount, changeGroups } from '$lib/state/sources/repositories/repositories';
    import type { GitEntry, GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        GROUP_DISCARD_ALL,
        GROUP_STAGE_ALL,
        GROUP_STAGE_UNTRACKED,
        GROUP_UNSTAGE_ALL,
        groupMenu,
        hasMenu,
        type MenuGroupId
    } from '../menus/change-menu';

    type Props = {
        root: string;
        git: GitState;
        nav: TreeNav;
        /** The section, group and folder ids the reader closed. */
        collapsed: string[];
        ontoggle: (id: string) => void;
        /** Ask before a write that loses work, in the view's own dialog. */
        ask: (message: string, detail: string, act: () => void) => void;
        /** Whether the groups list their files or draw them as folders. */
        mode?: 'list' | 'tree';
    };

    let { root, git, nav, collapsed, ontoggle, ask, mode = 'list' }: Props = $props();

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

    /** The row id of one path of a group, which is what the tree and the keys know it by. */
    function rowId(group: string, path: string): string {
        return `change:${group}:${path}`;
    }

    /** The id a row of a group is known by. */
    function idOf(group: string, row: TreeRow<GitEntry>): string {
        return row.kind === 'folder' ? folderId(root, group, row.path) : rowId(group, row.path);
    }

    /** The rows each group draws: its files, or in tree mode its folders and files that show. */
    const shown = $derived(
        groups.map((group) => {
            const tree = mode === 'tree' && group.id !== 'merge';
            const rows: TreeRow<GitEntry>[] = tree
                ? visibleRows(changeTree(group.entries), (path) =>
                      collapsed.includes(folderId(root, group.id, path))
                  )
                : group.entries.map((entry) => ({
                      kind: 'file' as const,
                      name: leafOf(entry.path),
                      path: entry.path,
                      depth: 0,
                      entry
                  }));
            const at = new Map(rows.map((row, index) => [idOf(group.id, row), index]));
            return { ...group, rows, at };
        })
    );

    /** Open or close a folder; a folder closing over the row that holds the focus takes it. */
    function folderToggled(group: string, path: string, open: boolean): void {
        const id = folderId(root, group, path);
        ontoggle(id);
        if (open && nav.kept().some((held) => insideFolder(held, root, group, path))) {
            nav.focus(id);
        }
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

    /** Open the diff pane over every path of the staged or the changed group. */
    function openGroup(id: 'staged' | 'changed'): void {
        repositories.openDiff(
            { root, path: '', staged: id === 'staged', worktree: false, group: id },
            id === 'staged'
                ? t('repositories.group_diff_staged')
                : t('repositories.group_diff_changed')
        );
    }
</script>

<div data-group="changes">
    <TreeSection
        label={t('repositories.changes')}
        id="changes"
        {nav}
        count={total}
        badge
        open={!collapsed.includes('changes')}
        ontoggle={() => ontoggle('changes')}
    >
        {#each shown as group (group.id)}
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
                    count={group.rows.length}
                    key={(at: number) => idOf(group.id, group.rows[at])}
                    {nav}
                    owns={(id: string) => group.at.get(id) ?? -1}
                    label={(id: string) => {
                        const at = group.at.get(id);
                        return at === undefined ? undefined : group.rows[at].name;
                    }}
                >
                    {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                        {@const row = group.rows[at]}
                        {#if row.kind === 'folder'}
                            <FolderRow
                                {root}
                                group={group.id as MenuGroupId}
                                {row}
                                {nav}
                                open={!collapsed.includes(folderId(root, group.id, row.path))}
                                {busy}
                                ontoggle={() =>
                                    folderToggled(
                                        group.id,
                                        row.path,
                                        !collapsed.includes(folderId(root, group.id, row.path))
                                    )}
                                {ask}
                                {measure}
                            />
                        {:else}
                            <ChangeRow
                                {root}
                                entry={row.entry}
                                group={group.id}
                                {nav}
                                level={3 + row.depth}
                                depth={1 + row.depth}
                                showFolder={mode !== 'tree' || group.id === 'merge'}
                                {busy}
                                {ask}
                                {measure}
                            />
                        {/if}
                    {/snippet}
                </VirtualRows>
            {/if}
        {/each}
    </TreeSection>
</div>

{#snippet groupHead(group: { id: string; entries: GitEntry[] }, open: boolean)}
    <TreeItem
        label={labelOf(group.id)}
        id={`group:${group.id}`}
        {nav}
        level={2}
        count={group.entries.length}
        badge
        expanded={open}
        tone={group.id === 'merge' ? 'error' : undefined}
        onclick={() => ontoggle(group.id)}
    >
        {#snippet actions(reach: number)}
            {#if (group.id === 'staged' || group.id === 'changed') && group.entries.length > 0}
                <ToolButton
                    label={t('repositories.diff_open')}
                    glyph="diff"
                    compact
                    tabindex={reach}
                    onclick={() => openGroup(group.id as 'staged' | 'changed')}
                />
            {/if}
            {#if group.id === 'staged'}
                <ToolButton
                    label={t('git.unstage_all')}
                    glyph="unstage"
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
                    glyph="stage"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.stageAll(root, 'changed')}
                />
            {:else if group.id === 'untracked' && group.entries.length > 0}
                <ToolButton
                    label={t('git.stage_all_untracked')}
                    glyph="stage"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.stageAll(root, 'untracked')}
                />
            {/if}
        {/snippet}
    </TreeItem>
{/snippet}
