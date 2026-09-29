// Layer 2, client state. Where the Map's nodes go: Graphviz's neato engine, run in the page through
// @viz-js/viz (Graphviz compiled to WebAssembly), lays a Graph out from a start seed, and the
// positions it answers are fitted into the Map's box. The same node set and seed give the same
// picture every time, since neato's random start is seeded by `start`.
//
// The library is loaded by a dynamic import on the first load of createGraphviz()'s loader, which
// only the page makes, so the server never loads the WebAssembly. The loader is held by the client
// state (state/client/context.ts), so one instance serves every Map pane of the page.
// Each node is written to Graphviz under its index (`n0`, `n1`, ...) rather than its id, so an id
// holding a quote, a space or a backslash needs no escaping and comes back under the same id.

import type { Viz } from '@viz-js/viz';
import {
    DEFAULT_BOUNDS,
    DEFAULT_PHYSICS,
    type Bounds,
    type Graph,
    type GraphEdge,
    type PointNode
} from './graph';

/** The Graphviz layout engine the Map is placed by; `fdp` is the other one worth trying. */
export const ENGINE = 'neato';

/** Graphviz's unit, points per inch, which node sizes and edge lengths are written in. */
const POINTS = 72;

/** The most a placement is enlarged to fill the box, so a small graph is not spread across it. */
const MAX_SCALE = 1.5;

/** What a pane holds of Graphviz: nothing yet, the loaded instance, or why it did not load. */
export type GraphvizAnswer = Viz | string | null;

/** The page's one Graphviz, loaded on first use and shared by every Map pane of the client. */
export type GraphvizLoader = {
    /** The instance once it has loaded, and null before, so a later pane places at once. */
    loaded(): Viz | null;
    /** The instance, loaded on the first call and shared by every later one. */
    ready(): Promise<Viz>;
    /**
     * Load, and hand `done` the instance or the reason the load failed, unless the returned cancel
     * ran first, which is what a pane closed or remounted before the load finished calls.
     */
    load(done: (answer: Viz | string) => void): () => void;
};

/**
 * The client's Graphviz loader. The promise and the instance live in this closure, one per client
 * state, so every pane of a page shares one instance and two clients share nothing. A load that
 * fails is forgotten, so the next pane opened tries again.
 */
export function createGraphviz(): GraphvizLoader {
    let loading: Promise<Viz> | null = null;
    let loaded: Viz | null = null;
    function ready(): Promise<Viz> {
        loading ??= import('@viz-js/viz')
            .then(({ instance }) => instance())
            .then(
                (viz) => {
                    loaded = viz;
                    return viz;
                },
                (error: unknown) => {
                    loading = null;
                    throw error;
                }
            );
        return loading;
    }
    return {
        loaded: () => loaded,
        ready,
        load(done) {
            let live = true;
            ready().then(
                (viz) => {
                    if (live) done(viz);
                },
                (error: unknown) => {
                    if (live) done(error instanceof Error ? error.message : String(error));
                }
            );
            return () => {
                live = false;
            };
        }
    };
}

/** A number as Graphviz reads it: plain decimals, never an exponent. */
function num(value: number): string {
    return value.toFixed(4);
}

/**
 * The graph as Graphviz input: each node under its index with its drawn size, and every edge
 * undirected at `DEFAULT_PHYSICS.linkLength`. placeGraph() then scales the picture to fit the box,
 * and a drag holds every edge to the length it has on screen when the press begins (edgeLengths()
 * of graph.ts), so the drag keeps the picture's own spacing.
 */
function graphDot(graph: Graph, seed: number): string {
    const index = new Map(graph.nodes.map((node, at) => [node.id, at]));
    const lines = [
        'graph {',
        `    graph [start=${Math.trunc(seed)}, overlap=false, splines=false];`,
        '    node [shape=circle, fixedsize=true, label=""];',
        `    edge [len=${num(DEFAULT_PHYSICS.linkLength / POINTS)}];`
    ];
    graph.nodes.forEach((node, at) => {
        const size = num((node.radius * 2) / POINTS);
        lines.push(`    n${at} [width=${size}, height=${size}];`);
    });
    for (const edge of graph.edges) {
        const source = index.get(edge.source);
        const target = index.get(edge.target);
        if (source !== undefined && target !== undefined)
            lines.push(`    n${source} -- n${target};`);
    }
    lines.push('}');
    return lines.join('\n');
}

