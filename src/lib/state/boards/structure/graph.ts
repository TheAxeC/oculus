// Layer 2, client state. The Map's pure graph builder over the projects its bar keeps, the kinds of
// node its Show menu draws, its saved state, and the start seed a pane keeps for its node set
// (`layoutKey`, `layoutSeed`, `startFor`, `nextStart`). The bar's groups and what they keep are
// map-bar.ts beside this file. The placement itself is Graphviz's neato, in layout.ts, and the
// force simulation the Map runs from it is forces.ts there. Every visible-set and seed rule is
// independent of the DOM so it can be checked without a browser. It sits in state/boards/structure
// beside the Pillars and Domains joins, the pure halves of the Structure views. A project's stage
// is read under the words of its own hub when the caller gives them (`wordsOf`), and the legend's
// stages are listed in the order of every hub's words.

import { z } from 'zod';
import type { Project, Snapshot } from '../../../data/model/index.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { keyOf } from '../../../data/helpers/hub-names.ts';
import { anyNumberShape, fieldItemsShape, readAs, wordShape } from '../../../data/shapes/shapes.ts';
import { hasWord, recordWords, vocabKeys, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import { personNames } from '../person.ts';
import { selfIds, shownTeam } from '../board/team.ts';
import { freshPicks } from '../board/state.ts';

/**
 * What a node stands for: the Map's projects, pillar lines and people (the people of a project's
 * team, `collaborator` nodes), a Notes Graph note.
 */
export type GraphKind = 'project' | 'line' | 'collaborator' | 'note';
export type EdgeKind = 'membership' | 'collaborator' | 'related';
export type Direction = 'none' | 'one' | 'mutual';

export type GraphNode = {
    id: string;
    entityId: string;
    label: string;
    kind: GraphKind;
    stage?: string;
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

/** The kinds of node the Map's Show menu draws or leaves out. */
export type GraphShow = { projects: boolean; pillars: boolean; team: boolean };

/**
 * What the Map draws with nothing changed in its Show menu: the projects and the pillars, built per
 * call so no caller holds another's object.
 */
function showDefault(): GraphShow {
    return { projects: true, pillars: true, team: false };
}

/**
 * Which part of a built graph is drawn: the kinds of node shown, the pillars picked by their key
 * (none picked draws every pillar), and Connected only.
 */
type GraphFilter = {
    show?: GraphShow;
    /** The pillars drawn, by their key, every hub's pillar of a key among them; empty is all. */
    pillars?: readonly string[];
    /** While pillars are shown, drop a project with no membership edge to a pillar drawn. */
    connected?: boolean;
};

export type GraphOptions = GraphFilter & {
    /** The projects drawn, by their ids; every project of the snapshot without it. */
    projects?: ReadonlySet<string>;
    labelMode?: string;
    /** The words of each hub, which a project's stage is read under; the config's without it. */
    wordsOf?: WordsOf;
};

export type PointNode = GraphNode & { x: number; y: number; vx: number; vy: number };
export type Bounds = { width: number; height: number; pad: number };
/** The length neato lays every edge out at, before its picture is scaled to fit the box. */
export const LINK_LENGTH = 107;

/** How far inside the edges of the box the Map draws into its nodes are placed and kept. */
const BOUNDS_PAD = 48;

/**
 * The box the Map draws into: the pane's own size in CSS pixels, so the graph takes the pane's
 * shape and one unit of the graph is one pixel at the zoom of 1. Every layout rule places nodes in
 * it, less its pad.
 */
export function paneBounds(width: number, height: number): Bounds {
    return { width, height, pad: BOUNDS_PAD };
}

/** The label mode the configuration's `map_label_mode` names, and the empty word for any other. */
export function labelModeOf(config: Record<string, unknown>): string {
    return wordShape.parse(config.map_label_mode);
}

/**
 * The stage of a project at a stage carrying `terminal`, its node and its edges drawn as done
 * work; else none.
 */
function archivedAt(project: Project, config: Record<string, unknown>): string | undefined {
    return hasWord(config, 'stages', 'terminal', project.stage) ? project.stage : undefined;
}

/**
 * The graph of the projects `options.projects` names (every project without it): a node per
 * project, a pillar node per pillar a drawn project names with its membership edge while pillars
 * are shown, a node and an edge per person of a project's team, its lead, its collaborators and its
 * supervisors, except the user, the person marked `self: true` (board/team.ts), while the team is
 * shown, and the related edges between drawn projects; then `filterGraph`.
 */
export function buildGraph(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    options: GraphOptions = {}
): Graph {
    const show = options.show ?? showDefault();
    const archived = (project: Project): string | undefined =>
        archivedAt(project, recordWords(config, options.wordsOf, project));
    const projects = Object.values(snapshot.entities.projects);
    const all = new Map(projects.map((project) => [project.id, project]));
    const wanted = options.projects;
    const visible = projects.filter((project) => wanted === undefined || wanted.has(project.id));
    const visibleIds = new Set(visible.map((project) => project.id));
    const nodes: GraphNode[] = visible.map((project) => ({
        id: `project::${project.id}`,
        entityId: project.id,
        label:
            options.labelMode === 'full' || project.short?.trim() === ''
                ? project.title
                : (project.short ?? project.title),
        kind: 'project',
        stage: project.stage,
        ...(archived(project) === undefined ? {} : { archived: archived(project) }),
        degree: 0,
        radius: 7
    }));
    const edges: GraphEdge[] = [];
    const lineIds = new Set<string>();
    const collaboratorIds = new Set<string>();
    const self = selfIds(snapshot);

    for (const project of visible) {
        for (const line of show.pillars ? project.pillarIds : []) {
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
        if (show.team) {
            for (const person of shownTeam(project, self)) {
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
            label: line === undefined || line.title === '' ? keyOf(id) : line.title,
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
            label: byKey(names, id) ?? keyOf(id),
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
 * The part of a graph one Map instance draws, as a pure function over the whole of it. The rules
 * run in order: the pillars picked keep their own pillar nodes (by key, so every hub's pillar of a
 * picked key stays); Connected only, while pillars are shown, takes out a project left with no
 * membership edge to a pillar drawn; with projects shown, a pillar or a person of a team whose
 * projects have all gone leaves with them, since such a node is in the graph only to carry a
 * project's edge; with projects not shown, every project node goes, and the pillars and the team
 * the drawn projects reach stay without edges, so the view is not empty.
 */
function filterGraph(graph: Graph, filter: GraphFilter = {}): Graph {
    const show = filter.show ?? showDefault();
    const picked = new Set(filter.pillars ?? []);
    let nodes = graph.nodes.filter(
        (node) => node.kind !== 'line' || picked.size === 0 || picked.has(keyOf(node.entityId))
    );
    let edges = joining(graph.edges, idsOf(nodes));
    if (filter.connected === true && show.pillars) {
        const joined = new Set(
            edges.filter((edge) => edge.kind === 'membership').map((edge) => edge.source)
        );
        nodes = nodes.filter((node) => node.kind !== 'project' || joined.has(node.id));
        edges = joining(edges, idsOf(nodes));
    }
    const ends = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    nodes = nodes.filter((node) => node.kind === 'project' || ends.has(node.id));
    if (!show.projects)
        return measure(
            nodes.filter((node) => node.kind !== 'project'),
            []
        );
    return measure(nodes, edges);
}

/** How many projects at each stage a graph draws, which is the count one filter carries. */
export function stageCounts(graph: Graph): Record<string, number> {
    const counted: Record<string, number> = {};
    for (const node of graph.nodes) {
        if (node.kind !== 'project' || node.stage === undefined) continue;
        counted[node.stage] = (counted[node.stage] ?? 0) + 1;
    }
    return counted;
}

/**
 * The stages of the projects a graph draws, in the order of `stages` of `config` (every hub's
 * words), then the rest by name: what the Map's legend lists.
 */
export function drawnStages(graph: Graph, config: Record<string, unknown>): string[] {
    const ordered = vocabKeys(config.stages);
    const names = Object.keys(stageCounts(graph));
    const rest = names.filter((stage) => !ordered.includes(stage)).sort();
    return [...ordered.filter((stage) => names.includes(stage)), ...rest];
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
export type MapState = {
    /** What is typed in the bar's search box. */
    search: string;
    /**
     * The picked values of the bar's groups by facet, a project board's facets
     * (state/boards/board/presets.ts `FACETS`), the slices under `slice`, and the Stage group's
     * under `stage`, which the Map applies itself (state/boards/structure/map-bar.ts).
     */
    filters: Record<string, string[]>;
    /** Mine only, off at first, since the Map draws every project. */
    mine: boolean;
    /** The kinds of node the Show menu draws. */
    show: GraphShow;
    /** Whether a project with no membership edge to a pillar drawn is dropped. */
    connected: boolean;
    /** Whether a click starts a link rather than selecting. */
    linkMode: boolean;
    /** The start seed the pane chose, under the name of the node set it was chosen for. */
    start?: { key: string; seed: number };
};

/** A saved start seed: a key and a non-negative safe integer, else none. */
const startShape = z.object({
    key: z.string(),
    seed: anyNumberShape.refine((seed) => Number.isSafeInteger(seed) && seed >= 0)
});

/** The fields of a saved Map instance, each read apart so a wrong one costs that field alone. */
const mapStateShape = z.object({
    search: z.string().catch(''),
    filters: z.record(z.string(), fieldItemsShape).catch({}),
    mine: z.boolean().catch(false),
    show: z
        .object({
            projects: z.boolean().catch(showDefault().projects),
            pillars: z.boolean().catch(showDefault().pillars),
            team: z.boolean().catch(showDefault().team)
        })
        .catch(() => showDefault()),
    connected: z.boolean().catch(false),
    linkMode: z.boolean().catch(false),
    start: startShape.optional().catch(undefined)
});

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
    const held = readAs(mapStateShape, raw) ?? mapStateShape.parse({});
    const { start, filters, show, ...fields } = held;
    return {
        ...fields,
        filters: freshPicks(filters),
        show,
        ...(start === undefined ? {} : { start })
    };
}
