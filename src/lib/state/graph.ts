// Layer 2, client state. The Map's pure graph builder and seeded spring layout. Every visible-set
// and placement rule is independent of the DOM so it can be checked without a browser.

import type { Project, Snapshot } from '../data/model.ts';

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
export type GraphOptions = {
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
    const collection = snapshot.entities.collections.collaborations;
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
        const mutual = directed.has(`${target}\0${source}`);
        edges.push({
            id: `related::${pair.replace('\0', '::')}`,
            source: `project::${source}`,
            target: `project::${target}`,
            kind: 'related',
            direction: mutual ? 'mutual' : 'one',
            archived:
                archived(all.get(source)!) !== undefined || archived(all.get(target)!) !== undefined
        });
    }

    for (const id of lineIds) {
        const line = snapshot.entities.programs[id];
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

    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (const edge of edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (source !== undefined) source.degree += 1;
        if (target !== undefined) target.degree += 1;
    }
    for (const node of nodes) {
        node.radius = (node.kind === 'project' ? 7 : 11) + Math.min(4, node.degree);
    }
    return { nodes, edges };
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
