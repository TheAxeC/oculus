<script module lang="ts">
    // Layer 3, view registration. Map closes the structure group.
    import type { ViewRegistration } from './registry';
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

    import Pane from '$lib/ui/Pane.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Controls from '$lib/views/map/Controls.svelte';
    import Graph from '$lib/views/map/Graph.svelte';
    import {
        buildGraph,
        filterGraph,
        layoutKey,
        lineCounts,
        presentFilter,
        toggleFilter,
        tunedFor,
        typeCounts
    } from '$lib/state/graph';
    import { t } from '$lib/state/text';
    import { parseMapState, type MapState, type Physics } from '$lib/state/graph';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

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
    const statuses = $derived.by(() => {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity -- the set is built and dropped inside one derivation, and nothing renders from it
        const found = new Set<string>();
        for (const project of Object.values(snapshot?.entities.projects ?? {})) {
            if ((project.tier === 'archive' || project.tier === 'coauthor') && project.type) {
                found.add(project.type);
            }
        }
        const colors = configMap().arch_color;
        const map =
            typeof colors === 'object' && colors !== null && !Array.isArray(colors)
                ? (colors as Record<string, unknown>)
                : {};
        return [...found].map((status) => {
            const color = map[status];
            return { status, ...(typeof color === 'string' ? { color } : {}) };
        });
    });
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

    const typeFilters = $derived.by(() => {
        const order = configMap().type_order;
        const ordered = (Array.isArray(order) ? order : []).filter(
            (one): one is string => typeof one === 'string'
        );
        const present = typeCounts(base);
        const counted = typeCounts(graph);
        const names = Object.keys(present);
        const rest = names.filter((type) => !ordered.includes(type)).sort();
        return [...ordered.filter((type) => names.includes(type)), ...rest].map((type) => ({
            type,
            count: counted[type] ?? 0,
            shown: types.length === 0 || types.includes(type)
        }));
    });

    const lineFilters = $derived.by(() => {
        const counted = lineCounts(graph);
        const present = base.nodes.filter((node) => node.kind === 'line');
        const order = Object.keys(snapshot?.entities.pillars ?? {});
        const ids = present.map((node) => node.entityId);
        const listed = [
            ...order.filter((id) => ids.includes(id)),
            ...ids.filter((id) => !order.includes(id))
        ];
        return listed.map((id) => ({
            id,
            title: present.find((node) => node.entityId === id)?.label ?? id,
            count: counted[id] ?? 0,
            shown: lines.length === 0 || lines.includes(id)
        }));
    });

    const hasRelationships = $derived(
        Object.values(snapshot?.entities.projects ?? {}).some(
            (project) => project.pillarIds.length > 0 || project.relatedIds.length > 0
        )
    );

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
