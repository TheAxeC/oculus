<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The Open Editors section: the tabs of
    // the page this view is on that show a file, grouped by the pane that holds them, each row the
    // file's icon and name with the folder it sits in, the dot of a tab holding unsaved text, the
    // name of a tab whose file was deleted struck through in red, the count of the errors and
    // warnings the file holds in the colour of the worst (the name takes that colour too), and a
    // close control under the pointer. A press on a row brings its tab forward. The head carries
    // Save All, which saves every dirty source tab, and Close All, which closes every tab listed
    // and asks the close question first (state/workbench/navigation/pages.ts's closeAsk) whenever
    // one of them holds unsaved text.
    //
    // A row drags onto another row, and the tab moves to the place of the target row's tab in that
    // row's pane (state/sources/explorer/sections/open-editors.ts's editorDrop), through
    // transferInstance, so a pinned tab dropped among unpinned ones unpins as it does in the strip.
    // Close All leaves the pinned tabs open.
    //
    // The groups are read from the page's layout on every change of it, so the section never holds
    // a copy of the tabs. It holds nothing of its own but the close that waits on the dialog and
    // the row being dragged.

    import Section from '$lib/views/shared/explorer/sections/Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import { MOVE_KEYMAP } from '$lib/state/sources/explorer/acts/keys';
    import {
        headKeys,
        type SectionMove
    } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';
    import {
        dirtyIds,
        editorDrop,
        openGroups,
        openIds,
        type OpenEditor
    } from '$lib/state/sources/explorer/sections/open-editors';
    import { problemMarkOf, problemWords } from '$lib/state/sources/fs';
    import { instanceLabel, panes } from '$lib/state/workbench/layout';
    import { fileOfTab } from '$lib/state/workbench/navigation/pages';
    import { closingEditors, type Confirming } from '../control/editor-closing';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        open: boolean;
        ontoggle: () => void;
        /** What lets the head be dragged and moved by Alt+Up/Down. */
        move?: SectionMove;
    };

    let { open, ontoggle, move }: Props = $props();

    const {
        layout: { activateInstance, closeInstance, currentPage, layout, transferInstance },
        fs: { gone },
        problems,
        ui: { saveBeforeClose, unsaved },
        source: { saveSourceDraft }
    } = useState();

    const page = $derived(currentPage().id);
    const held = $derived(panes(layout(page)));
    const groups = $derived(
        openGroups(
            held,
            (tab) => instanceLabel(tab.state) ?? '',
            (id) => unsaved(id),
            fileOfTab
        )
    );
    const several = $derived(groups.length > 1);
    const total = $derived(openIds(groups).length);
    const dirty = $derived(dirtyIds(groups));

    /** The close that waits on the dialog: the words it asks and what a yes does. */
    let confirming: Confirming | null = $state(null);

    /** The mark of a row's file: its errors and warnings. */
    function markOf(row: OpenEditor) {
        return problemMarkOf(problems.fileCounts(row.file.root, row.file.path), 'file');
    }

    /** The id a group line has in the tree, and a row's. */
    const groupKey = (index: number): string => `group:${String(index)}`;
    const rowKey = (row: OpenEditor): string => `editor:${row.id}`;

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? groups.flatMap((group) => [
                  ...(several ? [{ id: groupKey(group.index), parent: 'head' }] : []),
                  ...group.rows.map((row) => ({
                      id: rowKey(row),
                      parent: several ? groupKey(group.index) : 'head'
                  }))
              ])
            : [])
    ]);

    function nameOf(id: string): string {
        return groups.flatMap((group) => group.rows).find((row) => row.id === id)?.name ?? id;
    }

    /** Close these tabs, asking first when one holds unsaved text. */
    async function closing(ids: string[]): Promise<void> {
        confirming = await closingEditors(ids, {
            unsaved,
            saveBeforeClose,
            nameOf,
            close: (id) => closeInstance(id, page)
        });
    }

    /** Save every dirty source tab, one after the other. */
    async function saveAll(): Promise<void> {
        for (const group of groups) {
            for (const row of group.rows) {
                if (row.view === 'source' && row.dirty) {
                    await saveSourceDraft(row.id, row.file.root, row.file.path);
                }
            }
        }
    }

    /** The drag type a row carries: the id of its tab. */
    const EDITOR_DRAG = 'application/x-oculus-editor';

    /** The tab being dragged, set when a drag starts and read by the rows it passes over. */
    let dragged: string | null = null;

    function dragStarted(event: DragEvent, id: string): void {
        if (event.dataTransfer === null) return;
        dragged = id;
        event.dataTransfer.setData(EDITOR_DRAG, id);
        event.dataTransfer.effectAllowed = 'move';
    }

    /** A drag over a row is let drop where the drop would move the tab. */
    function dragOver(event: DragEvent, id: string): void {
        if (dragged === null || editorDrop(held, dragged, id) === null) return;
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
    }

    function dropped(event: DragEvent, id: string): void {
        const moved = dragged === null ? null : editorDrop(held, dragged, id);
        if (dragged === null || moved === null) return;
        event.preventDefault();
        transferInstance(dragged, moved.path, moved.index, page);
        dragged = null;
    }

    /** Take the question away and perform the close it asked about. */
    function confirmed(): void {
        const act = confirming?.act;
        confirming = null;
        act?.();
    }
