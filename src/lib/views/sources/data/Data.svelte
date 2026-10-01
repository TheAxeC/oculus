<script module lang="ts">
    // Layer 3, view registration. Data follows Venues in the References page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'data',
        label: 'views.data',
        glyph: 'views.data_glyph',
        group: 'references',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The dataset registry: its access summary, search, modality facets, cards and
    // schema-driven add and edit forms. Registry entities display while its collection handles
    // writes.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import AddButton from '$lib/views/shared/forms/AddButton.svelte';
    import SourceToolbar from '$lib/views/shared/links/SourceToolbar.svelte';
    import RegistryHead from '$lib/views/shared/forms/RegistryHead.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import ThemeFacets from '$lib/views/shared/forms/ThemeFacets.svelte';
    import DatasetCard from '$lib/views/sources/data/DatasetCard.svelte';
    import {
        accessSummary,
        datasetSearch,
        datasetUsers,
        parseDataState,
        type DataState
    } from '$lib/state/sources/datasets';
    import { applyThemeFacets, themeFacets, themeWordLabels } from '$lib/state/shared/words/themes';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { entryById } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { collectionOf, configMap, datasets, projects },
        formDrafts: { toggleAdd, toggleEdit },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const collection = $derived(collectionOf('data'));
    /**
     * The registry file this view is drawn from, which the control at the end of the toolbar opens.
     */
    const source = $derived(viewSourceFile('datasets', configMap()));
    const allDatasets = $derived(datasets());
    const allProjects = $derived(projects());
    const held = $derived(parseDataState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const labels = $derived(themeWordLabels(configMap().data_themes));
    const facets = $derived(themeFacets(allDatasets, labels));
    const shown = $derived(applyThemeFacets(datasetSearch(allDatasets, held.search), held.off));

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
        return entryById(collection, id);
    }

    function users(ids: string[]) {
        return datasetUsers(ids, allProjects);
    }
</script>

{#snippet tools()}
    <SourceToolbar {source}>
        {#if collection?.schema !== undefined}
            <AddButton
                open={held.adding}
                onclick={() => write({ adding: toggleAdd(instance.id, 'data', held.adding) })}
            />
        {/if}
    </SourceToolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('data.filters')}>
        <Search
            fill
            value={held.search}
            placeholder={t('data.search')}
            oninput={(search: string) => write({ search })}
        />
        <ThemeFacets
            {facets}
            caption={t('data.modality_facet')}
            off={held.off}
            ontoggle={toggleTheme}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.data')} toolbar={tools} {bar}>
    <div class="data" data-instance={instance.id}>
        <RegistryHead
            collection="data"
            schema={collection?.schema}
            adding={held.adding}
            bind:said
            onclose={() => write({ adding: false })}
        >
            {#snippet intro()}
                <Intro
                    lines={[
                        t('data.intro', allDatasets.length, accessSummary(allDatasets)),
                        ...(collection?.intro ? [inlineMarkdown(collection.intro)] : [])
                    ]}
                />
            {/snippet}
        </RegistryHead>

        {#if allDatasets.length === 0}
            <Empty message={t('data.empty')} />
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
                            cursor={cursor === dataset.id}
                            projects={users(dataset.projectIds)}
                            entry={entryFor(dataset.id)}
                            schema={collection?.schema}
                            editing={held.editing === dataset.id}
                            onedit={() =>
                                write({
                                    editing: toggleEdit(
                                        instance.id,
                                        'data',
                                        held.editing,
                                        dataset.id
                                    )
                                })}
                            onsaid={(words: string) => (said = words)}
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

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
    }
</style>
