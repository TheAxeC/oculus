// Layer 2, client state. The Map's pure graph builder, the chips its filters draw, the start seed a
// pane keeps for its node set (`layoutKey`, `layoutSeed`, `startFor`, `nextStart`), and `physics`,
// the force tick that runs while a node is dragged so the dragged node pulls its neighbours. The
// placement itself is Graphviz's neato, in layout.ts beside this file. Every visible-set, seed and
// tick rule is independent of the DOM so it can be checked without a browser. It sits in
// state/boards/structure beside the Pillars and Domains joins, the pure halves of the Structure
// views.

import type { Project, Snapshot } from '../../../data/model/index.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { personNames } from '../person.ts';

export type GraphKind = 'project' | 'line' | 'collaborator';
export type EdgeKind = 'membership' | 'collaborator' | 'related';
export type Direction = 'none' | 'one' | 'mutual';

export type GraphNode = {
    id: string;
    entityId: string;
    label: string;
    kind: GraphKind;
    type?: string;
    archived?: string;
    degree: number;
    radius: number;
};

export type GraphEdge = {
    id: string;
    source: string;
    target: string;
    kind: EdgeKind;
    direction: Direction;
    archived: boolean;
};

export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

/**
 * Which part of a built graph is drawn. An empty or absent list means every one of its kind, so a
 * saved Map state that names no filter draws the whole graph.
 */
export type GraphFilter = {
    /** The project types drawn. */
    types?: string[];
    /** The pillars drawn, by their registry key. */
    lines?: string[];
    /** Drop a project with no membership edge to a line that is still drawn. */
    connected?: boolean;
};

export type GraphOptions = GraphFilter & {
    archived?: string[];
    collaborators?: boolean;
    labelMode?: string;
};

export type PointNode = GraphNode & { x: number; y: number; vx: number; vy: number };
export type Bounds = { width: number; height: number; pad: number };
/**
 * The drag's forces: each edge's spring, the length an edge with no recorded length rests at, the
 * share of its speed a moving node keeps from one frame to the next, and the room the push keeps
 * between two nodes past their two radii.
 */
export type Physics = {
    linkLength: number;
    linkStrength: number;
    damping: number;
    gap: number;
};

export const DEFAULT_PHYSICS: Physics = {
    linkLength: 107,
    linkStrength: 0.042,
    damping: 0.6,
    gap: 4
};

/**
 * How far a node moves per unit of speed in one frame of a drag, the largest move in a frame below
 * which the drag stops, the most frames one settle runs, and the most passes the push makes in one
 * frame. The step is fixed, so a settle runs until no mover moves REST in a frame; the push repeats
 * because a pair pushed apart can push a node back into one an earlier pair pushed it off.
 */
export const DRAG_STEP = 0.4;
export const REST = 0.01;
export const MAX_FRAMES = 2000;
export const PUSH_PASSES = 10;

/** The box the Map draws into, which is the box every layout rule below places nodes in. */
export const DEFAULT_BOUNDS: Bounds = { width: 1000, height: 680, pad: 48 };

function archived(project: Project): string | undefined {
    return project.tier === 'archive' || project.tier === 'coauthor' ? project.type : undefined;
}

