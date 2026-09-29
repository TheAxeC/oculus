// The Map's force simulation on d3-force: the settle from neato's placement of the dense graph of
// map-fixture.ts at seed 1, the collision and the charge each on their own, a press, a drag through
// the dense middle and across the map, the box, and the inputs at the edges (no node, one node, an
// unknown id, an edge to a node that is not there).

import { beforeAll, describe, expect, it } from 'vitest';
import type { Viz } from '@viz-js/viz';
import {
    DEFAULT_BOUNDS,
    type Graph,
    type GraphEdge,
    type PointNode
} from '../../../../src/lib/state/boards/structure/graph.ts';
import {
    createGraphviz,
    mapPlacement,
    placeGraph
} from '../../../../src/lib/state/boards/structure/layout.ts';
import {
    FORCES,
    advance,
    clampToBox,
    createForces,
    dragTo,
    press,
    release,
    settleForces
} from '../../../../src/lib/state/boards/structure/forces.ts';
import { denseGraph, edge, node } from './map-fixture.ts';

type Point = { x: number; y: number };

const CENTRE: Point = { x: DEFAULT_BOUNDS.width / 2, y: DEFAULT_BOUNDS.height / 2 };

/** How far apart two circles' edges are: their centres' distance less their two radii. */
function room(a: PointNode, b: PointNode): number {
    return Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius;
}

/**
 * Every pair of circles that is not apart, as "a over b: room", where apart is the gap less half a
 * unit of room between their edges. A pair holding `held` may be short of the gap by `short`.
 */
function crowded(nodes: PointNode[], gap: number, held = '', short = 0): string[] {
    const found: string[] = [];
    for (let left = 0; left < nodes.length; left += 1) {
        for (let right = left + 1; right < nodes.length; right += 1) {
            const a = nodes[left];
            const b = nodes[right];
            const least = a.id === held || b.id === held ? gap - short : gap - 0.5;
            const between = room(a, b);
            if (between < least) found.push(`${a.id} over ${b.id}: ${between.toFixed(2)}`);
        }
    }
    return found;
}

function finite(nodes: PointNode[]): boolean {
    return nodes.every((one) => Number.isFinite(one.x) && Number.isFinite(one.y));
}

function inside(nodes: PointNode[]): boolean {
    const { width, height, pad } = DEFAULT_BOUNDS;
    return nodes.every(
        (one) => one.x >= pad && one.x <= width - pad && one.y >= pad && one.y <= height - pad
    );
}

/** A project of the Map's own size, radius 7, placed at a point. */
function project(id: string, x: number, y: number): PointNode {
    return { ...node(id), radius: 7, x, y, vx: 0, vy: 0 };
}

/** Ten unconnected projects on a 3 by 3 unit grid at the box centre, the tenth on the first. */
function huddle(): PointNode[] {
    return Array.from({ length: 10 }, (_, at) =>
        project(`project::h${at}`, CENTRE.x + (at % 3), CENTRE.y + (Math.floor(at / 3) % 3))
    );
}

/** Where every node of a list lies, by id. */
function where(nodes: PointNode[]): Map<string, Point> {
    return new Map(nodes.map((one) => [one.id, { x: one.x, y: one.y }]));
}