/** Each node's position as Graphviz answered it, by the node's index. */
function positions(json: unknown, count: number): { x: number; y: number }[] {
    const objects = (json as { objects?: unknown }).objects;
    const found = new Map<number, { x: number; y: number }>();
    for (const object of Array.isArray(objects) ? objects : []) {
        const { name, pos } = object as { name?: unknown; pos?: unknown };
        const at = typeof name === 'string' ? /^n(\d+)$/.exec(name) : null;
        if (at === null || typeof pos !== 'string') continue;
        const [x, y] = pos.split(',').map(Number);
        if (Number.isFinite(x) && Number.isFinite(y)) found.set(Number(at[1]), { x, y });
    }
    return Array.from({ length: count }, (_, at) => {
        const point = found.get(at);
        if (point === undefined) throw new Error(`Graphviz placed no position for node ${at}`);
        return point;
    });
}

/** Placed nodes. */
export type Placed = { nodes: PointNode[] };

/**
 * Lay a graph out with neato from one start seed and fit it into the box: the picture is scaled
 * evenly and centred, Graphviz's upward y turned into the page's downward one.
 */
export function placeGraph(
    viz: Viz,
    graph: Graph,
    seed: number,
    bounds: Bounds = DEFAULT_BOUNDS
): Placed {
    if (graph.nodes.length === 0) return { nodes: [] };
    const json = viz.renderJSON(graphDot(graph, seed), { engine: ENGINE });
    const points = positions(json, graph.nodes.length);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const [minX, maxX, minY, maxY] = [
        Math.min(...xs),
        Math.max(...xs),
        Math.min(...ys),
        Math.max(...ys)
    ];
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const scale = Math.min(
        MAX_SCALE,
        spanX > 0 ? (bounds.width - bounds.pad * 2) / spanX : Infinity,
        spanY > 0 ? (bounds.height - bounds.pad * 2) / spanY : Infinity
    );
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const nodes = graph.nodes.map((node, at) => ({
        ...node,
        x: bounds.width / 2 + (points[at].x - midX) * scale,
        y: bounds.height / 2 - (points[at].y - midY) * scale,
        vx: 0,
        vy: 0
    }));
    return { nodes };
}

/** A placement, or the reason the engine gave for refusing it. */
export type Placement = Placed | { error: string };

/** Place a graph, answering the engine's error as a value so the Map can say it in its place. */
export function placement(viz: Viz, graph: Graph, seed: number): Placement {
    try {
        return placeGraph(viz, graph, seed);
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * What the Map draws from what it holds of Graphviz: no node and no failure before the load, the
 * placed nodes once it has loaded, and the reason when the load or the
 * placement failed.
 */
export function mapPlacement(
    answer: GraphvizAnswer,
    graph: Graph,
    seed: number
): Placed & { failure: string | null } {
    if (answer === null) return { nodes: [], failure: null };
    const placed = typeof answer === 'string' ? { error: answer } : placement(answer, graph, seed);
    return 'error' in placed ? { nodes: [], failure: placed.error } : { ...placed, failure: null };
}

/**
 * Where one edge's line is drawn between its placed ends, and null when an end is not placed. A
 * related edge stops short of its target, and of its source too when it is mutual, so its arrowhead
 * sits clear of the node it points at.
 */
export function edgeEnds(
    edge: GraphEdge,
    nodes: PointNode[]
): { x1: number; y1: number; x2: number; y2: number } | null {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (source === undefined || target === undefined) return null;
    if (edge.kind !== 'related') return { x1: source.x, y1: source.y, x2: target.x, y2: target.y };
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
