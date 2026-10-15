<script module lang="ts">
    import { z } from 'zod';
    import { wordShape } from '$lib/data/shapes/shapes';

    /**
     * The root and the path a bookmark names, each as text and the empty text when it is not; the
     * empty path is the root's top.
     */
    const whereShape = z.object({ root: wordShape, path: wordShape });
</script>

<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The reader's own bookmarks as a section
    // under the trees: a head that opens and closes it, and one explorer row per bookmark, opening
    // the file or showing the folder or root it names, with two controls: Rename Bookmark..., which
    // asks for the new label in a prompt, and Remove Bookmark. A row drags to another place and
    // moves with Alt+Up and Alt+Down, which write the bookmarks file in the new order. A folder and
    // a root's top have the folder glyph, and a path or root that is gone is drawn muted and struck
    // through.
    //
    // The head is drawn in every state: with no bookmark the section says so in one muted row, and
    // with a bookmarks file that could not be read it says why in that row instead, with the
    // control that reads it again beside it, as every other row of the tree carries its controls.
    // The section is one stop of the focus order through ui/tree/TreeView.svelte.
    //
    // The star on a file, a folder or a root adds a bookmark. This section is where bookmarks are
    // opened, renamed, removed and put in order.

    import Failed from '$lib/views/shared/explorer/tree/Failed.svelte';
    import Section from '$lib/views/shared/explorer/sections/Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import type { PromptRequest } from '$lib/ui/forms/prompt';
    import { MOVE_KEYMAP } from '$lib/state/sources/explorer/acts/keys';
    import {
        createListDrag,
        listKeys,
        type ListSectionProps
    } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import type { BookmarkEntry } from '$lib/state/sources/fs.svelte';
    import { placeOf } from '$lib/state/sources/fs';
    import { readOr } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        rows: BookmarkEntry[];
        onopen: (entry: BookmarkEntry) => void;
        /** Give one bookmark another label. */
        onrename: (id: string, label: string) => void;
        /** Take one bookmark away. */
        onremove: (id: string) => void;
    } & ListSectionProps;

    let { rows, error, open, ontoggle, onopen, onrename, onremove, onretry, move, onorder }: Props =
        $props();

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

    /** The question Rename Bookmark... asks, held while the prompt is open. */
    let renaming: PromptRequest | null = $state(null);

    function ask(row: BookmarkEntry): void {
        renaming = {
            message: t('files.bookmark_rename_ask', row.title),
            fields: [{ label: t('files.bookmark_label'), value: row.title }],
            verb: t('files.bookmark_rename_do'),
            act: ([label]) => {
                renaming = null;
                if (label.trim() !== '' && label.trim() !== row.title) {
                    onrename(row.id, label);
                }
            }
        };
    }

    /** The place one bookmark names, which is what a row says after its label. */
    function whereOf(entry: BookmarkEntry): string {
        const { root, path } = readOr(whereShape, entry.fields, { root: '', path: '' });
        return placeOf({ root, path });
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
                            onclick={() => onopen(row)}
                            drag={list.row(row.id)}
                        >
                            {#snippet detail()}
                                {whereOf(row)}
                            {/snippet}
                            {#snippet actions(reach: number)}
                                <ToolButton
                                    label={t('files.bookmark_rename')}
                                    glyph="edit"
                                    compact
                                    tabindex={reach}
                                    title={t('files.bookmark_rename_title', row.title)}
                                    onclick={() => ask(row)}
                                />
                                <ToolButton
                                    label={t('files.menu_remove_bookmark')}
                                    glyph="trash"
                                    compact
                                    tabindex={reach}
                                    title={t('files.bookmark_remove_title', row.title)}
                                    onclick={() => onremove(row.id)}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
            </Section>
        {/snippet}
    </TreeView>
</div>

{#if renaming !== null}
    <Prompt request={renaming} cancel={t('ui.confirm_cancel')} oncancel={() => (renaming = null)} />
{/if}

<style>
    .marks {
        margin-top: 6px;
    }
</style>
