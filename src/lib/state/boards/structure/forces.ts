// Layer 2, client state. The Map's force simulation on d3-force, over every node the Map draws:
// each edge's link at the length neato gave it, a charge between every pair, a collision that keeps
// two circles `gap` apart past their two radii, and a pull toward the box centre on each axis.
// layout.ts starts it from neato's placement and runs it to rest before the first draw, and the
// view goes on with that one settled simulation, so the first drag does not jolt the picture.
//
// The charge and the collision are the same in every direction, so left to one pull the picture
// settles to a round cloud of its own size whatever the box, and a box shorter than that cloud on
// one axis would hold a row of nodes on its pad line there. So settleForces() fits the pull of each
// axis to the box: it settles, measures how far the picture reaches on each axis, strengthens the
// pull of an axis the picture overreaches and weakens the pull of one it underfills, and settles
// again, until the picture spans `fill` of the box's room on both axes; the cloud then takes the
// box's shape and no node rests on a pad line. A drag later heats the same forces, so the picture
// it settles back to keeps that shape. A press fixes the node where it is and moves nothing; a drag
// moves the fixed node and heats the simulation, so every node is pushed and pulled; a release
// frees the node and lets the simulation cool. An edge written or taken away while the Map shows
// (relink()), a node added or taken away (renode()) and a pane that changes its size (recentre())
// change the simulation in place and heat nothing, so no node the graph keeps is laid out anew.
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
import {
    LINK_LENGTH,
    type Bounds,
    type Graph,
    type GraphEdge,
    type GraphNode,
    type PointNode
} from './graph';

/**
 * The simulation's parameters: the charge between every pair and the distance past which it acts no
 * more, the room the collision keeps between two circles past their two radii, the collision's
 * strength and its passes per tick, the pull toward the box centre the first settle starts from,
 * and the alpha a drag holds the simulation at. A parameter at 0 leaves its force out. `fill` is
 * the share of the box's room, less its pad, the settled picture aims to span on each axis,
 * `fitRounds` the most settles the fit of the pulls runs, `fitLow` and `fitHigh` the least and the
 * most of that aim a span counts as fitted (a span a little past the aim still leaves a drag room
 * before the pad), and `refitHeat` the alpha a round after the first settles from.
 */
export type Forces = {
    charge: number;
    chargeMax: number;
    gap: number;
    collideStrength: number;
    collideIterations: number;
    center: number;
    dragHeat: number;
    fill: number;
    fitRounds: number;
    fitLow: number;
    fitHigh: number;
    refitHeat: number;
};

export const FORCES: Forces = {
    charge: -120,
    chargeMax: 300,
    gap: 4,
    collideStrength: 1,
    collideIterations: 2,
    center: 0.02,
    dragHeat: 0.3,
    fill: 0.9,
    fitRounds: 8,
    fitLow: 0.85,
    fitHigh: 1.03,
    refitHeat: 0.1
};

/** A node as the simulation holds it: a placed node, with the fixed point a press gives it. */
export type ForceNode = PointNode & SimulationNodeDatum;

/** A link as the simulation holds it: a copy of an edge, whose ends forceLink turns into nodes. */
export type ForceLink = GraphEdge & SimulationLinkDatum<ForceNode>;

export type MapForces = Simulation<ForceNode, ForceLink>;

/** The link force of a Map's simulation, which holds the links and the length each rests at. */
type LinkForce = ReturnType<typeof forceLink<ForceNode, ForceLink>>;

/** The collision force of a Map's simulation, which holds each node's radius. */
type CollideForce = ReturnType<typeof forceCollide<ForceNode>>;

/** A pull of a Map's simulation toward the box centre along one axis. */
type PullForce = ReturnType<typeof forceX<ForceNode>> | ReturnType<typeof forceY<ForceNode>>;

/** How far apart a link's two ends stand now. */
function standing(source: ForceNode, target: ForceNode): number {
    return Math.hypot(target.x - source.x, target.y - source.y);
}

/**
 * The links of every edge whose two ends are both among the nodes (forceLink rewrites a link's ends
 * to nodes and throws on an id it does not hold), each with the length it rests at: the one `kept`
 * holds for its edge, else its length as the nodes stand.
 */
