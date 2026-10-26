<script module lang="ts">
    // Layer 3, view registration. Data follows Venues in the Registries page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'data',
        label: 'views.data',
        glyph: 'views.data_glyph',
        group: 'registries',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The dataset registry: its access summary, search, modality facets, cards, and
    // Add and Edit in File, which open the registry file. Registry entities display while its
    // collection handles writes.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import RegistryTools from '$lib/views/shared/forms/registry/RegistryTools.svelte';
    import { registryFile } from '$lib/views/shared/forms/registry/registry-file.svelte';
    import RegistryHead from '$lib/views/shared/forms/registry/RegistryHead.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import ThemeFacets from '$lib/views/shared/forms/ThemeFacets.svelte';
    import DatasetCard from '$lib/views/sources/data/DatasetCard.svelte';
    import {
        accessSummary,
        datasetSearch,
        datasetUsers,
        parseDataState,
        type DataState
    } from '$lib/state/sources/registries/datasets';
    import { applyThemeFacets, themeFacets, themeLabeller } from '$lib/state/shared/words/themes';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        selectors: { hubVocabs, datasets, projects },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const file = registryFile(client, 'datasets');
    const allDatasets = $derived(datasets());
    const allProjects = $derived(projects());
    const held = $derived(parseDataState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const labelOf = $derived(themeLabeller(hubVocabs(), 'data_themes'));
    const facets = $derived(themeFacets(allDatasets, labelOf));
    const shown = $derived(applyThemeFacets(datasetSearch(allDatasets, held.search), held.off));

    function write(next: Partial<DataState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }

    function users(ids: string[]) {
        return datasetUsers(ids, allProjects);
    }
</script>

{#snippet tools()}
    <RegistryTools {file} />
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
            onchange={(off: string[]) => write({ off })}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.data')} toolbar={tools} {bar}>
    <div class="data" data-instance={instance.id}>
        <RegistryHead {file}>
            {#snippet intro()}
                <Intro
                    lines={[
                        allDatasets.length === 1
                            ? t('data.intro_one', accessSummary(allDatasets))
                            : t('data.intro', allDatasets.length, accessSummary(allDatasets))
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
                            entry={file.entryOf(dataset.id)}
                            schema={file.schemaOf(dataset.id)}
                            file={file.sourceOf(dataset.id)}
                            fault={file.faultOf(dataset.id)}
                            onsaid={file.say}
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
