// Layer 2, client state. Where the Map's nodes go: Graphviz's neato engine, run in the page through
// @viz-js/viz (Graphviz compiled to WebAssembly), lays a Graph out from a start seed, and the
// positions it answers are fitted into the Map's box, which is the pane's own size. The same node
// set, edges, seed and box give the same picture every time, since neato's random start is seeded
// by `start` and d3-force's random source starts from one fixed seed in every simulation.
// mapPlacement() then runs that placement to rest under the Map's forces (forces.ts) before the
// first draw. A placement is made again only on a re-tune, a new seed for the same node set, or a
// node set that shares no node with the one drawn (placementTurn()); an edge written or taken away
// later, and a node added or taken away, are brought into the simulation the view holds (relink()
// and renode() of forces.ts) and move no other node.
//
// The library is loaded by a dynamic import on the first load of createGraphviz()'s loader, which
// only the page makes, so the server never loads the WebAssembly. The loader is held by the client
// state (state/client/context.ts), so one instance serves every Map pane of the page.
// Each node is written to Graphviz under its index (`n0`, `n1`, ...) rather than its id, so an id
// holding a quote, a space or a backslash needs no escaping and comes back under the same id.

import type { Viz } from '@viz-js/viz';
import { z } from 'zod';
import { readAs, rowsShape } from '../../../data/shapes/shapes.ts';
import {
    LINK_LENGTH,
    layoutKey,
    type Bounds,
    type Graph,
    type GraphEdge,
    type GraphNode,
    type PointNode
} from './graph';
import { createForces, settleForces, type MapForces } from './forces';

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
 * undirected at `LINK_LENGTH`. placeGraph() then scales the picture to fit the box, and the
 * placement is then run to rest under the Map's forces (forces.ts), each edge's link resting at the
 * length it has in neato's picture, so the settle keeps the picture's own spacing.
 */
