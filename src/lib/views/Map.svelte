<script lang="ts">
    // Layer 3, view. The relationship-map heading and visibility controls around the pure graph
    // built from the current portfolio snapshot.

    import Pane from '$lib/ui/Pane.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Controls from '$lib/views/map/Controls.svelte';
    import Graph from '$lib/views/map/Graph.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { buildGraph, layoutKey } from '$lib/state/graph';
    import { configMap } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();
    let collaborators = $state(false);
    let enabled = $state<string[]>([]);
    let linkMode = $state(false);
    let generation = $state(0);
    const snapshot = $derived(portfolio());
    const statuses = $derived.by(() => {
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
    const graph = $derived.by(() => {
        if (snapshot === null) return { nodes: [], edges: [] };
        const held = configMap().map_label_mode;
        return buildGraph(snapshot, {
            archived: enabled,
            collaborators,
            labelMode: typeof held === 'string' ? held : ''
        });
    });
    const hasRelationships = $derived(
        Object.values(snapshot?.entities.projects ?? {}).some(
            (project) => project.programIds.length > 0 || project.relatedIds.length > 0
        )
    );

    function toggleArchive(status: string, checked: boolean): void {
        enabled = checked ? [...enabled, status] : enabled.filter((item) => item !== status);
    }

    function retune(): void {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(layoutKey(graph.nodes));
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
            onlink={() => (linkMode = !linkMode)}
            onretune={retune}
            oncollaborators={(checked) => (collaborators = checked)}
            onarchive={toggleArchive}
        />
        {#if !hasRelationships}
            <p class="empty">{t('map.empty')}</p>
        {:else}
            {#key `${layoutKey(graph.nodes)}-${generation}`}
                <Graph {graph} instanceId={instance.id} {linkMode} />
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
