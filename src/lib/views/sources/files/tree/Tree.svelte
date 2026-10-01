<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The roots as one explorer tree: every
    // row carries its own depth, so one each draws the whole thing and nothing here recurses. Which
    // rows exist is state/sources/fs.ts's treeRows() over the listings and the open folders, or
    // filterRows() while a filter is typed, so what is on screen follows the state and is never
    // something a click did to the list.
    //
    // A root's own line is the head of that root's tree, drawn in small capitals with that root's
    // icon controls on it: refresh, collapse all, and the removal of a root the reader added. Every
    // other row is a folder or a file, and a file row carries its star and its new-tab control. The
    // controls that change the workspace are the view's toolbar, since they belong to no one root.
    //
    // A file row has two speeds: one click opens it as the pane's preview tab, which the next
    // single click replaces, and a double click opens it to keep. The two clicks of a double click
    // open the same file twice as a preview first, which is the same tab, so nothing is left
    // behind.
    //
    // The tree is one stop of the focus order through ui/tree/TreeView.svelte, and the stop is the
    // selected row, which is the instance's, so it is the same row when the tab comes back. A key
    // that moves the focus selects the row it moves to. While a filter draws the rows, a folder it
    // holds open is stepped through by Right and Left and never opened or closed, so clearing the
    // filter gives back the folders that were open before it.
    //
    // The rows of the open folders have no cap, so they are drawn through
    // ui/tree/VirtualRows.svelte, which draws only the rows in view of the pane and holds the
    // height of the rest; a key moving to a row not drawn has it scrolled in first, and the
    // type-ahead reads every row's name.
    //
    // A file row is draggable and carries its absolute path under the file drag type, which a drop
    // target that takes a file (the composer's prompt box) reads.
    //
    // Every row opens its own right-click menu (tree/row-menu.ts), by the pointer or by Shift+F10
    // and the context menu key on the focused row. A pick runs through the stores, and through the
    // view's own add-root form and its removal question, handed in; a pick the server refuses is
    // said on a line above the rows until the next pick.
    //
    // The picks that write (tree/row-ops.ts) run here too, over the explorer store: this component
    // draws the questions they ask (../Questions.svelte), opens the file dialog for Upload..., and
    // holds the name being typed. A row marked `editing` by treeRows() is drawn as an input
    // (tree/NameInput.svelte) in place of its name: the pending row of a new file or folder, or the
    // row being renamed. The name is the instance's own state (`naming`), written through `owner`,
    // the id of the Files view this tree belongs to. A row on the clipboard as Cut is drawn faded.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import VirtualRows from '$lib/ui/tree/VirtualRows.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import FileChooser from '$lib/ui/forms/file/FileChooser.svelte';
    import NameInput from './NameInput.svelte';
    import Questions from '../Questions.svelte';
    import { rowFacts, rowMenu, rowPicker, rowStores } from './row-menu';
    import { holdsContents, rowNaming, rowOpsPicker, type AskedQuestion } from './row-ops';
    import { onDestroy } from 'svelte';
    import { useState } from '$lib/state/client/use';
    import {
        FILE_DRAG,
        absoluteOf,
        filesViewOf,
        nameOf,
        patchedFilesView,
        rowKey,
        shownOf,
        treeKeyRows,
        typeOfFile,
        type FilesView,
        type FsRoot,
        type RowRef,
        type TreeRow
    } from '$lib/state/sources/fs';
    import { stemLength } from '$lib/state/sources/explorer/ops.svelte';
    import { diffState } from '$lib/state/sources/repositories/repositories';
    import { DIFF_VIEW } from '$lib/state/sources/repositories/repositories.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        rows: TreeRow[];
        /** The roots the rows are under, for the absolute path a dragged file row carries. */
        roots?: FsRoot[];
        /** Whether a filter draws the rows, which holds the folders it draws open. */
        filtering: boolean;
        selected: RowRef | null;
        /** The id of the Files view this tree is drawn for, which holds the name being typed. */
        owner: string;
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
        /**
         * Open the view's add-root form, the root menu's Add Folder to Workspace...; none while the
         * form is open, when the item is not offered.
         */
        onaddroot?: () => void;
    };

    let {
        rows,
        roots,
        filtering,
        selected,
        owner,
        fixed,
        marked,
        onselect,
        ontoggle,
        onopen,
        onremove,
        onbookmark,
        onrefresh,
        oncollapse,
        onaddroot
    }: Props = $props();

    const client = useState();

    /** A pick from a row's menu the server refused, said above the rows until the next pick. */
    let refused = $state('');

    /** What a pick from a row's right-click menu runs. */
    const picked = rowPicker(
        {
            ...rowStores(client),
            dirOf: (root: string) => roots?.find((one) => one.key === root)?.dir ?? '',
            say: (note: string) => (refused = note),
            addRoot: () => onaddroot?.(),
            removeRoot: (root: string) => onremove(root)
        },
        t
    );

    const { explorer } = client;

    /** What this tree's Files view remembers, read when a press or an answer needs it. */
    function viewNow(): FilesView {
        return filesViewOf(client.ui.instanceState(owner));
    }

    /** Write part of what the Files view remembers, and nothing when its tab has been closed. */
    function patchView(part: Partial<FilesView>): void {
        if (client.ui.instanceState(owner) === undefined) return;
        client.ui.setInstanceState(owner, patchedFilesView(client.ui.instanceState(owner), part));
    }

    /** The question on screen and the call that answers it; none while nothing is asked. */
    let asking: { ask: AskedQuestion; resolve: (confirmed: boolean) => void } | null =
        $state.raw(null);

    /** Ask a question and answer whether it was confirmed; a new question cancels the old. */
    function ask(ask: AskedQuestion): Promise<boolean> {
        asking?.resolve(false);
        return new Promise((resolve) => {
            asking = { ask, resolve };
        });
    }

    function answered(confirmed: boolean): void {
        const held = asking;
        asking = null;
        held?.resolve(confirmed);
    }

    /** The file dialog, and the call that takes the files it hands over. */
    let chooser: { open: () => void } | null = $state(null);
    let choosing: ((files: File[]) => void) | null = null;

    function choose(): Promise<File[]> {
        choosing?.([]);
        return new Promise((resolve) => {
            choosing = resolve;
            chooser?.open();
        });
    }

    onDestroy(() => {
        asking?.resolve(false);
        choosing?.([]);
    });

    const naming = rowNaming(
        {
            explorer,
            view: viewNow,
            patch: patchView,
            say: (note: string) => (refused = note),
            entries: (root: string, path: string) =>
                client.fs.heldEntries(root, path, shownOf(viewNow()))
        },
        t
    );

    /** What a pick of the menu's file operations runs. */
    const opsPicked = rowOpsPicker(
        {
            explorer,
            say: (note: string) => (refused = note),
            confirm: ask,
            choose,
            startName: naming.start,
            openCompare: (file, against) => {
                client.layout.openView(
                    DIFF_VIEW,
                    diffState(
                        {
                            root: file.root,
                            path: file.path,
                            staged: false,
                            worktree: false,
                            against
                        },
                        t('files.compare_title', nameOf(against.path), nameOf(file.path))
                    )
                );
            },
            draftOf: (row: TreeRow) =>
                explorer.unsaved({ root: row.root, path: row.path }, holdsContents(row)),
            selected: () =>
                selected === null ? [] : [{ root: selected.root, path: selected.path }]
        },
        t
    );

    /** Whether a row is on the clipboard as Cut. */
    function isCut(row: TreeRow): boolean {
        const held = explorer.clipboard();
        return (
            held?.mode === 'cut' &&
            held.items.some((one) => one.root === row.root && one.path === row.path)
        );
    }

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

    /** Each row's index by its key, for the key moves and the type-ahead. */
    const indexes = $derived(new Map(rows.map((row, at) => [rowKey(row), at])));

    function rowOf(id: string): TreeRow | undefined {
        const at = indexes.get(id);
        return at === undefined ? undefined : rows[at];
    }

    /** Put a file row's absolute path on the drag, for a drop target that takes a file. */
    function dragged(event: DragEvent, row: TreeRow): void {
        const dir = roots?.find((one) => one.key === row.root)?.dir ?? '';
        if (dir === '' || event.dataTransfer === null) return;
        const path = absoluteOf(dir, row.path);
        event.dataTransfer.setData(FILE_DRAG, path);
        event.dataTransfer.setData('text/plain', path);
        event.dataTransfer.effectAllowed = 'copy';
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
        title={t('files.collapse_all_title', row.name)}
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

{#if refused !== ''}
    <Empty error message={refused} />
{/if}

<FileChooser
    bind:this={chooser}
    accept=""
    multiple
    onchoose={(files: File[]) => {
        const taker = choosing;
        choosing = null;
        taker?.(files);
    }}
/>

{#if asking !== null}
    <Questions question={asking.ask} onanswer={answered} />
{/if}

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
            <VirtualRows
                count={rows.length}
                key={(at: number) => rowKey(rows[at])}
                {nav}
                owns={(id: string) => indexes.get(id) ?? -1}
                label={(id: string) => rowOf(id)?.name}
            >
                {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                    {@const row = rows[at]}
                    <li
                        class="row"
                        class:apart={row.depth === 0 && at > 0}
                        role="none"
                        data-fs-row={rowKey(row)}
                        data-cut={isCut(row) ? '' : undefined}
                        draggable={row.kind === 'file' &&
                        roots !== undefined &&
                        row.editing === undefined
                            ? 'true'
                            : undefined}
                        ondragstart={(event) => dragged(event, row)}
                        {@attach measure}
                    >
                        {#if row.editing !== undefined}
                            <TreeItem
                                label=""
                                name={t('files.name_label')}
                                id={rowKey(row)}
                                {nav}
                                level={row.depth + 1}
                                glyph={glyphOf(row)}
                                depth={row.depth - 1}
                                selected
                            >
                                {#snippet field()}
                                    <NameInput
                                        value={row.name}
                                        select={row.editing === 'rename' && row.kind === 'file'
                                            ? stemLength(row.name)
                                            : undefined}
                                        taken={naming.takenIn(row)}
                                        onaccept={(text: string) => void naming.named(text)}
                                        oncancel={() => patchView({ naming: null })}
                                    />
                                {/snippet}
                            </TreeItem>
                        {:else}
                            <ContextMenu
                                label={row.name}
                                items={rowMenu(
                                    rowFacts(row, fixed, onaddroot !== undefined, explorer),
                                    t
                                )}
                                onpick={(pick: string) => {
                                    refused = '';
                                    picked(row, pick);
                                    opsPicked(row, pick);
                                }}
                            >
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
                            </ContextMenu>
                        {/if}
                    </li>
                {/snippet}
            </VirtualRows>
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
       above them. The gap is padding inside the row's own box, so the list measures it with the
       row. */
    .row.apart {
        padding-top: 6px;
    }

    /* A row on the clipboard as Cut shows through the token's share of its colour. */
    .row[data-cut] {
        opacity: var(--tree-cut-opacity);
    }
</style>