/** Build only nodes reached by visible projects and only edges whose two ends are visible. */
export function buildGraph(snapshot: Snapshot, options: GraphOptions = {}): Graph {
    const enabled = new Set(options.archived ?? []);
    const projects = Object.values(snapshot.entities.projects);
    const all = new Map(projects.map((project) => [project.id, project]));
    const visible = projects.filter((project) => {
        const status = archived(project);
        return status === undefined || enabled.has(status);
    });
    const visibleIds = new Set(visible.map((project) => project.id));
    const nodes: GraphNode[] = visible.map((project) => ({
        id: `project::${project.id}`,
        entityId: project.id,
        label:
            options.labelMode === 'title' || project.short?.trim() === ''
                ? project.title
                : (project.short ?? project.title),
        kind: 'project',
        type: project.type,
        ...(archived(project) === undefined ? {} : { archived: archived(project) }),
        degree: 0,
        radius: 7
    }));
    const edges: GraphEdge[] = [];
    const lineIds = new Set<string>();
    const collaboratorIds = new Set<string>();

    for (const project of visible) {
        for (const line of project.pillarIds) {
            lineIds.add(line);
            edges.push({
                id: `membership::${project.id}::${line}`,
                source: `project::${project.id}`,
                target: `line::${line}`,
                kind: 'membership',
                direction: 'none',
                archived: archived(project) !== undefined
            });
        }
        if (options.collaborators === true) {
            for (const person of project.collaborators) {
                collaboratorIds.add(person);
                edges.push({
                    id: `collaborator::${project.id}::${person}`,
                    source: `project::${project.id}`,
                    target: `collaborator::${person}`,
                    kind: 'collaborator',
                    direction: 'none',
                    archived: archived(project) !== undefined
                });
            }
        }
    }

    const directed = new Set<string>();
    for (const project of visible) {
        for (const target of project.relatedIds) {
            if (target !== project.id && visibleIds.has(target) && all.has(target)) {
                directed.add(`${project.id}\0${target}`);
            }
        }
    }
    const pairs = new Set<string>();
    for (const key of [...directed].sort()) {
        const [source, target] = key.split('\0');
        const pair = [source, target].sort().join('\0');
        if (pairs.has(pair)) continue;
        pairs.add(pair);
        const from = all.get(source);
        const to = all.get(target);
        if (from === undefined || to === undefined) continue;
        const mutual = directed.has(`${target}\0${source}`);
        edges.push({
            id: `related::${pair.replace('\0', '::')}`,
            source: `project::${source}`,
            target: `project::${target}`,
            kind: 'related',
            direction: mutual ? 'mutual' : 'one',
            archived: archived(from) !== undefined || archived(to) !== undefined
        });
    }

    for (const id of lineIds) {
        const line = byKey(snapshot.entities.pillars, id);
        nodes.push({
            id: `line::${id}`,
            entityId: id,
            label: line?.title ?? id,
            kind: 'line',
            degree: 0,
            radius: 11
        });
    }
    const names = personNames(snapshot);
    for (const id of collaboratorIds) {
        nodes.push({
            id: `collaborator::${id}`,
            entityId: id,
            label: byKey(names, id) ?? id,
            kind: 'collaborator',
            degree: 0,
            radius: 11
        });
    }

    return filterGraph({ nodes, edges }, options);
}

/**
 * The degree and the drawn size of every node, from the edges that reached it. A node is copied
 * rather than written to, so measuring a graph leaves the one it was given as it was.
 */
function measure(nodes: GraphNode[], edges: GraphEdge[]): Graph {
    const degrees = new Map(nodes.map((node) => [node.id, 0]));
    for (const edge of edges) {
        for (const end of [edge.source, edge.target]) {
            const held = degrees.get(end);
            if (held !== undefined) degrees.set(end, held + 1);
        }
    }
    return {
        nodes: nodes.map((node) => {
            const degree = degrees.get(node.id) ?? 0;
            return {
                ...node,
                degree,
                radius: (node.kind === 'project' ? 7 : 11) + Math.min(4, degree)
            };
        }),
        edges
    };
}

/** The nodes of a graph, as the set of their ids. */
function idsOf(nodes: GraphNode[]): Set<string> {
    return new Set(nodes.map((node) => node.id));
}

/** The edges whose two ends are both in a set of nodes. */
function joining(edges: GraphEdge[], kept: Set<string>): GraphEdge[] {
    return edges.filter((edge) => kept.has(edge.source) && kept.has(edge.target));
}

/**
 * The part of a graph one Map instance draws, as a pure function over the whole of it. The three
 * rules run in order: the types and the lines take their own nodes out, `connected` then takes out
 * a project left with no membership edge, and a line or a collaborator whose projects have all gone
 * leaves with them, since such a node is in the graph only to carry a project's edge.
 */
export function filterGraph(graph: Graph, filter: GraphFilter = {}): Graph {
    const types = new Set(filter.types ?? []);
    const lines = new Set(filter.lines ?? []);
    let nodes = graph.nodes.filter((node) => {
        // A project whose manifest names no type is outside the type filter rather than under it:
        // the row carries no chip for it, so a filter that dropped it could not bring it back.
        if (node.kind === 'project') {
            return types.size === 0 || node.type === undefined || types.has(node.type);
        }
        if (node.kind === 'line') return lines.size === 0 || lines.has(node.entityId);
        return true;
    });
    let edges = joining(graph.edges, idsOf(nodes));
    if (filter.connected === true) {
        const joined = new Set(
            edges.filter((edge) => edge.kind === 'membership').map((edge) => edge.source)
        );
        nodes = nodes.filter((node) => node.kind !== 'project' || joined.has(node.id));
        edges = joining(edges, idsOf(nodes));
    }
    const ends = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    nodes = nodes.filter((node) => node.kind === 'project' || ends.has(node.id));
    return measure(nodes, edges);
}

