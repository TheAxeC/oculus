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

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import SourceToolbar from '$lib/views/shared/links/SourceToolbar.svelte';
    import EntryForm from '$lib/views/shared/forms/EntryForm.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import Facets from '$lib/views/sources/data/Facets.svelte';
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
    <SourceToolbar {source} />
{/snippet}

<Pane title={t('views.data')} toolbar={tools}>
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
                oninput={(search: string) => write({ search })}
            />
            {#if collection?.schema !== undefined}
                <ToolButton
                    label={t('collection.add')}
                    title={t('collection.add_tip')}
                    active={held.adding}
                    onclick={() => write({ adding: toggleAdd(instance.id, 'data', held.adding) })}
                />
            {/if}
        </div>

        {#if held.adding && collection?.schema !== undefined}
            <EntryForm
                collection="data"
                schema={collection.schema}
                entry={null}
                onclose={() => write({ adding: false })}
                onsaid={(words: string) => (said = words)}
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
