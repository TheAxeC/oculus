<script lang="ts">
    // Layer 3, partial of views/Files.svelte. The roots as one explorer tree: every row carries its
    // own depth, so one each draws the whole thing and nothing here recurses. Which rows exist is
    // state/fs.ts's treeRows() over the listings and the open folders, or filterRows() while a filter
    // is typed, so what is on screen follows the state and is never something a click did to the list.
    //
    // A root's own line is the head of that root's tree, drawn in small capitals with that root's
    // icon controls on it: refresh, collapse all, and the removal of a root the reader added. Every
    // other row is a folder or a file, and a file row carries its star and its new-tab control. The
    // controls that change the workspace are the view's toolbar, since they belong to no one root.
    //
    // A file row has two speeds: one click opens it as the pane's preview tab, which the next single
    // click replaces, and a double click opens it to keep. The two clicks of a double click open the
    // same file twice as a preview first, which is the same tab, so nothing is left behind.
    //
    // The tree is one stop of the focus order through ui/TreeView.svelte, and the stop is the
    // selected row, which is the instance's, so it is the same row when the tab comes back. A key
    // that moves the focus selects the row it moves to. While a filter draws the rows, a folder it
    // holds open is stepped through by Right and Left and never opened or closed, so clearing the
    // filter gives back the folders that were open before it.

    import TreeItem from '$lib/ui/TreeItem.svelte';
    import TreeView from '$lib/ui/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree-keys';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { rowKey, treeKeyRows, typeOfFile, type RowRef, type TreeRow } from '$lib/state/fs';
    import { t } from '$lib/state/text';

    type Props = {
        rows: TreeRow[];
        /** Whether a filter draws the rows, which holds the folders it draws open. */
        filtering: boolean;
        selected: RowRef | null;
        /** The root keys a removal refuses, so a configured root offers no remove control. */
        fixed: string[];
        /** The row keys a bookmark of the reader's own names. */
        marked: string[];
        onselect: (row: RowRef) => void;
        ontoggle: (row: TreeRow) => void;
        /** Open one file. A single click asks for a preview tab, a double click for a kept one. */
        onopen: (row: TreeRow, preview: boolean) => void;
        onremove: (key: string) => void;
        onbookmark: (row: TreeRow) => void;
        onrefresh: () => void;
        oncollapse: (root: string) => void;
    };

    let {
        rows,
        filtering,
        selected,
        fixed,
        marked,
        onselect,
        ontoggle,
        onopen,
        onremove,
        onbookmark,
        onrefresh,
        oncollapse
    }: Props = $props();

    const keyRows = $derived(treeKeyRows(rows, filtering));

    /** The glyph a row draws: a folder, or the shape the file's own name gives it. */
    function glyphOf(row: TreeRow): string {
        if (row.kind === 'dir') return t('files.folder_glyph');
        const { kind } = typeOfFile(row.name);
        if (kind === 'image') return t('files.image_glyph');
        if (kind === 'html') return t('files.html_glyph');
        return t('files.file_glyph');
    }

    function titleOf(row: TreeRow): string {
        if (row.kind !== 'dir') return t('files.open_title', row.name);
        return row.open ? t('files.collapse_title', row.name) : t('files.expand_title', row.name);
    }

    function isSelected(row: TreeRow): boolean {
        return selected !== null && rowKey(selected) === rowKey(row);
    }

    function rowOf(id: string): TreeRow | undefined {
        return rows.find((row) => rowKey(row) === id);
    }

    /** What a press on a row does: it is selected, and a folder opens or closes, a file opens. */
    function pressed(row: TreeRow): void {
        onselect(row);
        if (row.kind === 'dir') ontoggle(row);
        else onopen(row, true);
    }
</script>

{#snippet rootActions(row: TreeRow, reach: number)}
    <ToolButton
        label={t('files.refresh')}
        title={t('files.refresh_title')}
        glyph="refresh"
        compact
        tabindex={reach}
        onclick={onrefresh}
    />
    <ToolButton
        label={t('files.collapse_all')}
        title={t('files.collapse_all_title', row.root)}
        glyph="collapse_all"
        compact
        tabindex={reach}
        onclick={() => oncollapse(row.root)}
    />
    {#if !fixed.includes(row.root)}
        <ToolButton
            label={t('files.remove_root')}
            glyph="trash"
            compact
            tabindex={reach}
            title={t('files.remove_root_title', row.root)}
            onclick={() => onremove(row.root)}
        />
    {/if}
{/snippet}

{#snippet fileActions(row: TreeRow, reach: number)}
    {@const held = marked.includes(rowKey(row))}
    <ToolButton
        label={t('files.row_bookmark')}
        title={held
            ? t('files.row_unbookmark_title', row.name)
            : t('files.row_bookmark_title', row.name)}
        glyph={t('files.bookmark_glyph')}
        compact
        pressed={held}
        active={held}
        tabindex={reach}
        onclick={() => onbookmark(row)}
    />
    <ToolButton
        label={t('files.row_open_tab')}
        title={t('files.row_open_tab_title', row.name)}
        glyph="launch"
        compact
        tabindex={reach}
        onclick={() => {
            onselect(row);
            onopen(row, false);
        }}
    />
{/snippet}

<TreeView
    label={t('files.tree')}
    rows={keyRows}
    current={selected === null ? '' : rowKey(selected)}
    onfocusrow={(id: string) => {
        const row = rowOf(id);
        if (row !== undefined) onselect(row);
    }}
    ontoggle={(id: string) => {
        const row = rowOf(id);
        if (row === undefined) return;
        onselect(row);
        ontoggle(row);
    }}
>
    {#snippet children(nav: TreeNav)}
        <ul class="rows" role="none">
            {#each rows as row (rowKey(row))}
                <li class="row" class:head={row.depth === 0} role="none" data-fs-row={rowKey(row)}>
                    {#if row.depth === 0}
                        <TreeItem
                            label={row.name}
                            id={rowKey(row)}
                            {nav}
                            level={1}
                            heading
                            expanded={row.open}
                            selected={isSelected(row)}
                            title={titleOf(row)}
                            onclick={() => pressed(row)}
                        >
                            {#snippet actions(reach: number)}
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                {@render rootActions(row, reach)}
                            {/snippet}
                        </TreeItem>
                    {:else if row.kind === 'dir'}
                        <TreeItem
                            label={row.name}
                            id={rowKey(row)}
                            {nav}
                            level={row.depth + 1}
                            glyph={glyphOf(row)}
                            depth={row.depth - 1}
                            expanded={row.open}
                            selected={isSelected(row)}
                            title={titleOf(row)}
                            onclick={() => pressed(row)}
                        />
                    {:else}
                        <TreeItem
                            label={row.name}
                            id={rowKey(row)}
                            {nav}
                            level={row.depth + 1}
                            glyph={glyphOf(row)}
                            depth={row.depth - 1}
                            selected={isSelected(row)}
                            title={titleOf(row)}
                            onclick={() => pressed(row)}
                            ondblclick={() => onopen(row, false)}
                        >
                            {#snippet actions(reach: number)}
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                {@render fileActions(row, reach)}
                            {/snippet}
                        </TreeItem>
                    {/if}
                </li>
            {/each}
        </ul>
    {/snippet}
</TreeView>

<style>
    .rows {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .row {
        min-width: 0;
    }

    /* A root's head opens a tree of its own, so the heads after the first stand apart from the rows
       above them. */
    .row.head:not(:first-child) {
        margin-top: 6px;
    }
</style>