/**
 * A saved filter narrowed to what one graph holds: a type or a line the graph no longer draws is
 * dropped from its list, and a list left empty by that is nothing filtered, so a map saved against
 * a portfolio that has since changed opens on the whole graph rather than on an empty canvas.
 */
export function presentFilter(graph: Graph, filter: GraphFilter = {}): Required<GraphFilter> {
    const types = new Set<string>();
    const lines = new Set<string>();
    for (const node of graph.nodes) {
        if (node.kind === 'project' && node.type !== undefined) types.add(node.type);
        if (node.kind === 'line') lines.add(node.entityId);
    }
    return {
        types: (filter.types ?? []).filter((type) => types.has(type)),
        lines: (filter.lines ?? []).filter((id) => lines.has(id)),
        connected: filter.connected === true
    };
}

/**
 * One press of a filter control. Nothing filtered is every one of its kind drawn, so the first
 * press narrows to the one pressed; after that a press adds or removes, and taking the last one out
 * is nothing filtered again rather than an empty map.
 */
export function toggleFilter(list: string[], id: string): string[] {
    if (list.length === 0) return [id];
    return list.includes(id) ? list.filter((one) => one !== id) : [...list, id];
}

/** How many projects of each type a graph draws, which is the count one filter carries. */
export function typeCounts(graph: Graph): Record<string, number> {
    const counted: Record<string, number> = {};
    for (const node of graph.nodes) {
        if (node.kind !== 'project' || node.type === undefined) continue;
        counted[node.type] = (counted[node.type] ?? 0) + 1;
    }
    return counted;
}

/** How many projects each line holds a membership edge from, by the line's registry key. */
export function lineCounts(graph: Graph): Record<string, number> {
    const keys = new Map(
        graph.nodes.filter((node) => node.kind === 'line').map((node) => [node.id, node.entityId])
    );
    const counted: Record<string, number> = {};
    for (const edge of graph.edges) {
        if (edge.kind !== 'membership') continue;
        const id = keys.get(edge.target);
        if (id === undefined) continue;
        counted[id] = (counted[id] ?? 0) + 1;
    }
    return counted;
}

/**
 * The archive statuses the Map offers a toggle for: every type of an archived or coauthor project,
 * each with the colour `arch_color` of the merged config gives it where it gives one.
 */
export function archiveStatuses(
    snapshot: Snapshot | null,
    colors: unknown
): { status: string; color?: string }[] {
    const found = new Set<string>();
    for (const project of Object.values(snapshot?.entities.projects ?? {})) {
        if ((project.tier === 'archive' || project.tier === 'coauthor') && project.type) {
            found.add(project.type);
        }
    }
    const map =
        typeof colors === 'object' && colors !== null && !Array.isArray(colors)
            ? (colors as Record<string, unknown>)
            : {};
    return [...found].map((status) => {
        const color = map[status];
        return { status, ...(typeof color === 'string' ? { color } : {}) };
    });
}

/**
 * One chip per project type the base graph holds: the types `type_order` of the merged config names
 * first, in its order, then the rest by name, each with how many the drawn graph holds and whether
 * the filter shows it (an empty filter shows every type).
 */
export function typeFilters(
    base: Graph,
    drawn: Graph,
    order: unknown,
    types: string[]
): { type: string; count: number; shown: boolean }[] {
    const ordered = (Array.isArray(order) ? order : []).filter(
        (one): one is string => typeof one === 'string'
    );
    const counted = typeCounts(drawn);
    const names = Object.keys(typeCounts(base));
    const rest = names.filter((type) => !ordered.includes(type)).sort();
    return [...ordered.filter((type) => names.includes(type)), ...rest].map((type) => ({
        type,
        count: counted[type] ?? 0,
        shown: types.length === 0 || types.includes(type)
    }));
}

/**
 * One chip per line the base graph holds: in the registry's order, then any it does not list, each
 * with its label, how many projects the drawn graph gives it and whether the filter shows it.
 */
