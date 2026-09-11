<script lang="ts">
    // Layer 3, view. One collection file as its own tab: the file's title and intro, a search over
    // every word an entry holds, a status facet where the file has statuses, and one card per entry.
    //
    // It is registered once per collection key of config/sources.yml and reads which collection it is
    // from the id of the instance it was mounted as, exactly as Projects.svelte reads which board it
    // is. Nothing here knows what an event or a course is: the fields a card draws and their order
    // come from the file's own `schema:`, through the pure functions of state/collection.ts.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import {
        applyCollectionFilters,
        drawnFields,
        entryStatus,
        hasStatusField,
        hrefOf,
        parseCollectionState,
        statusValues,
        type CollectionState,
        type Entry
    } from '$lib/state/collection';
    import { collectionOf } from '$lib/state/selectors.svelte';
    import { lookup, t } from '$lib/state/text';
    import { statusTone } from '$lib/state/tones';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const collection = $derived(collectionOf(instance.view));
    const state = $derived(parseCollectionState(instanceState(instance.id)));
    const entries = $derived(collection?.entries ?? []);
    const shown = $derived(applyCollectionFilters(entries, state));

    /** The facet is offered where the file declares a status field and two values actually occur. */
    const statuses = $derived(hasStatusField(collection?.schema) ? statusValues(entries) : []);

    const statusItems = $derived<MenuItem[]>(
        statuses.map((found) => ({
            id: found.value,
            label: `${found.value} ${found.count}`,
            active: state.statuses.includes(found.value)
        }))
    );

    function write(next: Partial<CollectionState>): void {
        setInstanceState(instance.id, { ...state, ...next });
    }

    /** Add or remove one status, which is what a click in the facet menu means. */
    function toggleStatus(value: string): void {
        const held = state.statuses;
        write({
            statuses: held.includes(value)
                ? held.filter((other) => other !== value)
                : [...held, value]
        });
    }

    /** The pane's words: the file's own title, and the view's registered name before it arrives. */
    function title(): string {
        return collection?.title ?? lookup(`views.${instance.view}`);
    }
</script>

{#snippet cardFor(entry: Entry)}
    {@const status = entryStatus(entry)}
    <Card
        title={entry.title === '' ? entry.id : entry.title}
        tone={status === undefined ? undefined : statusTone(status)}
    >
        <div class="entry" data-entry={entry.id}>
            {#each drawnFields(entry, collection?.schema) as drawn (drawn.field)}
                {#if drawn.kind === 'sub'}
                    <p class="sub">{drawn.values[0]}</p>
                {:else if drawn.kind === 'status'}
                    <div class="row">
                        <Chip label={drawn.values[0]} tone={statusTone(drawn.values[0])} filled />
                    </div>
                {:else if drawn.kind === 'chips' || drawn.kind === 'meta'}
                    <div class="row">
                        {#each drawn.values as value, at (`${at}:${value}`)}
                            <Chip label={value} />
                        {/each}
                    </div>
                {:else if drawn.kind === 'body'}
                    <p class="body">{drawn.values[0]}</p>
                {:else if drawn.kind === 'link'}
                    <p class="body">
                        <a href={hrefOf(drawn.values[0])} target="_blank" rel="noreferrer">
                            {drawn.values[0]}
                        </a>
                    </p>
                {:else}
                    <div class="field">
                        <span class="label">{drawn.label}</span>
                        <span class="value">{drawn.values[0]}</span>
                    </div>
                {/if}
            {/each}
        </div>
    </Card>
{/snippet}

{#snippet tools()}
    <Toolbar label={t('collection.toolbar')}>
        <Search
            value={state.search}
            placeholder={t('collection.search')}
            oninput={(value) => write({ search: value })}
        />
        {#if statusItems.length > 0}
            <Menu
                label={t('collection.status')}
                items={statusItems}
                onpick={(value) => toggleStatus(value)}
                placement="down"
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools}>
    <div class="collection" data-instance={instance.id} data-collection={instance.view}>
        {#if collection?.intro}
            <p class="intro">{collection.intro}</p>
        {/if}
        {#if shown.length === 0}
            <Empty message={t('collection.empty')} />
        {:else}
            <div class="cards">
                {#each shown as entry (entry.index)}
                    {@render cardFor(entry)}
                {/each}
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

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 10px;
        align-items: start;
    }

    .sub {
        margin: 0 0 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .body {
        margin: 6px 0 0;
        font-size: var(--fs-sm);
        overflow-wrap: anywhere;
    }

    .field {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-top: 6px;
    }

    .label {
        flex: 0 0 auto;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .value {
        font-size: var(--fs-sm);
        overflow-wrap: anywhere;
    }

    a {
        color: var(--accent-txt, var(--accent));
    }
</style>
