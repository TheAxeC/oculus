<script module lang="ts">
    // Layer 3, view registration. Data is the second source registry in the rail.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'data',
        label: 'views.data',
        glyph: 'views.data_glyph',
        group: 'sources',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The dataset registry: its access summary, search, modality facets, cards and
    // schema-driven add and edit forms. Registry entities display while its collection handles writes.

    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Intro from './shared/Intro.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import Reveal from '$lib/views/shared/Reveal.svelte';
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
    import { inlineMarkdown } from '$lib/ui/html';
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
        <Intro
            lines={[
                t('data.intro', allDatasets.length, accessSummary(allDatasets)),
                ...(collection?.intro ? [inlineMarkdown(collection.intro)] : [])
            ]}
        />

        <div class="controls">
            <Search
                value={held.search}
                placeholder={t('data.search')}
                oninput={(search) => write({ search })}
            />
            {#if collection?.schema !== undefined}
                <ToolButton
                    label={t('collection.add')}
                    title={t('collection.add_tip')}
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
            <p class="empty">{t('data.empty')}</p>
        {:else}
            <div class="cards">
                {#each shown as dataset (dataset.id)}
                    <Reveal
                        id={dataset.id}
                        wanted={held.reveal}
                        onrevealed={() => write({ reveal: '' })}
                    >
                        <DatasetCard
                            {dataset}
                            projects={users(dataset.projectIds)}
                            entry={entryFor(dataset.id)}
                            schema={collection?.schema}
                            editing={editing === dataset.id}
                            onedit={() => (editing = editing === dataset.id ? null : dataset.id)}
                            onsaid={(words) => (said = words)}
                        />
                    </Reveal>
                {/each}
            </div>
        {/if}
    </div>
</Pane>

<style>
    .data {
        min-width: 0;
    }

    .said,
    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
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
