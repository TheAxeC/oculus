<script module lang="ts">
    import { z } from 'zod';
    import { wordShape } from '$lib/data/shapes/shapes';

    /** The root and the path a bookmark names, each as text and the empty text when it is not. */
    const whereShape = z.object({ root: wordShape, path: wordShape });
</script>

<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The reader's own bookmarks as a section
    // under the trees: a head that opens and closes it and carries the control that adds one, and
    // one explorer row per bookmark, opening the file or showing the folder it names, with the
    // control that opens the shared entry form over it. A row drags to another place and moves with
    // Alt+Up and Alt+Down, which write the bookmarks file in the new order. The bookmark the form
    // is open for is drawn as the one in force; a folder has the folder glyph, and a path that is
    // gone is drawn muted and struck through.
    //
    // The head is drawn in every state, since it is where a bookmark is added: with no bookmark the
    // section says so in one muted row, and with a bookmarks file that could not be read it says
    // why in that row instead, with the control that reads it again beside it, as every other row
    // of the tree carries its controls. The section is one stop of the focus order through
    // ui/tree/TreeView.svelte.
    //
    // The rail draws the same bookmarks as buttons, which is where they are pressed from; this is
    // where they are changed, since a form has nowhere to go in a rail of 34-pixel controls.

    import Failed from '$lib/views/shared/explorer/tree/Failed.svelte';
    import Section from './Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { MOVE_KEYMAP } from '$lib/state/sources/explorer/acts/keys';
    import { createListDrag, listKeys, type SectionMove } from './list-drag.svelte';
    import type { BookmarkEntry } from '$lib/state/sources/fs.svelte';
    import { readOr } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        rows: BookmarkEntry[];
        /** What reading the bookmarks failed with, or the empty string. */
        error: string;
        /** Whether the section is open. */
        open: boolean;
        /** The bookmark the form is open for, and the empty string while it is closed. */
        editing: string;
        /** Whether the form is open to add a bookmark. */
        adding: boolean;
        ontoggle: () => void;
        onadd: () => void;
        onopen: (entry: BookmarkEntry) => void;
        onedit: (id: string) => void;
        /** Ask for the bookmarks again, which the failed line's own control offers. */
        onretry: () => void;
        /** What lets the head be dragged and moved by Alt+Up/Down. */
        move?: SectionMove;
        /** Put the bookmarks in the order the ids name, after a drop or Alt+Up/Down on a row. */
        onorder: (ids: string[]) => void;
    };

    let {
        rows,
        error,
        open,
        editing,
        adding,
        ontoggle,
        onadd,
        onopen,
        onedit,
        onretry,
        move,
        onorder
    }: Props = $props();

    /** The drags of the bookmark rows over each other. */
    const list = createListDrag({
        type: 'application/x-oculus-bookmark',
        order: () => rows.map((row) => row.id),
        drawn: () => rows.map((row) => row.id),
        write: (ids) => onorder(ids)
    });

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: `mark:${row.id}`, parent: 'head' })) : [])
    ]);

    /** The root and the path one bookmark names, which is what a row says after its label. */
    function whereOf(entry: BookmarkEntry): string {
        const { root, path } = readOr(whereShape, entry.fields, { root: '', path: '' });
        return `${root}/${path}`;
    }
</script>

<div class="marks" data-fs-bookmarks>
    <TreeView
        label={t('files.bookmarks')}
        rows={keyRows}
        {ontoggle}
        keymap={MOVE_KEYMAP}
        onkey={listKeys(move, list, 'mark:')}
    >
        {#snippet children(nav: TreeNav)}
            <Section
                label={t('files.bookmarks')}
                {nav}
                count={rows.length}
                {open}
                {ontoggle}
                add={{
                    label: t('files.add_bookmark'),
                    title: t('files.add_bookmark_title'),
                    glyph: t('files.bookmark_glyph')
                }}
                {adding}
                {onadd}
                showActions
                drag={move?.drag}
            >
                {#if error !== ''}
                    <li role="none">
                        <Failed
                            label={t('files.bookmarks_failed', error)}
                            title={t('files.read_again_bookmarks')}
                            {onretry}
                        />
                    </li>
                {:else if rows.length === 0}
                    <li role="none">
                        <TreeItem label={t('files.bookmarks_empty')} tone="muted" />
                    </li>
                {/if}
                {#each rows as row (row.id)}
                    <li role="none" data-fs-bookmark={row.id}>
                        <TreeItem
                            label={row.title}
                            id={`mark:${row.id}`}
                            {nav}
                            level={2}
                            glyph={row.kind === 'folder'
                                ? t('files.folder_glyph')
                                : t('files.bookmark_glyph')}
                            tone={row.kind === 'missing' ? 'muted' : undefined}
                            struck={row.kind === 'missing'}
                            title={row.kind === 'missing'
                                ? t('files.bookmark_missing_title', whereOf(row))
                                : t('files.bookmark_open_title', whereOf(row))}
                            current={editing === row.id}
                            onclick={() => onopen(row)}
                            drag={list.row(row.id)}
                        >
                            {#snippet detail()}
                                {whereOf(row)}
                            {/snippet}
                            {#snippet actions(reach: number)}
                                <ToolButton
                                    label={t('files.bookmark_edit')}
                                    glyph="edit"
                                    compact
                                    tabindex={reach}
                                    expanded={editing === row.id}
                                    title={t('files.bookmark_edit_title', row.title)}
                                    onclick={() => onedit(row.id)}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
            </Section>
        {/snippet}
    </TreeView>
</div>

<style>
    .marks {
        margin-top: 6px;
    }
</style>