function linksOf(
    nodes: ForceNode[],
    edges: GraphEdge[],
    kept: ReadonlyMap<string, number>
): { links: ForceLink[]; lengths: Map<string, number> } {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const links: ForceLink[] = [];
    const lengths = new Map<string, number>();
    for (const edge of edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (source === undefined || target === undefined) continue;
        links.push({ ...edge });
        lengths.set(edge.id, kept.get(edge.id) ?? standing(source, target));
    }
    return { links, lengths };
}

/**
 * A stopped simulation over copies of the nodes, with a link over a copy of every edge whose two
 * ends are both among them, each resting at its length as the nodes stand, which is neato's
 * placement.
 */
export function createForces(
    nodes: PointNode[],
    edges: GraphEdge[],
    bounds: Bounds,
    params: Forces = FORCES
): MapForces {
    const copies: ForceNode[] = nodes.map((node) => ({ ...node }));
    const { links, lengths } = linksOf(copies, edges, new Map());
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
    if (params.center !== 0) pull(simulation, bounds, params.center, params.center);
    return simulation;
}

/**
 * The strongest pull toward the centre a fit sets. d3 moves a node by its distance to the centre
 * times the strength at each tick, so a strength past 1 carries it beyond the centre by more than
 * it was away, each tick further, until the positions are no numbers; a box with little room asks
 * for such a pull.
 */
const MAX_PULL = 1;

/** A fitted pull kept to the range a tick stays stable in. */
function stable(strength: number): number {
    return Math.min(MAX_PULL, strength);
}

/** Pull every node toward the box's centre, with the strength `x` across and `y` down. */
function pull(simulation: MapForces, bounds: Bounds, x: number, y: number): void {
    simulation.force('x', forceX<ForceNode>(bounds.width / 2).strength(stable(x)));
    simulation.force('y', forceY<ForceNode>(bounds.height / 2).strength(stable(y)));
}

/** The strength of the simulation's pull along one axis, 0 when it has none. */
function pullOf(simulation: MapForces, axis: 'x' | 'y'): number {
    const force = simulation.force<PullForce>(axis);
    const nodes = simulation.nodes();
    if (force === undefined || nodes.length === 0) return 0;
    return force.strength()(nodes[0], 0, nodes);
}

/** How far the picture reaches on each axis, from the edge of one circle to the edge of another. */
function reach(simulation: MapForces): { x: number; y: number; midX: number; midY: number } {
    const nodes = simulation.nodes();
    const left = Math.min(...nodes.map((node) => node.x - node.radius));
    const right = Math.max(...nodes.map((node) => node.x + node.radius));
    const top = Math.min(...nodes.map((node) => node.y - node.radius));
    const bottom = Math.max(...nodes.map((node) => node.y + node.radius));
    return { x: right - left, y: bottom - top, midX: (left + right) / 2, midY: (top + bottom) / 2 };
}

/** The room the box gives the picture on one axis: its span less its pad, at the share `fill`. */
function room(span: number, bounds: Bounds, params: Forces): number {
    return Math.max(1, (span - bounds.pad * 2) * params.fill);
}

/**
 * Every node put back inside the box less its pad, and the part of its speed that points out of
 * the box taken out, so the next tick does not carry it out again.
 */
export function clampToBox(simulation: MapForces, bounds: Bounds): void {
    const [left, right] = [bounds.pad, bounds.width - bounds.pad];
    const [top, bottom] = [bounds.pad, bounds.height - bounds.pad];
    for (const node of simulation.nodes()) {
        if (node.x < left) [node.x, node.vx] = [left, Math.max(0, node.vx)];
        if (node.x > right) [node.x, node.vx] = [right, Math.min(0, node.vx)];
        if (node.y < top) [node.y, node.vy] = [top, Math.max(0, node.vy)];
        if (node.y > bottom) [node.y, node.vy] = [bottom, Math.min(0, node.vy)];
    }
}

/** A copy of every node as the simulation holds it now. */
export function forceNodes(simulation: MapForces): PointNode[] {
    return simulation.nodes().map((node) => ({ ...node }));
}

