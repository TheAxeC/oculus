<script module lang="ts">
    // Layer 3, view registration. Map closes the structure group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'map',
        label: 'views.map',
        glyph: 'views.map_glyph',
        group: 'structure',
        order: 2
    };
</script>

<script lang="ts">
    // Layer 3, view. The relationship-map heading and visibility controls around the pure graph
    // built from the current portfolio snapshot.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Controls from '$lib/views/structure/map/Controls.svelte';
    import Graph from '$lib/views/structure/map/Graph.svelte';
    import {
        archiveStatuses,
        buildGraph,
        filterGraph,
        hasRelationships as relationshipsOf,
        layoutKey,
        lineFilters as lineChips,
        presentFilter,
        toggleFilter,
        tunedFor,
        typeFilters as typeChips
    } from '$lib/state/boards/structure/graph';
    import { t } from '$lib/state/shared/words/text';
    import { parseMapState, type MapState, type Physics } from '$lib/state/boards/structure/graph';
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
    let generation = $state(0);

    /** Keep the view's own toggles with the instance, so a tab reopened is the tab as it was. */
    function write(next: Partial<MapState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
    const snapshot = $derived(portfolio());
    const statuses = $derived(archiveStatuses(snapshot, configMap().arch_color));
    /**
     * The graph the filters narrow, which is what the chips are drawn from: a type or a line stays
     * on the row while nothing of it is drawn, so a reader can press it back.
     */
    const base = $derived.by(() => {
        if (snapshot === null) return { nodes: [], edges: [] };
        const mode = configMap().map_label_mode;
        return buildGraph(snapshot, {
            archived: enabled,
            collaborators,
            labelMode: typeof mode === 'string' ? mode : ''
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
    /** The parameters this pane tuned for the set of nodes it is drawing, where it has them. */
    const tuned = $derived(tunedFor(held, graph.nodes));

    const typeFilters = $derived(typeChips(base, graph, configMap().type_order, types));
    const lineFilters = $derived(lineChips(base, graph, snapshot, lines));
    const hasRelationships = $derived(relationshipsOf(snapshot));

    function toggleArchive(status: string, checked: boolean): void {
        write({
            enabled: checked ? [...enabled, status] : enabled.filter((item) => item !== status)
        });
    }

    /** Keep what the graph tuned, so the pane draws the same picture the next time it is opened. */
    function keepTuned(params: Physics): void {
        write({ tuned: { key: layoutKey(graph.nodes), params } });
    }

    function retune(): void {
        write({ tuned: undefined });
        generation += 1;
    }
</script>

<Pane title={t('views.map')}>
    <div class="map" data-instance={instance.id}>
        <div class="head">
            <span class="shape">
                <Glyph name={t('map.line_glyph')} />
                <Glyph name={t('map.project_glyph')} />
            </span>
            <span>{t('map.head')}</span>
        </div>
        <Controls
            {linkMode}
            {collaborators}
            {statuses}
            {enabled}
            {connected}
            types={typeFilters}
            lines={lineFilters}
            onlink={() => write({ linkMode: !linkMode })}
            onretune={retune}
            oncollaborators={(checked: boolean) => write({ collaborators: checked })}
            onarchive={toggleArchive}
            ontype={(type: string) => write({ types: toggleFilter(types, type) })}
            online={(id: string) => write({ lines: toggleFilter(lines, id) })}
            onalltypes={() => write({ types: [] })}
            onalllines={() => write({ lines: [] })}
            onconnected={() => write({ connected: !connected })}
        />
        {#if !hasRelationships}
            <p class="empty">{t('map.empty')}</p>
        {:else if base.nodes.length > 0 && graph.nodes.length === 0}
            <p class="empty">{t('map.empty_filtered')}</p>
        {:else}
            {#key `${layoutKey(graph.nodes)}-${generation}`}
                <Graph {graph} instanceId={instance.id} {linkMode} {tuned} ontuned={keepTuned} />
            {/key}
        {/if}
    </div>
</Pane>

<style>
    .map {
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

    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
