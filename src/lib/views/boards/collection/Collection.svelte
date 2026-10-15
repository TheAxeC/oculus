<script module lang="ts">
    // Layer 3, view registration. The generic collection component owns each configured
    // collection's place in the catalogue, which is the rail page it sits on: the Academic Life
    // page's six, the Literature page's Literature after the Literature search and Lit Watch, and
    // the Registries page's for Statements, People, Organisations, Resources and a collection
    // sources.yml adds that no placement names.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    const placements: Record<string, { group: string; order: number }> = {
        funding: { group: 'academic', order: 0 },
        events: { group: 'academic', order: 1 },
        education: { group: 'academic', order: 2 },
        applications: { group: 'academic', order: 3 },
        'joint-work': { group: 'academic', order: 4 },
        tasks: { group: 'academic', order: 5 },
        literature: { group: 'literature', order: 2 },
        statements: { group: 'registries', order: 3 },
        people: { group: 'registries', order: 4 },
        organisations: { group: 'registries', order: 5 },
        resources: { group: 'registries', order: 6 }
    };

    export const registration = (keys: string[]): ViewRegistration[] =>
        keys.map((id, index) => {
            const applications = id === 'applications';
            const place = placements[id] ?? { group: 'registries', order: 100 + index };
            return {
                id,
                label: `views.${id}`,
                glyph: `views.${id}_glyph`,
                ...place,
                badge: applications
                    ? (client) => client.railBadges.applicationsBadge()
                    : (client) => client.railBadges.collectionBadge(id),
                badgeTone: applications
                    ? () => 'green'
                    : (client) => client.railBadges.collectionBadgeTone(id),
                badgeTitle: applications
                    ? undefined
                    : (client) => client.railBadges.collectionBadgeTitle(id)
            };
        });
</script>

