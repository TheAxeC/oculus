<script module lang="ts">
    // Layer 3, view registration. An entry opens from the title of a collection card whose link
    // names a folder and is not listed in the view catalogue: opened bare it can only report that
    // it was opened for no entry.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'entry',
        label: 'views.entry',
        glyph: 'views.entry_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One collection entry as its own tab: its card, opened out, then the Markdown
    // documents of the folder its link names, then the folder's files, then the sessions working in
    // that folder. One instance per entry, and the entry it is for is the `collection` and `key`
    // of its instance state (state/boards/collection.ts's pageState), whose `id` joins the two so
    // that one entry is one tab and one key in two collections is two.
    //
    // The card is views/shared/forms/entry/EntryCard.svelte, the one the collection view draws,
    // with every control it has there and, since it is handed neither a grip nor a title opener,
    // with the long fields whole and the title as words. The documents are fetched, not selected:
    // state/system/docs.svelte.ts asks api/docs for the chosen one and the shared Markdown partial
    // draws what comes back, as the project view draws its own. The files are
    // views/shared/links/FolderFiles.svelte, the block the person view draws for a student's
    // folder, and each session is views/shared/sessions/SessionRow.svelte, the row the project view
    // draws.
    //
    // Whether the entry has a folder is the file store's listing of the folder that holds its
    // link, as the card's title decides it, so the blocks come and go with the folder.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Segment from '$lib/ui/controls/segment/Segment.svelte';
    import type { SegmentItem } from '$lib/ui/controls/segment/segment-items';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryCard from '../../shared/forms/entry/EntryCard.svelte';
    import { taskCardActions } from '../../shared/forms/entry/task-card';
    import FolderFiles from '../../shared/links/FolderFiles.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import SessionRow from '../../shared/sessions/SessionRow.svelte';
    import {
        entryById,
        hubPathsOf,
        identityFaults,
        offeredStatuses,
        pageFolder,
        statusFacets
    } from '$lib/state/boards/collection';
    import { dirOf } from '$lib/state/sources/repositories/change-tree';
    import { HUB_ROOT } from '$lib/state/sources/fs';
    import { absoluteOf } from '$lib/state/workbench/navigation/pages';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import type { TaskRef } from '$lib/state/sessions/terminals.svelte';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { hubDocument },
        fs: { listing },
        layout: { openView },
        selectors: { collectionOf, configMap, hubRoot, projects, sessionsForProject },
        terminals: { composeAt },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The collection and the key of the entry this instance was opened for. */
    const collectionKey = $derived(instanceText(instance.state, 'collection'));
    const key = $derived(instanceText(instance.state, 'key'));
    const collection = $derived(collectionKey === '' ? null : collectionOf(collectionKey));
    const entry = $derived(key === '' ? null : entryById(collection, key));
    const schema = $derived(collection?.schema);
    const source = $derived(
        collection === null ? null : viewSourceFile('collection', configMap(), collectionKey)
    );
    const faults = $derived(identityFaults(collection?.entries ?? [], schema));
    const lifecycle = $derived(offeredStatuses(schema, statusFacets(collection?.entries ?? [])));

    /** The entries of one folder of the hub, from the file store's listing of it. */
    const listed = (folder: string): ReturnType<typeof listing>['entries'] =>
        listing(HUB_ROOT, folder).entries;

    /** The folder the entry's link names, undefined while the listing of its parent is read. */
    const folder = $derived(entry === null ? undefined : pageFolder(entry.fields, listed));
    const link = $derived(
        entry === null ? undefined : hubPathsOf({ link: entry.fields.link }).at(0)
    );
    const reading = $derived(
        folder === undefined && link !== undefined && listing(HUB_ROOT, dirOf(link)).loading
    );

    const files = $derived(folder === undefined ? null : listing(HUB_ROOT, folder));
    const names = $derived(
        (files?.entries ?? [])
            .filter((one) => one.kind === 'file' && /\.md$/i.test(one.name))
            .map((one) => one.name)
    );
    const chosen = $derived(pick(names, instanceText(instanceState(instance.id), 'doc')));
    const shown = $derived(
        folder === undefined || chosen === '' ? null : hubDocument(`${folder}/${chosen}`)
    );
    const documents: SegmentItem[] = $derived(names.map((name) => ({ id: name, label: name })));

    const root = $derived(hubRoot());
    const rows = $derived(
        folder === undefined || root === '' ? [] : sessionsForProject(absoluteOf(root, folder))
    );

    /** What the card's last write answered, the one outcome line this tab holds. */
    let said = $state('');

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    /** The document showing: the one the tab remembers if the folder holds it, else the first. */
    function pick(present: string[], held: string): string {
        if (present.includes(held)) return held;
        return present[0] ?? '';
    }

    function choose(name: string): void {
        setInstanceState(instance.id, { doc: name });
    }

    /** Open the composer on a task; a refusal is said on the line every write answers on. */
    async function startAgent(task: TaskRef): Promise<void> {
        const refused = await composeAt({ task });
        if (refused !== '') said = refused;
    }

    function title(): string {
        if (entry === null) return t('views.entry');
        return entry.title === '' ? entry.id : entry.title;
    }