/** The simulation run from `alpha` until alpha falls below alphaMin: from 1, 300 ticks. */
function toRest(simulation: MapForces, alpha: number): void {
    simulation.alpha(alpha);
    while (simulation.alpha() >= simulation.alphaMin()) simulation.tick();
}

/**
 * The pull that brings an axis's reach from `reached` to `aim`. The reach of a cloud held by a pull
 * goes about as one over the root of the pull; once two rounds have settled under two pulls, the
 * power is read from them instead, kept between -2 and -0.1. The pull is kept at most MAX_PULL.
 */
function pullFor(
    now: { pull: number; reached: number },
    before: { pull: number; reached: number } | null,
    aim: number
): number {
    let power = -0.5;
    if (before !== null && before.pull !== now.pull && before.reached !== now.reached) {
        const read = Math.log(now.reached / before.reached) / Math.log(now.pull / before.pull);
        power = Math.min(-0.1, Math.max(-2, read));
    }
    return stable(now.pull * (aim / now.reached) ** (1 / power));
}

/**
 * The simulation run to rest with the pull of each axis fitted to the box, answering copies of its
 * nodes. The first round's pulls keep the strength the simulation was made with on average and are
 * set apart by the box's shape, so a wide box starts with a weaker pull across than down. Each
 * round settles with no box, so the picture reaches as far as its forces take it, and measures that
 * reach against its aim, a share `fill` of the box's room: a reach between `fitLow` and `fitHigh`
 * of the aim on both axes ends the fit. Otherwise each axis gets the pull pullFor() gives, the
 * picture is stretched about its middle to the aim on each axis, and the next round settles from
 * `refitHeat` rather than from 1, since the stretched picture is near its new rest. At most
 * `fitRounds` rounds run. The picture is then centred in the box and kept inside it, and the
 * simulation is left settled and cold, the one the view goes on with. A simulation with no pull
 * settles once.
 */