describe("the Map's forces over the dense graph neato places", () => {
    const graph: Graph = denseGraph();
    let viz: Viz;
    let placed: PointNode[] = [];

    beforeAll(async () => {
        viz = await createGraphviz().ready();
        placed = placeGraph(viz, graph, 1).nodes;
    });

    it('settles every node finite, inside the box and apart from every other', () => {
        // Revert: advance() ticking without clampToBox() carries the outer nodes out of the box.
        const nodes = settleForces(createForces(placed, graph.edges));
        expect(nodes).toHaveLength(placed.length);
        expect(finite(nodes)).toBe(true);
        expect(inside(nodes)).toBe(true);
        expect(crowded(nodes, FORCES.gap)).toEqual([]);
    });

    it('moves no node and leaves alpha as it was on a press', () => {
        // Revert: press() ticking the simulation once moves the nodes and cools alpha.
        const simulation = createForces(placed, graph.edges);
        settleForces(simulation);
        const before = where(simulation.nodes());
        const alpha = simulation.alpha();
        press(simulation, 'line::a');
        expect(where(simulation.nodes())).toEqual(before);
        expect(simulation.alpha()).toBe(alpha);
    });

    it('pushes and pulls every node on a drag of a pillar into the dense middle, and keeps the circles apart', () => {
        // Revert: the nodes that are no neighbour of line::d fixed where they lie, a neighbour-only
        // drag, leaves those nodes where they were at the press.
        const held = 'line::d';
        const simulation = createForces(placed, graph.edges);
        settleForces(simulation);
        press(simulation, held);
        const pressed = where(simulation.nodes());
        const from = pressed.get(held);
        if (from === undefined) throw new Error('the dense graph holds line::d');
        const steps = 30;
        let closest = Infinity;
        for (let step = 1; step <= steps; step += 1) {
            const at = {
                x: from.x + ((CENTRE.x - from.x) * step) / steps,
                y: from.y + ((CENTRE.y - from.y) * step) / steps
            };
            dragTo(simulation, held, at);
            advance(simulation, 1, DEFAULT_BOUNDS);
            expect(crowded(simulation.nodes(), FORCES.gap, held, 2), `step ${step}`).toEqual([]);
            const moving = simulation.nodes().find((one) => one.id === held);
            if (moving === undefined) throw new Error('the simulation holds line::d');
            for (const one of simulation.nodes()) {
                if (one !== moving) closest = Math.min(closest, room(moving, one));
            }
        }
        console.log(`the least room to the held pillar over the drag: ${closest.toFixed(2)}`);
        release(simulation, held);
        const rest = settleForces(simulation);
        expect(crowded(rest, FORCES.gap), 'at rest').toEqual([]);
        const still = rest.filter((one) => {
            const was = pressed.get(one.id) ?? one;
            return one.id !== held && Math.hypot(one.x - was.x, one.y - was.y) <= 0;
        });
        expect(still.map((one) => one.id)).toEqual([]);
    });

    it('keeps every circle off a node with no edge dragged across the map', () => {
        // Revert: dragTo() setting the fixed point alone leaves the collision acting on where the
        // node was, and a circle overlaps it by 3.33 at step 15.
        const alone = 'project::alone';
        const nodes = placeGraph(
            viz,
            { nodes: [...graph.nodes, node(alone)], edges: graph.edges },
            1
        ).nodes.map((one) => (one.id === alone ? { ...one, x: 60, y: 340 } : one));
        const simulation = createForces(nodes, graph.edges);
        settleForces(simulation);
        press(simulation, alone);
        const worst: number[] = [];
        for (let step = 1; step <= 88; step += 1) {
            dragTo(simulation, alone, { x: 60 + step * 10, y: 340 });
            advance(simulation, 1, DEFAULT_BOUNDS);
            const moving = simulation.nodes().find((one) => one.id === alone);
            if (moving === undefined) throw new Error('the simulation holds the lone node');
            const least = Math.min(
                ...simulation
                    .nodes()
                    .filter((one) => one.id !== alone)
                    .map((one) => room(moving, one))
            );
            worst.push(least);
            expect(least, `step ${step}`).toBeGreaterThanOrEqual(-2);
        }
        console.log(
            `the least room to the lone node over the drag: ${Math.min(...worst).toFixed(2)}`
        );
    });

    it('frees a node on a release after a press that did not move', () => {
        // Revert: release() leaving fx and fy set keeps the node pinned.
        const simulation = createForces(placed, graph.edges);
        settleForces(simulation);
        press(simulation, 'project::p0');
        release(simulation, 'project::p0');
        const freed = simulation.nodes().find((one) => one.id === 'project::p0');
        expect(freed?.fx).toBeNull();
        expect(freed?.fy).toBeNull();
    });

    it('throws nothing and moves nothing for an id the simulation does not hold', () => {
        // Revert: press() with no guard for an id it does not find throws a TypeError.
        const simulation = createForces(placed, graph.edges);
        settleForces(simulation);
        const before = where(simulation.nodes());
        const alpha = simulation.alpha();
        expect(() => {
            press(simulation, 'project::gone');
            dragTo(simulation, 'project::gone', CENTRE);
            release(simulation, 'project::gone');
        }).not.toThrow();
        expect(where(simulation.nodes())).toEqual(before);
        expect(simulation.alpha()).toBe(alpha);
        expect(simulation.nodes().every((one) => one.fx == null && one.fy == null)).toBe(true);
    });

    it('leaves the edges it was given as they were', () => {
        // Revert: the edges handed to forceLink without copying have their ends rewritten to nodes.
        const before = structuredClone(graph.edges);
        settleForces(createForces(placed, graph.edges));
        expect(graph.edges).toEqual(before);
        expect(graph.edges.every((one) => typeof one.source === 'string')).toBe(true);
    });

    it('answers the settled nodes and a cold simulation for a loaded Graphviz, and none before', () => {
        // Revert: mapPlacement() answering neato's nodes unsettled, or settleForces() running no
        // tick, which leaves the simulation hot.
        const answer = mapPlacement(viz, graph, 1);
        expect(answer.failure).toBeNull();
        expect(answer.nodes).toEqual(settleForces(createForces(placed, graph.edges)));
        expect(answer.forces).not.toBeNull();
        expect(answer.forces?.alpha()).toBeLessThan(answer.forces?.alphaMin() ?? 0);
        expect(mapPlacement(null, graph, 1).forces).toBeNull();
        expect(mapPlacement('the library did not load', graph, 1).forces).toBeNull();
    });
});

