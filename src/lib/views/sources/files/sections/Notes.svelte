<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The notes of every hub as a section
    // under the trees: a head that opens and closes it and carries New Note (into the primary hub's
    // notes folder, else the first hub's) and the control that opens the Notes Graph, and under it
    // the Explorer's own tree (views/shared/explorer/tree/Tree.svelte) over each hub's
    // `.oculus/notes/`, each hub a group row named by the workspace's name for it, with its own New
    // Note and New Folder. A press, a key, the menu, the name input, Rename, Move to Trash and a
    // drag act on a note as on any file of the Files tree, through the file operations, so each is
    // in History and a note trashed is in the Trash.
    //
    // The rows, the record the tree keeps and what only this tree does (a typed name made a note,
    // the order the notes keep) are notes-section.svelte.ts's. A group that lists nothing says why
    // in one muted row, with the read again for notes that could not be read; a workspace with no
    // hub is that one row and no New Note. The head is the tree's first row, so the arrow keys walk
    // from it into the groups, and Alt+Up and Alt+Down on it move the section.

    import { untrack } from 'svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import Tree from '$lib/views/shared/explorer/tree/Tree.svelte';
    import type { SectionMove } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import { HEADER_ID, type TreeRow } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { createNotesSection } from './notes-section.svelte';

    type Props = {
        /** The Files tab the section is drawn in. */
        owner: string;
        open: boolean;
        ontoggle: () => void;
        move: SectionMove;
        /** Say what a press answered on the Files view's line of the instance it was made in. */
        onnote: (owner: string, note: string) => void;
    };

    let { owner, open, ontoggle, move, onnote }: Props = $props();

    const client = useState();
    const {
        fs: { retryNotes },
        layout: { openView }
    } = client;

    const section = createNotesSection(client, {
        owner: () => owner,
        say: (from: string, note: string) => onnote(from, note)
    });

    // A read that failed holds nothing, so the section asks again when it is drawn; untracked, so
    // a read that fails again is not itself the reason for another ask.
    $effect(() => {
        untrack(() => retryNotes());
    });

    /** The roots of the groups, for the absolute path a dragged row carries. */
    const roots = $derived(section.groups.map((one) => one.root));
</script>

{#snippet header(nav: TreeNav)}
    <TreeItem
        label={t('files.notes')}
        id={HEADER_ID}
        {nav}
        level={1}
        heading
        expanded={open}
        title={open
            ? t('files.header_close_title', t('files.notes'))
            : t('files.header_open_title', t('files.notes'))}
        onclick={ontoggle}
        drag={move.drag}
        showActions
    >
        {#snippet actions(reach: number)}
            {#if section.headHub !== undefined}
                <ToolButton
                    label={t('files.add_note')}
                    title={t('notes.add_title', section.headHub.root.key)}
                    glyph={t('files.note_glyph')}
                    compact
                    tabindex={reach}
                    onclick={section.newNote}
                />
            {/if}
            <ToolButton
                label={t('notes.graph')}
                title={t('notes.graph_title')}
                glyph={t('notes.graph_glyph')}
                compact
                tabindex={reach}
                onclick={() => openView('notes-graph')}
            />
        {/snippet}
    </TreeItem>
{/snippet}

{#snippet groupActions(row: TreeRow, reach: number)}
    {#if row.depth === 0}
        <ToolButton
            label={t('notes.new_note')}
            title={t('notes.add_title', row.name)}
            glyph="file_add"
            compact
            tabindex={reach}
            onclick={() => section.start('file', row)}
        />
        <ToolButton
            label={t('notes.new_folder')}
            title={t('notes.add_folder_title', row.name)}
            glyph="folder_add"
            compact
            tabindex={reach}
            onclick={() => section.start('folder', row)}
        />
    {/if}
{/snippet}

<div class="notes" data-fs-notes>
    <Tree
        rows={section.rows}
        {roots}
        filtering={false}
        selected={section.view.selected}
        owner={section.key}
        fixed={roots.map((one) => one.key)}
        marked={section.marked}
        {header}
        headerOpen={open}
        onselect={section.select}
        ontoggle={section.toggle}
        onopen={section.open}
        onremove={() => undefined}
        onbookmark={(row: TreeRow) => void section.marking.bookmark(row)}
        onmoveheader={(direction: 'up' | 'down') => move.step(direction)}
        onrefused={(note: string) => onnote(owner, note)}
        rowOrder={section.rowOrder}
        naming={section.naming}
        rowActions={groupActions}
        onretry={retryNotes}
    />
</div>

<style>
    .notes {
        margin-top: 6px;
    }
</style>
