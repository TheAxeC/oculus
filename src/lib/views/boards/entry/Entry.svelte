<script module lang="ts">
    // Layer 3, view registration. An entry opens from the title of a card, from a referrer list,
    // from the palette and from an Add, and is not listed in the view catalogue: opened bare it can
    // only report that it was opened for no entry.
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
    // Layer 3, view. One entry as its own tab: an entry of a collection file, or a lead or a Lit
    // Watch paper of a feed. The entry it is for is the `collection` and `key` of its instance
    // state (state/forms/page-entry.ts's entryPageState), whose `id` joins the two so that one
    // entry is one tab and one key in two collections is two.
    //
    // An entry of a collection shows its card, opened out, then the editor built from the file's
    // own `schema:` (views/shared/forms/entry/edit/EntryEditor.svelte), then what refers to the
    // entry when other records do, and, when its `link` names a folder of the hub, the folder's
    // documents, files and sessions (EntryFolder.svelte). A lead or a Lit Watch paper shows its
    // card, opened out, above the editor: the card its feed's view draws
    // (views/shared/card/feed/), with every control it has there, its title as words. Delete asks
    // first, naming the records that refer to the entry, and an entry that is gone says so; it is
    // shown again when Undo brings it back.
    //
    // The card is views/shared/forms/entry/EntryCard.svelte, the one the collection view draws,
    // with every control it has there (Start Agent on a task, Copy BibTeX on a Literature entry)
    // and, since it is handed neither a grip nor a title opener, with the long fields whole and the
    // title as words.
    //
    // A toolbar action opens the workbench of the entry's folder with this page in its documents
    // pane (state/workbench/layout/open/float/folder-opener.ts). Whether the entry has a folder is
    // the file store's listing of the folder that holds its link, as the card decides it, so the
    // blocks come and go with the folder.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryFolder from './EntryFolder.svelte';
    import LeadCard from '../../shared/card/feed/LeadCard.svelte';
    import RadarCard from '../../shared/card/feed/RadarCard.svelte';
    import DeleteAsk from '../../shared/forms/entry/DeleteAsk.svelte';
    import EntryCard from '../../shared/forms/entry/EntryCard.svelte';
    import EntryEditor from '../../shared/forms/entry/edit/EntryEditor.svelte';
    import { pageFault, pageFile } from '../../shared/forms/entry/edit/page-file';
    import Referrers from '../../shared/forms/entry/Referrers.svelte';
    import { taskCardActions } from '$lib/views/shared/forms/entry/task-card';
    import { literatureCardActions } from '$lib/views/shared/card/feed/literature-card';
    import { blockedBy } from '../../shared/forms/entry-file';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import {
        entryById,
        hubPathsOf,
        identityFaults,
        offeredStatuses,
        pageFolder,
        pageState,
        statusFacets
    } from '$lib/state/boards/collection';
    import { entryPageState, revealState } from '$lib/state/forms/page-entry';
    import { isExpired, localDate } from '$lib/state/feeds/leads';
    import { isDismissed } from '$lib/state/feeds/radar';
    import { asText } from '$lib/state/forms/schema';
    import { REFERRED, referrersOf } from '$lib/state/forms/referrers';
    import { dirOf } from '$lib/state/sources/repositories/change-tree';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { lookup, t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import type { TaskRef } from '$lib/state/sessions/terminals.svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { config, portfolio },
        feeds: { feed },
        folders,
        fs: { listing, primary },
        layout: { openView, restateInstance },
        pages: { pageOf },
        selectors: { collectionsOfKey, configMap, projects },
        source: { unsavedFile },
        terminals: { composeAt },
        writes: { writeToken }
    } = client;

    let { instance }: ViewProps = $props();

    /** The collection (or feed) and the key of the entry this instance was opened for. */
    const collectionKey = $derived(instanceText(instance.state, 'collection'));
    const key = $derived(instanceText(instance.state, 'key'));
    /**
     * The entry as the editor sees it, or null while no file holds it and no write of this page
     * added it. The page carries the values the server took over the snapshot's.
     */
    const page = $derived(collectionKey === '' || key === '' ? null : pageOf(collectionKey, key));
    const held = $derived(collectionKey === '' ? [] : collectionsOfKey(collectionKey));
    /** The key the entry has now: a save that changed it moves the page to the new one. */
    const current = $derived(page === null ? key : page.key);
    /** The collection that holds the entry: the file of the hub the entry is of. */
    const collection = $derived(
        key === ''
            ? null
            : (held.find(
                  (one) => entryById(one, key) !== null || entryById(one, current) !== null
              ) ??
                  held.find((one) => page !== null && one.schema === page.schema) ??
                  null)
    );
    /** The entry the snapshot holds under its old key or its new one, with the page's values. */
    const stored = $derived(entryById(collection, key) ?? entryById(collection, current));
    const entry = $derived(
        page === null || collection === null
            ? null
            : {
                  file: collection.file,
                  index: collection.entries.length,
                  ...(collection.root === undefined ? {} : { root: collection.root }),
                  ...stored,
                  id: page.key,
                  title: page.title,
                  fields: page.values
              }
    );
    const schema = $derived(collection?.schema);
    /** The hub the entry is of, null while no collection entry is shown. */
    const hub = $derived(entry === null ? null : rootOf(entry, primary()));
    const file = $derived(page === null ? null : pageFile(client, page));
    const fault = $derived(page === null ? undefined : pageFault(client, page));
    const faults = $derived(identityFaults(collection?.entries ?? [], schema));
    const lifecycle = $derived(offeredStatuses(schema, statusFacets(collection?.entries ?? [])));
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    const snapshot = $derived(portfolio());
    const referrers = $derived(
        snapshot === null || !REFERRED.includes(collectionKey)
            ? []
            : referrersOf(snapshot, configMap(), collectionKey, key)
    );

    /** The entries of one folder of the hub, from the file store's listing of it. */
    const listingOf = (folder: string): ReturnType<typeof listing> =>
        hub === null ? { entries: [], error: '', loading: false } : listing(hub, folder);
    const listed = (folder: string): ReturnType<typeof listing>['entries'] =>
        listingOf(folder).entries;

    /** The folder the entry's link names, undefined while the listing of its parent is read. */
    const folder = $derived(entry === null ? undefined : pageFolder(entry.fields, listed));
    const link = $derived(
        entry === null ? undefined : hubPathsOf({ link: entry.fields.link }).at(0)
    );
    const reading = $derived(
        folder === undefined && link !== undefined && listingOf(dirOf(link)).loading
    );

    // A save that gave the entry a new key or a new title moves the tab to them, so the page and
    // the tab's title follow the saved words from the first frame.
    $effect(() => {
        if (page === null) return;
        if (page.key !== key || page.title !== instanceText(instance.state, 'label')) {
            restateInstance(instance.id, entryPageState(collectionKey, page.key, page.title));
        }
    });

    /** The lead or the paper a feed entry's page shows, with the page's values; null otherwise. */
    const feedEntry = $derived(page?.kind === 'feed' ? page.values : null);

    /** What the card's last write answered, the one outcome line this tab holds. */
    let said = $state('');
    /**
     * The entry's values the line was said over. A write's answer lands after the page took the
     * values the write sent (state/forms/settled.svelte.ts), so the push of those values keeps the
     * line, and values that differ (an undo, another tab, the disk) take it away.
     */
    const shownValues = $derived(JSON.stringify(page?.values ?? null));
    let saidOver = '';

    /** Say a write's answer on the tab's one outcome line. */
    function say(words: string): void {
        said = words;
        saidOver = shownValues;
    }

    $effect(() => {
        if (said !== '' && shownValues !== saidOver) said = '';
    });

    /** True while the question before a delete is open. */
    let deleting = $state(false);

    /** Open the composer on a task; a refusal is said on the line every write answers on. */
    async function startAgent(task: TaskRef): Promise<void> {
        const refused = await composeAt({ task });
        if (refused !== '') say(refused);
    }

    function title(): string {
        return page === null ? t('views.entry') : page.title;
    }

    /** The words the entry's collection or feed is named by. */
    function collectionTitle(): string {
        return collection?.title ?? lookup(`views.${collectionKey}`);
    }

    /** Open the workbench of the entry's folder, with this entry's page in its documents pane. */
    function openWorkbench(): void {
        if (entry === null || folder === undefined || hub === null) return;
        folders.open(
            { root: hub, path: folder },
            { label: title(), item: { view: 'entry', state: pageState(collectionKey, entry) } }
        );
    }