describe("the Map's forces on their own", () => {
    it('pushes projects apart through the collision alone', () => {
        // Revert: the collision left out lets the huddle rest on top of each other.
        const nodes = settleForces(
            createForces(huddle(), [], DEFAULT_BOUNDS, { ...FORCES, charge: 0 })
        );
        expect(crowded(nodes, FORCES.gap)).toEqual([]);
    });

    it('pushes projects apart through the charge alone', () => {
        // Revert: the charge left out lets the huddle rest on top of each other.
        const params = { ...FORCES, gap: 0, collideStrength: 0 };
        const nodes = settleForces(createForces(huddle(), [], DEFAULT_BOUNDS, params));
        const near: string[] = [];
        for (let left = 0; left < nodes.length; left += 1) {
            for (let right = left + 1; right < nodes.length; right += 1) {
                const a = nodes[left];
                const b = nodes[right];
                if (Math.hypot(a.x - b.x, a.y - b.y) <= 20) near.push(`${a.id} and ${b.id}`);
            }
        }
        expect(near).toEqual([]);
    });

    it('audits that an empty node set settles to no node', () => {
        expect(settleForces(createForces([], []))).toEqual([]);
    });

    it('settles one node finite and inside the box', () => {
        // Revert: settleForces() running no tick leaves the node where it started, outside the box.
        const nodes = settleForces(createForces([project('project::one', 20, 900)], []));
        expect(nodes).toHaveLength(1);
        expect(finite(nodes)).toBe(true);
        expect(inside(nodes)).toBe(true);
    });

    it('parts five nodes placed on one point', () => {
        // Revert: settleForces() running no tick leaves the five on one point.
        const five = Array.from({ length: 5 }, (_, at) => project(`project::s${at}`, 300, 300));
        const nodes = settleForces(createForces(five, []));
        expect(finite(nodes)).toBe(true);
        expect(crowded(nodes, FORCES.gap)).toEqual([]);
    });

    it('builds over an edge whose target it does not hold, and leaves that edge out', () => {
        // Revert: every edge linked, its missing end included, throws while the lengths are read.
        const nodes = [project('project::a', 400, 300), project('project::b', 500, 300)];
        const edges: GraphEdge[] = [
            edge('project::a', 'project::b', 'related'),
            edge('project::a', 'project::gone', 'related')
        ];
        const simulation = createForces(nodes, edges);
        const link = simulation.force('link') as unknown as { links(): unknown[] } | undefined;
        expect(link?.links()).toHaveLength(1);
        expect(finite(settleForces(simulation))).toBe(true);
    });

    it('puts a node outside the box back inside and takes out its speed out of the box', () => {
        // Revert: clampToBox() moving the node back and keeping its speed leaves vx at -5.
        const simulation = createForces([project('project::out', 10, 900)], []);
        const [out] = simulation.nodes();
        out.vx = -5;
        out.vy = 7;
        clampToBox(simulation, DEFAULT_BOUNDS);
        expect(out.x).toBe(DEFAULT_BOUNDS.pad);
        expect(out.y).toBe(DEFAULT_BOUNDS.height - DEFAULT_BOUNDS.pad);
        expect(out.vx).toBe(0);
        expect(out.vy).toBe(0);
    });
});