function graphDot(graph: Graph, seed: number): string {
    const index = new Map(graph.nodes.map((node, at) => [node.id, at]));
    const lines = [
        'graph {',
        `    graph [start=${Math.trunc(seed)}, overlap=false, splines=false];`,
        '    node [shape=circle, fixedsize=true, label=""];',
        `    edge [len=${num(LINK_LENGTH / POINTS)}];`
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

/** One object of Graphviz's JSON: a node named `n<index>` with a `pos` of two finite numbers. */
const objectShape = z
    .object({
        name: z
            .string()
            .regex(/^n\d+$/)
            .transform((name) => Number(name.slice(1))),
        pos: z.string().transform((pos) => pos.split(',').map(Number))
    })
    .transform(({ name, pos: [x, y] }) => ({ at: name, x, y }))
    .refine((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

/** What Graphviz's JSON answers of the layout: the objects that name a node and a position. */
const graphvizShape = z.object({ objects: rowsShape(objectShape).catch([]) });

/** Each node's position as Graphviz answered it, by the node's index. */
function positions(json: unknown, count: number): { x: number; y: number }[] {
    const found = new Map<number, { x: number; y: number }>();
    for (const { at, x, y } of readAs(graphvizShape, json)?.objects ?? []) found.set(at, { x, y });
    return Array.from({ length: count }, (_, at) => {
        const point = found.get(at);
        if (point === undefined) throw new Error(`Graphviz placed no position for node ${at}`);
        return point;
    });
}

/** Placed nodes. */
export type Placed = { nodes: PointNode[] };

/**
 * How much one axis of the picture is scaled to fill the room the box has along it: up to
 * MAX_SCALE, and nothing for a box with no room past its pad.
 */
function axisScale(span: number, room: number): number {
    return Math.min(MAX_SCALE, span > 0 ? Math.max(0, room) / span : Infinity);
}

/**
 * Lay a graph out with neato from one start seed and fit it into the box: each axis of the picture
 * is scaled to fill the box's room along it, so the picture takes the pane's shape whatever shape
 * neato gave it, as Graphviz's own `ratio=fill` does, and centred, Graphviz's upward y turned into
 * the page's downward one.
 */
export function placeGraph(viz: Viz, graph: Graph, seed: number, bounds: Bounds): Placed {
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
    const scaleX = axisScale(spanX, bounds.width - bounds.pad * 2);
    const scaleY = axisScale(spanY, bounds.height - bounds.pad * 2);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const nodes = graph.nodes.map((node, at) => ({
        ...node,
        x: bounds.width / 2 + (points[at].x - midX) * scaleX,
        y: bounds.height / 2 - (points[at].y - midY) * scaleY,
        vx: 0,
        vy: 0
    }));
    return { nodes };
}

/** A placement, or the reason the engine gave for refusing it. */
export type Placement = Placed | { error: string };

/** Place a graph, answering the engine's error as a value so the Map can say it in its place. */
export function placement(viz: Viz, graph: Graph, seed: number, bounds: Bounds): Placement {
    try {
        return placeGraph(viz, graph, seed, bounds);
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * What the Map draws: its nodes, the reason the load or the placement failed, the simulation the
 * view goes on with, which is null before the load or on a failure, and the box the nodes were
 * placed in, null with no simulation.
 */
export type MapPlacement = Placed & {
    failure: string | null;
    forces: MapForces | null;
    bounds: Bounds | null;
};

/**
 * What one pane's placement was last made from: the key of its node set (layoutKey() of graph.ts),
 * the node ids, the seed, and the count of placements made, which names the placement in force.
 */
export type PlacementTurn = { key: string; ids: ReadonlySet<string>; seed: number; turn: number };

/**
 * The record for the graph and the seed now, its `turn` one past `held`'s when the pane is to be
 * placed again: a seed changed under the same node set (the Map's re-tune), or a node set sharing
 * no node with the one held (another hub's notes). Anything else keeps the turn: a graph built
 * again from a new portfolio version, a toggle of the link mode, another label, a link written or
 * taken away, and a node set that changed while keeping some node, whose seed changes with it
 * (startFor() of graph.ts) and whose new nodes are placed beside the drawn ones (renode() of
 * forces.ts).
 */
export function placementTurn(
    held: PlacementTurn | null,
    nodes: GraphNode[],
    seed: number
): PlacementTurn {
    const key = layoutKey(nodes);
    const ids = new Set(nodes.map((node) => node.id));
    if (held === null) return { key, ids, seed, turn: 0 };
    const retuned = key === held.key && seed !== held.seed;
    const replaced = ![...ids].some((id) => held.ids.has(id));
    return { key, ids, seed, turn: held.turn + (retuned || replaced ? 1 : 0) };
}

/**
 * What the Map draws from what it holds of Graphviz, in the box `bounds`: no node and no failure
 * before the load or while the pane has not been measured (`bounds` null), and once both are there,
 * neato's placement run to rest under the Map's forces: the settled simulation, cold, and copies of
 * its nodes. A failed load answers its reason whether or not the pane is measured, and a failed
 * placement answers the engine's.
 */
export function mapPlacement(
    answer: GraphvizAnswer,
    graph: Graph,
    seed: number,
    bounds: Bounds | null
): MapPlacement {
    if (typeof answer === 'string') {
        return { nodes: [], failure: answer, forces: null, bounds: null };
    }
    if (answer === null || bounds === null) {
        return { nodes: [], failure: null, forces: null, bounds: null };
    }
    const placed = placement(answer, graph, seed, bounds);
    if ('error' in placed) return { nodes: [], failure: placed.error, forces: null, bounds: null };
    const forces = createForces(placed.nodes, graph.edges, bounds);
    return { nodes: settleForces(forces, bounds), failure: null, forces, bounds };
}

/**
 * Each node as the graph gives it now, at the place `at` holds for its id, so a label or a tone
 * that changed since the placement is drawn as it is now; a node `at` does not hold is not drawn.
 */
export function drawnAt(nodes: GraphNode[], at: PointNode[]): PointNode[] {
    const byId = new Map(at.map((node) => [node.id, node]));
    return nodes.flatMap((node) => {
        const point = byId.get(node.id);
        return point === undefined ? [] : [{ ...node, x: point.x, y: point.y, vx: 0, vy: 0 }];
    });
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
