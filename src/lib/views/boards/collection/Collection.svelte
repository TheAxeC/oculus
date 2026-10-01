<script module lang="ts">
    // Layer 3, view registration. The generic collection component owns each configured
    // collection's place in the catalogue, which is the rail page it sits on: the Academic Life
    // page's six, and the References page's for Code, Statements and a collection sources.yml adds
    // that no placement names.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    const placements: Record<string, { group: string; order: number }> = {
        funding: { group: 'academic', order: 0 },
        events: { group: 'academic', order: 1 },
        education: { group: 'academic', order: 2 },
        applications: { group: 'academic', order: 3 },
        'joint-work': { group: 'academic', order: 4 },
        tasks: { group: 'academic', order: 5 },
        code: { group: 'references', order: 2 },
        statements: { group: 'references', order: 3 }
    };

    export const registration = (keys: string[]): ViewRegistration[] =>
        keys.map((id, index) => {
            const applications = id === 'applications';
            const place = placements[id] ?? { group: 'references', order: 100 + index };
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
    // under the header), an add form over the file's own schema, and one card per entry, the
    // pinned ones first.
    //
    // It is registered once per collection key of config/sources.yml and reads which collection it
    // is from the id of the instance it was mounted as, exactly as Projects.svelte reads which
    // board it is. Nothing here knows what an event or a scheme is: the fields a card draws and
    // their order come from the file's own `schema:`, through the pure functions of
    // state/boards/collection.ts.
    //
    // Two collections carry one thing of their own, and both are that collection's own file joined
    // to the projects rather than a second view: funding adds the card of the projects no scheme
    // covers, and code adds what the portfolio says about its own code above the cards, then the
    // software projects of its own scan tier, which the registry file does not hold.
    //
    // An add form the Position Leads view opened from a lead names that lead in this instance's
    // state, and its save goes through state/feeds/lead-application.ts: the entry, then the lead
    // set to `applied` once the entry is written. Closing the form forgets the lead, so a cancel
    // writes nothing to it.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Coverage from './Coverage.svelte';
    import Software from './Software.svelte';
    import EntryCard from './EntryCard.svelte';
    import AddButton from '../../shared/forms/AddButton.svelte';
    import EntryForm from '../../shared/forms/EntryForm.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        FUNDING,
        NO_FUNDING,
        applyCollectionFilters,
        fileOrder,
        identityValue,
        movedOrder,
        offeredStatuses,
        parseCollectionState,
        pinnedFirst,
        statusFacets,
        unfundedBy,
        type CollectionState
    } from '$lib/state/boards/collection';
    import {
        closeAddForm,
        leadAddFor,
        type ApplicationTab
    } from '$lib/state/feeds/lead-application';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { lookup, t } from '$lib/state/shared/words/text';
    import { statusTone } from '$lib/state/shared/words/tones';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView },
        selectors: { archiveDead, collectionOf, configMap, projects },
        formDrafts: { clearFormDraft, formEdits, setFormField, toggleAdd, toggleEdit },
        ui: { cardMoveRequested, instanceState, setInstanceState },
        writes: { newEntry, reorderEntries, writeFeedField }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The collection key, which is the id the view was registered under. */
    const key = $derived(instance.view);

    const collection = $derived(collectionOf(key));
    const schema = $derived(collection?.schema);
    const held = $derived(parseCollectionState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const entries = $derived(pinnedFirst(collection?.entries ?? []));
    const shown = $derived(applyCollectionFilters(entries, held));
    const facets = $derived(statusFacets(entries));

    const lifecycle = $derived(offeredStatuses(schema, facets));

    /** The collection file this view is drawn from, offered once the file has been read. */
    const source = $derived(
        collection === null ? null : viewSourceFile('collection', configMap(), key)
    );

    const all = $derived(projects());
    const unfunded = $derived(key === FUNDING ? unfundedBy(all, collection?.entries ?? []) : []);

    let said = $state('');

    /** The identity value of the card the reader picked up, while a drag is in flight. */
    let dragged = $state('');

    function write(next: Partial<CollectionState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    /** This tab's drafts and state, as the add from a lead reads and writes them. */
    const tab: ApplicationTab = {
        formEdits,
        clearFormDraft,
        setFormField,
        instanceState,
        setInstanceState
    };

    /**
     * The add write of a form opened from a position lead, or none for any other add form, which
     * then writes through the form's own add.
     */
    const leadAdd = $derived(leadAddFor(tab, { newEntry, writeFeedField }, instance.id, key));

    /** Hide one status's cards, or bring them back, which is what a facet toggle does. */
    function toggle(value: string): void {
        const shownNow = held.hidden;
        write({
            hidden: shownNow.includes(value)
                ? shownNow.filter((other) => other !== value)
                : [...shownNow, value]
        });
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
     * written in the whole new order. The order is taken over every entry, not over the ones the
     * filter leaves, so a drag while a search is typed cannot drop the entries it is hiding, and it
     * is the file's own order rather than the pinned-first one the cards are drawn in, so a drag
     * while an entry is pinned does not write the pinned-first order into the file.
     */
    async function drop(onto: string): Promise<void> {
        const from = dragged;
        dragged = '';
        if (from === '' || from === onto) return;
        const order = fileOrder(collection?.entries ?? [], schema);
        await writeOrder(order, order.indexOf(from), order.indexOf(onto));
    }

    /**
     * The keyboard reorder: the card under the pane's cursor changes places with its neighbour in
     * the file's order. It is the drag's other path, so a list is reorderable without a pointer.
     */
    async function carry(value: string, step: -1 | 1): Promise<void> {
        const order = fileOrder(collection?.entries ?? [], schema);
        const at = order.indexOf(value);
        await writeOrder(order, at, at + step);
    }

    /** Move one place of the order to another and write the whole new order to the file. */
    async function writeOrder(order: string[], at: number, to: number): Promise<void> {
        const moved = movedOrder(order, at, to);
        if (moved === null) return;
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
            <AddButton
                open={held.adding}
                onclick={() => write({ adding: toggleAdd(instance.id, key, held.adding) })}
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
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools} {bar}>
    <div class="collection" data-instance={instance.id} data-collection={instance.view}>
        {#if collection?.intro}
            <Intro html={inlineMarkdown(collection.intro)} />
        {/if}

        {#if held.adding}
            <EntryForm
                collection={key}
                {schema}
                entry={null}
                onadd={leadAdd}
                onclose={() => closeAddForm(tab, instance.id)}
                onsaid={(words: string) => (said = words)}
            />
        {/if}

        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}

        {#if key === 'code'}
            <Coverage projects={all} dead={archiveDead()} />
            <Software projects={all} />
        {/if}

        {#if shown.length === 0 && unfunded.length === 0}
            <Empty message={t('collection.empty')} />
        {:else}
            <div class="cards" role="list">
                {#each shown as entry (entry.index)}
                    <Reveal
                        id={entry.id}
                        wanted={held.reveal}
                        onrevealed={() => write({ reveal: '' })}
                    >
                        <EntryCard
                            {entry}
                            cursor={cursor === identityValue(entry, schema)}
                            collection={key}
                            {schema}
                            projects={all}
                            statuses={lifecycle}
                            editing={held.editing === entry.id}
                            onedit={() =>
                                write({
                                    editing: toggleEdit(instance.id, key, held.editing, entry.id)
                                })}
                            ondragfrom={(value: string) => (dragged = value)}
                            ondropon={drop}
                            onsaid={(words: string) => (said = words)}
                            more={held.more.includes(entry.id)}
                            onmore={() => toggleMore(entry.id)}
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