export function lineFilters(
    base: Graph,
    drawn: Graph,
    snapshot: Snapshot | null,
    lines: string[]
): { id: string; title: string; count: number; shown: boolean }[] {
    const counted = lineCounts(drawn);
    const present = base.nodes.filter((node) => node.kind === 'line');
    const order = Object.keys(snapshot?.entities.pillars ?? {});
    const ids = present.map((node) => node.entityId);
    const listed = [
        ...order.filter((id) => ids.includes(id)),
        ...ids.filter((id) => !order.includes(id))
    ];
    return listed.map((id) => ({
        id,
        title: present.find((node) => node.entityId === id)?.label ?? id,
        count: counted[id] ?? 0,
        shown: lines.length === 0 || lines.includes(id)
    }));
}

/** Whether any project names a line or a related project, which is what gives the Map an edge. */
export function hasRelationships(snapshot: Snapshot | null): boolean {
    return Object.values(snapshot?.entities.projects ?? {}).some(
        (project) => project.pillarIds.length > 0 || project.relatedIds.length > 0
    );
}

/** Stable name for one visible node set, which is what a saved layout is held under. */
export function layoutKey(nodes: GraphNode[]): string {
    let hash = 5381;
    const text = nodes
        .map((node) => node.id)
        .sort()
        .join(',');
    for (let index = text.length - 1; index >= 0; index -= 1) {
        hash = (hash * 33) ^ text.charCodeAt(index);
    }
    return `oculus-map-v1-${(hash >>> 0).toString(36)}`;
}

function clone(nodes: PointNode[]): PointNode[] {
    return nodes.map((node) => ({ ...node }));
}

/**
 * What a drag holds from its press: the nodes it moves, every edge's length and every pair's
 * distance.
 */
export type DragHold = {
    movers: ReadonlySet<string>;
    lengths: ReadonlyMap<string, number>;
    /** Each pair of a mover and another node, by pairKey(), and how far apart they were. */
    apart: ReadonlyMap<string, number>;
};

/**
 * The key of a pair of node ids in `DragHold.apart`, the same whichever id comes first. The two ids
 * are written as a JSON list, so no two pairs share a key whatever characters the ids hold.
 */
export function pairKey(a: string, b: string): string {
    return JSON.stringify(a < b ? [a, b] : [b, a]);
}

/**
 * One immutable frame of a drag over the hold's movers, every other node left where it is. Each
 * edge pulls or pushes a mover toward the length the hold recorded for it, or `params.linkLength`
 * when it has none; the speed is damped and the mover moves DRAG_STEP times its speed. Then the
 * push, up to PUSH_PASSES passes with every mover kept inside the box after each, moves each mover
 * off every other node closer than their two radii and `params.gap`, or closer than they were at
 * the press when that is less, so a pair neato placed close is never pushed apart by a press: by
 * the whole shortfall against a node that does not move and by half of it against another mover. A
 * pair that met at the press is never pushed, and a pair the frame finds on one point is parted
 * along x. A mover the push moves loses the part of its speed that points into the contact. The
 * passes stop at the first that pushes nothing.
 */
export function physics(
    nodes: PointNode[],
    edges: GraphEdge[],
    hold: DragHold,
    params: Physics = DEFAULT_PHYSICS,
    bounds: Bounds = DEFAULT_BOUNDS
): PointNode[] {
    const next = clone(nodes);
    const byId = new Map(next.map((node) => [node.id, node]));
    const moves = (node: PointNode): boolean => hold.movers.has(node.id);
    for (const edge of edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (source === undefined || target === undefined) continue;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.hypot(dx, dy);
        if (distance === 0) continue;
        const rest = hold.lengths.get(edge.id) ?? params.linkLength;
        const force = (distance - rest) * params.linkStrength;
        source.vx += (dx / distance) * force;
        source.vy += (dy / distance) * force;
        target.vx -= (dx / distance) * force;
        target.vy -= (dy / distance) * force;
    }
    for (const node of next) {
        if (!moves(node)) {
            node.vx = 0;
            node.vy = 0;
            continue;
        }
        node.vx *= params.damping;
        node.vy *= params.damping;
        node.x += node.vx * DRAG_STEP;
        node.y += node.vy * DRAG_STEP;
    }
    for (let pass = 0; pass < PUSH_PASSES; pass += 1) {
        const pushed = push(next, hold, params);
        for (const node of next) {
            if (!moves(node)) continue;
            node.x = Math.max(bounds.pad, Math.min(bounds.width - bounds.pad, node.x));
            node.y = Math.max(bounds.pad, Math.min(bounds.height - bounds.pad, node.y));
        }
        if (!pushed) break;
    }
    return next;
}

