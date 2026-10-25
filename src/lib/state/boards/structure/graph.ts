// Layer 2, client state. The Map's pure graph builder, the chips its filters draw, and the start
// seed a pane keeps for its node set (`layoutKey`, `layoutSeed`, `startFor`, `nextStart`). The
// placement itself is Graphviz's neato, in layout.ts beside this file, and the force simulation the
// Map runs from it is forces.ts there. Every visible-set and seed rule is independent of the DOM so
// it can be checked without a browser. It sits in state/boards/structure beside the Pillars and
// Domains joins, the pure halves of the Structure views. A project's stage is read under the words
// of its own hub when the caller gives them (`wordsOf`), and the stage chips are drawn in the order
// and the tones of every hub's words.

import { z } from 'zod';
import type { Project, Snapshot } from '../../../data/model/index.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { keyOf } from '../../../data/helpers/hub-names.ts';
import {
    anyNumberShape,
    fieldItemsShape,
    readAs,
    recordItemsShape,
    wordShape
} from '../../../data/shapes/shapes.ts';
import { hasWord, recordWords, vocabKeys, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import { personNames } from '../person.ts';
import { selfIds, shownTeam } from '../board/team.ts';
import { stageTone } from '../../shared/words/tones.ts';

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

/**
 * Which part of a built graph is drawn. An empty or absent list means every one of its kind, so a
 * saved Map state that names no filter draws the whole graph.
 */
export type GraphFilter = {
    /** The project stages drawn. */
    stages?: string[];
    /** The pillars drawn, by their registry key. */
    lines?: string[];
    /** Drop a project with no membership edge to a line that is still drawn. */
    connected?: boolean;
};

export type GraphOptions = GraphFilter & {
    archived?: string[];
    collaborators?: boolean;
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

/** The stage of a project at a stage carrying `terminal`, which a Map toggle shows; else none. */
function archivedAt(project: Project, config: Record<string, unknown>): string | undefined {
    return hasWord(config, 'stages', 'terminal', project.stage) ? project.stage : undefined;
}

/**
 * Build only nodes reached by visible projects and only edges whose two ends are visible. With the
 * people option a node and an edge are drawn for each person of a project's team, its lead, its
 * collaborators and its supervisors, except the person the workspace setting `self` names
 * (board/team.ts).
 */
export function buildGraph(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    options: GraphOptions = {}
): Graph {
    const enabled = new Set(options.archived ?? []);
    const archived = (project: Project): string | undefined =>
        archivedAt(project, recordWords(config, options.wordsOf, project));
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
 * The part of a graph one Map instance draws, as a pure function over the whole of it. The three
 * rules run in order: the stages and the lines take their own nodes out, `connected` then takes out
 * a project left with no membership edge, and a line or a person of a team whose projects have all
 * gone leaves with them, since such a node is in the graph only to carry a project's edge.
 */
export function filterGraph(graph: Graph, filter: GraphFilter = {}): Graph {
    const stages = new Set(filter.stages ?? []);
    const lines = new Set(filter.lines ?? []);
    let nodes = graph.nodes.filter((node) => {
        // A project whose manifest names no stage is outside the stage filter rather than under
        // it: the row carries no chip for it, so a filter that dropped it could not bring it back.
        if (node.kind === 'project') {
            return stages.size === 0 || node.stage === undefined || stages.has(node.stage);
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
 * A saved filter narrowed to what one graph holds: a stage or a line the graph no longer draws is
 * dropped from its list, and a list left empty by that is nothing filtered, so a map saved against
 * a portfolio that has since changed opens on the whole graph rather than on an empty canvas.
 */
export function presentFilter(graph: Graph, filter: GraphFilter = {}): Required<GraphFilter> {
    const stages = new Set<string>();
    const lines = new Set<string>();
    for (const node of graph.nodes) {
        if (node.kind === 'project' && node.stage !== undefined) stages.add(node.stage);
        if (node.kind === 'line') lines.add(node.entityId);
    }
    return {
        stages: (filter.stages ?? []).filter((stage) => stages.has(stage)),
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

/** How many projects at each stage a graph draws, which is the count one filter carries. */
export function stageCounts(graph: Graph): Record<string, number> {
    const counted: Record<string, number> = {};
    for (const node of graph.nodes) {
        if (node.kind !== 'project' || node.stage === undefined) continue;
        counted[node.stage] = (counted[node.stage] ?? 0) + 1;
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
 * The archive statuses the Map offers a toggle for: every stage carrying `terminal` that a project
 * is at (the done work of every tier) under its own hub's words, each with the tone the `color` of
 * its row of `stages` of every hub's words gives, the tone its board card and its node are drawn
 * in.
 */
export function archiveStatuses(
    snapshot: Snapshot | null,
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): { status: string; tone: string }[] {
    const found = new Set<string>();
    for (const project of Object.values(snapshot?.entities.projects ?? {})) {
        const stage = archivedAt(project, recordWords(config, wordsOf, project));
        if (stage) found.add(stage);
    }
    return [...found].map((status) => ({ status, tone: stageTone(status) }));
}

/**
 * One chip per project stage the base graph holds: the keys of `stages` of the merged config first,
 * in its order, then the rest by name, each with how many the drawn graph holds and whether the
 * filter shows it (an empty filter shows every stage).
 */
export function stageFilters(
    base: Graph,
    drawn: Graph,
    config: Record<string, unknown>,
    stages: string[]
): { stage: string; count: number; shown: boolean }[] {
    const ordered = vocabKeys(config.stages);
    const counted = stageCounts(drawn);
    const names = Object.keys(stageCounts(base));
    const rest = names.filter((stage) => !ordered.includes(stage)).sort();
    return [...ordered.filter((stage) => names.includes(stage)), ...rest].map((stage) => ({
        stage,
        count: counted[stage] ?? 0,
        shown: stages.length === 0 || stages.includes(stage)
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
        title: present.find((node) => node.entityId === id)?.label ?? keyOf(id),
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
    /** Whether the people of each project's team, the user left out, join the graph as nodes. */
    collaborators: boolean;
    /** The archive stages whose projects are shown, by their own stage word. */
    enabled: string[];
    /** Whether a click starts a link rather than selecting. */
    linkMode: boolean;
    /** The project stages drawn. Empty is every stage, which is what an unfiltered map holds. */
    stages: string[];
    /** The pillars drawn, by their ids in the portfolio. Empty is every pillar. */
    lines: string[];
    /** Whether a project with no membership edge to a line still drawn is dropped. */
    connected: boolean;
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
    collaborators: z.boolean().catch(false),
    enabled: fieldItemsShape,
    linkMode: z.boolean().catch(false),
    stages: fieldItemsShape,
    lines: recordItemsShape,
    connected: z.boolean().catch(false),
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
    const held = readAs(mapStateShape, raw) ?? {
        collaborators: false,
        enabled: [],
        linkMode: false,
        stages: [],
        lines: [],
        connected: false,
        start: undefined
    };
    const { start, ...fields } = held;
    return { ...fields, ...(start === undefined ? {} : { start }) };
}
