<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The Backlinks section: the notes that
    // link to the note of the file tab the Outline follows (followedTab in
    // state/sources/explorer/sections/followed-tab.ts), each by its name with a row per link under
    // it, the line the link is on and its number; a press opens that note at the link. The links
    // are read from the notes of every hub as the page holds them (fs.svelte.ts's `notes`, through
    // state/sources/explorer/notes/note-index.ts), so the section follows a note saved, made,
    // renamed, moved or removed, by the page or by another program, as the notes are read again.
    //
    // A file tab whose file is no note of a hub, and a page with no file tab, say so in one muted
    // row.

    import ListedSection from '$lib/views/shared/explorer/sections/ListedSection.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { SectionMove } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import type { FollowTab } from '$lib/state/sources/explorer/sections/followed-tab';
    import { backlinksOf, noteOf } from '$lib/state/sources/explorer/notes/note-index';
    import { notePath } from '$lib/state/sources/explorer/notes/note-tree';
    import { fileOfTab } from '$lib/state/workbench/navigation/pages';
    import { openSourceFile } from '$lib/views/shared/links/source-file';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        open: boolean;
        ontoggle: () => void;
        /** The file tab the reader looked at last on the page, or null for none. */
        tab: FollowTab | null;
        move?: SectionMove;
    };

    let { open, ontoggle, tab, move }: Props = $props();

    const client = useState();
    const {
        fs: { notes },
        selectors: { docPlaceFor }
    } = client;

    const file = $derived(tab === null ? null : fileOfTab(tab, docPlaceFor(tab)));
    const note = $derived(file === null ? null : noteOf(notes().hubs, file.root, file.path));
    const links = $derived(note === null ? [] : backlinksOf(notes().hubs, note));
    /** The notes that link, each with its links, in the order the notes are listed. */
    const groups = $derived(
        links.reduce<{ path: string; title: string; links: typeof links }[]>((kept, link) => {
            const last = kept.at(-1);
            if (last?.path === link.path) last.links.push(link);
            else kept.push({ path: link.path, title: link.title, links: [link] });
            return kept;
        }, [])
    );
    const empty = $derived(
        tab === null
            ? t('notes.backlinks_no_tab')
            : note === null
              ? t('notes.backlinks_not_note')
              : links.length === 0
                ? t('notes.backlinks_none')
                : ''
    );

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? groups.flatMap((group) => [
                  { id: `note:${group.path}`, parent: 'head' },
                  ...group.links.map((_, at) => ({
                      id: `link:${group.path}:${String(at)}`,
                      parent: `note:${group.path}`
                  }))
              ])
            : [])
    ]);

    /** Open the linking note, at the link's line when one is given. */
    function goTo(path: string, line?: number): void {
        if (note === null) return;
        const place = line === undefined ? {} : { line: line + 1, column: 1 };
        openSourceFile(client, { root: note.root, path: notePath(path), ...place });
    }
</script>

<div class="backlinks" data-fs-backlinks>
    <ListedSection
        label={t('notes.backlinks')}
        rows={keyRows}
        count={links.length}
        {open}
        {ontoggle}
        {move}
        {empty}
    >
        {#snippet children(nav: TreeNav)}
            {#each groups as group (group.path)}
                <li role="none" data-fs-backlink={group.path}>
                    <TreeItem
                        label={group.title}
                        id={`note:${group.path}`}
                        {nav}
                        level={2}
                        glyph={t('files.note_glyph')}
                        title={t('notes.backlinks_open_title', group.title)}
                        onclick={() => goTo(group.path)}
                    />
                </li>
                {#each group.links as link, at (at)}
                    <li role="none">
                        <TreeItem
                            label={link.text}
                            id={`link:${group.path}:${String(at)}`}
                            {nav}
                            level={3}
                            depth={1}
                            title={t('notes.backlinks_line_title', group.title, link.line + 1)}
                            onclick={() => goTo(group.path, link.line)}
                        >
                            {#snippet detail()}
                                {link.line + 1}
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
            {/each}
        {/snippet}
    </ListedSection>
</div>
