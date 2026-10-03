<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The Outline section: the structure of
    // the source tab that is active on the page this view is on, read from the text the tab holds
    // (so it follows what is typed, saved or not), as the headings of a Markdown file and the
    // sectioning commands of a LaTeX file nested by level. A press moves the tab's editor to the
    // line. A file in another language says it has no symbols yet, and a page whose active tab
    // shows no file says there is nothing to outline.
    //
    // The reading is outlineOf in state/sources/explorer/sections/outline.ts. A LaTeX file's
    // outline arrives after the parser is loaded and after each change of the text, through
    // outlineFollower over the client state's LaTeX reader, and the list of the last one stays
    // drawn while the next is read.

    import Section from './Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { languageOf } from '$lib/state/sources/fs';
    import { fileOfTab } from '$lib/state/sources/explorer/sections/open-editors';
    import {
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

    let { open, ontoggle }: Props = $props();

    const {
        layout: { activeInstance, currentPage },
        source: { sourceDraft },
        selectors: { languages },
        editorStatus: { ask },
        latexReader
    } = useState();

    const tab = $derived(activeInstance(currentPage().id));
    const file = $derived(tab === null ? null : fileOfTab(tab));
    const draft = $derived(tab?.view === 'source' ? sourceDraft(tab.id) : null);

    const language = $derived(
        draft === null || file === null || !draft.loaded
            ? ''
            : draft.language === ''
              ? languageOf(file.path, languages())
              : draft.language
    );

    /** The text of the active tab when it is LaTeX, whose outline is read after a load. */
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

    /** The symbols of the active tab: null for a tab with none to read, else the list. */
    const items = $derived.by<OutlineItem[] | null>(() => {
        if (latexText !== null) return waiting ? [] : (arrived?.items ?? []);
        return language === '' ? null : outlineOf(language, draft?.text ?? '');
    });

    /**
     * What the section says when it has no rows: nothing to outline, no symbols, or no headings.
     */
    const empty = $derived(
        file === null
            ? t('files.outline_no_editor')
            : items === null
              ? t('files.outline_none')
              : items.length === 0 && !waiting
                ? t('files.outline_empty')
                : ''
    );

    const rows = $derived(items ?? []);
    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: keyOf(row), parent: 'head' })) : [])
    ]);

    function keyOf(row: OutlineItem): string {
        return `outline:${String(row.line)}:${row.title}`;
    }

    function goTo(row: OutlineItem): void {
        if (tab !== null) ask(tab.id, { kind: 'goto', line: row.line });
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
                {#each rows as row (keyOf(row))}
                    <li role="none" data-fs-symbol={row.line}>
                        <TreeItem
                            label={row.title}
                            id={keyOf(row)}
                            {nav}
                            level={row.depth + 2}
                            depth={row.depth}
                            title={t('files.outline_go_title', row.title, row.line)}
                            onclick={() => goTo(row)}
                        >
                            {#snippet detail()}
                                {row.line}
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
            </Section>
        {/snippet}
    </TreeView>
</div>
