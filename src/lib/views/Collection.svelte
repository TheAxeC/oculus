<script module lang="ts">
    // Layer 3, view registration. The generic collection component owns each configured collection's rail placement.
    import type { ViewRegistration } from './registry';

    const placements: Record<string, { group: string; order: number }> = {
        funding: { group: 'academic', order: 0 },
        events: { group: 'academic', order: 1 },
        education: { group: 'academic', order: 2 },
        applications: { group: 'academic', order: 3 },
        'joint-work': { group: 'academic', order: 4 },
        tasks: { group: 'academic', order: 5 },
        code: { group: 'sources', order: 2 },
        statements: { group: 'sources', order: 3 }
    };

    export const registration = (keys: string[]): ViewRegistration[] =>
        keys.map((id, index) => {
            const applications = id === 'applications';
            const place = placements[id] ?? { group: 'sources', order: 100 + index };
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
    // every word an entry holds, a facet bar of the statuses the file uses, an add form over the
    // file's own schema, and one card per entry, the pinned ones first.
    //
    // It is registered once per collection key of config/sources.yml and reads which collection it is
    // from the id of the instance it was mounted as, exactly as Projects.svelte reads which board it
    // is. Nothing here knows what an event or a scheme is: the fields a card draws and their order
    // come from the file's own `schema:`, through the pure functions of state/collection.ts.
    //
    // Two collections carry one thing of their own, and both are that collection's own file joined to
    // the projects rather than a second view: funding adds the card of the projects no scheme covers,
    // and code adds what the portfolio says about its own code above the cards, then the software
    // projects of its own scan tier, which the registry file does not hold.

    import Card from '$lib/ui/Card.svelte';
    import Tag from '$lib/ui/Tag.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Coverage from './collection/Coverage.svelte';
    import Software from './collection/Software.svelte';
    import EntryCard from './collection/EntryCard.svelte';
    import EntryForm from './shared/EntryForm.svelte';
    import Intro from './shared/Intro.svelte';
    import Reveal from './shared/Reveal.svelte';
    import SourceButton from './shared/SourceButton.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        FUNDING,
        NO_FUNDING,
        applyCollectionFilters,
        identityValue,
        movedOrder,
        noFunding,
        parseCollectionState,
        pinnedFirst,
        statusFacets,
        type CollectionState
    } from '$lib/state/collection';
    import { cardCursor } from '$lib/state/instance';
    import { lookup, t } from '$lib/state/text';
    import { statusTone } from '$lib/state/tones';
    import { viewSourceFile } from '$lib/state/view-source';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        layout: { openView },
        selectors: { archiveDead, collectionOf, configMap, projects },
        ui: { cardMoveRequested, instanceState, setInstanceState },
        writes: { reorderEntries }
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

    /** The statuses a file with no schema offers as buttons: the ones its own entries use. */
    const lifecycle = $derived(schema === undefined ? facets.map((facet) => facet.value) : []);

    /** The collection file this view is drawn from, offered once the file has been read. */
    const source = $derived(
        collection === null ? null : viewSourceFile('collection', configMap(), key)
    );

    const all = $derived(projects());
    const unfunded = $derived(
        key === FUNDING
            ? noFunding(
                  all,
                  (collection?.entries ?? []).map((one) => one.id)
              )
            : []
    );

    /** True while the add form is open, and the id of the entry whose edit form is. */
    let adding = $state(false);
    let editing: string | null = $state(null);
    let said = $state('');

    /** The identity value of the card the reader picked up, while a drag is in flight. */
    let dragged = $state('');

    function write(next: Partial<CollectionState>): void {
        setInstanceState(instance.id, { ...held, ...next });
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
        const order = fileOrder();
        await writeOrder(order, order.indexOf(from), order.indexOf(onto));
    }

    /**
     * The keyboard reorder: the card under the pane's cursor changes places with its neighbour in
     * the file's order. It is the drag's other path, so a list is reorderable without a pointer.
     */
    async function carry(value: string, step: -1 | 1): Promise<void> {
        const order = fileOrder();
        const at = order.indexOf(value);
        await writeOrder(order, at, at + step);
    }

    /** The identity of every entry the file holds, in the order the file holds them. */
    function fileOrder(): string[] {
        return (collection?.entries ?? []).map((entry) => identityValue(entry, schema));
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

    /** The sequence number of the last keyboard reorder performed, so one request moves one card. */
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
    <Toolbar label={t('collection.toolbar')}>
        <Search
            value={held.search}
            placeholder={t('collection.search', title())}
            oninput={(value: string) => write({ search: value })}
        />
        {#if schema !== undefined}
            <ToolButton
                label={t('collection.add')}
                title={t('collection.add_tip')}
                active={adding}
                onclick={() => (adding = !adding)}
            />
        {/if}
        {#if source !== null}
            <SourceButton file={source} />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools}>
    <div class="collection" data-instance={instance.id} data-collection={instance.view}>
        {#if collection?.intro}
            <Intro html={inlineMarkdown(collection.intro)} />
        {/if}

        {#if facets.length > 0 || unfunded.length > 0}
            <div class="facets">
                <span class="label">{t('collection.status_facet')}</span>
                {#each facets as facet (facet.value)}
                    <span
                        class="facet"
                        style={`--accent: var(--c-${statusTone(facet.value)}); --on-accent: var(--on-c-${statusTone(facet.value)})`}
                    >
                        <ToolButton
                            label={`${facet.value} ${facet.count}`}
                            active={!held.hidden.includes(facet.value)}
                            onclick={() => toggle(facet.value)}
                        />
                    </span>
                {/each}
                {#if unfunded.length > 0}
                    <ToolButton
                        label={`${t('collection.no_funding')} ${unfunded.length}`}
                        active={!held.hidden.includes(NO_FUNDING)}
                        onclick={() => toggle(NO_FUNDING)}
                    />
                {/if}
            </div>
        {/if}

        {#if adding}
            <EntryForm
                collection={key}
                {schema}
                entry={null}
                onclose={() => (adding = false)}
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
                            editing={editing === entry.id}
                            onedit={() => (editing = editing === entry.id ? null : entry.id)}
                            ondragfrom={(value: string) => (dragged = value)}
                            ondropon={drop}
                            onsaid={(words: string) => (said = words)}
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
    .facets,
    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .facets {
        margin-bottom: 10px;
    }

    .label {
        font-size: var(--fs-xxs);
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
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 10px;
        align-items: start;
    }
</style>