<script lang="ts">
    // Layer 3, view. One collection file as its own tab: the file's title and intro, a search over
    // every word an entry holds and a facet bar of the statuses the file uses (both in the bar
    // under the header), an Add that asks the new entry's name and opens its page, and one card per
    // entry, the pinned ones first. The title of a card opens the entry's page, the `entry` view's
    // tab, where the entry is edited and deleted.
    //
    // It is registered once per collection key of config/sources.yml and reads which collection it
    // is from the id of the instance it was mounted as, exactly as Projects.svelte reads which
    // board it is. Nothing here knows what an event or a scheme is: the fields a card draws and
    // their order come from the file's own `schema:`, through the pure functions of
    // state/boards/collection.ts.
    //
    // The funding collection carries one thing of its own, its file joined to the projects rather
    // than a second view: the card of the projects no scheme covers. The Literature collection
    // carries three: Add asks a DOI or an address and looks the paper up, its cards copy their
    // BibTeX, and the toolbar copies the BibTeX of the entries shown.
    //
    // A schema field marked `filter: true` is a filter in the bar (FieldFilters.svelte), its picks
    // and ranges the tab's instance state beside the search.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryCard from '../../shared/forms/entry/EntryCard.svelte';
    import { taskCardActions } from '$lib/views/shared/forms/entry/task-card';
    import AddAsk from '../../shared/forms/entry/AddAsk.svelte';
    import FieldFilters from './FieldFilters.svelte';
    import { copyBibtex, literatureCardActions } from '$lib/views/shared/card/feed/literature-card';
    import AddButton from '../../shared/forms/AddButton.svelte';
    import { collectionAsk, literatureAsk, type Ask } from '../../shared/forms/entry/entry-add';
    import { blockedBy } from '../../shared/forms/entry-file';
    import Intro from '../../shared/prose/Intro.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        FUNDING,
        NO_FUNDING,
        applyCollectionFilters,
        fieldFilters,
        fileOrder,
        identityFaults,
        identityValue,
        movedOrder,
        offeredStatuses,
        parseCollectionState,
        pinnedFirst,
        statusFacets,
        unfundedBy,
        type Bounds,
        type CollectionState,
        type Entry
    } from '$lib/state/boards/collection';
    import { LITERATURE } from '$lib/state/feeds/literature/saved';
    import { pageView } from '$lib/state/forms/page-entry';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { lookup, t } from '$lib/state/shared/words/text';
    import { statusTone } from '$lib/state/shared/words/tones';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import { fileUnder, rootOf } from '$lib/state/shared/page/hubs';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import type { TaskRef } from '$lib/state/sessions/terminals.svelte';

    const client = useState();
    const {
        layout: { openView },
        terminals: { composeAt },
        fs: { primary, roots },
        selectors: { collectionOf, collectionsOfKey, configMap, projects },
        source: { unsavedFile },
        ui: { cardMoveRequested, instanceState, setInstanceState },
        writes: { reorderEntries, writeToken }
    } = client;

    let { instance }: ViewProps = $props();

    /** The collection key, which is the id the view was registered under. */
    const key = $derived(instance.view);

    const collection = $derived(collectionOf(key));
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
                one.root === undefined
                    ? viewSourceFile('collection', configMap(), primary(), key)
                    : fileUnder(one.file, roots(), primary()),
            faults: identityFaults(one.entries, one.schema)
        }))
    );
    const entries = $derived(pinnedFirst(parts.flatMap((part) => part.collection.entries)));
    const shown = $derived(
        parts.flatMap((part) =>
            applyCollectionFilters(pinnedFirst(part.collection.entries), held).map((entry) => ({
                entry,
                part
            }))
        )
    );
    const facets = $derived(statusFacets(entries));
    const filters = $derived(
        fieldFilters(
            parts.map((part) => part.schema),
            entries
        )
    );

    const lifecycle = $derived(offeredStatuses(schema, facets));

    /** The collection file this view is drawn from, offered once the file has been read. */
    const source = $derived(
        collection === null ? null : viewSourceFile('collection', configMap(), key)
    );

    const all = $derived(projects());
    const unfunded = $derived(key === FUNDING ? unfundedBy(all, entries) : []);

    let said = $state('');

    /** Open the composer on a task; a refusal is said on the line every write answers on. */
    async function startAgent(task: TaskRef): Promise<void> {
        const refused = await composeAt({ task });
        if (refused !== '') said = refused;
    }

    /** The identity value of the card the reader picked up, while a drag is in flight. */
    let dragged = $state('');

    function write(next: Partial<CollectionState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    /** The Add box while it is open: it asks the new entry's name and opens the entry's page. */
    let asking = $state<Ask | null>(null);

    /** The page of one entry, opened from its card's title. */
    function openPage(entry: Entry): void {
        const page = pageView(key, entry.id, entry.title === '' ? entry.id : entry.title);
        openView(page.view, page.state);
    }

    /** Hide one status's cards, or bring them back, which is what a facet toggle does. */
    function toggle(value: string): void {
        const shownNow = held.hidden;
        write({
            hidden: shownNow.includes(value)
                ? shownNow.filter((other) => other !== value)
                : [...shownNow, value]
        });
    }

    /** Press or release one value of a schema filter. */
    function pick(field: string, value: string): void {
        const now = held.picked[field] ?? [];
        const next = now.includes(value) ? now.filter((one) => one !== value) : [...now, value];
        write({ picked: { ...held.picked, [field]: next } });
    }

    /** The bounds of one range filter as typed. */
    function bound(field: string, bounds: Bounds): void {
        write({ range: { ...held.range, [field]: bounds } });
    }

    /** The Add of this collection: a DOI or an address for Literature, the key for any other. */
    function addAsk(): Ask {
        const plain = (chosen?: string): Ask => collectionAsk(client, key, schema, title(), chosen);
        return key === LITERATURE ? literatureAsk(client, plain) : plain();
    }

    /** Copy the BibTeX of the entries the search and the filters leave, in the view's order. */
    async function copyShown(): Promise<void> {
        said = await copyBibtex(
            shown.map((one) => one.entry),
            writeToken()
        );
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
        const order = fileOrder(part.collection.entries, part.schema);
        await writeOrder(part, order, order.indexOf(from), order.indexOf(onto));
    }

    /** The collection of the hub whose file holds the card with the identity `value`. */
    function partOf(value: string): (typeof parts)[number] | undefined {
        return parts.find((part) =>
            part.collection.entries.some((entry) => identityValue(entry, part.schema) === value)
        );
    }

    /**
     * The keyboard reorder: the card under the pane's cursor changes places with its neighbour in
     * the file's order. It is the drag's other path, so a list is reorderable without a pointer.
     */
    async function carry(value: string, step: -1 | 1): Promise<void> {
        const part = partOf(value);
        if (part === undefined) return;
        const order = fileOrder(part.collection.entries, part.schema);
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
        void carry(asked.card, asked.step);
    });

    /** The pane's words: the file's own title, and the view's registered name before it arrives. */
    function title(): string {
        return collection?.title ?? lookup(`views.${instance.view}`);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('collection.toolbar')} overflow>
        {#if schema !== undefined}
            <AddButton onclick={() => (asking = addAsk())} />
        {/if}
        {#if key === LITERATURE}
            <ToolButton
                label={t('literature.bibtex_shown')}
                title={t('literature.bibtex_shown_tip')}
                glyph="copy"
                disabled={shown.length === 0}
                onclick={copyShown}
            />
        {/if}
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('collection.filters')}>
        <Search
            fill
            value={held.search}
            placeholder={t('collection.search', title())}
            oninput={(value: string) => write({ search: value })}
        />
        {#if facets.length > 0 || unfunded.length > 0}
            <span class="label">{t('collection.status_facet')}</span>
            {#each facets as facet (facet.value)}
                <Chip
                    label={`${facet.value} ${facet.count}`}
                    tone={statusTone(facet.value)}
                    pressed={!held.hidden.includes(facet.value)}
                    onclick={() => toggle(facet.value)}
                />
            {/each}
            {#if unfunded.length > 0}
                <Chip
                    label={`${t('collection.no_funding')} ${unfunded.length}`}
                    pressed={!held.hidden.includes(NO_FUNDING)}
                    onclick={() => toggle(NO_FUNDING)}
                />
            {/if}
        {/if}
        <FieldFilters
            {filters}
            picked={held.picked}
            range={held.range}
            onpick={pick}
            onrange={bound}
        />
    </Toolbar>
{/snippet}

<AddAsk ask={asking} onclose={() => (asking = null)} />

<Pane title={title()} toolbar={tools} {bar}>
    <div class="collection" data-instance={instance.id} data-collection={instance.view}>
        {#if collection?.intro}
            <Intro html={inlineMarkdown(collection.intro)} />
        {/if}

        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}

        {#if shown.length === 0 && unfunded.length === 0}
            <Empty message={t('collection.empty')} />
        {:else}
            <div class="cards" role="list">
                {#each shown as { entry, part } (`${rootOf(entry, primary())}:${entry.index}`)}
                    <Reveal
                        id={entry.id}
                        wanted={held.reveal}
                        onrevealed={() => write({ reveal: '' })}
                    >
                        <EntryCard
                            {entry}
                            cursor={cursor === identityValue(entry, part.schema)}
                            collection={key}
                            schema={part.schema}
                            projects={all}
                            statuses={lifecycle}
                            file={part.file}
                            fault={part.faults.get(entry.index)}
                            ondragfrom={(value: string) => (dragged = value)}
                            ondropon={drop}
                            onsaid={(words: string) => (said = words)}
                            more={held.more.includes(entry.id)}
                            onmore={() => toggleMore(entry.id)}
                            onpage={() => openPage(entry)}
                            extra={taskCardActions(key, entry, configMap(), startAgent).concat(
                                literatureCardActions(key, entry, writeToken, (words) => {
                                    said = words;
                                })
                            )}
                        />
                    </Reveal>
                {/each}
                {#if unfunded.length > 0 && !held.hidden.includes(NO_FUNDING)}
                    <div class="slot" data-entry={NO_FUNDING} role="listitem">
                        <Card
                            id={NO_FUNDING}
                            cursor={cursor === NO_FUNDING}
                            title={t('collection.no_funding')}
                        >
                            {#snippet meta()}
                                <Tag label={String(unfunded.length)} />
                            {/snippet}
                            <p class="sub">{t('collection.no_funding_sub')}</p>
                            <div class="row">
                                {#each unfunded as project (project.id)}
                                    <ToolButton
                                        small
                                        label={project.short ?? project.title}
                                        onclick={() =>
                                            openView('project', {
                                                id: project.id,
                                                label: project.short ?? project.title
                                            })}
                                    />
                                {/each}
                            </div>
                        </Card>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</Pane>

<style>
    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .said {
        margin: 0 0 6px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .sub {
        margin: 0 0 6px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The cards of one row stretch to the row's height, in file order, so no empty cell is left
       under a short card and nothing is reordered to fill one. A card sits inside its reveal box,
       which is stretched with it. */
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        align-items: stretch;
    }

    .cards > :global([data-reveal]) {
        display: flex;
        flex-direction: column;
    }

    .cards > :global([data-reveal] > .slot) {
        flex: 1 1 auto;
    }

    .cards > .slot {
        display: flex;
        flex-direction: column;
    }

    .cards > .slot > :global(.card) {
        flex: 1 1 auto;
    }
</style>