/**
 * One pass of the push of physics(), in place over nodes already cloned for this frame; answers
 * whether it pushed anything. A mover pushed out of a contact also loses the part of its speed that
 * points into it, so it does not keep pressing into the contact and sliding along it frame after
 * frame; a node that is not a mover has no speed to lose. Only pairs holding a mover are looked at,
 * each once, and a pair's key is built only once the two are inside their room, since the limit is
 * never more than that.
 */
function push(nodes: PointNode[], hold: DragHold, params: Physics): boolean {
    let pushed = false;
    for (let left = 0; left < nodes.length; left += 1) {
        const a = nodes[left];
        if (!hold.movers.has(a.id)) continue;
        for (let right = 0; right < nodes.length; right += 1) {
            if (right === left) continue;
            const b = nodes[right];
            const movesB = hold.movers.has(b.id);
            if (movesB && right < left) continue;
            const room = a.radius + b.radius + params.gap;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);
            if (distance >= room) continue;
            const limit = Math.min(room, hold.apart.get(pairKey(a.id, b.id)) ?? room);
            if (limit <= 0 || distance >= limit) continue;
            const ux = distance === 0 ? 1 : dx / distance;
            const uy = distance === 0 ? 0 : dy / distance;
            const shortfall = limit - distance;
            const share = movesB ? shortfall / 2 : shortfall;
            pushed = true;
            a.x += ux * share;
            a.y += uy * share;
            const inA = a.vx * ux + a.vy * uy;
            if (inA < 0) {
                a.vx -= inA * ux;
                a.vy -= inA * uy;
            }
            if (movesB) {
                b.x -= ux * share;
                b.y -= uy * share;
                const inB = b.vx * ux + b.vy * uy;
                if (inB > 0) {
                    b.vx -= inB * ux;
                    b.vy -= inB * uy;
                }
            }
        }
    }
    return pushed;
}

/** A hold with one node taken out of its movers, every other field kept. */
function withoutMover(hold: DragHold, id: string): DragHold {
    return { ...hold, movers: new Set([...hold.movers].filter((one) => one !== id)) };
}

/** The nodes an edge joins to one node, which are the nodes a drag of it moves. */
export function neighbours(edges: GraphEdge[], id: string): Set<string> {
    const found = new Set<string>();
    for (const edge of edges) {
        if (edge.source === id && edge.target !== id) found.add(edge.target);
        if (edge.target === id && edge.source !== id) found.add(edge.source);
    }
    return found;
}

/**
 * The hold of a drag of one node, taken at its press: its direct neighbours move, every edge keeps
 * the length it has, and every pair of a mover and another node keeps the distance it has as the
 * most the push asks of it, so the positions at the press are at rest under physics().
 */
export function holdFor(nodes: PointNode[], edges: GraphEdge[], id: string): DragHold {
    const movers = neighbours(edges, id);
    const apart = new Map<string, number>();
    for (const mover of nodes) {
        if (!movers.has(mover.id)) continue;
        for (const other of nodes) {
            if (other.id === mover.id) continue;
            apart.set(
                pairKey(mover.id, other.id),
                Math.hypot(mover.x - other.x, mover.y - other.y)
            );
        }
    }
    return { movers, lengths: edgeLengths(nodes, edges), apart };
}

/**
 * One frame of a drag: physics() under the hold, and the largest distance any node moved in it,
 * which is what tells the drag it has come to rest. The dragged node is no mover, so it stays
 * wherever the pointer put it.
 */
export function dragTick(
    nodes: PointNode[],
    edges: GraphEdge[],
    hold: DragHold
): { nodes: PointNode[]; moved: number } {
    const next = physics(nodes, edges, hold);
    let moved = 0;
    next.forEach((node, at) => {
        moved = Math.max(moved, Math.hypot(node.x - nodes[at].x, node.y - nodes[at].y));
    });
    return { nodes: next, moved };
}

/**
 * The frames of a drag run to rest: dragTick() until the first frame in which no node moves REST or
 * more, or until MAX_FRAMES frames. That can be short of the springs' balance, since a node sliding
 * slowly toward it moves less than REST in a frame.
 */
