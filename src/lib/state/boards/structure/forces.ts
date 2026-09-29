// Layer 2, client state. The Map's force simulation on d3-force, over every node the Map draws:
// each edge's link at the length neato gave it, a charge between every pair, a collision that keeps
// two circles `gap` apart past their two radii, and a pull toward the box centre. layout.ts starts
// it from neato's placement and runs it to rest once before the first draw, and the view goes on
// with that one settled simulation, so the first drag does not jolt the picture. A press fixes
// the node where it is and moves nothing; a drag moves the fixed node and heats the simulation, so
// every node is pushed and pulled; a release frees the node and lets the simulation cool.
//
// A d3 force runs before the move of its tick and cannot bound where the move lands, so the box is
// kept by clampToBox() after every tick. Every function here is pure of the DOM: the simulation is
// answered stopped, and only the view restarts it, so no d3 timer ticks outside a page.

import {
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
    forceX,
    forceY,
    type Simulation,
    type SimulationLinkDatum,
    type SimulationNodeDatum
} from 'd3-force';
import { DEFAULT_BOUNDS, type Bounds, type GraphEdge, type PointNode } from './graph';

/**
 * The simulation's parameters: the charge between every pair and the distance past which it acts
 * no more, the room the collision keeps between two circles past their two radii, the collision's
 * strength and its passes per tick, the pull toward the box centre, and the alpha a drag holds the
 * simulation at. A parameter at 0 leaves its force out.
 */
export type Forces = {
    charge: number;
    chargeMax: number;
    gap: number;
    collideStrength: number;
    collideIterations: number;
    center: number;
    dragHeat: number;
};

export const FORCES: Forces = {
    charge: -120,
    chargeMax: 300,
    gap: 4,
    collideStrength: 1,
    collideIterations: 2,
    center: 0.02,
    dragHeat: 0.3
};

/** A node as the simulation holds it: a placed node, with the fixed point a press gives it. */
export type ForceNode = PointNode & SimulationNodeDatum;

/** A link as the simulation holds it: a copy of an edge, whose ends forceLink turns into nodes. */
export type ForceLink = GraphEdge & SimulationLinkDatum<ForceNode>;

export type MapForces = Simulation<ForceNode, ForceLink>;

/**
 * A stopped simulation over copies of the nodes, with a link over a copy of every edge whose two
 * ends are both among them (forceLink rewrites a link's ends to nodes and throws on an id it does
 * not hold), each resting at its length as the nodes stand, which is neato's placement.
 */
export function createForces(
    nodes: PointNode[],
    edges: GraphEdge[],
    bounds: Bounds = DEFAULT_BOUNDS,
    params: Forces = FORCES
): MapForces {
    const copies: ForceNode[] = nodes.map((node) => ({ ...node }));
    const byId = new Map(copies.map((node) => [node.id, node]));
    const links: ForceLink[] = [];
    const lengths = new Map<string, number>();
    for (const edge of edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (source === undefined || target === undefined) continue;
        links.push({ ...edge });
        lengths.set(edge.id, Math.hypot(target.x - source.x, target.y - source.y));
    }
    const simulation = forceSimulation<ForceNode, ForceLink>(copies).stop();
    simulation.force(
        'link',
        forceLink<ForceNode, ForceLink>(links)
            .id((node) => node.id)
            .distance((link) => lengths.get(link.id) ?? 0)
    );
    if (params.charge !== 0) {
        simulation.force(
            'charge',
            forceManyBody<ForceNode>().strength(params.charge).distanceMax(params.chargeMax)
        );
    }
    if (params.collideStrength !== 0 && params.collideIterations !== 0) {
        simulation.force(
            'collide',
            forceCollide<ForceNode>((node) => node.radius + params.gap / 2)
                .strength(params.collideStrength)
                .iterations(params.collideIterations)
        );
    }
    if (params.center !== 0) {
        simulation.force('x', forceX<ForceNode>(bounds.width / 2).strength(params.center));
        simulation.force('y', forceY<ForceNode>(bounds.height / 2).strength(params.center));
    }
    return simulation;
}

/**
 * Every node put back inside the box less its pad, and the part of its speed that points out of
 * the box taken out, so the next tick does not carry it out again.
 */
export function clampToBox(simulation: MapForces, bounds: Bounds = DEFAULT_BOUNDS): void {
    const [left, right] = [bounds.pad, bounds.width - bounds.pad];
    const [top, bottom] = [bounds.pad, bounds.height - bounds.pad];
    for (const node of simulation.nodes()) {
        if (node.x < left) [node.x, node.vx] = [left, Math.max(0, node.vx)];
        if (node.x > right) [node.x, node.vx] = [right, Math.min(0, node.vx)];
        if (node.y < top) [node.y, node.vy] = [top, Math.max(0, node.vy)];
        if (node.y > bottom) [node.y, node.vy] = [bottom, Math.min(0, node.vy)];
    }
}

/** `ticks` ticks of the simulation, each followed by clampToBox(). */
export function advance(
    simulation: MapForces,
    ticks: number,
    bounds: Bounds = DEFAULT_BOUNDS
): void {
    for (let tick = 0; tick < ticks; tick += 1) {
        simulation.tick();
        clampToBox(simulation, bounds);
    }
}

/** A copy of every node as the simulation holds it now. */
export function forceNodes(simulation: MapForces): PointNode[] {
    return simulation.nodes().map((node) => ({ ...node }));
}

/**
 * The simulation run to rest: advance() until alpha falls below alphaMin, which from alpha 1 at
 * d3's decay is 300 ticks, answering copies of its nodes. The simulation is left settled and cold,
 * and is the one the view goes on with.
 */
export function settleForces(simulation: MapForces, bounds: Bounds = DEFAULT_BOUNDS): PointNode[] {
    while (simulation.alpha() >= simulation.alphaMin()) advance(simulation, 1, bounds);
    return forceNodes(simulation);
}

function nodeOf(simulation: MapForces, id: string): ForceNode | undefined {
    return simulation.nodes().find((node) => node.id === id);
}

/** Fix a node where it lies. Nothing ticks and nothing restarts, so no node moves. */
export function press(simulation: MapForces, id: string): void {
    const node = nodeOf(simulation, id);
    if (node === undefined) return;
    node.fx = node.x;
    node.fy = node.y;
}

/**
 * Move the fixed node to a point, where the next tick's forces already see it, and hold the
 * simulation at the drag's alpha so every node is pushed and pulled.
 */
export function dragTo(
    simulation: MapForces,
    id: string,
    point: { x: number; y: number },
    params: Forces = FORCES
): void {
    const node = nodeOf(simulation, id);
    if (node === undefined) return;
    [node.fx, node.fy, node.x, node.y, node.vx, node.vy] = [
        point.x,
        point.y,
        point.x,
        point.y,
        0,
        0
    ];
    simulation.alphaTarget(params.dragHeat);
}

/** Let the simulation cool to rest and free the node, which takes part in it again. */
export function release(simulation: MapForces, id: string): void {
    simulation.alphaTarget(0);
    const node = nodeOf(simulation, id);
    if (node === undefined) return;
    node.fx = null;
    node.fy = null;
}
