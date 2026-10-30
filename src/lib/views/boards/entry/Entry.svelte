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
    // Watch paper of a feed. The entry it is for is the `collection`, `hub` and `key` of its
    // instance state (state/forms/page-entry.ts's entryPageState), the three together making one
    // entry one tab, and the same key in two collections or two hubs two.
    //
    // The frame is views/shared/card/record/RecordPage.svelte, the frame of every record's page. An
    // entry of a collection shows its card, opened out, then what refers to the entry when other
    // records do, and, when its `link` names a folder of the hub, the folder's documents, files and
    // sessions (EntryFolder.svelte). A lead or a Lit Watch paper shows its card, opened out: the
    // card its feed's view draws (views/shared/card/feed/), with every control it has there, its
    // title as words. The page holds no form: the card's Edit opens the editor beside it
    // (views/boards/editor/Editor.svelte). Delete asks first, naming the records that refer to the
    // entry, and an entry that is gone says so; it is shown again when Undo brings it back.
    //
    // The card of a venue, a dataset, a domain or a pillar line is the one its view draws
    // (views/shared/card/record/registry/RegistryPageCard.svelte). Every other card is
    // views/shared/forms/entry/card/EntryCard.svelte, the one the collection view draws, with every
    // control it has there (Start Agent on a task, Copy BibTeX on a Literature entry) and, since it
    // is handed neither a grip nor a title opener, with the long fields whole and the title as
    // words.
    //
    // The referrers and the folder's blocks are each the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), folded by its block key (`referrers`, `documents`,
    // `files`, `sessions`) under `folded` of the tab's state (views/shared/card/pane-fold.ts); a
    // save that moves the tab to a new key keeps the folds.
    //
    // A toolbar action opens the workbench of the entry's folder with this page in its documents
    // pane (state/workbench/layout/open/float/folder-opener.ts). Whether the entry has a folder is
    // the file store's listing of the folder that holds its link, as the card decides it, so the
    // blocks come and go with the folder.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryFolder from './EntryFolder.svelte';
    import LeadCard from '../../shared/card/feed/LeadCard.svelte';
    import RadarCard from '../../shared/card/feed/RadarCard.svelte';
    import DeleteAsk from '../../shared/forms/entry/DeleteAsk.svelte';
    import EntryCard from '../../shared/forms/entry/card/EntryCard.svelte';
    import { pageFault, pageFile } from '../../shared/forms/entry/edit/page-file';
    import Referrers from '../../shared/forms/entry/Referrers.svelte';
    import RecordPage from '../../shared/card/record/RecordPage.svelte';
    import RegistryPageCard from '../../shared/card/record/registry/RegistryPageCard.svelte';
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
    import { listsReferrers, referrersOf } from '$lib/state/forms/referrers';
    import { dirOf } from '$lib/state/sources/repositories/change-tree';
    import { keyOf, rootOf } from '$lib/state/shared/page/hubs';
    import { instanceFolded } from '$lib/state/shared/page/folds';
    import { instanceText, withInstanceKey } from '$lib/state/workbench/layout/instance';
    import { stateRecord } from '$lib/state/shared/page/records';
    import { t } from '$lib/state/shared/words/text';
    import { registrationLabel, type ViewProps } from '$lib/state/workbench/navigation/registry';
    import type { TaskRef } from '$lib/state/sessions/terminals.svelte';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { portfolio },
        feeds: { feed },
        folders,
        fs: { listing },
        layout: { openView, restateInstance },
        pages: { pageOf },
        selectors: { collectionsOfKey, configMap, hubVocabs, projects },
        source: { unsavedFile },
        terminals: { composeAt },
        writes: { writeToken }
    } = client;

    let { instance }: ViewProps = $props();

    /**
     * The collection (or feed) and the internal id of the entry this instance was opened for, the
     * id read from the hub and the key of the instance's state.
     */
    const collectionKey = $derived(instanceText(instance.state, 'collection'));
    const key = $derived(stateRecord(instance.state));
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
    const hub = $derived(entry === null ? null : rootOf(entry));
    const file = $derived(page === null ? null : pageFile(client, page));
    const fault = $derived(page === null ? undefined : pageFault(client, page));
    const faults = $derived(
        identityFaults(
            collection?.entries ?? [],
            collection?.primary_key ?? null,
            collection?.key_fault
        )
    );
    const lifecycle = $derived(offeredStatuses(schema, statusFacets(collection?.entries ?? [])));
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    const snapshot = $derived(portfolio());
    /**
     * Whether the page lists the entry's referrers, by the registry its collection's entry names.
     */
    const referred = $derived(listsReferrers(collection ?? held.at(0) ?? null));
    const referrers = $derived(
        snapshot === null || !referred
            ? []
            : referrersOf(snapshot, configMap(), collectionKey, key, hubVocabs()?.primary ?? null)
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
    // the tab's title follow the saved words from the first frame, the folded blocks kept.
    $effect(() => {
        if (page === null) return;
        if (page.key !== key || page.title !== instanceText(instance.state, 'label')) {
            const moved = entryPageState(collectionKey, page.key, page.title);
            const folded = instanceFolded(instance.state);
            restateInstance(instance.id, withInstanceKey(moved, 'folded', folded));
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

    /**
     * The words the entry's collection or feed is named by: the file's title, else the name of the
     * view registered under its key, else the key.
     */
    function collectionTitle(): string {
        if (collection !== null) return collection.title;
        const view = client.registry.viewFor(collectionKey);
        return view === undefined ? collectionKey : registrationLabel(view);
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

<RecordPage
    title={title()}
    {instance}
    toolbar={tools}
    said={page === null ? '' : said}
    data-entry={key}
    data-collection={collectionKey}
>
    {#snippet card()}
        {#if collectionKey === '' || key === ''}
            <Surface>
                <Empty message={t('entry.none')} glyph={t('entry.none_glyph')} />
            </Surface>
        {:else if page === null}
            <Surface>
                <Empty
                    message={t('entry.unknown', collectionKey, keyOf(key))}
                    glyph={t('entry.none_glyph')}
                />
            </Surface>
        {:else if entry !== null && collection !== null}
            <RegistryPageCard {collection} {entry} {schema} {file} {fault} onsaid={say}>
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
                    page
                    extra={taskCardActions(collection, entry, configMap(), startAgent).concat(
                        literatureCardActions(collection, entry, writeToken, say)
                    )}
                />
            </RegistryPageCard>
        {:else if feedEntry !== null && collectionKey === 'leads'}
            <LeadCard
                entry={feedEntry}
                id={key}
                cursor={false}
                expired={isExpired(configMap(), feedEntry, localDate(Date.now()), vocabOf)}
                onsaid={say}
                beside={instance.id}
                page
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
    {/snippet}

    {#if page !== null}
        {#if referred}
            <Referrers {referrers} />
        {/if}

        {#if entry !== null && hub !== null && link !== undefined}
            <EntryFolder instance={instance.id} {hub} {folder} {reading} />
        {/if}
    {/if}
</RecordPage>

{#if deleting && page !== null}
    <DeleteAsk
        collection={collectionKey}
        id={key}
        onsaid={say}
        onclose={() => (deleting = false)}
    />
{/if}
