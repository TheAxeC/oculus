<script lang="ts">
    // Layer 3, Map partial. The hand-drawn SVG graph and its drag, pan, zoom, open and related-edge
    // interactions. Geometry comes from the pure seeded layout in state/boards/graph.ts.
    //
    // The labels are one layer drawn over every node, so a label is never covered by a node drawn
    // after it. A label that would overlap one already drawn is hidden, by the rule of
    // views/structure/map/labels.ts over each label's measured width, until its node is hovered or
    // holds the keyboard; those labels are drawn whatever they overlap, and last, so they sit on
    // top.

    import { onMount, tick } from 'svelte';
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
        mapLayout,
        physics,
        type Graph,
        type GraphNode,
        type Physics,
        type PointNode
    } from '$lib/state/boards/graph';
    import { t } from '$lib/state/words/text';
    import { toneOf, typeTone } from '$lib/state/words/tones';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        layout: { openView },
        selectors: { configMap },
        ui: { textScale },
        writes: { writeManifest }
    } = useState();

    type Props = {
        graph: Graph;
        instanceId: string;
        linkMode: boolean;
        /** The parameters the pane saved for this node set, and null when it saved none. */
        tuned: Physics | null;
        /** Where parameters tuned here are handed back, for the pane to keep with its own state. */
        ontuned: (params: Physics) => void;
    };
    let { graph, instanceId, linkMode, tuned, ontuned }: Props = $props();

    const WIDTH = DEFAULT_BOUNDS.width;
    const HEIGHT = DEFAULT_BOUNDS.height;

    // Read before the first paint and again on mount, so what is drawn and what the simulation
    // carries on from are the one placement rather than two.
    const chosen = $derived(mapLayout(graph, tuned));
    let placed = $state<PointNode[] | null>(null);
    const positions = $derived(placed ?? chosen.nodes);
    let params: Physics = DEFAULT_PHYSICS;
    let alpha = 0.12;
    let frame: number | null = null;
    let svg: SVGSVGElement;
    let drag: PointNode | null = null;
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
        // The node set, its words and the text size are read, so a label that changes, and every
        // label once the text grows or shrinks, is measured again.
        void graph.nodes.map((node) => `${node.id}\n${node.label}`).join('\n');
        void textScale();
        void tick().then(measure);
    });

    function point(id: string): PointNode | undefined {
        return positions.find((node) => node.id === id);
    }

    function edgePoints(edge: Graph['edges'][number]): {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    } | null {
        const source = point(edge.source);
        const target = point(edge.target);
        if (source === undefined || target === undefined) return null;
        if (edge.kind !== 'related') {
            return { x1: source.x, y1: source.y, x2: target.x, y2: target.y };
        }
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / distance;
        const uy = dy / distance;
        const targetPad = target.radius + 6;
        const sourcePad = edge.direction === 'mutual' ? source.radius + 6 : 0;
        return {
            x1: source.x + ux * sourcePad,
            y1: source.y + uy * sourcePad,
            x2: target.x - ux * targetPad,
            y2: target.y - uy * targetPad
        };
    }

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
        placed = physics(positions, graph.edges, alpha, params, DEFAULT_BOUNDS, drag?.id);
        alpha *= params.cool;
        frame = alpha > 0.03 ? requestAnimationFrame(step) : null;
    }

    function nodeDown(event: PointerEvent, node: PointNode): void {
        event.stopPropagation();
        svg.setPointerCapture(event.pointerId);
        start = local(event);
        pointer = start;
        moved = false;
        if (linkMode && node.kind === 'project') linkSource = node;
        else drag = node;
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

    onMount(() => {
        params = chosen.params;
        placed = chosen.nodes;
        if (chosen.tuned !== null) ontuned(chosen.tuned);
        frame = requestAnimationFrame(step);
        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
        };
    });
</script>

<div class="graph-wrap">
    {#if status !== ''}
        <p class="status" role="status">{status}</p>
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
                {@const points = edgePoints(edge)}
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