</script>

{#snippet tools()}
    <Toolbar label={t('entry.toolbar')} overflow>
        {#if collection !== null && entry !== null}
            <ToolButton
                bare
                label={t('entry.open_collection', collection.title)}
                glyph="cards"
                title={t('entry.open_collection_tip', collection.title)}
                onclick={() => openView(collectionKey, { reveal: entry.id })}
            />
        {/if}
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools}>
    <div class="entry" data-instance={instance.id} data-entry={key} data-collection={collectionKey}>
        {#if collectionKey === '' || key === ''}
            <Empty message={t('entry.none')} glyph={t('entry.none_glyph')} />
        {:else if collection === null || entry === null}
            <Empty message={t('entry.unknown', collectionKey, key)} glyph={t('entry.none_glyph')} />
        {:else}
            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}
            <EntryCard
                {entry}
                cursor={false}
                collection={collectionKey}
                {schema}
                projects={projects()}
                statuses={lifecycle}
                file={source}
                fault={faults.get(entry.index)}
                onsaid={(answer: string) => (said = answer)}
                more
                extra={taskCardActions(collectionKey, entry, configMap(), startAgent)}
            />

            {#if reading}
                <Empty message={t('entry.reading')} glyph={t('entry.none_glyph')} />
            {:else if folder === undefined}
                <Empty message={t('entry.no_folder')} glyph={t('entry.none_glyph')} />
            {:else}
                <section class="block">
                    <h3 class="heading">{t('entry.documents')}</h3>
                    {#if shown === null}
                        <Empty
                            message={files?.loading === true
                                ? t('entry.reading')
                                : t('entry.no_documents')}
                            glyph={t('entry.none_glyph')}
                        />
                    {:else}
                        <Segment
                            label={t('entry.documents')}
                            items={documents}
                            value={chosen}
                            onchange={(name: string) => choose(name)}
                        />
                        <Markdown
                            doc={shown}
                            loading={t('entry.doc_loading')}
                            failed={t('entry.doc_failed', shown.error)}
                        />
                    {/if}
                </section>

                <section class="block files">
                    <FolderFiles {folder}>
                        {#snippet heading()}
                            <h3 class="heading">{t('entry.files', folder)}</h3>
                        {/snippet}
                    </FolderFiles>
                </section>

                <section class="block">
                    <h3 class="heading">{t('entry.sessions')}</h3>
                    {#if rows.length === 0}
                        <Empty message={t('entry.no_sessions')} glyph={t('entry.none_glyph')} />
                    {:else}
                        {#each rows as row (row.id)}
                            <SessionRow entry={row} {now} />
                        {/each}
                    {/if}
                </section>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .entry {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .block {
        min-width: 0;
    }

    .heading {
        margin: 0 0 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    /* The Files heading sits in FolderFiles' centred row with the control, so the row carries the
       space below it. */
    .files .heading {
        margin: 0;
    }

    .files :global(.head) {
        margin-bottom: 6px;
    }

    .said {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: the whole tab follows the folder line, as the board does. */
    :global(body.rice) .entry {
        font-family: var(--font-mono);
    }
</style>
