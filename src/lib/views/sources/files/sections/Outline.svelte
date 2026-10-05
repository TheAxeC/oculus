<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The Outline section: the structure of
    // the file tab the reader looked at last on the page this view is on (followedTab in
    // state/sources/explorer/sections/followed-tab.ts, the order the Timeline follows a file in),
    // so pressing the Files tab does not empty it.
    //
    // A source tab is read from the text the tab holds (so it follows what is typed, saved or
    // not), as the headings of a Markdown file and the sectioning commands of a LaTeX file nested
    // by level; a press moves the tab's editor to the line. A Doc tab and a Markdown preview tab
    // hold no text here: they say which headings they draw (state/sources/explorer/sections/
    // headings.svelte.ts), and a press scrolls that tab to the heading. A source tab in another
    // language says it has no symbols yet, and a page whose followed tab shows no editor, or has
    // no file tab, says the active editor cannot provide outline information.
    //
    // The source reading is outlineOf in state/sources/explorer/sections/outline.ts. A LaTeX
    // file's outline arrives after the parser is loaded and after each change of the text, through
    // outlineFollower over the client state's LaTeX reader, and the list of the last one stays
    // drawn while the next is read.

    import Section from './Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { languageOf, MARKDOWN_PREVIEW_VIEW } from '$lib/state/sources/fs';
    import { fileOfTab } from '$lib/state/workbench/navigation/pages';
    import { panes } from '$lib/state/workbench/layout';
    import { followedTab } from '$lib/state/sources/explorer/sections/followed-tab';
    import {
        headingOutline,
        outlineFollower,
        outlineOf,
        type OutlineItem
    } from '$lib/state/sources/explorer/sections/outline';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        open: boolean;
        ontoggle: () => void;
    };

    /** One row: a source line to go to, or the id of a heading of a rendered tab. */
    type Row = { key: string; title: string; depth: number; line: number; id: string };

    let { open, ontoggle }: Props = $props();

    const {
        layout: { activeInstance, currentPage, layout },
        source: { sourceDraft },
        selectors: { languages },
        editorStatus: { ask },
        headings,
        latexReader
    } = useState();

    const page = $derived(currentPage().id);
    const tab = $derived(
        followedTab(
            panes(layout(page)).map((held) => held.pane),
            activeInstance(page)?.id ?? null,
            (one) => fileOfTab(one) !== null
        )
    );
    const file = $derived(tab === null ? null : fileOfTab(tab));
    const draft = $derived(tab?.view === 'source' ? sourceDraft(tab.id) : null);
    /** Whether the followed tab draws a document it publishes the headings of. */
    const rendered = $derived(tab?.view === 'doc' || tab?.view === MARKDOWN_PREVIEW_VIEW);
    /** Whether the followed tab shows a file this section reads no structure of. */
    const unread = $derived(tab !== null && draft === null && !rendered);

    const language = $derived(
        draft === null || file === null || !draft.loaded
            ? ''
            : draft.language === ''
              ? languageOf(file.path, languages())
              : draft.language
    );

    /** The text of the followed tab when it is LaTeX, whose outline is read after a load. */
    const latexText = $derived(language === 'latex' && draft !== null ? draft.text : null);

    /** The last LaTeX outline to arrive and the tab it was read for. */
    let arrived = $state<{ tab: string; items: OutlineItem[] } | null>(null);

    $effect(() => {
        if (latexText === null || tab === null) return;
        const id = tab.id;
        const follow = outlineFollower(latexReader, (found) => {
            arrived = { tab: id, items: found };
        });
        follow.ask(latexText);
        return follow.stop;
    });

    /** Whether a LaTeX outline has been asked for and has not arrived for this tab. */
    const waiting = $derived(latexText !== null && (arrived === null || arrived.tab !== tab?.id));

    /** The symbols of the followed source tab: null for a tab with none to read, else the list. */
    const items = $derived.by<OutlineItem[] | null>(() => {
        if (latexText !== null) return waiting ? [] : (arrived?.items ?? []);
        return language === '' ? null : outlineOf(language, draft?.text ?? '');
    });

    /** The headings a followed Doc or preview tab published, or null before it has. */
    const drawn = $derived(rendered && tab !== null ? headings.headingsOf(tab.id) : null);

    /**
     * What the section says when it has no rows: nothing to outline, no symbols, or no headings. A
     * source tab whose text is still being read says nothing yet, as a Doc tab still drawing does.
     */
    const empty = $derived(
        file === null || unread
            ? t('files.outline_no_editor')
            : rendered
              ? drawn !== null && drawn.length === 0
                  ? t('files.outline_empty')
                  : ''
              : draft !== null && !draft.loaded
                ? ''
                : items === null
                  ? t('files.outline_none')
                  : items.length === 0 && !waiting
                    ? t('files.outline_empty')
                    : ''
    );

    const rows = $derived.by<Row[]>(() => {
        if (rendered) {
            return headingOutline(drawn ?? []).map((one) => ({
                key: `outline:${one.id}`,
                title: one.title,
                depth: one.depth,
                line: 0,
                id: one.id
            }));
        }
        return (items ?? []).map((one) => ({
            key: `outline:${String(one.line)}:${one.title}`,
            title: one.title,
            depth: one.depth,
            line: one.line,
            id: ''
        }));
    });
    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: row.key, parent: 'head' })) : [])
    ]);

    function goTo(row: Row): void {
        if (tab === null) return;
        if (rendered) headings.askHeading(tab.id, row.id);
        else ask(tab.id, { kind: 'goto', line: row.line });
    }
</script>

<div class="outline" data-fs-outline>
    <TreeView label={t('files.outline')} rows={keyRows} {ontoggle}>
        {#snippet children(nav: TreeNav)}
            <Section label={t('files.outline')} {nav} count={rows.length} {open} {ontoggle}>
                {#if empty !== ''}
                    <li role="none">
                        <TreeItem label={empty} tone="muted" />
                    </li>
                {/if}
                {#each rows as row (row.key)}
                    <li role="none" data-fs-symbol={rendered ? row.id : row.line}>
                        <TreeItem
                            label={row.title}
                            id={row.key}
                            {nav}
                            level={row.depth + 2}
                            depth={row.depth}
                            title={rendered
                                ? t('files.outline_go_heading_title', row.title)
                                : t('files.outline_go_title', row.title, row.line)}
                            onclick={() => goTo(row)}
                        >
                            {#snippet detail()}
                                {#if !rendered}{row.line}{/if}
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
            </Section>
        {/snippet}
    </TreeView>
</div>