export function settleForces(
    simulation: MapForces,
    bounds: Bounds,
    params: Forces = FORCES
): PointNode[] {
    const rounds = params.center === 0 || simulation.nodes().length === 0 ? 1 : params.fitRounds;
    const aim = { x: room(bounds.width, bounds, params), y: room(bounds.height, bounds, params) };
    let pulls = { x: pullOf(simulation, 'x'), y: pullOf(simulation, 'y') };
    if (rounds > 1) {
        const mean = Math.sqrt(aim.x * aim.y);
        pulls = {
            x: stable(pulls.x * (mean / aim.x) ** 2),
            y: stable(pulls.y * (mean / aim.y) ** 2)
        };
        pull(simulation, bounds, pulls.x, pulls.y);
    }
    let before: { x: number; y: number; reachX: number; reachY: number } | null = null;
    for (let round = 1; ; round += 1) {
        toRest(simulation, round === 1 ? 1 : params.refitHeat);
        const reached = reach(simulation);
        const over = [reached.x / aim.x, reached.y / aim.y];
        const fitted = over.every((one) => one >= params.fitLow && one <= params.fitHigh);
        if (fitted || round >= rounds) break;
        const next = {
            x: pullFor(
                { pull: pulls.x, reached: reached.x },
                before === null ? null : { pull: before.x, reached: before.reachX },
                aim.x
            ),
            y: pullFor(
                { pull: pulls.y, reached: reached.y },
                before === null ? null : { pull: before.y, reached: before.reachY },
                aim.y
            )
        };
        before = { ...pulls, reachX: reached.x, reachY: reached.y };
        pulls = next;
        for (const node of simulation.nodes()) {
            node.x = reached.midX + (node.x - reached.midX) * (aim.x / reached.x);
            node.y = reached.midY + (node.y - reached.midY) * (aim.y / reached.y);
        }
        pull(simulation, bounds, pulls.x, pulls.y);
    }
    const reached = reach(simulation);
    for (const node of simulation.nodes()) {
        node.x += bounds.width / 2 - reached.midX;
        node.y += bounds.height / 2 - reached.midY;
    }
    clampToBox(simulation, bounds);
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

/**
 * The simulation brought to the graph as it is now, over the nodes it holds, with no node moved and
 * nothing heated: each node takes the graph's radius, which its edges' count sets, and the links
 * are the graph's edges, an edge the simulation held resting at the length it rested at and an edge
 * written since resting at its length as its ends stand. So a link written in the Map's link mode,
 * or one taken away, leaves every node where it is, and the forces act on the new edges at the next
 * drag.
 */
export function relink(simulation: MapForces, graph: Graph): void {
    const nodes = simulation.nodes();
    const radii = new Map(graph.nodes.map((node) => [node.id, node.radius]));
    for (const node of nodes) node.radius = radii.get(node.id) ?? node.radius;
    const link = simulation.force<LinkForce>('link');
    if (link !== undefined) {
        const rest = link.distance();
        const held = link.links();
        const kept = new Map(held.map((one, at) => [one.id, rest(one, at, held)]));
        const { links, lengths } = linksOf(nodes, graph.edges, kept);
        link.links(links).distance((one) => lengths.get(one.id) ?? 0);
    }
    // forceCollide reads the radii when it is handed its accessor, so it is handed it again.
    const collide = simulation.force<CollideForce>('collide');
    collide?.radius(collide.radius());
}

/** The ring of spots a new node is tried at around its anchor: twelve directions, at each step. */
const SPOT_TURNS = 12;
const SPOT_STEPS = [0, 0.5, 1, 1.5, 2, 3, 4];

/**
 * Where a node new to the simulation goes: around the middle of the placed nodes it is linked to,
 * or around the box's centre when it is linked to none, at the first spot inside the box less its
 * pad whose circle keeps `gap` clear of every placed circle. The spots are tried nearest first, at
 * steps of half a link's length, each ring starting from the direction that points away from the
 * box's centre, so a new node lands on the outside of the nodes it joins. A node no spot fits is
 * put at its anchor.
 */
function spotFor(
    node: GraphNode,
    edges: GraphEdge[],
    placed: ForceNode[],
    bounds: Bounds,
    params: Forces
): { x: number; y: number } {
    const byId = new Map(placed.map((one) => [one.id, one]));
    const linked = edges.flatMap((edge) => {
        const other =
            edge.source === node.id ? edge.target : edge.target === node.id ? edge.source : null;
        const found = other === null ? undefined : byId.get(other);
        return found === undefined ? [] : [found];
    });
    const [midX, midY] = [bounds.width / 2, bounds.height / 2];
    const anchor =
        linked.length === 0
            ? { x: midX, y: midY }
            : {
                  x: linked.reduce((sum, one) => sum + one.x, 0) / linked.length,
                  y: linked.reduce((sum, one) => sum + one.y, 0) / linked.length
              };
    const outward = Math.atan2(anchor.y - midY, anchor.x - midX);
    const inside = (x: number, y: number): boolean =>
        x >= bounds.pad &&
        x <= bounds.width - bounds.pad &&
        y >= bounds.pad &&
        y <= bounds.height - bounds.pad;
    const clear = (x: number, y: number): boolean =>
        placed.every(
            (one) => Math.hypot(one.x - x, one.y - y) >= one.radius + node.radius + params.gap
        );
    for (const step of SPOT_STEPS) {
        const turns = step === 0 ? 1 : SPOT_TURNS;
        for (let turn = 0; turn < turns; turn += 1) {
            const angle = outward + (turn * 2 * Math.PI) / SPOT_TURNS;
            const x = anchor.x + Math.cos(angle) * step * LINK_LENGTH;
            const y = anchor.y + Math.sin(angle) * step * LINK_LENGTH;
            if (inside(x, y) && clear(x, y)) return { x, y };
        }
    }
    return anchor;
}

/**
 * The simulation brought to the graph's node set, with every node it keeps left where it is: a node
 * the graph no longer holds is taken out with its links, and a node new to it is placed by
 * spotFor(), one after another in the graph's order, so a later new node sees the earlier ones.
 * Nothing is heated; the links are then brought to the graph by relink(). Answers whether the node
 * set changed.
 */
export function renode(
    simulation: MapForces,
    graph: Graph,
    bounds: Bounds,
    params: Forces = FORCES
): boolean {
    const held = new Map(simulation.nodes().map((node) => [node.id, node]));
    const wanted = new Set(graph.nodes.map((node) => node.id));
    const same = held.size === wanted.size && [...wanted].every((id) => held.has(id));
    if (same) return false;
    const nodes = simulation.nodes().filter((node) => wanted.has(node.id));
    // The links lose every end taken out before the nodes are handed over, since forceLink counts
    // each link's ends by the index the nodes held.
    const link = simulation.force<LinkForce>('link');
    link?.links(
        link.links().filter((one) => {
            const [source, target] = [endOf(one.source, held), endOf(one.target, held)];
            return (
                source !== undefined &&
                target !== undefined &&
                wanted.has(source.id) &&
                wanted.has(target.id)
            );
        })
    );
    for (const node of graph.nodes) {
        if (held.has(node.id)) continue;
        const spot = spotFor(node, graph.edges, nodes, bounds, params);
        nodes.push({ ...node, x: spot.x, y: spot.y, vx: 0, vy: 0 });
    }
    simulation.nodes(nodes);
    relink(simulation, graph);
    return true;
}

/**
 * The simulation moved from the box `from` into the box `to`, a pane that changed its size. The
 * picture is moved so its middle stays at the box's centre, every node keeping its place against
 * the others, and a pressed node's fixed point moves with it. A picture whose centres span more
 * than the new box's room less its pad is shrunk about that centre by one factor on both axes to
 * `fill` of the room, so it keeps its shape and no node rests on the box's edge; a picture shrunk
 * by an earlier box grows back the same way as the room returns, never past the size it settled
 * at. Each link's resting length is then scaled by the same factor and each pull strengthened by
 * one over its square (settleForces() reads a pull's reach as one over its root), so a drag settles
 * the picture back at its new size. The pulls aim at the new centre. Nothing is heated. `scaled`
 * is the size the picture is drawn at against the size it settled at, and the answer is its size
 * after the move.
 */
export function recentre(
    simulation: MapForces,
    from: Bounds,
    to: Bounds,
    scaled = 1,
    params: Forces = FORCES
): number {
    const nodes = simulation.nodes();
    if (nodes.length === 0) return scaled;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const span = {
        x: Math.max(...xs) - Math.min(...xs),
        y: Math.max(...ys) - Math.min(...ys)
    };
    const fit = (spanned: number, size: number): number =>
        spanned > 0 ? ((size - to.pad * 2) * params.fill) / spanned : Infinity;
    const scale = Math.min(1 / scaled, fit(span.x, to.width), fit(span.y, to.height));
    const [fromX, fromY] = [from.width / 2, from.height / 2];
    const [toX, toY] = [to.width / 2, to.height / 2];
    const moved = (value: number, centre: number, next: number): number =>
        next + (value - centre) * scale;
    for (const node of nodes) {
        node.x = moved(node.x, fromX, toX);
        node.y = moved(node.y, fromY, toY);
        if (typeof node.fx === 'number') node.fx = moved(node.fx, fromX, toX);
        if (typeof node.fy === 'number') node.fy = moved(node.fy, fromY, toY);
    }
    if (scale !== 1) {
        const link = simulation.force<LinkForce>('link');
        if (link !== undefined) {
            const rest = link.distance();
            const links = link.links();
            const lengths = new Map(links.map((one, at) => [one.id, rest(one, at, links) * scale]));
            link.distance((one) => lengths.get(one.id) ?? 0);
        }
    }
    if (params.center === 0) return scaled * scale;
    const strength = 1 / scale ** 2;
    pull(simulation, to, pullOf(simulation, 'x') * strength, pullOf(simulation, 'y') * strength);
    return scaled * scale;
}

/**
 * A link's end as a node of the simulation: forceLink puts the node itself in place of the id once
 * the link is in a simulation, and an end still held as an id is looked up by it.
 */
function endOf(end: unknown, byId: ReadonlyMap<string, ForceNode>): ForceNode | undefined {
    return typeof end === 'object' && end !== null ? (end as ForceNode) : byId.get(String(end));
}