export function settle(
    nodes: PointNode[],
    edges: GraphEdge[],
    hold: DragHold
): { nodes: PointNode[]; frames: number } {
    let current = nodes;
    let frames = 0;
    while (frames < MAX_FRAMES) {
        const tick = dragTick(current, edges, hold);
        current = tick.nodes;
        frames += 1;
        if (tick.moved < REST) break;
    }
    return { nodes: current, frames };
}

/**
 * The positions and the hold a press of node `id` starts from. A press while the last drag is still
 * settling under `running` first runs that settle to rest for every node but the pressed one, which
 * is held where the press caught it, so it stays under the pointer and the new drag inherits none
 * of the last one's movement; the new hold is taken from those positions.
 */
export function pressHold(
    nodes: PointNode[],
    edges: GraphEdge[],
    id: string,
    running: DragHold | null
): { nodes: PointNode[]; hold: DragHold } {
    const settled =
        running === null ? nodes : settle(nodes, edges, withoutMover(running, id)).nodes;
    return { nodes: settled, hold: holdFor(settled, edges, id) };
}

/** Every edge's length as the nodes stand, by edge id, which is what a drag holds each edge to. */
export function edgeLengths(nodes: PointNode[], edges: GraphEdge[]): Map<string, number> {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const lengths = new Map<string, number>();
    for (const edge of edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (source === undefined || target === undefined) continue;
        lengths.set(edge.id, Math.hypot(target.x - source.x, target.y - source.y));
    }
    return lengths;
}

/** The seed one visible node set starts from, so the same set is placed the same way every time. */
export function layoutSeed(nodes: GraphNode[]): number {
    const key = layoutKey(nodes);
    let sum = 0;
    for (let index = 0; index < key.length; index += 1) sum += key.charCodeAt(index);
    return sum;
}

/**
 * What one Map instance holds of its own: which nodes it shows and whether links are being drawn.
 */
export type MapState = GraphFilter & {
    /** Whether collaboration nodes join the graph. */
    collaborators: boolean;
    /** The archive types whose projects are shown, by their own status word. */
    enabled: string[];
    /** Whether a click starts a link rather than selecting. */
    linkMode: boolean;
    /** The project types drawn. Empty is every type, which is what an unfiltered map holds. */
    types: string[];
    /** The pillars drawn, by their registry key. Empty is every pillar. */
    lines: string[];
    /** Whether a project with no membership edge to a line still drawn is dropped. */
    connected: boolean;
    /** The start seed the pane chose, under the name of the node set it was chosen for. */
    start?: { key: string; seed: number };
};

/** The strings of a saved list, and an empty list for anything that was not one. */
function stringList(raw: unknown): string[] {
    return Array.isArray(raw) ? raw.filter((one): one is string => typeof one === 'string') : [];
}

/** A saved start seed, and nothing for a value no layout could be started from. */
function savedStart(raw: unknown): { key: string; seed: number } | undefined {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
    const held = raw as Record<string, unknown>;
    if (typeof held.key !== 'string' || typeof held.seed !== 'number') return undefined;
    if (!Number.isSafeInteger(held.seed) || held.seed < 0) return undefined;
    return { key: held.key, seed: held.seed };
}

/**
 * The seed the Map lays the node set it draws now out from: the one the pane saved for this set,
 * and the set's own default when it saved none or saved it for another set, which is what makes an
 * added project lay the map out once from the default.
 */
export function startFor(state: MapState, nodes: GraphNode[]): number {
    const start = state.start;
    return start?.key === layoutKey(nodes) ? start.seed : layoutSeed(nodes);
}

/** What the re-tune control saves: the seed one above the one in force, under this node set. */
export function nextStart(state: MapState, nodes: GraphNode[]): { key: string; seed: number } {
    return { key: layoutKey(nodes), seed: startFor(state, nodes) + 1 };
}

/**
 * The saved state of one Map instance, with anything that is not the shape above replaced by it.
 */
export function parseMapState(raw: unknown): MapState {
    const held =
        typeof raw === 'object' && raw !== null && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {};
    const start = savedStart(held.start);
    return {
        collaborators: held.collaborators === true,
        enabled: stringList(held.enabled),
        linkMode: held.linkMode === true,
        types: stringList(held.types),
        lines: stringList(held.lines),
        connected: held.connected === true,
        ...(start === undefined ? {} : { start })
    };
}
