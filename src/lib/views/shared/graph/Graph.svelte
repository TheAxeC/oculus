<script lang="ts">
    // Layer 3, shared graph partial. The hand-drawn SVG graph the Map and the Notes Graph draw, and
    // its drag, pan, zoom, open and link interactions; what a press opens and what a link drawn in
    // link mode writes are the caller's (`onopen`, `onlink`). The nodes are placed by Graphviz's
    // neato through @viz-js/viz in the page (state/boards/structure/layout.ts, whose loader the
    // client state holds as `graphviz`), from
    // the start seed the pane hands down, and each edge is drawn between the ends edgeEnds() of
    // that module answers. The SVG draws the nodes once the placement has come back, draws nothing
    // before that, and says in one line why when the engine refuses the graph or does not load.
    // A pointer is mapped through the letterbox the SVG draws its box in, then the pan and zoom
    // (pointer.ts beside this file). The view goes on with the one simulation mapPlacement()
    // settled from neato's placement (state/boards/structure/forces.ts, on d3-force): an effect
    // draws each tick, kept in the box, and stops it when the pane goes or placementKey() changes.
    // A press fixes the node and moves nothing (press()); past the click threshold and a screen
    // pixel, dragTo() puts it under the pointer at its grab offset and heats the simulation, so
    // every node is pushed and pulled; every release, a click and a cancel included, frees it
    // (release()) and lets the simulation cool with the freed node in it again.
    //
    // The nodes are one layer of their own, Nodes.svelte, which draws them and reports a press, the
    // node under the pointer and the node holding the keyboard back here. The labels are one layer
    // over every node. By the rule of labels.ts beside this file a label is hidden when it would
    // overlap a label already drawn or any node but its own, the pillars' labels placed first,
    // until its node is hovered or holds the keyboard; those labels are drawn whatever they
    // overlap, and last, so they sit on top.

    import { tick, untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import { onShown } from '$lib/ui/shown';
    import {
        LABEL_DROP,
        LABEL_GAP,
        UNMEASURED,
        labelBox,
        labelSize,
        shownLabels,
        type LabelSize
    } from './labels';
    import Nodes from './Nodes.svelte';
    import { dragTarget, movedEnough, nearestProject, toBox, toGraph } from './pointer';
    import { DEFAULT_BOUNDS, type Graph, type PointNode } from '$lib/state/boards/structure/graph';
    import {
        clampToBox,
        dragTo as holdAt,
        forceNodes,
        press,
        release
    } from '$lib/state/boards/structure/forces';
    import {
        edgeEnds,
        mapPlacement,
        placementKey,
        drawnAt,
        type GraphvizAnswer,
        type MapPlacement
    } from '$lib/state/boards/structure/layout';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        graphviz,
        ui: { textScale }
    } = useState();

    type Props = {
        graph: Graph;
        instanceId: string;
        /** The start seed the graph is laid out from, which the pane keeps for its node set. */
        seed: number;
        /** The words the graph is named by for a reader. */
        label: string;
        /** Open what a node stands for, on a click or on Enter or Space. */
        onopen: (node: PointNode) => void;
        /** Whether a drag from a project draws a link to the project it ends on. */
        linkMode?: boolean;
        /** Write the link drawn in link mode; the sentence saying why it was refused, or ''. */
        onlink?: (source: PointNode, target: PointNode) => Promise<string>;
        /** The sentence a placement the engine refused says, with the engine's reason. */
        failed?: (reason: string) => string;
    };
    let {
        graph,
        instanceId,
        seed,
        label,
        onopen,
        linkMode = false,
        onlink,
        failed = (reason: string) => t('map.layout_failed', reason)
    }: Props = $props();

    /** The page's Graphviz once loaded, or the reason it did not load. */
    let viz = $state<GraphvizAnswer>(graphviz.loaded());
    /** What the placement is made from, by placementKey() of layout.ts. */
    const shape = $derived(placementKey(graph, seed));
    /**
     * Where neato put the nodes, settled under the Map's forces, with the settled simulation, or
     * why the engine refused; no node until Graphviz loads.
     */
    const chosen = $derived(placedFor(shape, viz));

    /** The placement, read untracked, so only an unequal key or a load places again. */
    function placedFor(_key: string, answer: GraphvizAnswer): MapPlacement {
        return untrack(() => mapPlacement(answer, graph, seed));
    }
    /** The positions at the simulation's last tick, which take over from the settled placement. */
    let placed = $state<PointNode[] | null>(null);
    const positions = $derived(drawnAt(graph.nodes, placed ?? chosen.nodes));
    const failure = $derived(chosen.failure);
    let svg: SVGSVGElement;
    let drag: PointNode | null = null;
    /** The dragged node's centre less the pointer at the press, in graph units. */
    let grab = { x: 0, y: 0 };
    /** The screen point of the last event that placed the dragged node, the press first. */
    let lastScreen = { x: 0, y: 0 };
    let linkSource: PointNode | null = $state(null);
    let linkTarget: PointNode | null = $state(null);
    let status = $state('');
    let moved = false;
    let start = { x: 0, y: 0 };
    let pointer = $state({ x: 0, y: 0 });
    let panStart: { x: number; y: number; tx: number; ty: number } | null = null;
    let tx = $state(0);
    let ty = $state(0);
    let zoom = $state(1);
    const marker = $derived(`map-arrow-${instanceId.replace(/[^a-zA-Z0-9_-]/g, '-')}`);

    /** The node under the pointer, and the node holding the keyboard, by id. */
    let hovered: string | null = $state(null);
    let focused: string | null = $state(null);

    /**
     * Each drawn label element by node id, which is where a label's width is measured. It is state
     * because `bind:this` writes into it; `measure` reads it after a tick, outside any effect.
     */
    const texts: Record<string, SVGTextElement | null> = $state({});

    /** Each label's measured size by node id; a label not yet measured has none. */
    let measured: Partial<Record<string, LabelSize>> = $state({});

    /** The labels drawn on top of the rest: the hovered node's and the selected node's. */
    const leading = $derived.by(() =>
        [hovered, focused, linkSource?.id ?? null, linkTarget?.id ?? null].filter(
            (id): id is string => id !== null
        )
    );

    /** The labels drawn, by node id. An unmeasured label has no width and so overlaps nothing. */
    const shown = $derived(
        shownLabels(
            positions.map((node) => labelBox(node, measured[node.id] ?? UNMEASURED)),
            leading,
            positions
        )
    );

    /** The nodes in the order their labels are drawn: the leading labels last, so on top. */
    const labelled = $derived([
        ...positions.filter((node) => !leading.includes(node.id)),
        ...positions.filter((node) => leading.includes(node.id))
    ]);

    /** Read every drawn label's box from the page, so the box follows the node as it moves. */
    function measure(): void {
        const next: Record<string, LabelSize> = {};
        for (const [id, text] of Object.entries(texts)) {
            if (text?.isConnected === true) next[id] = labelSize(text);
        }
        measured = next;
    }

    $effect(() => {
        // The node set, its words, the text size and the placement are read, so a label that
        // changes, every label once the text grows or shrinks, and every label once Graphviz has
        // placed the nodes and their labels are drawn, is measured again.
        void graph.nodes.map((node) => `${node.id}\n${node.label}`).join('\n');
        void textScale();
        void chosen.nodes.map((node) => node.id).join('\n');
        void tick().then(measure);
    });

    // A hidden tab draws at no size and measures no label, so each is measured again once it shows.
    $effect(() => onShown(svg, measure));

    // Graphviz loads once per page; a pane opened before it has loaded waits for it here.
    $effect(() => (viz === null ? graphviz.load((answer) => (viz = answer)) : undefined));

    // Each tick of the settled simulation is kept in the box and drawn; a new placement stops it.
    $effect(() => {
        const forces = chosen.forces;
        placed = null;
        if (forces === null) return;
        forces.on('tick', () => {
            clampToBox(forces);
            placed = forceNodes(forces);
        });
        return () => {
            forces.stop();
            forces.on('tick', null);
        };
    });

    // A refused placement is logged with the graph's size, beside the line the pane shows.
    $effect(() => {
        if (failure !== null) {
            console.error(`map: the layout failed for ${graph.nodes.length} nodes: ${failure}`);
        }
    });

    function viewport(event: PointerEvent | WheelEvent): { x: number; y: number } {
        return toBox({ x: event.clientX, y: event.clientY }, svg.getBoundingClientRect());
    }

    function local(event: PointerEvent | WheelEvent): { x: number; y: number } {
        return toGraph(viewport(event), { x: tx, y: ty }, zoom);
    }

    function nodeDown(event: PointerEvent, node: PointNode): void {
        event.stopPropagation();
        svg.setPointerCapture(event.pointerId);
        start = local(event);
        pointer = start;
        moved = false;
        if (linkMode && node.kind === 'project') linkSource = node;
        else {
            if (chosen.forces !== null) press(chosen.forces, node.id);
            drag = node;
            grab = { x: node.x - start.x, y: node.y - start.y };
            lastScreen = { x: event.clientX, y: event.clientY };
        }
    }

    function backgroundDown(event: PointerEvent): void {
        svg.setPointerCapture(event.pointerId);
        panStart = { ...viewport(event), tx, ty };
    }

    function pointerMove(event: PointerEvent): void {
        if (linkSource !== null) {
            pointer = local(event);
            linkTarget = nearestProject(positions, pointer, linkSource.id);
            return;
        }
        if (drag !== null) {
            const at = local(event);
            moved = moved || Math.hypot(at.x - start.x, at.y - start.y) > 3;
            if (moved) dragTo(event);
            return;
        }
        if (panStart !== null) {
            const at = viewport(event);
            tx = panStart.tx + at.x - panStart.x;
            ty = panStart.ty + at.y - panStart.y;
        }
    }

    async function linked(source: PointNode, target: PointNode): Promise<void> {
        if (onlink !== undefined) status = await onlink(source, target);
    }

    /** Put the dragged node under the pointer, once it has moved a pixel, and run the forces. */
    function dragTo(event: PointerEvent): void {
        const screen = { x: event.clientX, y: event.clientY };
        if (!movedEnough(lastScreen, screen)) return;
        lastScreen = screen;
        if (drag === null || chosen.forces === null) return;
        holdAt(chosen.forces, drag.id, dragTarget(local(event), grab));
        chosen.forces.restart();
    }

    function pointerUp(event: PointerEvent): void {
        if (linkSource !== null && linkTarget !== null) void linked(linkSource, linkTarget);
        else if (drag !== null && !moved) onopen(drag);
        else if (drag !== null && event.type === 'pointerup') dragTo(event);
        if (drag !== null && chosen.forces !== null) release(chosen.forces, drag.id);
        drag = null;
        linkSource = null;
        linkTarget = null;
        panStart = null;
    }

    function wheel(event: WheelEvent): void {
        event.preventDefault();
        const at = viewport(event);
        const next = Math.max(0.35, Math.min(4, zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
        tx = at.x - (at.x - tx) * (next / zoom);
        ty = at.y - (at.y - ty) * (next / zoom);
        zoom = next;
    }

    function reset(): void {
        tx = 0;
        ty = 0;
        zoom = 1;
    }
</script>

<div class="graph-wrap">
    {#if status !== ''}
        <div class="status">
            <Empty error message={status} />
        </div>
    {/if}
    {#if failure !== null}
        <div class="status">
            <Empty error message={failed(failure)} />
        </div>
    {/if}
    <svg
        bind:this={svg}
        viewBox={`0 0 ${DEFAULT_BOUNDS.width} ${DEFAULT_BOUNDS.height}`}
        preserveAspectRatio="xMidYMid meet"
        data-map-graph
        role="application"
        aria-label={label}
        onpointerdown={backgroundDown}
        onpointermove={pointerMove}
        onpointerup={pointerUp}
        onpointercancel={pointerUp}
        onwheel={wheel}
        ondblclick={reset}
    >
        <defs>
            <marker
                id={marker}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="10"
                markerHeight="10"
                orient="auto-start-reverse"
                markerUnits="userSpaceOnUse"
            >
                <path d="M0,0 L10,5 L0,10 z"></path>
            </marker>
        </defs>
        <g transform={`translate(${tx},${ty}) scale(${zoom})`}>
            {#each graph.edges as edge (edge.id)}
                {@const points = edgeEnds(edge, positions)}
                {#if points !== null}
                    <line
                        class:membership={edge.kind === 'membership'}
                        class:collaborator={edge.kind === 'collaborator'}
                        class:related={edge.kind === 'related' && edge.direction === 'one'}
                        class:mutual={edge.kind === 'related' && edge.direction === 'mutual'}
                        data-edge={edge.id}
                        x1={points.x1}
                        y1={points.y1}
                        x2={points.x2}
                        y2={points.y2}
                        marker-end={edge.kind === 'related' ? `url(#${marker})` : undefined}
                        marker-start={edge.direction === 'mutual' ? `url(#${marker})` : undefined}
                    ></line>
                {/if}
            {/each}
            {#if linkSource !== null}
                <line
                    class="rubber"
                    x1={linkSource.x}
                    y1={linkSource.y}
                    x2={pointer.x}
                    y2={pointer.y}
                ></line>
            {/if}
            <Nodes
                nodes={positions}
                targetId={linkTarget?.id}
                bind:hovered
                bind:focused
                onpress={nodeDown}
                {onopen}
            />
            <g class="labels">
                {#each labelled as node (node.id)}
                    <text
                        class:line-label={node.kind === 'line'}
                        class:hidden={!shown.has(node.id)}
                        class:archived={node.archived !== undefined}
                        data-label={node.id}
                        bind:this={texts[node.id]}
                        x={node.x + node.radius + LABEL_GAP}
                        y={node.y + LABEL_DROP}
                    >
                        {node.label}
                    </text>
                {/each}
            </g>
        </g>
    </svg>
</div>

<style>
    /* The graph takes the height the head and the legend leave in the map's column. */
    .graph-wrap {
        position: relative;
        flex: 1 1 auto;
        min-height: 420px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        overflow: hidden;
    }

    :global(body.wall) .graph-wrap {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The error box sits over the canvas's top left corner, on the panel so the nodes under it do
       not show through the words. */
    .status {
        position: absolute;
        z-index: 1;
        top: 8px;
        left: 8px;
        right: 8px;
        background: var(--panel);
    }

    :global(body.wall) .status {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 420px;
        touch-action: none;
    }

    line {
        stroke: var(--map-edge);
        stroke-width: 1.4;
    }

    line.collaborator {
        stroke: var(--map-collab);
    }

    line.related,
    line.rubber {
        stroke: var(--map-related);
        stroke-width: 2.6;
    }

    line.mutual {
        stroke: var(--map-mutual);
        stroke-width: 2.8;
    }

    text {
        fill: var(--ink-txt, var(--ink));
        font-size: var(--fs-xs);
        pointer-events: none;
    }

    text.line-label {
        font-size: var(--fs-sm);
    }

    /* An archived node's label is dimmed with its node, which it no longer sits inside. */
    text.archived {
        opacity: 0.6;
    }

    text.hidden {
        visibility: hidden;
    }

    path {
        fill: context-stroke;
    }
</style>
