<script lang="ts">
    // Layer 3, partial of views/Files.svelte. The tree as one flat list: every row carries its own
    // depth, so one each draws the whole thing and nothing here recurses. Which rows exist is
    // state/fs.ts's treeRows() over the listings and the set of open folders, so what is on screen
    // follows the state and is never something a click did to the list by hand.
    //
    // A file row has two speeds: one click opens it as the pane's preview tab, which the next single
    // click replaces, and a double click opens it to keep. The two clicks of a double click open the
    // same file twice as a preview first, which is the same tab, so nothing is left behind.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { typeOfFile, treeKey, type TreeRow } from '$lib/state/fs';
    import { t } from '$lib/state/text';

    type Props = {
        rows: TreeRow[];
        /** The root keys a removal refuses, so a configured root offers no remove control. */
        fixed: string[];
        ontoggle: (row: TreeRow) => void;
        /** Open one file. A single click asks for a preview tab, a double click for a kept one. */
        onopen: (row: TreeRow, preview: boolean) => void;
        onremove: (key: string) => void;
    };

    let { rows, fixed, ontoggle, onopen, onremove }: Props = $props();

    /** How far one row is set in from the one above it, in pixels per level. */
    const STEP = 14;

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
</script>

<ul class="tree" aria-label={t('files.tree')}>
    {#each rows as row (treeKey(row.root, row.path))}
        <li class="row" data-fs-row={treeKey(row.root, row.path)}>
            <span class="indent" style={`padding-left: ${row.depth * STEP}px`}>
                <ToolButton
                    label={row.name}
                    glyph={glyphOf(row)}
                    title={titleOf(row)}
                    expanded={row.kind === 'dir' ? row.open : undefined}
                    onclick={() => {
                        if (row.kind === 'dir') ontoggle(row);
                        else onopen(row, true);
                    }}
                    ondblclick={() => {
                        if (row.kind !== 'dir') onopen(row, false);
                    }}
                />
            </span>
            {#if row.depth === 0 && !fixed.includes(row.root)}
                <ToolButton
                    label={t('files.remove_root')}
                    glyph="trash"
                    compact
                    title={t('files.remove_root_title', row.root)}
                    onclick={() => {
                        onremove(row.root);
                    }}
                />
            {/if}
        </li>
    {/each}
</ul>

<style>
    .tree {
        display: flex;
        flex-direction: column;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }

    /* The indent is the row's own box rather than a margin on the button, so a long name still
       elides against the pane's edge instead of pushing the row wider. */
    .indent {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
    }
</style>
