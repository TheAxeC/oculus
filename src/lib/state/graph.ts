// Layer 2, client state. The Map's pure graph builder and seeded spring layout. Every visible-set
// and placement rule is independent of the DOM so it can be checked without a browser.

import type { Project, Snapshot } from '../data/model.ts';
import { byKey } from '../data/guards.ts';

export type GraphKind = 'project' | 'line' | 'collaborator';
export type EdgeKind = 'membership' | 'collaborator' | 'related';
export type Direction = 'none' | 'one' | 'mutual';
export type Rng = () => number;

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
    /** The research lines drawn, by their registry key. */
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

const DEFAULT_BOUNDS: Bounds = { width: 1000, height: 680, pad: 48 };

function archived(project: Project): string | undefined {
    return project.tier === 'archive' || project.tier === 'coauthor' ? project.type : undefined;
}

function collaborationNames(snapshot: Snapshot): Map<string, string> {
    const collection = byKey(snapshot.entities.collections, 'collaborations');
    return new Map((collection?.entries ?? []).map((entry) => [entry.id, entry.title || entry.id]));
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
        for (const line of project.programIds) {
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
        const line = byKey(snapshot.entities.programs, id);
        nodes.push({
            id: `line::${id}`,
            entityId: id,
            label: line?.title ?? id,
            kind: 'line',
            degree: 0,
            radius: 11
        });
    }
    const names = collaborationNames(snapshot);
    for (const id of collaboratorIds) {
        nodes.push({
            id: `collaborator::${id}`,
            entityId: id,
            label: names.get(id) ?? id,
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

/** Stable localStorage suffix for one visible node set. */
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

/** Small deterministic random source for tests and repeatable layout starts. */
export function seededRandom(seed: number): Rng {
    let held = seed >>> 0;
    return () => {
        held += 0x6d2b79f5;
        let value = held;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function clone(nodes: PointNode[]): PointNode[] {
    return nodes.map((node) => ({ ...node }));
}

/** Place line hubs on a ring and projects near the mean position of their hubs. */
export function placeInit(
    graph: Graph,
    rng: Rng,
    bounds: Bounds = DEFAULT_BOUNDS,
    seed = 0
): PointNode[] {
    const cx = bounds.width / 2;
    const cy = bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) * 0.34;
    const lineNodes = graph.nodes.filter((node) => node.kind === 'line');
    const positions = new Map<string, { x: number; y: number }>();
    lineNodes.forEach((node, index) => {
        const angle = seed * 1.3 + (index / Math.max(1, lineNodes.length)) * Math.PI * 2;
        positions.set(node.id, {
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius
        });
    });
    return graph.nodes.map((node) => {
        const hubs = graph.edges
            .filter((edge) => edge.kind === 'membership' && edge.source === node.id)
            .map((edge) => positions.get(edge.target))
            .filter((point): point is { x: number; y: number } => point !== undefined);
        const own = positions.get(node.id);
        if (own !== undefined) return { ...node, ...own, vx: 0, vy: 0 };
        if (hubs.length > 0) {
            return {
                ...node,
                x:
                    hubs.reduce((sum, point) => sum + point.x, 0) / hubs.length +
                    (rng() - 0.5) * 130,
                y:
                    hubs.reduce((sum, point) => sum + point.y, 0) / hubs.length +
                    (rng() - 0.5) * 130,
                vx: 0,
                vy: 0
            };
        }
        const angle = rng() * Math.PI * 2;
        return {
            ...node,
            x: cx + Math.cos(angle) * radius * 1.15,
            y: cy + Math.sin(angle) * radius * 1.15,
            vx: 0,
            vy: 0
        };
    });
}

/** One immutable force tick. */
export function physics(
    nodes: PointNode[],
    edges: GraphEdge[],
    alpha: number,
    params: Physics = DEFAULT_PHYSICS,
    bounds: Bounds = DEFAULT_BOUNDS,
    fixed?: string
): PointNode[] {
    const next = clone(nodes);
    const byId = new Map(next.map((node) => [node.id, node]));
    for (let left = 0; left < next.length; left += 1) {
        for (let right = left + 1; right < next.length; right += 1) {
            const a = next[left];
            const b = next[right];
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
            if (distance < separation) {
                const push = (separation - distance) * 0.5;
                a.x += ux * push;
                a.y += uy * push;
                b.x -= ux * push;
                b.y -= uy * push;
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
        const force = (distance - params.linkLength) * params.linkStrength;
        source.vx += (dx / distance) * force;
        source.vy += (dy / distance) * force;
        target.vx -= (dx / distance) * force;
        target.vy -= (dy / distance) * force;
    }
    const cx = bounds.width / 2;
    const cy = bounds.height / 2;
    for (const node of next) {
        if (node.id === fixed) {
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

/** Count intersecting edges that do not share an endpoint. */
export function crossings(nodes: PointNode[], edges: GraphEdge[]): number {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const ccw = (a: PointNode, b: PointNode, c: PointNode) =>
        (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    let count = 0;
    for (let left = 0; left < edges.length; left += 1) {
        for (let right = left + 1; right < edges.length; right += 1) {
            const p = edges[left];
            const q = edges[right];
            if ([p.source, p.target].some((id) => id === q.source || id === q.target)) continue;
            const ps = byId.get(p.source);
            const pt = byId.get(p.target);
            const qs = byId.get(q.source);
            const qt = byId.get(q.target);
            if (
                ps &&
                pt &&
                qs &&
                qt &&
                ccw(ps, qs, qt) !== ccw(pt, qs, qt) &&
                ccw(ps, pt, qs) !== ccw(ps, pt, qt)
            )
                count += 1;
        }
    }
    return count;
}

/** Layout quality, lower being better. */
export function score(
    nodes: PointNode[],
    edges: GraphEdge[],
    bounds: Bounds = DEFAULT_BOUNDS
): number {
    if (nodes.length === 0) return 0;
    let overlap = 0;
    let boundary = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let left = 0; left < nodes.length; left += 1) {
        const node = nodes[left];
        if (
            node.x <= bounds.pad + 3 ||
            node.x >= bounds.width - bounds.pad - 3 ||
            node.y <= bounds.pad + 3 ||
            node.y >= bounds.height - bounds.pad - 3
        )
            boundary += 1;
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
        for (let right = left + 1; right < nodes.length; right += 1) {
            const other = nodes[right];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = node.radius + other.radius + 6;
            if (dx * dx + dy * dy < distance * distance) overlap += 1;
        }
    }
    const fill = ((maxX - minX) * (maxY - minY)) / (bounds.width * bounds.height);
    return crossings(nodes, edges) + overlap * 2.5 + boundary * 0.5 + Math.abs(fill - 0.5) * 14;
}

/** Run the force simulation to equilibrium for a fixed number of ticks. */
export function settle(
    nodes: PointNode[],
    edges: GraphEdge[],
    ticks: number,
    params: Physics = DEFAULT_PHYSICS,
    bounds: Bounds = DEFAULT_BOUNDS
): PointNode[] {
    let next = clone(nodes);
    for (let tick = 0; tick < ticks; tick += 1) {
        next = physics(next, edges, Math.max(0.12, 1 - tick / Math.max(1, ticks)), params, bounds);
    }
    return next;
}

/** Try several seeded starts and retain the lowest-scoring layout. */
export function bestLayout(
    graph: Graph,
    rng: Rng,
    starts = 12,
    ticks = 150,
    params: Physics = DEFAULT_PHYSICS,
    bounds: Bounds = DEFAULT_BOUNDS
): { score: number; nodes: PointNode[] } {
    let best = { score: Infinity, nodes: [] as PointNode[] };
    for (let start = 0; start < starts; start += 1) {
        const nodes = settle(
            placeInit(graph, rng, bounds, start + rng() * 7),
            graph.edges,
            ticks,
            params,
            bounds
        );
        const measured = score(nodes, graph.edges, bounds);
        if (measured < best.score) best = { score: measured, nodes };
    }
    return best;
}

/** Search a bounded parameter space, always including the configured baseline. */
export function optimize(
    graph: Graph,
    rng: Rng,
    trials = 24,
    bounds: Bounds = DEFAULT_BOUNDS
): { params: Physics; score: number; nodes: PointNode[] } {
    let bestParams = DEFAULT_PHYSICS;
    let best = bestLayout(graph, rng, 3, 150, bestParams, bounds);
    const range = (low: number, high: number) => low + rng() * (high - low);
    for (let trial = 0; trial < trials; trial += 1) {
        const params: Physics = {
            linkLength: range(95, 150),
            linkStrength: range(0.03, 0.09),
            repulse: range(6000, 10500),
            collide: range(26, 40),
            center: range(0.008, 0.022),
            damping: range(0.82, 0.9),
            cool: DEFAULT_PHYSICS.cool
        };
        const candidate = bestLayout(graph, rng, 3, 150, params, bounds);
        if (candidate.score < best.score) {
            best = candidate;
            bestParams = params;
        }
    }
    return { params: bestParams, ...best };
}

/** What one Map instance holds of its own: which nodes it shows and whether links are being drawn. */
export type MapState = GraphFilter & {
    /** Whether collaboration nodes join the graph. */
    collaborators: boolean;
    /** The archive types whose projects are shown, by their own status word. */
    enabled: string[];
    /** Whether a click starts a link rather than selecting. */
    linkMode: boolean;
    /** The project types drawn. Empty is every type, which is what an unfiltered map holds. */
    types: string[];
    /** The research lines drawn, by their registry key. Empty is every line. */
    lines: string[];
    /** Whether a project with no membership edge to a line still drawn is dropped. */
    connected: boolean;
};

/** The strings of a saved list, and an empty list for anything that was not one. */
function stringList(raw: unknown): string[] {
    return Array.isArray(raw) ? raw.filter((one): one is string => typeof one === 'string') : [];
}

/** The saved state of one Map instance, with anything that is not the shape above replaced by it. */
export function parseMapState(raw: unknown): MapState {
    const held =
        typeof raw === 'object' && raw !== null && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {};
    return {
        collaborators: held.collaborators === true,
        enabled: stringList(held.enabled),
        linkMode: held.linkMode === true,
        types: stringList(held.types),
        lines: stringList(held.lines),
        connected: held.connected === true
    };
}
