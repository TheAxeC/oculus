<script module lang="ts">
    // Layer 3, view registration. The generic collection component registers each collection view
    // the page is given at the place its `collections:` entry names, with its label and glyph
    // (registration.ts).
    import { registration } from './registration';

    export { registration };
</script>

<script lang="ts">
    // Layer 3, view. One collection file as its own tab: the file's title, the bar under the header
    // (a project board's two lines, drawn by views/shared/forms/bar/FilterBar.svelte and
    // SliceLine.svelte), an Add that asks the new entry's fields and opens its page, and its
    // entries, the pinned ones first, as one card each in the shared card grid
    // (views/shared/card/record/CardGrid.svelte) or, with List pressed in the toolbar (the Cards
    // and List buttons of views/shared/forms/bar/ModeButtons.svelte), as one table
    // (EntryList.svelte) whose columns the toolbar's Columns menu shows and hides. The title of a
    // card or of a row opens the entry's page, the `entry` view's tab, where the entry is edited
    // and deleted. The keyboard move of a card acts in cards mode only.
    //
    // It is registered once per collection view the page is given and reads which collection it is
    // from the id of the instance it was mounted as, exactly as Projects.svelte reads which board
    // it is. Nothing here knows what an event or a scheme is: the fields a card draws and their
    // order come from the file's own `schema:`, through the pure functions of
    // state/boards/collection/.
    //
    // Each hub's file of the key is read by the registry that hub's own entry of the key names
    // (state/boards/collection/joined.ts `joinedRegistries`). The files whose entry names the
    // `funding` registry carry one thing of their own, joined to the projects rather than a second
    // view: the card of the projects of those hubs none of their schemes covers. The files whose
    // entry names the `literature` registry carry three: Add asks a DOI or an address, looks the
    // paper up and saves it into one of those hubs, their cards copy their BibTeX, and the toolbar
    // copies the BibTeX of their entries shown. An entry's page opens by its own hub's registry.
    //
    // Line 1 of the bar is the search, Mine only and the group buttons, folding into More: the Role
    // group, the Hub group while the workspace has more than one hub, then one group per schema
    // field marked `filter: true`. Line 2 is the status field's slices with their counts, the No
    // funding slice after them for the files whose entry names the `funding` registry while
    // projects have no scheme, how many entries are shown, and Clear all. A pick keeps the entries
    // that hold it, none picked keeps every entry, and each count is taken over what the other
    // filters leave, as on a project board; the rules are state/boards/collection/bar.ts's, the
    // picks the tab's instance state beside the search.
    //
    // A collection whose `schema:` declares a field a row of `roles:` is read from (`lead`,
    // `collaborators`, `supervisors`) draws, while a person is marked as the user, the Mine only
    // toggle, on by default, keeping the entries that name the user in one of those fields and
    // those that name no one; the Role group, every row of `roles:` with its count; and the Lead
    // badge on an entry whose lead is the user. The rule is data/shapes/boards/roles.ts's, the one
    // the project boards read. The line a write answered and the empty message are
    // views/shared/writes/SaidBody.svelte's, as on the project boards.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryCard from '../../shared/forms/entry/card/EntryCard.svelte';
    import { taskCardActions } from '$lib/views/shared/forms/entry/task-card';
    import AddAsk from '../../shared/forms/entry/AddAsk.svelte';
    import FilterBar from '../../shared/forms/bar/FilterBar.svelte';
    import SliceLine from '../../shared/forms/bar/SliceLine.svelte';
    import ModeButtons from '../../shared/forms/bar/ModeButtons.svelte';
    import EntryList from './EntryList.svelte';
    import NoFundingCard from './NoFundingCard.svelte';
    import { copyBibtex, literatureCardActions } from '$lib/views/shared/card/feed/literature-card';
    import AddButton from '../../shared/forms/AddButton.svelte';
    import { collectionAsk, literatureAsk, type Ask } from '../../shared/forms/entry/entry-add';
    import { blockedBy } from '../../shared/forms/entry-file';
    import CardGrid from '../../shared/card/record/CardGrid.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import SaidBody from '../../shared/writes/SaidBody.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import {
        NO_FUNDING,
        TITLE_COLUMN,
        entryColumns,
        fileOrder,
        identityFaults,
        identityValue,
        joinedRegistries,
        movedOrder,
        offeredStatuses,
        parseCollectionState,
        pickColumn,
        pinnedFirst,
        statusFacets,
        type CollectionMode,
        type CollectionState,
        type Entry
    } from '$lib/state/boards/collection';
    import { STATUS_FACET, collectionBar, entryCountWords } from '$lib/state/boards/collection/bar';
    import { withPick } from '$lib/state/boards/board';
    import { unfundedBy } from '$lib/state/boards/structure/cross-links';
    import { pageView } from '$lib/state/forms/page-entry';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import { vocabOf } from '$lib/state/shared/words/tones';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import { fileUnder, hubList, rootOf } from '$lib/state/shared/page/hubs';
    import { registrationLabel, type ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import type { TaskRef } from '$lib/state/sessions/terminals.svelte';

    const client = useState();
    const {
        layout: { openView },
        terminals: { composeAt },
        fs: { primary, roots },
        selectors: { collectionOf, collectionsOfKey, configMap, projects, selfPeople },
        source: { unsavedFile },
        ui: { cardMoveRequested, instanceState, setInstanceState },
        writes: { reorderEntries, writeToken }
    } = client;

    let { instance }: ViewProps = $props();

    /** The collection key, which is the id the view was registered under. */
    const key = $derived(instance.view);

    const collection = $derived(collectionOf(key));
    /** Each hub's file of the key read by the registry its own entry names. */
    const joined = $derived(joinedRegistries(collectionsOfKey(key)));
    const schema = $derived(collection?.schema);
    const held = $derived(parseCollectionState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));

    /**
     * The file of the collection in each hub that holds one, the primary hub's first: the cards of
     * a hub other than the primary are written by that hub's own file, schema and identities.
     */
    const parts = $derived(
        collectionsOfKey(key).map((one) => ({
            collection: one,
            schema: one.schema,
            file:
                rootOf(one) === primary()
                    ? viewSourceFile('collection', configMap(), primary(), key)
                    : fileUnder(one.file, roots(), primary()),
            faults: identityFaults(one.entries, one.primary_key ?? null, one.key_fault)
        }))
    );
    const entries = $derived(pinnedFirst(parts.flatMap((part) => part.collection.entries)));
    const schemas = $derived(parts.map((part) => part.schema));
    /** The hubs of the Hub group, none while the workspace has one hub. */
    const hubs = $derived(hubList(roots(), primary()));
    const lifecycle = $derived(offeredStatuses(schema, statusFacets(entries)));

    /** The collection file this view is drawn from, offered once the file has been read. */
    const source = $derived(
        collection === null ? null : viewSourceFile('collection', configMap(), key)
    );

    const all = $derived(projects());
    const unfunded = $derived(
        joined.funded.length > 0
            ? unfundedBy(joined.fundedProjects(all), joined.funded, configMap(), vocabOf)
            : []
    );
    /** The bar's groups and slices with their counts, and what it keeps. */
    const filtered = $derived(
        collectionBar({
            entries,
            schemas,
            filters: held.filters,
            search: held.search,
            mine: held.mine,
            config: configMap(),
            self: selfPeople(),
            hubs,
            noFunding: unfunded.length
        })
    );
    const shown = $derived(
        parts.flatMap((part) =>
            pinnedFirst(part.collection.entries)
                .filter(filtered.keeps)
                .map((entry) => ({ entry, part }))
        )
    );
    const columns = $derived(entryColumns(schemas, held.columns));
    /** The entries shown of the files whose entry names the `literature` registry. */
    const shownPapers = $derived(
        shown.filter((one) => one.part.collection.registry === 'literature').map((one) => one.entry)
    );

    let said = $state('');

    /** Open the composer on a task; a refusal is said on the line every write answers on. */
    async function startAgent(task: TaskRef): Promise<void> {
        const refused = await composeAt({ task });
        if (refused !== '') said = refused;
    }

    /** The identity value of the card the reader picked up, while a drag is in flight. */
    let dragged = $state('');

    function write(next: Partial<CollectionState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }, ['more']));
    }

    /** The Add box while it is open: it asks the new entry's name and opens the entry's page. */
    let asking = $state<Ask | null>(null);

    /** The page of one entry, opened from its card's title. */
    function openPage(entry: Entry): void {
        const label = entry.title === '' ? entry.id : entry.title;
        const page = pageView(key, entry.id, label, joined.registryOf(entry));
        openView(page.view, page.state);
    }

    /** Add or remove one value of one group, which is what a pick in a group's list means. */
    function toggleFilter(group: string, value: string): void {
        write({ filters: withPick(held.filters, group, value) });
    }

    /** Draw the cards or the list; a press on the mode in force changes nothing. */
    function setMode(mode: CollectionMode): void {
        if (held.mode !== mode) write({ mode });
    }

    /**
     * The Add of this collection: a DOI or an address saved into a hub whose entry names the
     * `literature` registry while one does, the key for any other.
     */
    function addAsk(): Ask {
        const plain = (chosen?: string): Ask => collectionAsk(client, key, schema, title(), chosen);
        return joined.literature.length > 0
            ? literatureAsk(client, plain, joined.literature)
            : plain();
    }

    /**
     * Copy the BibTeX of the entries the search and the filters leave of the files whose entry
     * names the `literature` registry, in the view's order.
     */
    async function copyShown(): Promise<void> {
        said = await copyBibtex(shownPapers, writeToken());
    }

    /** Draw one entry's long text whole, or cut it to its clamp again. */
    function toggleMore(id: string): void {
        write({
            more: held.more.includes(id)
                ? held.more.filter((one) => one !== id)
                : [...held.more, id]
        });
    }

    /**
     * The drop: the dragged entry moves to the place of the card it was dropped on, and the file is
     * written in the whole new order. A card dropped on a card of another hub's file moves nothing.
     * The order is taken over every entry of the file, not over the ones the filter leaves, so a
     * drag while a search is typed cannot drop the entries it is hiding, and it is the file's own
     * order rather than the pinned-first one the cards are drawn in, so a drag while an entry is
     * pinned does not write the pinned-first order into the file.
     */
    async function drop(onto: string): Promise<void> {
        const from = dragged;
        dragged = '';
        if (from === '' || from === onto) return;
        const part = partOf(from);
        if (part === undefined) return;
        const order = fileOrder(part.collection.entries);
        await writeOrder(part, order, order.indexOf(from), order.indexOf(onto));
    }

    /** The collection of the hub whose file holds the card a write addresses by `value`. */
    function partOf(value: string): (typeof parts)[number] | undefined {
        return parts.find((part) =>
            part.collection.entries.some((entry) => identityValue(entry) === value)
        );
    }

    /**
     * The keyboard reorder: the card under the pane's cursor changes places with its neighbour in
     * the file's order. It is the drag's other path, so a list is reorderable without a pointer.
     */
    async function carry(value: string, step: -1 | 1): Promise<void> {
        const part = partOf(value);
        if (part === undefined) return;
        const order = fileOrder(part.collection.entries);
        const at = order.indexOf(value);
        await writeOrder(part, order, at, at + step);
    }

    /** Move one place of the order to another and write the whole new order to the file. */
    async function writeOrder(
        part: (typeof parts)[number],
        order: string[],
        at: number,
        to: number
    ): Promise<void> {
        const moved = movedOrder(order, at, to);
        if (moved === null) return;
        const file = part.file;
        const held = file !== null && unsavedFile(file.root, file.path);
        const blocked = blockedBy(file, held, [...part.faults.values()].at(0));
        if (blocked !== '') {
            said = blocked;
            return;
        }
        const answer = await reorderEntries(key, moved);
        said = answer.ok
            ? t('editor.saved', answer.changed.join(', '))
            : t('editor.failed', answer.error ?? '');
    }

    /**
     * The sequence number of the last keyboard reorder performed, so one request moves one card.
     */
    let carried = 0;

    $effect(() => {
        const asked = cardMoveRequested(instance.id);
        if (asked === null || asked.seq === carried) return;
        carried = asked.seq;
        if (held.mode === 'cards') void carry(asked.card, asked.step);
    });

    /**
     * The pane's words: the file's own title, and the view's registered name before it arrives,
     * else its key.
     */
    function title(): string {
        if (collection !== null) return collection.title;
        const view = client.registry.viewFor(instance.view);
        return view === undefined ? instance.view : registrationLabel(view);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('collection.toolbar')} overflow>
        {#if schema !== undefined}
            <AddButton onclick={() => (asking = addAsk())} />
        {/if}
        <ModeButtons mode={held.mode} onmode={setMode} />
        {#if held.mode === 'list'}
            <Menu
                label={t('board.columns')}
                glyph="sliders"
                compact
                bare
                placement="down"
                align="right"
                items={columns.map((one) => ({
                    id: one.key,
                    label: one.label,
                    checked: one.shown,
                    disabled: one.key === TITLE_COLUMN,
                    title:
                        one.key === TITLE_COLUMN ? t('board.columns_always', one.label) : one.label
                }))}
                onpick={(column: string) =>
                    write({ columns: pickColumn(schemas, held.columns, column) })}
            />
        {/if}
        {#if joined.literature.length > 0}
            <ToolButton
                label={t('literature.bibtex_shown')}
                title={t('literature.bibtex_shown_tip')}
                glyph="copy"
                disabled={shownPapers.length === 0}
                onclick={copyShown}
            />
        {/if}
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

{#snippet bar()}
    <FilterBar
        label={t('collection.filters')}
        search={held.search}
        placeholder={t('collection.search', title())}
        onsearch={(value: string) => write({ search: value })}
        named={filtered.named}
        mine
        pressed={held.mine}
        onmine={() => write({ mine: !held.mine })}
        groups={filtered.groups}
        line={filtered.line}
        ontoggle={toggleFilter}
    />
    <SliceLine
        label={t('collection.slices')}
        groups={filtered.slices}
        facet={STATUS_FACET}
        counted={filtered.counted}
        filters={held.filters}
        shown={filtered.shown}
        total={filtered.total}
        words={entryCountWords}
        onfilters={(next: Record<string, string[]>) => write({ filters: next })}
    />
{/snippet}

<AddAsk ask={asking} onclose={() => (asking = null)} />

<Pane title={title()} toolbar={tools} {bar}>
    <div class="collection" data-instance={instance.id} data-collection={instance.view}>
        <SaidBody
            {said}
            empty={shown.length === 0 && !filtered.card}
            message={t('collection.empty')}
        >
            {#if held.mode === 'list'}
                {#if filtered.card}
                    <CardGrid role="list">
                        <NoFundingCard {unfunded} cursor={cursor === NO_FUNDING} />
                    </CardGrid>
                {/if}
                <EntryList
                    rows={shown.map((one) => ({ entry: one.entry, schema: one.part.schema }))}
                    {columns}
                    onpage={openPage}
                    reveal={held.reveal}
                    onrevealed={() => write({ reveal: '' })}
                />
            {:else}
                <CardGrid role="list">
                    {#each shown as { entry, part } (`${rootOf(entry)}:${entry.index}`)}
                        <Reveal
                            id={entry.id}
                            wanted={held.reveal}
                            onrevealed={() => write({ reveal: '' })}
                        >
                            <EntryCard
                                {entry}
                                cursor={cursor === identityValue(entry)}
                                collection={key}
                                schema={part.schema}
                                projects={all}
                                statuses={lifecycle}
                                file={part.file}
                                fault={part.faults.get(entry.index)}
                                ondragfrom={(value: string) => (dragged = value)}
                                ondropon={drop}
                                onsaid={(words: string) => (said = words)}
                                lead={filtered.lead(entry)}
                                more={held.more.includes(entry.id)}
                                onmore={() => toggleMore(entry.id)}
                                onpage={() => openPage(entry)}
                                extra={taskCardActions(
                                    part.collection,
                                    entry,
                                    configMap(),
                                    startAgent
                                ).concat(
                                    literatureCardActions(
                                        part.collection,
                                        entry,
                                        writeToken,
                                        (words) => {
                                            said = words;
                                        }
                                    )
                                )}
                            />
                        </Reveal>
                    {/each}
                    {#if filtered.card}
                        <NoFundingCard {unfunded} cursor={cursor === NO_FUNDING} />
                    {/if}
                </CardGrid>
            {/if}
        </SaidBody>
    </div>
</Pane>