</script>

{#snippet tools()}
    <Toolbar label={t('entry.toolbar')} overflow>
        {#if page !== null}
            <ToolButton
                bare
                label={t('entry.open_collection', collectionTitle())}
                glyph="cards"
                title={t('entry.open_collection_tip', collectionTitle())}
                onclick={() => openView(collectionKey, revealState(collectionKey, key))}
            />
        {/if}
        {#if folder !== undefined && hub !== null && folders.served(hub)}
            <ToolButton
                bare
                label={t('entry.open_workbench')}
                glyph="app_view"
                title={t('entry.open_workbench_tip', folder)}
                onclick={openWorkbench}
            />
        {/if}
        {#if page !== null}
            <ToolButton
                bare
                label={t('entry_form.delete')}
                glyph={t('entry_form.delete_glyph')}
                title={blocked === '' ? t('entry.delete_tip', page.title) : blocked}
                disabled={blocked !== ''}
                onclick={() => (deleting = true)}
            />
        {/if}
        {#if file !== null}
            <SourceButton {file} />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools}>
    <div class="entry" data-instance={instance.id} data-entry={key} data-collection={collectionKey}>
        {#if collectionKey === '' || key === ''}
            <Empty message={t('entry.none')} glyph={t('entry.none_glyph')} />
        {:else if page === null}
            <Empty message={t('entry.unknown', collectionKey, key)} glyph={t('entry.none_glyph')} />
        {:else}
            {#if said !== ''}
                <Surface>
                    <p class="said">{said}</p>
                </Surface>
            {/if}
            {#if entry !== null && collection !== null}
                <EntryCard
                    {entry}
                    cursor={false}
                    collection={collectionKey}
                    {schema}
                    projects={projects()}
                    statuses={lifecycle}
                    {file}
                    fault={faults.get(entry.index)}
                    onsaid={say}
                    more
                    extra={taskCardActions(collectionKey, entry, configMap(), startAgent).concat(
                        literatureCardActions(collectionKey, entry, writeToken, say)
                    )}
                />
            {:else if feedEntry !== null && collectionKey === 'leads'}
                <LeadCard
                    entry={feedEntry}
                    vocab={config()?.config ?? {}}
                    cursor={false}
                    expired={isExpired(configMap(), feedEntry, localDate(Date.now()))}
                    onsaid={say}
                    beside={instance.id}
                    {blocked}
                />
            {:else if feedEntry !== null && collectionKey === 'radar'}
                <RadarCard
                    entry={feedEntry}
                    id={key}
                    cursor={false}
                    lastRun={asText(feed('radar')?.meta.last_run)}
                    projects={snapshot?.entities.projects ?? {}}
                    dismissed={isDismissed(feedEntry)}
                    page
                    onsaid={say}
                />
            {/if}

            <Surface>
                <section class="block">
                    <h3 class="heading">{t('entry.editor')}</h3>
                    <EntryEditor {page} instance={instance.id} {file} {fault} />
                </section>
            </Surface>

            {#if REFERRED.includes(collectionKey)}
                <Surface>
                    <Referrers {referrers} />
                </Surface>
            {/if}

            {#if entry !== null && hub !== null && link !== undefined}
                <EntryFolder instance={instance.id} {hub} {folder} {reading} />
            {/if}
        {/if}
    </div>
</Pane>

{#if deleting && page !== null}
    <DeleteAsk
        collection={collectionKey}
        id={key}
        onsaid={say}
        onclose={() => (deleting = false)}
    />
{/if}

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

    .said {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: the whole tab follows the folder line, as the board does. */
    :global(body.rice:where(:not(.rice-sans))) .entry {
        font-family: var(--font-mono);
    }
</style>
