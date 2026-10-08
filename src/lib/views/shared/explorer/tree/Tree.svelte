<script lang="ts">
    // Layer 3, shared view, drawn by RootedTree.svelte. The roots as one explorer tree, drawn as VS
    // Code's Explorer draws it: every row carries its depth, so one `each` draws the whole thing
    // and nothing here recurses. Which rows exist is state/sources/explorer/rows/tree-rows.ts over
    // the listings and the open folders, or its filterRows() while a filter is typed, so what is on
    // screen follows the state and is never something a click did to the list. Each root is a
    // top-level folder row. The workspace header, when the view draws one, is the first row of this
    // same tree (the `header` snippet, handed the tree's `nav`), so the arrow keys walk from it
    // into the roots; a closed header leaves the keyboard its own row.
    //
    // A row is drawn by tree/FileRow.svelte. A press selects the row and a folder opens or closes,
    // a file opens as the pane's preview tab (a double click keeps it); with Cmd held the press
    // toggles the row in the selection, with Shift it selects the range from the anchor
    // (acts/selection.ts). The selection is the instance's state, pruned by the view when a refresh
    // no longer lists a row. Every action of the menu and of the keys acts on the selection when
    // the row is in it, and on the row alone otherwise.
    //
    // The tree is one stop of the focus order through ui/tree/TreeView.svelte, and the stop is the
    // selected row, which is the instance's, so it is the same row when the tab comes back. A key
    // that moves the focus selects the row it moves to. While a filter draws the rows, a folder it
    // holds open is stepped through by Right and Left and never opened or closed, so clearing the
    // filter gives back the folders that were open before it. The rows of the open folders have no
    // cap, so they are drawn through ui/tree/list/VirtualRows.svelte, which draws only the rows in
    // view of the pane and holds the height of the rest; a key moving to a row not drawn has it
    // scrolled in first, and the type-ahead reads every row's name.
    //
    // The work behind the rows is in tree/control/: keyed.ts is what the keys of acts/keys.ts do,
    // picks.svelte.ts what the menu's and the keys' picks run (and the name being typed),
    // pressing.ts what a press does, row-index.ts the rows by key and the labels the type-ahead
    // reads, dragging.svelte.ts the drags and drops (the files and folders moved, and the movable
    // roots reordered, which Alt+Up and Alt+Down do through keyed.ts as well), asking.svelte.ts the
    // questions and the file dialog they wait on, view-access.ts the tab's state. A row on the
    // clipboard as Cut is drawn faded, and a row marked `editing` by treeRows() is drawn as an
    // input (tree/NameInput.svelte) in place of its name.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import { untrack, type Snippet } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import FileChooser from '$lib/ui/forms/file/FileChooser.svelte';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import FileRow from './FileRow.svelte';
    import NameInput from './NameInput.svelte';
    import Questions from '../Questions.svelte';
    import { menuHints } from './menu/row-menu';
    import { createAsking } from './control/asking.svelte';
    import { createDragging } from './control/dragging.svelte';
    import { createKeyed } from './control/keyed';
    import { createPicks } from './control/picks.svelte';
    import { createPressed } from './control/pressing';
    import { rowIndexOf } from './control/row-index';
    import { viewAccess } from './control/view-access';
    import { useState } from '$lib/state/client/use';
    import { absoluteOf } from '$lib/state/workbench/navigation/pages';
    import {
        decorationOf,
        filesViewOf,
        rowKey,
        treeKeyRows,
        treeKey,
        withHeader,
        type FsRoot,
        type ProblemMark,
        type RowRef,
        type StatusFold,
        type TreeRow
    } from '$lib/state/sources/fs';
    import { acting, type Picked } from '$lib/state/sources/explorer/acts/selection';
    import { filesKeymap, keyWords } from '$lib/state/sources/explorer/acts/keys';
    import { stemLength } from '$lib/state/sources/explorer/ops.svelte';
    import { rememberAnswer } from '$lib/state/sources/explorer/acts/confirm';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        rows: TreeRow[];
        /** The roots the rows are under, for the absolute path a dragged row carries. */
        roots?: FsRoot[];
        /** Whether a filter draws the rows, which holds the folders it draws open. */
        filtering: boolean;
        selected: RowRef | null;
        /** The key of the record this tree is drawn for, which holds the name being typed. */
        owner: string;
        /** The root keys a removal refuses, so a configured root offers no remove control. */
        fixed: string[];
        /** The row keys a bookmark of the reader's own names. */
        marked: string[];
        /** What git says of the paths under the repositories the page carries. */
        fold?: StatusFold;
        /** What the Problems view counts for a row, null for a row with no error or warning. */
        problemOf?: (root: string, path: string, kind: 'file' | 'dir') => ProblemMark | null;
        /**
         * The workspace header, drawn as the first row of the tree; none for a tab that draws no
         * workspace (a following or a rooted one). `headerOpen` says whether the roots show.
         */
        header?: Snippet<[TreeNav]>;
        headerOpen?: boolean;
        /** A plain press or a key moved the cursor to a row. */
        onselect: (row: RowRef) => void;
        ontoggle: (row: TreeRow) => void;
        /**
         * Open one file. A single click asks for a preview tab, a double click for a kept one. A
         * press passes the time it was made at.
         */
        onopen: (row: TreeRow, preview: boolean, pressedAt?: number) => void;
        onremove: (key: string) => void;
        onbookmark: (row: TreeRow) => void;
        /** The `..` row of a rooted tab was pressed: show this folder as the top. */
        onup?: (to: RowRef) => void;
        /**
         * Add folders to the workspace in force through the folder picker, the root menu's Add
         * Folder to Workspace...; none when the item is not offered.
         */
        onaddroot?: () => void;
        /**
         * The keys of the roots the reader may move, in the order written, and the write of a new
         * order of them; a tree given none moves no root.
         */
        order?: string[];
        onreorder?: (keys: string[]) => void;
        /** Alt+Up or Alt+Down on the workspace header row moves the tree's section. */
        onmoveheader?: (direction: 'up' | 'down') => void;
        /**
         * Say a pick's refusal on the caller's own line, the empty text when it ends; a tree given
         * none says it above its rows.
         */
        onrefused?: (note: string) => void;
    };

    let {
        rows,
        roots,
        filtering,
        selected,
        owner,
        fixed,
        marked,
        fold,
        problemOf,
        header,
        headerOpen = true,
        onselect,
        ontoggle,
        onopen,
        onremove,
        onbookmark,
        onup,
        onaddroot,
        order = [],
        onreorder,
        onmoveheader,
        onrefused
    }: Props = $props();

    const client = useState();
    const { explorer } = client;
    const mac = onMac();
    const keymap = filesKeymap(mac);
    const view = viewAccess(client, () => owner);

    /** What this tree's Files view remembers, reactive. */
    const held = $derived(filesViewOf(client.ui.instanceState(owner)));
    const picked = $derived<Picked>({
        selected,
        selection: held.selection,
        anchor: held.anchor
    });
    const chosen = $derived(new Set(acting(picked).map(rowKey)));

    /** Whether a row is part of what is selected, a segment of a folder chain included. */
    function isSelected(row: TreeRow): boolean {
        if (row.chain === undefined) return chosen.has(rowKey(row));
        return row.chain.some((step) => chosen.has(treeKey(row.root, step.path)));
    }

    let chooser: { open: () => void } | null = $state(null);
    const asking = createAsking(
        (confirmed, forget) => rememberAnswer(client.writes.writeConfigKey, confirmed, forget),
        () => chooser
    );
    const question = $derived(asking.asked());

    const picks = createPicks({
        client,
        view,
        asking,
        rows: () => rows,
        roots: () => roots,
        fixed: () => fixed,
        addable: () => onaddroot !== undefined,
        addRoot: () => onaddroot?.(),
        removeRoot: (root: string) => onremove(root),
        bookmark: (row: TreeRow) => onbookmark(row),
        isMarked: (row: TreeRow) => marked.includes(rowKey(row)),
        hints: menuHints(keymap, keyWords(t, mac)),
        isSelected,
        select: (row: TreeRow) => onselect(row),
        onrefused: (note: string) => onrefused?.(note)
    });
    const naming = picks.naming;

    const keyRows = $derived.by(() => {
        const keyed = treeKeyRows(rows, filtering);
        return header === undefined ? keyed : withHeader(keyed, headerOpen);
    });
    const drawn = $derived(header !== undefined && !headerOpen ? [] : rows);

    /** Each row by its key and its place, for the key moves and the type-ahead. */
    const index = $derived(rowIndexOf(drawn));
    const rowOf = (id: string): TreeRow | undefined => index.rowOf(id);

    /** A plain press moves the cursor; Cmd toggles the row in the selection, Shift extends it. */
    const pressed = createPressed({
        view,
        mac,
        drawn: () => drawn,
        onselect: (row) => onselect(row),
        ontoggle: (row) => ontoggle(row),
        onopen: (row, preview, pressedAt) => onopen(row, preview, pressedAt),
        onup: (to) => onup?.(to)
    });

    const dragger = createDragging({
        roots: () => roots,
        picked: view.picked,
        drawn: () => drawn,
        dropper: picks.dropper,
        order: () => order,
        onreorder: (keys) => onreorder?.(keys)
    });

    const keyed = createKeyed({
        client,
        view,
        asking,
        picks,
        rowOf,
        drawn: () => drawn,
        roots: () => roots,
        onopen: (row, preview) => onopen(row, preview),
        ontoggle: (row) => ontoggle(row),
        onup: (to) => onup?.(to),
        order: () => order,
        onreorder: (keys) => onreorder?.(keys),
        onmoveheader: (direction) => onmoveheader?.(direction)
    });

    // The log is read again whenever a file operation was answered, so the next Cmd+Z is the
    // newest one.
    $effect(() => {
        void explorer.answers();
        untrack(() => client.changes.reload());
    });

    /** Whether a row is on the clipboard as Cut. */
    function isCut(row: TreeRow): boolean {
        const clip = explorer.clipboard();
        return (
            clip?.mode === 'cut' &&
            clip.items.some((one) => one.root === row.root && one.path === row.path)
        );
    }
