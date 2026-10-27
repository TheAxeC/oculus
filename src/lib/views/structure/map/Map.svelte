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
    // Layer 3, view. The relationship map's legend and bar around the pure graph built from the
    // current portfolio snapshot. The pane keeps the start seed Graphviz's neato lays its node set
    // out from, as `start: { key, seed }` in its own instance state, so a page saved with a map
    // draws the same picture again; the re-tune control saves the next seed.
    //
    // The header holds the two icon actions, link mode and re-tune. The bar is a project board's
    // two lines (views/shared/forms/bar/FilterBar.svelte and SliceLine.svelte): line 1 the search;
    // the Show button (views/shared/forms/bar/PickMenu.svelte), which lists Projects, Pillars and
    // Team, each ticked while its kind of node is drawn, and Connected only; Mine only while a
    // person is marked as the user, off at first; then the group buttons Stage, Form, Situation,
    // Role, Year, Domain, Venue, Pillar, Tier and Hub (Hub while the workspace has more than one
    // hub), folding into More, which holds a board's other facets. Line 2 is the slices, how many
    // projects the filters keep and Clear all. The Stage group draws the stages that do not carry
    // `terminal` while none is picked, and the stages picked otherwise; a Pillar pick keeps its
    // projects and only its pillars' nodes. The groups, their counts and what they keep are
    // state/boards/structure/map-bar.ts's, the graph state/boards/structure/graph.ts's.
    //
    // The body holds the legend (Legend.svelte), the stages of the projects drawn, and the graph,
    // drawn by views/shared/graph/Graph.svelte, which the Notes Graph draws too; what a node opens
    // (node-view.ts) and the related edge a link writes (edge-write.ts) are the Map's.
    //
    // Over a wallpaper the graph's canvas is its own surface, and the legend is read off a
    // `Surface` above it.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FilterBar from '$lib/views/shared/forms/bar/FilterBar.svelte';
    import PickMenu from '$lib/views/shared/forms/bar/PickMenu.svelte';
    import SliceLine from '$lib/views/shared/forms/bar/SliceLine.svelte';
    import Graph from '$lib/views/shared/graph/Graph.svelte';
    import Legend from '$lib/views/structure/map/Legend.svelte';
    import { writeRelated } from './edge-write';
    import { viewOf } from './node-view';
    import {
        buildGraph,
        drawnStages,
        hasRelationships as relationshipsOf,
        labelModeOf,
        nextStart,
        parseMapState,
        startFor,
        type GraphShow,
        type MapState,
        type PointNode
    } from '$lib/state/boards/structure/graph';
    import {
        MAP_LINE,
        PILLAR_FACET,
        SHOW_CONNECTED,
        mapBar,
        showGroup
    } from '$lib/state/boards/structure/map-bar';
    import { mapPreset, offersMine, shownWords, withPick } from '$lib/state/boards/board';
    import { hubList } from '$lib/state/shared/page/hubs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { storedState } from '$lib/state/workbench/layout/instance';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const {
        entities: { portfolio },
        fs: { primary, roots },
        layout: { openView },
        selectors: { board, configMap, selfNamed },
        ui: { instanceState, setInstanceState },
        writes: { writeManifest }
    } = useState();

    let { instance }: ViewProps = $props();
    const held = $derived(parseMapState(instanceState(instance.id)));
    const linkMode = $derived(held.linkMode);

    /** Keep the view's own controls with the instance, so a tab reopened is the tab as it was. */
    function write(next: Partial<MapState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }, []));
    }
    const snapshot = $derived(portfolio());
    /** The Map's projects as a board's items, every project of every hub. */
    const preset = $derived(mapPreset(configMap(), vocabOf));
    const items = $derived(board(preset));
    /** Whether a person is marked as the user, which Mine only and the Role group need. */
    const named = $derived(selfNamed());
    /** The hubs the Hub group lists, none while the workspace has one hub. */
    const hubs = $derived(hubList(roots(), primary()));
    /** The bar's groups and slices with their counts, and the projects it keeps. */
    const made = $derived(
        mapBar({
            items,
            preset,
            filters: held.filters,
            search: held.search,
            mine: held.mine,
            named,
            hubs,
            config: configMap(),
            wordsOf: vocabOf
        })
    );
    /** What the graph and the Show group's counts are built over. */
    const context = $derived({
        projects: new Set(made.kept.map((item) => item.project.id)),
        pillars: held.filters[PILLAR_FACET] ?? [],
        wordsOf: vocabOf
    });
    const graph = $derived.by(() => {
        if (snapshot === null) return { nodes: [], edges: [] };
        return buildGraph(snapshot, configMap(), {
            ...context,
            show: held.show,
            connected: held.connected,
            labelMode: labelModeOf(configMap())
        });
    });
    const show = $derived(
        snapshot === null
            ? null
            : showGroup(snapshot, configMap(), context, held.show, held.connected)
    );
    /** The seed this pane lays the set of nodes it is drawing out from. */
    const seed = $derived(startFor(held, graph.nodes));
    const hasRelationships = $derived(relationshipsOf(snapshot));

    /** Add or remove one value of one facet, which is what a pick in a group's list means. */
    function toggleFilter(facet: string, value: string): void {
        write({ filters: withPick(held.filters, facet, value) });
    }

    /** Tick or untick one item of the Show group: a kind of node, or Connected only. */
    function toggleShow(_group: string, id: string): void {
        if (id === SHOW_CONNECTED) {
            write({ connected: !held.connected });
            return;
        }
        if (id === 'projects' || id === 'pillars' || id === 'team') {
            const next: GraphShow = { ...held.show, [id]: !held.show[id] };
            write({ show: next });
        }
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

{#snippet toggles()}
    {#if show !== null}
        <PickMenu label={t('map.show')} groups={[show]} onpick={toggleShow} />
    {/if}
{/snippet}

{#snippet bar()}
    <FilterBar
        label={t('map.filters')}
        search={held.search}
        placeholder={t('board.search_default')}
        onsearch={(value: string) => write({ search: value })}
        {toggles}
        {named}
        mine={offersMine(items, named)}
        pressed={held.mine}
        onmine={() => write({ mine: !held.mine })}
        groups={made.groups}
        line={MAP_LINE}
        ontoggle={toggleFilter}
    />
    <SliceLine
        label={t('map.slices')}
        groups={made.slices}
        facet="slice"
        counted={made.counted}
        filters={held.filters}
        shown={made.kept.length}
        total={made.total}
        words={shownWords}
        onfilters={(next: Record<string, string[]>) => write({ filters: next })}
    />
{/snippet}

<Pane title={t('views.map')} toolbar={tools} {bar}>
    <div class="map" data-instance={instance.id}>
        <Surface>
            <Legend stages={drawnStages(graph, configMap())} />
        </Surface>
        {#if !hasRelationships}
            <Empty message={t('map.empty')} glyph={t('map.empty_glyph')} />
        {:else if items.length > 0 && graph.nodes.length === 0}
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
