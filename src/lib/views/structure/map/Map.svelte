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
    // Layer 3, view. The relationship map's legend and visibility controls around the pure graph
    // built from the current portfolio snapshot. The pane keeps the start seed Graphviz's neato
    // lays its node set out from, as `start: { key, seed }` in its own instance state, so a page
    // saved with a map draws the same picture again; the re-tune control saves the next seed.
    //
    // The header holds the two icon actions, link mode and re-tune. The bar holds the filters and
    // the visibility toggles (Controls.svelte), and the body the legend (Legend.svelte) and the
    // graph, drawn by views/shared/graph/Graph.svelte, which the Notes Graph draws too; what a node
    // opens (node-view.ts) and the related edge a link writes (edge-write.ts) are the Map's.
    //
    // Over a wallpaper the graph's canvas is its own surface, and the legend is read off a
    // `Surface` above it.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Controls from '$lib/views/structure/map/Controls.svelte';
    import Graph from '$lib/views/shared/graph/Graph.svelte';
    import Legend from '$lib/views/structure/map/Legend.svelte';
    import { writeRelated } from './edge-write';
    import { viewOf } from './node-view';
    import {
        archiveStatuses,
        buildGraph,
        filterGraph,
        hasRelationships as relationshipsOf,
        lineFilters as lineChips,
        presentFilter,
        nextStart,
        startFor,
        toggleFilter,
        stageFilters as stageChips
    } from '$lib/state/boards/structure/graph';
    import { t } from '$lib/state/shared/words/text';
    import {
        labelModeOf,
        parseMapState,
        type MapState,
        type PointNode
    } from '$lib/state/boards/structure/graph';
    import { useState } from '$lib/state/client/use';
    import { storedState } from '$lib/state/workbench/layout/instance';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const {
        entities: { portfolio },
        layout: { openView },
        selectors: { configMap },
        ui: { instanceState, setInstanceState },
        writes: { writeManifest }
    } = useState();

    let { instance }: ViewProps = $props();
    const held = $derived(parseMapState(instanceState(instance.id)));
    const collaborators = $derived(held.collaborators);
    const enabled = $derived(held.enabled);
    const linkMode = $derived(held.linkMode);
    const connected = $derived(held.connected);

    /** Keep the view's own toggles with the instance, so a tab reopened is the tab as it was. */
    function write(next: Partial<MapState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }, ['lines']));
    }
    const snapshot = $derived(portfolio());
    const statuses = $derived(archiveStatuses(snapshot, configMap(), vocabOf));
    /**
     * The graph the filters narrow, which is what the chips are drawn from: a type or a line stays
     * on the row while nothing of it is drawn, so a reader can press it back.
     */
    const base = $derived.by(() => {
        if (snapshot === null) return { nodes: [], edges: [] };
        return buildGraph(snapshot, configMap(), {
            archived: enabled,
            collaborators,
            labelMode: labelModeOf(configMap()),
            wordsOf: vocabOf
        });
    });
    /**
     * The filter the graph is drawn under: what the saved state names, narrowed to the stages and
     * the lines the base graph still holds, so a stale name neither hides a node nor a chip.
     */
    const kept = $derived(presentFilter(base, held));
    const stages = $derived(kept.stages);
    const lines = $derived(kept.lines);
    const graph = $derived(filterGraph(base, kept));
    /** The seed this pane lays the set of nodes it is drawing out from. */
    const seed = $derived(startFor(held, graph.nodes));

    const stageFilters = $derived(stageChips(base, graph, configMap(), stages));
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

    /** Open the view a node stands for: a project, the pillars or a person. */
    function open(node: PointNode): void {
        const target = viewOf(node);
        openView(target.view, target.state);
    }

    /**
     * A link drawn in link mode: the target is added to the source project's related list, or
     * taken off it when it is there; the sentence of a refused write, else ''.
     */
    async function toggleRelated(source: PointNode, target: PointNode): Promise<string> {
        const project = portfolio()?.entities.projects[source.entityId];
        if (project === undefined) return '';
        const related = project.relatedIds.includes(target.entityId)
            ? project.relatedIds.filter((id) => id !== target.entityId)
            : [...project.relatedIds, target.entityId];
        return writeRelated(source.entityId, related, writeManifest);
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
        stages={stageFilters}
        lines={lineFilters}
        oncollaborators={(checked: boolean) => write({ collaborators: checked })}
        onarchive={toggleArchive}
        onstage={(stage: string) => write({ stages: toggleFilter(stages, stage) })}
        online={(id: string) => write({ lines: toggleFilter(lines, id) })}
        onallstages={() => write({ stages: [] })}
        onalllines={() => write({ lines: [] })}
        onconnected={() => write({ connected: !connected })}
    />
{/snippet}

<Pane title={t('views.map')} toolbar={tools} {bar}>
    <div class="map" data-instance={instance.id}>
        <Surface>
            <Legend
                stages={stageFilters
                    .filter((item) => item.shown && item.count > 0)
                    .map((item) => item.stage)}
            />
        </Surface>
        {#if !hasRelationships}
            <Empty message={t('map.empty')} glyph={t('map.empty_glyph')} />
        {:else if base.nodes.length > 0 && graph.nodes.length === 0}
            <Empty message={t('map.empty_filtered')} glyph={t('map.empty_glyph')} />
        {:else}
            <Graph
                {graph}
                instanceId={instance.id}
                {linkMode}
                {seed}
                label={t('views.map')}
                onopen={open}
                onlink={toggleRelated}
            />
        {/if}
    </div>
</Pane>

<style>
    /* The legend takes its own height and the graph takes the rest, so the graph fills the body
       whatever the bar above it needs. */
    .map {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
        height: 100%;
    }
</style>