</script>

{#if onrefused === undefined && picks.refused() !== ''}
    <Empty error message={picks.refused()} />
{/if}

<FileChooser bind:this={chooser} accept="" multiple onchoose={asking.chosen} />

{#if question !== null}
    <Questions {question} onanswer={asking.answered} />
{/if}

<TreeView
    label={t('files.tree')}
    rows={keyRows}
    current={selected === null ? '' : rowKey(selected)}
    {keymap}
    onkey={keyed}
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
        {#if header !== undefined}
            {@render header(nav)}
        {/if}
        <ul
            class="rows"
            role="none"
            ondragleave={dragger.left}
            ondragover={dragger.overTail}
            ondrop={dragger.droppedRoot}
        >
            <VirtualRows
                count={drawn.length}
                key={(at: number) => rowKey(drawn[at])}
                {nav}
                owns={(id: string) => index.indexOf(id)}
                label={(id: string) => index.labelOf(id)}
            >
                {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                    {@const row = drawn[at]}
                    <li
                        class="row"
                        role="none"
                        data-fs-row={rowKey(row)}
                        data-cut={isCut(row) ? '' : undefined}
                        data-drop={dragger.tinted(row) ? '' : undefined}
                        data-drop-place={dragger.dropEdge(row)}
                        draggable={dragger.draggable(row) ? 'true' : undefined}
                        ondragstart={(event) => dragger.started(event, row)}
                        ondragover={(event) => dragger.over(event, row)}
                        ondrop={(event) => dragger.dropped(event, row)}
                        ondragend={dragger.ended}
                        {@attach measure}
                    >
                        {#if row.editing !== undefined}
                            <TreeItem
                                label=""
                                name={t('files.name_label')}
                                id={rowKey(row)}
                                {nav}
                                level={row.depth + 1}
                                glyph={row.kind === 'dir' ? t('files.folder_glyph') : undefined}
                                file={row.kind === 'file' && row.name !== '' ? row.name : undefined}
                                depth={row.depth}
                                selected
                            >
                                {#snippet field()}
                                    <NameInput
                                        value={row.name}
                                        select={row.editing === 'rename' && row.kind === 'file'
                                            ? stemLength(row.name)
                                            : undefined}
                                        taken={naming.takenIn(row)}
                                        title={row.editing === 'title'}
                                        onaccept={(text: string) => void naming.named(text)}
                                        oncancel={() => view.patch({ naming: null })}
                                    />
                                {/snippet}
                            </TreeItem>
                        {:else}
                            <ContextMenu
                                label={row.name}
                                read={(event: MouseEvent) => picks.menuOf(row, event)}
                                onpick={picks.pickTarget}
                            >
                                <FileRow
                                    {row}
                                    {nav}
                                    selected={isSelected(row)}
                                    marked={marked.includes(rowKey(row))}
                                    decoration={fold === undefined
                                        ? null
                                        : decorationOf(
                                              fold,
                                              absoluteOf(
                                                  roots?.find((one) => one.key === row.root)?.dir ??
                                                      '',
                                                  row.path
                                              ),
                                              row.kind
                                          )}
                                    problem={problemOf?.(row.root, row.path, row.kind) ?? null}
                                    onpress={pressed}
                                    onkeep={(one: TreeRow, pressedAt?: number) => {
                                        onselect(one);
                                        onopen(one, false, pressedAt);
                                    }}
                                    {onbookmark}
                                />
                            </ContextMenu>
                        {/if}
                    </li>
                {/snippet}
            </VirtualRows>
        </ul>
    {/snippet}
</TreeView>

<style>
    /* VS Code's Explorer measures: the indent guide sits at the centre of the folder's twistie,
       with no gap before the first, and the status letter 16px from the row's edge. */
    .rows {
        --tree-guide-gap: 0px;
        --tree-guide-shift: calc(var(--icon-box) / 2);
        --tree-end-inset: 16px;
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

    /* A row on the clipboard as Cut shows through the token's share of its colour. */
    .row[data-cut] {
        opacity: var(--tree-cut-opacity);
    }

    /* The folder a drop would land in, and the rows open under it, are tinted. */
    .row[data-drop] {
        background: var(--accent-bg);
    }

    /* Where a dragged root would land: a 2px line on that edge of the row. */
    .row[data-drop-place] {
        box-shadow: inset 0 2px 0 var(--accent);
    }

    .row[data-drop-place='after'] {
        box-shadow: inset 0 -2px 0 var(--accent);
    }
</style>
