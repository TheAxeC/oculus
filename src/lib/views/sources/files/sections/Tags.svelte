<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The Tags section: every tag the notes
    // of every hub carry (a `#word` in a note's text or an entry of its front matter's `tags:`),
    // each with the number of notes that carry it, nested on `/` (state/sources/explorer/notes/
    // note-index.ts's tagRows). A press opens the Search view over the notes folder of every hub
    // with the search that finds the notes carrying the tag, and runs it.
    //
    // The tags are read from the notes as the page holds them (fs.svelte.ts's `notes`), so the
    // section follows a note saved, made, renamed, moved or removed as the notes are read again. A
    // workspace whose notes carry no tag says so in one muted row.

    import ListedSection from '$lib/views/shared/explorer/sections/ListedSection.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { SectionMove } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import { tagRows } from '$lib/state/sources/explorer/notes/note-index';
    import { openTagSearch } from '$lib/views/shared/explorer/control/note-actions';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        open: boolean;
        ontoggle: () => void;
        move?: SectionMove;
    };

    let { open, ontoggle, move }: Props = $props();

    const client = useState();
    const {
        fs: { notes }
    } = client;

    const rows = $derived(tagRows(notes().hubs));
    const counted = $derived(rows.filter((row) => row.count !== null).length);
    const empty = $derived(rows.length === 0 ? t('notes.tags_none') : '');

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: `tag:${row.tag}`, parent: 'head' })) : [])
    ]);
</script>

<div class="tags" data-fs-tags>
    <ListedSection
        label={t('notes.tags')}
        rows={keyRows}
        count={counted}
        {open}
        {ontoggle}
        {move}
        {empty}
    >
        {#snippet children(nav: TreeNav)}
            {#each rows as row (row.tag)}
                <li role="none" data-fs-tag={row.tag}>
                    <TreeItem
                        label={t('notes.tag_label', row.name)}
                        id={`tag:${row.tag}`}
                        {nav}
                        level={row.depth + 2}
                        depth={row.depth}
                        glyph={t('notes.tag_glyph')}
                        title={t('notes.tag_title', row.tag)}
                        onclick={() => openTagSearch(client, row.tag)}
                    >
                        {#snippet detail()}
                            {#if row.count !== null}{row.count}{/if}
                        {/snippet}
                    </TreeItem>
                </li>
            {/each}
        {/snippet}
    </ListedSection>
</div>
