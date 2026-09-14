<script lang="ts">
    // Layer 3, Map partial. The hand-drawn SVG graph and its drag, pan, zoom, open and related-edge
    // interactions. Geometry comes from the pure seeded layout in state/graph.ts.

    import { onMount } from 'svelte';
    import { writeRelated } from './edge-write';
    import {
        DEFAULT_PHYSICS,
        bestLayout,
        layoutKey,
        optimize,
        physics,
        seededRandom,
        type Graph,
        type GraphNode,
        type Physics,
        type PointNode
    } from '$lib/state/graph';
    import { t } from '$lib/state/text';
    import { toneOf, typeTone } from '$lib/state/tones';
    import { useState } from '$lib/state/use';

    const {
        entities: { portfolio },
        layout: { openView },
        selectors: { configMap },
        writes: { writeManifest }
    } = useState();

    type Props = { graph: Graph; instanceId: string; linkMode: boolean };
    let { graph, instanceId, linkMode }: Props = $props();

    const WIDTH = 1000;
    const HEIGHT = 680;
    const BOUNDS = { width: WIDTH, height: HEIGHT, pad: 48 };
    const key = $derived(layoutKey(graph.nodes));

    function numericSeed(value: string): number {
        let sum = 0;
        for (let index = 0; index < value.length; index += 1) sum += value.charCodeAt(index);
        return sum;
    }

    const seed = $derived(numericSeed(key));

    function isPhysics(value: unknown): value is Physics {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
        const record = value as Record<string, unknown>;
        return [
            'linkLength',
            'linkStrength',
            'repulse',
            'collide',
            'center',
            'damping',
            'cool'
        ].every((name) => typeof record[name] === 'number' && Number.isFinite(record[name]));
    }
    let placed = $state<PointNode[] | null>(null);
    const positions = $derived(
        placed ?? bestLayout(graph, seededRandom(seed), 8, 120, DEFAULT_PHYSICS, BOUNDS).nodes
    );
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
        placed = physics(positions, graph.edges, alpha, params, BOUNDS, drag?.id);
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
            openView('programs');
        } else {
            openView('collaborations');
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
        let cached: Physics | null;
        try {
            const raw = localStorage.getItem(key);
            const parsed: unknown = raw === null ? null : JSON.parse(raw);
            cached = isPhysics(parsed) ? parsed : null;
        } catch {
            cached = null;
        }
        if (cached === null) {
            const tuned = optimize(graph, seededRandom(seed), 12, BOUNDS);
            params = tuned.params;
            placed = tuned.nodes;
            try {
                localStorage.setItem(key, JSON.stringify(params));
            } catch {
                // A private browser may refuse this convenience cache; the tuned layout still works.
            }
        } else {
            params = cached;
            placed = bestLayout(graph, seededRandom(seed), 8, 150, params, BOUNDS).nodes;
        }
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
                    <text
                        class:line-label={node.kind === 'line'}
                        x={node.x + node.radius + 4}
                        y={node.y + 4}
                    >
                        {node.label}
                    </text>
                    <title>{node.label}</title>
                </g>
            {/each}
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

    path {
        fill: context-stroke;
    }
</style>
