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
    // and code adds what the portfolio says about its own code above the cards.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Coverage from './collection/Coverage.svelte';
    import EntryCard from './collection/EntryCard.svelte';
    import EntryForm from './shared/EntryForm.svelte';
    import {
        FUNDING,
        NO_FUNDING,
        applyCollectionFilters,
        identityValue,
        inlineMarkdown,
        noFunding,
        parseCollectionState,
        pinnedFirst,
        statusFacets,
        type CollectionState
    } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';
    import { collectionOf, projects } from '$lib/state/selectors.svelte';
    import { lookup, t } from '$lib/state/text';
    import { statusTone } from '$lib/state/tones';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import { reorderEntries } from '$lib/state/writes.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    /** The collection key, which is the id the view was registered under. */
    const key = $derived(instance.view);

    const collection = $derived(collectionOf(key));
    const schema = $derived(collection?.schema);
    const held = $derived(parseCollectionState(instanceState(instance.id)));
    const entries = $derived(pinnedFirst(collection?.entries ?? []));
    const shown = $derived(applyCollectionFilters(entries, held));
    const facets = $derived(statusFacets(entries));

    /** The statuses a file with no schema offers as buttons: the ones its own entries use. */
    const lifecycle = $derived(schema === undefined ? facets.map((facet) => facet.value) : []);

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
     * filter leaves, so a drag while a search is typed cannot drop the entries it is hiding.
     */
    async function drop(onto: string): Promise<void> {
        const from = dragged;
        dragged = '';
        if (from === '' || from === onto) return;
        const order = entries.map((entry) => identityValue(entry, schema));
        const at = order.indexOf(from);
        const to = order.indexOf(onto);
        if (at < 0 || to < 0) return;
        order.splice(at, 1);
        order.splice(to, 0, from);
        const answer = await reorderEntries(key, order);
        said = answer.ok
            ? t('editor.saved', answer.changed.join(', '))
            : t('editor.failed', answer.error ?? '');
    }

    /** The pane's words: the file's own title, and the view's registered name before it arrives. */
    function title(): string {
        return collection?.title ?? lookup(`views.${instance.view}`);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('collection.toolbar')}>
        <Search
            value={held.search}
            placeholder={t('col.search', title())}
            oninput={(value) => write({ search: value })}
        />
        {#if schema !== undefined}
            <ToolButton
                label={t('col.add')}
                title={t('col.add_tip')}
                active={adding}
                onclick={() => (adding = !adding)}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools}>
    <div class="collection" data-instance={instance.id} data-collection={instance.view}>
        {#if collection?.intro}
            <p class="intro">{@html inlineMarkdown(collection.intro)}</p>
        {/if}

        {#if facets.length > 0 || unfunded.length > 0}
            <div class="facets">
                <span class="label">{t('col.status_facet')}</span>
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
                onsaid={(words) => (said = words)}
            />
        {/if}

        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}

        {#if key === 'code'}
            <Coverage projects={all} />
        {/if}

        {#if shown.length === 0 && unfunded.length === 0}
            <Empty message={t('collection.empty')} />
        {:else}
            <div class="cards" role="list">
                {#each shown as entry (entry.index)}
                    <EntryCard
                        {entry}
                        collection={key}
                        {schema}
                        projects={all}
                        statuses={lifecycle}
                        editing={editing === entry.id}
                        onedit={() => (editing = editing === entry.id ? null : entry.id)}
                        ondragfrom={(value) => (dragged = value)}
                        ondropon={drop}
                        onsaid={(words) => (said = words)}
                    />
                {/each}
                {#if unfunded.length > 0 && !held.hidden.includes(NO_FUNDING)}
                    <div class="slot" data-entry={NO_FUNDING} role="listitem">
                        <Card title={t('collection.no_funding')}>
                            {#snippet meta()}
                                <Chip label={String(unfunded.length)} />
                            {/snippet}
                            <p class="sub">{t('collection.no_funding_sub')}</p>
                            <div class="row">
                                {#each unfunded as project (project.id)}
                                    <ToolButton
                                        label={project.short ?? project.title}
                                        onclick={() =>
                                            openView('project', 'main', {
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
    .intro {
        margin: 0 0 10px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

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
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .said,
    .sub {
        margin: 0 0 6px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 10px;
        align-items: start;
    }
</style>
