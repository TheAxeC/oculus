<script lang="ts">
    // Layer 3, view. The dataset registry: its access summary, search, modality facets, cards and
    // schema-driven add and edit forms. Registry entities display while its collection handles writes.

    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import Facets from '$lib/views/data/Facets.svelte';
    import DatasetCard from '$lib/views/data/DatasetCard.svelte';
    import {
        accessSummary,
        applyThemeFacets,
        datasetSearch,
        parseDataState,
        themeFacets,
        type DataState
    } from '$lib/state/datasets';
    import { inlineMarkdown } from '$lib/state/collection';
    import { collectionOf, datasets, projects } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const collection = $derived(collectionOf('data'));
    const allDatasets = $derived(datasets());
    const allProjects = $derived(projects());
    const held = $derived(parseDataState(instanceState(instance.id)));
    const facets = $derived(themeFacets(allDatasets, collection?.themeLabels));
    const shown = $derived(applyThemeFacets(datasetSearch(allDatasets, held.search), held.off));

    let adding = $state(false);
    let editing: string | null = $state(null);
    let said = $state('');

    function write(next: Partial<DataState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    function toggleTheme(theme: string): void {
        write({
            off: held.off.includes(theme)
                ? held.off.filter((item) => item !== theme)
                : [...held.off, theme]
        });
    }

    function entryFor(id: string) {
        return collection?.entries.find((entry) => entry.id === id) ?? null;
    }

    function users(ids: string[]) {
        return ids
            .map((id) => allProjects.find((project) => project.id === id))
            .filter((project) => project !== undefined);
    }
</script>

<Pane title={t('views.data')}>
    <div class="data" data-instance={instance.id}>
        <div class="intro">
            <p>{@html t('col.ds_intro', allDatasets.length, accessSummary(allDatasets))}</p>
            {#if collection?.intro}
                <p>{@html inlineMarkdown(collection.intro)}</p>
            {/if}
        </div>

        <div class="controls">
            <Search
                value={held.search}
                placeholder={t('col.ds_search')}
                oninput={(search) => write({ search })}
            />
            {#if collection?.schema !== undefined}
                <ToolButton
                    label={t('col.add')}
                    title={t('col.add_tip')}
                    active={adding}
                    onclick={() => (adding = !adding)}
                />
            {/if}
        </div>

        {#if adding && collection?.schema !== undefined}
            <EntryForm
                collection="data"
                schema={collection.schema}
                entry={null}
                onclose={() => (adding = false)}
                onsaid={(words) => (said = words)}
            />
        {/if}

        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}

        <Facets {facets} off={held.off} ontoggle={toggleTheme} />

        {#if allDatasets.length === 0}
            <p class="empty">{t('col.ds_empty')}</p>
        {:else}
            <div class="cards">
                {#each shown as dataset (dataset.id)}
                    <DatasetCard
                        {dataset}
                        projects={users(dataset.projectIds)}
                        entry={entryFor(dataset.id)}
                        schema={collection?.schema}
                        editing={editing === dataset.id}
                        onedit={() => (editing = editing === dataset.id ? null : dataset.id)}
                        onsaid={(words) => (said = words)}
                    />
                {/each}
            </div>
        {/if}
    </div>
</Pane>

<style>
    .data {
        min-width: 0;
    }

    .intro,
    .said,
    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .intro p {
        margin: 0 0 6px;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
    }

    .controls :global(.search) {
        flex: 1;
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 8px;
    }
</style>
