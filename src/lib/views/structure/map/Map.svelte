<script module lang="ts">
    // Layer 3, view registration. Map closes the Pillars page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'map',
        label: 'views.map',
        glyph: 'views.map_glyph',
        group: 'pillars',
        order: 2
    };
</script>

<script lang="ts">
    // Layer 3, view. The relationship-map heading and visibility controls around the pure graph
    // built from the current portfolio snapshot. The pane keeps the start seed Graphviz's neato
    // lays its node set out from, as `start: { key, seed }` in its own instance state, so a page
    // saved with a map draws the same picture again; the re-tune control saves the next seed.
    //
    // The header holds the two icon actions, link mode and re-tune. The bar holds the filters and
    // the visibility toggles (Controls.svelte), and the body the heading, the legend
    // (Legend.svelte) and the graph.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Controls from '$lib/views/structure/map/Controls.svelte';
    import Graph from '$lib/views/structure/map/Graph.svelte';
    import Legend from '$lib/views/structure/map/Legend.svelte';
    import {
        archiveStatuses,
        buildGraph,
        filterGraph,
        hasRelationships as relationshipsOf,
        layoutKey,
        lineFilters as lineChips,
        presentFilter,
        nextStart,
        startFor,
        toggleFilter,
        typeFilters as typeChips
    } from '$lib/state/boards/structure/graph';
    import { t } from '$lib/state/shared/words/text';
    import { labelModeOf, parseMapState, type MapState } from '$lib/state/boards/structure/graph';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        selectors: { configMap },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();
    const held = $derived(parseMapState(instanceState(instance.id)));
    const collaborators = $derived(held.collaborators);
    const enabled = $derived(held.enabled);
    const linkMode = $derived(held.linkMode);
    const connected = $derived(held.connected);

    /** Keep the view's own toggles with the instance, so a tab reopened is the tab as it was. */
    function write(next: Partial<MapState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
    const snapshot = $derived(portfolio());
    const statuses = $derived(archiveStatuses(snapshot));
    /**
     * The graph the filters narrow, which is what the chips are drawn from: a type or a line stays
     * on the row while nothing of it is drawn, so a reader can press it back.
     */
    const base = $derived.by(() => {
        if (snapshot === null) return { nodes: [], edges: [] };
        return buildGraph(snapshot, {
            archived: enabled,
            collaborators,
            labelMode: labelModeOf(configMap())
        });
    });
    /**
     * The filter the graph is drawn under: what the saved state names, narrowed to the types and
     * the lines the base graph still holds, so a stale name neither hides a node nor a chip.
     */
    const kept = $derived(presentFilter(base, held));
    const types = $derived(kept.types);
    const lines = $derived(kept.lines);
    const graph = $derived(filterGraph(base, kept));
    /** The seed this pane lays the set of nodes it is drawing out from. */
    const seed = $derived(startFor(held, graph.nodes));

    const typeFilters = $derived(typeChips(base, graph, configMap().type_order, types));
    const lineFilters = $derived(lineChips(base, graph, snapshot, lines));
    const hasRelationships = $derived(relationshipsOf(snapshot));

    function toggleArchive(status: string, checked: boolean): void {
        write({
            enabled: checked ? [...enabled, status] : enabled.filter((item) => item !== status)
        });
    }

    /** Lay the map out again from the next seed, and keep that picture with the pane. */
    function retune(): void {
        write({ start: nextStart(held, graph.nodes) });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('map.toolbar')} overflow>
        <ToolButton
            bare
            glyph={t('map.link_glyph')}
            label={t('map.link')}
            title={t('map.link_tip')}
            active={linkMode}
            pressed={linkMode}
            onclick={() => write({ linkMode: !linkMode })}
        />
        <ToolButton
            bare
            glyph={t('map.retune_glyph')}
            label={t('map.retune')}
            title={t('map.retune_tip')}
            onclick={retune}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Controls
        {collaborators}
        {statuses}
        {enabled}
        {connected}
        types={typeFilters}
        lines={lineFilters}
        oncollaborators={(checked: boolean) => write({ collaborators: checked })}
        onarchive={toggleArchive}
        ontype={(type: string) => write({ types: toggleFilter(types, type) })}
        online={(id: string) => write({ lines: toggleFilter(lines, id) })}
        onalltypes={() => write({ types: [] })}
        onalllines={() => write({ lines: [] })}
        onconnected={() => write({ connected: !connected })}
    />
{/snippet}

<Pane title={t('views.map')} toolbar={tools} {bar}>
    <div class="map" data-instance={instance.id}>
        <div class="head">
            <span class="shape">
                <Glyph name={t('map.line_glyph')} />
                <Glyph name={t('map.project_glyph')} />
            </span>
            <span>{t('map.head')}</span>
        </div>
        <Legend />
        {#if !hasRelationships}
            <Empty message={t('map.empty')} glyph={t('map.empty_glyph')} />
        {:else if base.nodes.length > 0 && graph.nodes.length === 0}
            <Empty message={t('map.empty_filtered')} glyph={t('map.empty_glyph')} />
        {:else}
            {#key `${layoutKey(graph.nodes)}-${seed}`}
                <Graph {graph} instanceId={instance.id} {linkMode} {seed} />
            {/key}
        {/if}
    </div>
</Pane>

<style>
    /* The head and the legend take their own height and the graph takes the rest, so the graph
       fills the body whatever the bar above it needs. */
    .map {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 100%;
        min-width: 0;
    }

    .head {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .shape {
        color: var(--accent-txt, var(--accent));
        white-space: nowrap;
    }
</style>
