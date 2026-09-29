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
export type Physics = {
    linkLength: number;
    linkStrength: number;
    repulse: number;
    collide: number;
    center: number;
    damping: number;
    cool: number;
};

export const DEFAULT_PHYSICS: Physics = {
    linkLength: 107,
    linkStrength: 0.042,
    repulse: 9200,
    collide: 31,
    center: 0.012,
    damping: 0.88,
    cool: 0.992
};

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
 * One immutable force tick: every pair repels, every edge pulls toward its rest length and every
 * node is drawn to the centre. An edge rests at its length in `lengths`, by edge id, and at
 * `params.linkLength` when it has none there. Only the nodes in `movers` take the forces and move;
 * every other node stays where it is, and without `movers` every node moves. The Map runs it while
 * a node is dragged under DRAG_PHYSICS, with the lengths every edge had when the press began, the
 * dragged node's direct neighbours as the movers and the dragged node held, so the picture is at
 * rest until the pointer moves and a drag pulls the neighbours after the dragged node.
 */
export function physics(
    nodes: PointNode[],
    edges: GraphEdge[],
    alpha: number,
    params: Physics = DEFAULT_PHYSICS,
    bounds: Bounds = DEFAULT_BOUNDS,
    movers?: ReadonlySet<string>,
    lengths?: ReadonlyMap<string, number>
): PointNode[] {
    const next = clone(nodes);
    const byId = new Map(next.map((node) => [node.id, node]));
    const moves = (node: PointNode): boolean => movers === undefined || movers.has(node.id);
    for (let left = 0; left < next.length; left += 1) {
        for (let right = left + 1; right < next.length; right += 1) {
            const a = next[left];
            const b = next[right];
            if (!moves(a) && !moves(b)) continue;
            const rawDx = a.x - b.x;
            const rawDy = a.y - b.y;
            const coincident = rawDx === 0 && rawDy === 0;
            const dx = coincident ? 0.1 : rawDx;
            const dy = coincident ? 0 : rawDy;
            const distanceSquared = dx * dx + dy * dy;
            const distance = Math.sqrt(distanceSquared);
            const ux = dx / distance;
            const uy = dy / distance;
            const force = params.repulse / distanceSquared;
            a.vx += ux * force;
            a.vy += uy * force;
            b.vx -= ux * force;
            b.vy -= uy * force;
            const separation = a.radius + b.radius + params.collide;
            if (params.collide > 0 && distance < separation) {
                const push = (separation - distance) * 0.5;
                if (moves(a)) {
                    a.x += ux * push;
                    a.y += uy * push;
                }
                if (moves(b)) {
                    b.x -= ux * push;
                    b.y -= uy * push;
                }
            }
        }
    }
    for (const edge of edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (source === undefined || target === undefined) continue;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const rest = lengths?.get(edge.id) ?? params.linkLength;
        const force = (distance - rest) * params.linkStrength;
        source.vx += (dx / distance) * force;
        source.vy += (dy / distance) * force;
        target.vx -= (dx / distance) * force;
        target.vy -= (dy / distance) * force;
    }
    const cx = bounds.width / 2;
    const cy = bounds.height / 2;
    for (const node of next) {
        if (!moves(node)) {
            node.vx = 0;
            node.vy = 0;
            continue;
        }
        node.vx = (node.vx + (cx - node.x) * params.center) * params.damping;
        node.vy = (node.vy + (cy - node.y) * params.center) * params.damping;
        node.x = Math.max(
            bounds.pad,
            Math.min(bounds.width - bounds.pad, node.x + node.vx * alpha)
        );
        node.y = Math.max(
            bounds.pad,
            Math.min(bounds.height - bounds.pad, node.y + node.vy * alpha)
        );
    }
    return next;
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
 * The tick a drag runs under: the springs alone, with no repulsion, no collision push and no pull
 * toward the centre, so a picture whose edges rest at their recorded lengths is at rest under it
 * and only a moved node sets anything moving.
 */
export const DRAG_PHYSICS: Physics = { ...DEFAULT_PHYSICS, repulse: 0, collide: 0, center: 0 };

/** What a drag holds from its press: the nodes it moves and every edge's length at the press. */
export type DragHold = { movers: ReadonlySet<string>; lengths: ReadonlyMap<string, number> };

/** The hold of a drag of one node: its direct neighbours move, every edge keeps its length. */
export function holdFor(nodes: PointNode[], edges: GraphEdge[], id: string): DragHold {
    return { movers: neighbours(edges, id), lengths: edgeLengths(nodes, edges) };
}

/** One frame of a drag: the tick under DRAG_PHYSICS over the hold's movers and lengths. */
export function dragTick(
    nodes: PointNode[],
    edges: GraphEdge[],
    alpha: number,
    hold: DragHold
): PointNode[] {
    return physics(nodes, edges, alpha, DRAG_PHYSICS, DEFAULT_BOUNDS, hold.movers, hold.lengths);
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
