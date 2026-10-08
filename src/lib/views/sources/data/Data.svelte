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
    } from '$lib/state/sources/datasets';
    import {
        applyThemeFacets,
        themeFacets,
        themeWordLabels,
        toggledThemes
    } from '$lib/state/shared/words/themes';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        selectors: { configMap, datasets, projects },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const file = registryFile(client, 'datasets', 'data');
    const allDatasets = $derived(datasets());
    const allProjects = $derived(projects());
    const held = $derived(parseDataState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const labels = $derived(themeWordLabels(configMap().data_themes));
    const facets = $derived(themeFacets(allDatasets, labels));
    const shown = $derived(applyThemeFacets(datasetSearch(allDatasets, held.search), held.off));

    function write(next: Partial<DataState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    function toggleTheme(theme: string): void {
        write({ off: toggledThemes(held.off, theme) });
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
            ontoggle={toggleTheme}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.data')} toolbar={tools} {bar}>
    <div class="data" data-instance={instance.id}>
        <RegistryHead said={file.said}>
            {#snippet intro()}
                <Intro
                    lines={[
                        t('data.intro', allDatasets.length, accessSummary(allDatasets)),
                        ...(file.collection?.intro ? [inlineMarkdown(file.collection.intro)] : [])
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
                            schema={file.collection?.schema}
                            file={file.source}
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
