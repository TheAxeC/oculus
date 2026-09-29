<script lang="ts">
    // Layer 3, Map partial. The hand-drawn SVG graph and its drag, pan, zoom, open and related-edge
    // interactions. The nodes are placed by Graphviz's neato through @viz-js/viz in the page
    // (state/boards/structure/layout.ts, whose loader the client state holds as `graphviz`), from
    // the start seed the pane hands down, and each edge is drawn between the ends edgeEnds() of
    // that module answers. The SVG draws the nodes once the placement has come back, draws nothing
    // before that, and says in one line why when the engine refuses the graph or does not load.
    // Once a pressed node has moved past the click threshold, dragTick() of
    // state/boards/structure/graph.ts runs each frame: `physics` under DRAG_PHYSICS over that
    // node's direct neighbours alone, each edge held to the length it had when the press began, so
    // the dragged node pulls its neighbours after it and every other node stays where it is.
    //
    // The labels are one layer drawn over every node, so a label is never covered by a node drawn
    // after it. A label that would overlap one already drawn is hidden, by the rule of
    // views/structure/map/labels.ts over each label's measured width, until its node is hovered or
    // holds the keyboard; those labels are drawn whatever they overlap, and last, so they sit on
    // top.

    import { tick } from 'svelte';
    import { onShown } from '$lib/ui/shown';
    import { writeRelated } from './edge-write';
    import {
        LABEL_DROP,
        LABEL_GAP,
        UNMEASURED,
        labelBox,
        labelSize,
        shownLabels,
        type LabelSize
    } from './labels';
    import {
        DEFAULT_BOUNDS,
        DEFAULT_PHYSICS,
        dragTick,
        holdFor,
        type DragHold,
        type Graph,
        type GraphNode,
        type PointNode
    } from '$lib/state/boards/structure/graph';
    import {
        edgeEnds,
        mapPlacement,
        type GraphvizAnswer
    } from '$lib/state/boards/structure/layout';
    import { t } from '$lib/state/shared/words/text';
    import { toneOf, typeTone } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        graphviz,
        layout: { openView },
        selectors: { configMap },
        ui: { textScale },
        writes: { writeManifest }
    } = useState();

    type Props = {
        graph: Graph;
        instanceId: string;
        linkMode: boolean;
        /** The start seed the graph is laid out from, which the pane keeps for its node set. */
        seed: number;
    };
    let { graph, instanceId, linkMode, seed }: Props = $props();

    const WIDTH = DEFAULT_BOUNDS.width;
    const HEIGHT = DEFAULT_BOUNDS.height;

    /** The page's Graphviz once loaded, or the reason it did not load. */
    let viz = $state<GraphvizAnswer>(graphviz.loaded());
    /** Where neato put the nodes, or why the engine refused; no node until Graphviz loads. */
    const chosen = $derived(mapPlacement(viz, graph, seed));
    /** The positions after a drag, which take over from the placement once a node has moved. */
    let placed = $state<PointNode[] | null>(null);
    const positions = $derived(placed ?? chosen.nodes);
    const failure = $derived(chosen.failure);
    let alpha = 0.12;
    let frame: number | null = null;
    let svg: SVGSVGElement;
    let drag: PointNode | null = null;
    /** What the last drag moves and holds each edge to, taken when its press began. */
    let hold: DragHold = { movers: new Set(), lengths: new Map() };
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

    /** Each drawn label element by node id, which is where a label's width is measured. */
    const texts: Record<string, SVGTextElement | null> = {};

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
            leading
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

    // A refused placement is logged with the graph's size, beside the line the pane shows.
    $effect(() => {
        if (failure !== null) {
            console.error(`map: the layout failed for ${graph.nodes.length} nodes: ${failure}`);
        }
    });

    function nodeTone(node: GraphNode): string {
        if (node.archived === undefined) return typeTone(node.type ?? '');
        const colors = configMap().arch_color;
        if (typeof colors !== 'object' || colors === null || Array.isArray(colors)) return 'grey';
        const color = (colors as Record<string, unknown>)[node.archived];
        return typeof color === 'string' ? toneOf(color) : 'grey';
    }

    function local(event: PointerEvent | WheelEvent): { x: number; y: number } {
        const rect = svg.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * WIDTH;
        const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * HEIGHT;
        return { x: (x - tx) / zoom, y: (y - ty) / zoom };
    }

    function viewport(event: PointerEvent | WheelEvent): { x: number; y: number } {
        const rect = svg.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * WIDTH,
            y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * HEIGHT
        };
    }

    function nearestProject(at: { x: number; y: number }, except: string): PointNode | null {
        let nearest: PointNode | null = null;
        let distance = Infinity;
        for (const node of positions) {
            if (node.kind !== 'project' || node.id === except) continue;
            const dx = node.x - at.x;
            const dy = node.y - at.y;
            const held = Math.sqrt(dx * dx + dy * dy);
            if (held <= node.radius + 12 && held < distance) {
                nearest = node;
                distance = held;
            }
        }
        return nearest;
    }

    function reheat(): void {
        alpha = Math.max(alpha, 0.4);
        frame ??= requestAnimationFrame(step);
    }

    function step(): void {
        placed = dragTick(positions, graph.edges, alpha, hold);
        alpha *= DEFAULT_PHYSICS.cool;
        frame = alpha > 0.03 ? requestAnimationFrame(step) : null;
    }

    function nodeDown(event: PointerEvent, node: PointNode): void {
        event.stopPropagation();
        svg.setPointerCapture(event.pointerId);
        start = local(event);
        pointer = start;
        moved = false;
        if (linkMode && node.kind === 'project') linkSource = node;
        else {
            drag = node;
            hold = holdFor(positions, graph.edges, node.id);
        }
    }

    function backgroundDown(event: PointerEvent): void {
        svg.setPointerCapture(event.pointerId);
        const at = viewport(event);
        panStart = { ...at, tx, ty };
    }

    function pointerMove(event: PointerEvent): void {
        if (linkSource !== null) {
            pointer = local(event);
            linkTarget = nearestProject(pointer, linkSource.id);
            return;
        }
        if (drag !== null) {
            const at = local(event);
            moved = moved || Math.hypot(at.x - start.x, at.y - start.y) > 3;
            if (!moved) return;
            placed = positions.map((node) =>
                node.id === drag?.id ? { ...node, x: at.x, y: at.y, vx: 0, vy: 0 } : node
            );
            reheat();
            return;
        }
        if (panStart !== null) {
            const at = viewport(event);
            tx = panStart.tx + at.x - panStart.x;
            ty = panStart.ty + at.y - panStart.y;
        }
    }

    async function toggleRelated(source: PointNode, target: PointNode): Promise<void> {
        const project = portfolio()?.entities.projects[source.entityId];
        if (project === undefined) return;
        const related = project.relatedIds.includes(target.entityId)
            ? project.relatedIds.filter((id) => id !== target.entityId)
            : [...project.relatedIds, target.entityId];
        status = await writeRelated(source.entityId, related, writeManifest);
    }

    function open(node: PointNode): void {
        if (node.kind === 'project') {
            openView('project', { id: node.entityId, label: node.label });
        } else if (node.kind === 'line') {
            openView('pillars');
        } else {
            openView('person', { key: node.entityId, label: node.label });
        }
    }

    function pointerUp(): void {
        if (linkSource !== null && linkTarget !== null) void toggleRelated(linkSource, linkTarget);
        else if (drag !== null && !moved) open(drag);
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

    $effect(() => () => {
        if (frame !== null) cancelAnimationFrame(frame);
    });
</script>

<div class="graph-wrap">
    {#if status !== ''}
        <p class="status" role="status">{status}</p>
    {/if}
    {#if failure !== null}
        <p class="status" role="status">{t('map.layout_failed', failure)}</p>
    {/if}
    <svg
        bind:this={svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        data-map-graph
        role="application"
        aria-label={t('views.map')}
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
            {#each positions as node (node.id)}
                <g
                    class="node"
                    class:archived={node.archived !== undefined}
                    class:target={node.id === linkTarget?.id}
                    data-node={node.id}
                    role="button"
                    tabindex="0"
                    aria-label={node.label}
                    onpointerdown={(event) => nodeDown(event, node)}
                    onpointerenter={() => (hovered = node.id)}
                    onpointerleave={() => {
                        if (hovered === node.id) hovered = null;
                    }}
                    onfocus={() => (focused = node.id)}
                    onblur={() => {
                        if (focused === node.id) focused = null;
                    }}
                    onkeydown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') open(node);
                    }}
                >
                    {#if node.kind === 'project'}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.radius}
                            style={`--node-fill: var(--c-${nodeTone(node)})`}
                        ></circle>
                    {:else}
                        <rect
                            class:line-node={node.kind === 'line'}
                            class:collaborator-node={node.kind === 'collaborator'}
                            x={node.x - node.radius}
                            y={node.y - node.radius}
                            width={node.radius * 2}
                            height={node.radius * 2}
                            rx="3"
                        ></rect>
                    {/if}
                    <title>{node.label}</title>
                </g>
            {/each}
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
    .graph-wrap {
        position: relative;
        min-height: 420px;
        height: calc(100% - 78px);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        overflow: hidden;
    }

    :global(body.wall) .graph-wrap {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .status {
        position: absolute;
        z-index: 1;
        top: 8px;
        left: 8px;
        margin: 0;
        padding: 4px 8px;
        color: var(--c-red-d-txt);
        background: var(--panel);
        border: 1px solid var(--c-red);
        border-radius: var(--radius-sm);
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

    circle {
        fill: var(--node-fill);
    }

    rect.line-node {
        fill: var(--map-line);
    }

    rect.collaborator-node {
        fill: var(--map-collab);
    }

    .node {
        cursor: grab;
    }

    .node.archived {
        opacity: 0.6;
    }

    .node.target circle {
        stroke: var(--accent);
        stroke-width: 4;
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