</script>

<div class="editors" data-fs-editors>
    <TreeView
        label={t('files.editors')}
        rows={keyRows}
        {ontoggle}
        keymap={MOVE_KEYMAP}
        onkey={headKeys(move)}
    >
        {#snippet children(nav: TreeNav)}
            <Section
                label={t('files.editors')}
                {nav}
                count={total}
                {open}
                {ontoggle}
                drag={move?.drag}
            >
                {#snippet more(reach: number)}
                    <ToolButton
                        label={t('files.editors_save_all')}
                        title={t('files.editors_save_all_title')}
                        glyph="save_all"
                        compact
                        disabled={dirty.length === 0}
                        tabindex={reach}
                        onclick={() => void saveAll()}
                    />
                    <ToolButton
                        label={t('files.editors_close_all')}
                        title={t('files.editors_close_all_title')}
                        glyph="close_all"
                        compact
                        disabled={total === 0}
                        tabindex={reach}
                        onclick={() => closing(openIds(groups))}
                    />
                {/snippet}
                {#if total === 0}
                    <li role="none">
                        <TreeItem label={t('files.editors_empty')} tone="muted" />
                    </li>
                {/if}
                {#each groups as group (group.index)}
                    {#if several}
                        <li role="none" data-fs-editor-group={group.index}>
                            <TreeItem
                                label={t('files.editors_group', group.index + 1)}
                                id={groupKey(group.index)}
                                {nav}
                                level={2}
                                tone="muted"
                                expanded
                            />
                        </li>
                    {/if}
                    {#each group.rows as row (row.id)}
                        {@const mark = markOf(row)}
                        <li
                            role="none"
                            data-fs-editor={row.id}
                            draggable="true"
                            ondragstart={(event) => dragStarted(event, row.id)}
                            ondragover={(event) => dragOver(event, row.id)}
                            ondrop={(event) => dropped(event, row.id)}
                            ondragend={() => (dragged = null)}
                        >
                            <TreeItem
                                label={row.name}
                                id={rowKey(row)}
                                {nav}
                                level={several ? 3 : 2}
                                file={row.file.path}
                                selected={row.active}
                                tone={gone(row.file.root, row.file.path) || mark?.tone === 'error'
                                    ? 'error'
                                    : mark === null
                                      ? undefined
                                      : 'warn'}
                                struck={gone(row.file.root, row.file.path)}
                                title={gone(row.file.root, row.file.path)
                                    ? `${t('files.editors_open_title', row.name)}\n${t('ui.tab_deleted')}`
                                    : t('files.editors_open_title', row.name)}
                                onclick={() => activateInstance(row.id, page)}
                            >
                                {#snippet detail()}
                                    {row.where}
                                {/snippet}
                                {#snippet end()}
                                    {#if mark !== null}
                                        {@const words = problemWords(mark)}
                                        <span
                                            class="problems"
                                            class:warning={mark.tone === 'warning'}
                                            title={words.title}
                                            data-problem-count>{words.count}</span
                                        >
                                    {/if}
                                    {#if row.dirty}
                                        <span
                                            class="dirty"
                                            role="img"
                                            aria-label={t('files.editors_dirty')}
                                        >
                                            <Glyph name={t('ui.dirty_glyph')} />
                                        </span>
                                    {/if}
                                {/snippet}
                                {#snippet actions(reach: number)}
                                    <ToolButton
                                        label={t('files.editors_close')}
                                        title={t('files.editors_close_title', row.name)}
                                        glyph="dismiss"
                                        compact
                                        tabindex={reach}
                                        onclick={() => closing([row.id])}
                                    />
                                {/snippet}
                            </TreeItem>
                        </li>
                    {/each}
                {/each}
            </Section>
        {/snippet}
    </TreeView>
</div>

<CloseQuestion
    message={confirming?.message ?? null}
    onconfirm={confirmed}
    oncancel={() => (confirming = null)}
/>

<style>
    .editors {
        margin-top: 0;
    }

    /* The count of the errors or warnings of the row's file, before the unsaved mark, in the error
       colour and in the warning colour when the file has no error. */
    .problems {
        margin-left: 5px;
        color: var(--c-red-txt);
        font-size: 90%;
        font-weight: 600;
        opacity: 0.75;
    }

    .problems.warning {
        color: var(--c-amber-txt);
    }

    /* The unsaved mark: the dirty glyph the tab draws, in the row's own text colour, where VS Code
       draws it. */
    .dirty {
        display: inline-flex;
        align-items: center;
        opacity: 0.8;
    }

    .dirty :global(svg) {
        fill: currentColor;
    }
</style>
