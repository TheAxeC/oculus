// Pure relationship-graph visibility, directed-edge, start-seed and drag-tick checks. The drag is
// run on hand-placed nodes and on the dense graph of map-fixture.ts as neato places it at seed 1.

import { beforeAll, describe, expect, it } from 'vitest';
import type { Viz } from '@viz-js/viz';
import {
    DEFAULT_BOUNDS,
    DEFAULT_PHYSICS,
    MAX_FRAMES,
    REST,
    buildGraph,
    dragTick,
    holdFor,
    pressHold,
    settle,
    filterGraph,
    layoutKey,
    layoutSeed,
    neighbours,
    nextStart,
    parseMapState,
    physics,
    presentFilter,
    startFor,
    toggleFilter,
    typeCounts,
    archiveStatuses,
    hasRelationships,
    lineFilters,
    typeFilters,
    type Graph as MapGraph
} from '../../../../src/lib/state/boards/structure/graph.ts';
import type {
    DragHold,
    GraphEdge,
    PointNode
} from '../../../../src/lib/state/boards/structure/graph.ts';
import { createGraphviz, placeGraph } from '../../../../src/lib/state/boards/structure/layout.ts';
import { denseGraph, node } from './map-fixture.ts';
import type { Project, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { NO_FEEDS } from '../../../fixtures/entities-fixture.ts';

function project(id: string, relatedIds: string[], extra: Partial<Project> = {}): Project {
    return {
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        title: id,
        short: id.toUpperCase(),
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds,
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...extra
    };
}

function snapshot(): Snapshot {
    const projects = {
        alpha: project('alpha', ['beta', 'gamma'], {
            pillarIds: ['one', 'two'],
            collaborators: ['person']
        }),
        beta: project('beta', ['alpha']),
        gamma: project('gamma', []),
        old: project('old', ['alpha'], { tier: 'archive', type: 'dropped' })
    };
    return {
        version: 1,
        entities: {
            projects,
            venues: {},
            datasets: {},
            pillars: {
                one: { id: 'one', title: 'One', fundingIds: [], projectIds: [] },
                two: { id: 'two', title: 'Two', fundingIds: [], projectIds: [] }
            },
            domains: {},
            funding: {},
            people: {
                person: {
                    id: 'person',
                    name: 'Person Name',
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            },
            organisations: {},
            collections: {},
            feeds: NO_FEEDS,
            career: null
        },
        relations: {
            projectVenue: [],
            projectFunding: [],
            projectDataset: [],
            projectPillar: [],
            projectDomain: [],
            projectRelated: [],
            fundingPillar: [],
            projectPerson: [],
            jointWorkPerson: [],
            personOrganisation: [],
            fundingOrganisation: []
        },
        findings: []
    };
}

function point(id: string, x: number, y: number, velocity = 0): PointNode {
    return {
        id,
        entityId: id,
        label: id,
        kind: 'project',
        type: 'active',
        degree: 0,
        radius: 7,
        x,
        y,
        vx: velocity,
        vy: 0
    };
}

/** The ids of one kind of node in a graph, sorted, which is what a filter is read off. */
function ids(graph: { nodes: { id: string; kind: string }[] }, kind: string): string[] {
    return graph.nodes
        .filter((node) => node.kind === kind)
        .map((node) => node.id)
        .sort();
}

function edge(id: string, source: string, target: string): GraphEdge {
    return {
        id,
        source,
        target,
        kind: 'related',
        direction: 'one',
        archived: false
    };
}

describe('relationship graph', () => {
    it('applies visibility and emits each directed relationship shape once', () => {
        const base = buildGraph(snapshot());
        expect(base.nodes.filter((node) => node.kind === 'line')).toHaveLength(2);
        expect(base.nodes.some((node) => node.id === 'project::old')).toBe(false);
        expect(base.nodes.some((node) => node.kind === 'collaborator')).toBe(false);
        expect(
            base.edges.filter((edge) => edge.kind === 'related').map((edge) => edge.direction)
        ).toEqual(['mutual', 'one']);

        const expanded = buildGraph(snapshot(), { archived: ['dropped'], collaborators: true });
        expect(expanded.nodes.some((node) => node.id === 'project::old')).toBe(true);
        expect(expanded.nodes.find((node) => node.id === 'collaborator::person')?.label).toBe(
            'Person Name'
        );
        expect(expanded.edges.some((edge) => edge.source === 'project::old')).toBe(true);
    });

    it('draws only the types named, and takes a line no drawn project is a member of with them', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data, { collaborators: true });
        expect(ids(whole, 'project')).toEqual([
            'project::alpha',
            'project::beta',
            'project::gamma'
        ]);

        const typed = filterGraph(whole, { types: ['idea'] });
        expect(ids(typed, 'project')).toEqual(['project::beta']);
        expect(ids(typed, 'line')).toEqual([]);
        expect(ids(typed, 'collaborator')).toEqual([]);
        expect(buildGraph(data, { collaborators: true, types: ['idea'] })).toEqual(typed);
    });

    it('draws only the lines named, keeps their projects, and drops the membership edges of the rest', () => {
        const whole = buildGraph(snapshot());
        const lined = filterGraph(whole, { lines: ['one'] });
        expect(ids(lined, 'line')).toEqual(['line::one']);
        expect(lined.edges.map((edge) => edge.id)).not.toContain('membership::alpha::two');
        expect(lined.edges.map((edge) => edge.id)).toContain('membership::alpha::one');
        expect(ids(lined, 'project')).toEqual([
            'project::alpha',
            'project::beta',
            'project::gamma'
        ]);
        const before = whole.nodes.find((node) => node.id === 'project::alpha')?.degree ?? 0;
        expect(before).toBeGreaterThan(0);
        expect(lined.nodes.find((node) => node.id === 'project::alpha')?.degree).toBe(before - 1);
    });

    it('drops a project with no membership of a drawn line, and the collaborator left behind', () => {
        const data = snapshot();
        data.entities.projects.alpha.pillarIds = ['one'];
        data.entities.projects.gamma.pillarIds = ['two'];
        const whole = buildGraph(data, { collaborators: true });
        expect(ids(whole, 'collaborator')).toEqual(['collaborator::person']);

        const joined = filterGraph(whole, { connected: true });
        expect(ids(joined, 'project')).toEqual(['project::alpha', 'project::gamma']);
        expect(ids(joined, 'collaborator')).toEqual(['collaborator::person']);

        const narrowed = filterGraph(whole, { lines: ['two'], connected: true });
        expect(ids(narrowed, 'project')).toEqual(['project::gamma']);
        expect(ids(narrowed, 'collaborator')).toEqual([]);
        expect(narrowed.edges.map((edge) => edge.id)).toEqual(['membership::gamma::two']);
    });

    it('draws the whole graph for an empty list, which is what a state naming no filter holds', () => {
        const whole = buildGraph(snapshot(), { collaborators: true });
        expect(filterGraph(whole, {})).toEqual(whole);
        expect(filterGraph(whole, { types: [], lines: [], connected: false })).toEqual(whole);
    });

    it('leaves a project whose manifest names no type outside the type filter', () => {
        const data = snapshot();
        delete data.entities.projects.gamma.type;
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        expect(ids(filterGraph(whole, { types: ['idea'] }), 'project')).toEqual([
            'project::beta',
            'project::gamma'
        ]);
        expect(typeCounts(whole)).toEqual({ active: 1, idea: 1 });
    });

    it('keeps a collaborator two projects share when one of them goes, at the degree it has left', () => {
        const data = snapshot();
        data.entities.projects.beta.collaborators = ['person'];
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data, { collaborators: true });
        expect(whole.nodes.find((node) => node.id === 'collaborator::person')?.degree).toBe(2);

        const typed = filterGraph(whole, { types: ['idea'] });
        expect(ids(typed, 'collaborator')).toEqual(['collaborator::person']);
        expect(typed.nodes.find((node) => node.id === 'collaborator::person')?.degree).toBe(1);
        expect(typed.edges.map((edge) => edge.id)).toEqual(['collaborator::beta::person']);
    });

    it('drops a related edge whose other end the filter took out', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        expect(whole.edges.map((edge) => edge.id)).toContain('related::alpha::beta');

        const typed = filterGraph(whole, { types: ['idea'] });
        expect(typed.edges.map((edge) => edge.id)).not.toContain('related::alpha::beta');
        expect(ids(typed, 'project')).toEqual(['project::beta']);
    });

    it('narrows a saved filter to what the graph holds, and an emptied list filters nothing', () => {
        const whole = buildGraph(snapshot());
        expect(presentFilter(whole, { types: ['gone'], lines: ['nowhere'] })).toEqual({
            types: [],
            lines: [],
            connected: false
        });
        expect(
            presentFilter(whole, { types: ['active', 'gone'], lines: ['one'], connected: true })
        ).toEqual({ types: ['active'], lines: ['one'], connected: true });
        const narrowed = presentFilter(whole, { types: ['gone'] });
        expect(filterGraph(whole, narrowed)).toEqual(whole);
    });

    it('narrows the first press to the one pressed, then adds and removes', () => {
        expect(toggleFilter([], 'idea')).toEqual(['idea']);
        expect(toggleFilter(['idea'], 'active')).toEqual(['idea', 'active']);
        expect(toggleFilter(['idea', 'active'], 'idea')).toEqual(['active']);
        expect(toggleFilter(['active'], 'active')).toEqual([]);
    });

    it('keys a filtered layout by the nodes it left, so two filters do not share one layout', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        const ideas = layoutKey(filterGraph(whole, { types: ['idea'] }).nodes);
        const active = layoutKey(filterGraph(whole, { types: ['active'] }).nodes);
        expect(ideas).not.toBe(active);
        expect(layoutKey(filterGraph(whole, {}).nodes)).toBe(layoutKey(whole.nodes));
    });

    it('falls back from an empty short name to the full title', () => {
        const data = snapshot();
        data.entities.projects.alpha.short = '   ';
        data.entities.projects.alpha.title = 'Full title';
        expect(buildGraph(data).nodes.find((node) => node.id === 'project::alpha')?.label).toBe(
            'Full title'
        );
    });

    it('moves only the movers of a drag, and pulls a mover joined to the held node toward it', () => {
        const nodes = [
            point('held', 900, 340),
            point('partner', 300, 340),
            point('other', 500, 200),
            point('far', 120, 600)
        ];
        const edges = [edge('hp', 'held', 'partner'), edge('of', 'other', 'far')];
        const hold = { movers: new Set(['partner']), lengths: new Map(), apart: new Map() };
        const ticked = physics(nodes, edges, hold);
        const at = Object.fromEntries(ticked.map((one) => [one.id, [one.x, one.y]]));
        expect(at.held).toEqual([900, 340]);
        expect(at.other).toEqual([500, 200]);
        expect(at.far).toEqual([120, 600]);
        expect(at.partner[0]).toBeGreaterThan(300);
    });

    it('leaves a picture at rest under the drag tick with the lengths its edges have', () => {
        // Edges of different lengths, and a pair closer than their two radii and the gap, one of
        // them overlapping: nothing moves while nothing is dragged.
        const nodes = [
            point('hub', 500, 340),
            point('near', 520, 340),
            point('mid', 500, 420),
            point('far', 700, 300),
            point('touching', 512, 350)
        ];
        const edges = [
            edge('hn', 'hub', 'near'),
            edge('hm', 'hub', 'mid'),
            edge('hf', 'hub', 'far'),
            edge('nt', 'near', 'touching')
        ];
        const hold = holdFor(nodes, edges, 'hub');
        expect([...hold.movers].sort()).toEqual(['far', 'mid', 'near']);
        expect(dragTick(nodes, edges, hold)).toEqual({ nodes, moved: 0 });
    });

    it('pulls a neighbour joined only to the dragged node after it, to its recorded length', () => {
        const nodes = [point('held', 500, 340), point('partner', 560, 340)];
        const edges = [edge('hp', 'held', 'partner')];
        const hold = holdFor(nodes, edges, 'held');
        const moved = settle([{ ...nodes[0], x: 400 }, nodes[1]], edges, hold).nodes;
        expect(moved[0].x).toBe(400);
        // The partner has followed 100 px left and rests 60 px from the dragged node again.
        expect(moved[1].x).toBeCloseTo(460, 0);
        expect(moved[1].y).toBe(340);
    });

    it('rests an edge with no recorded length at the link length of the parameters', () => {
        const params = { ...DEFAULT_PHYSICS, linkLength: 80 };
        const nodes = [point('held', 500, 340), point('partner', 580, 340)];
        const edges = [edge('hp', 'held', 'partner')];
        const movers = new Set(['partner']);
        const still = physics(
            nodes,
            edges,
            { movers, lengths: new Map(), apart: new Map() },
            params
        );
        expect(still[1].x).toBe(580);
        const pulled = physics(
            nodes,
            edges,
            { movers, lengths: new Map([['hp', 40]]), apart: new Map() },
            params
        );
        expect(pulled[1].x).toBeLessThan(580);
    });

    it('answers the nodes an edge joins to a node', () => {
        const edges = [edge('ab', 'a', 'b'), edge('ca', 'c', 'a'), edge('bc', 'b', 'c')];
        expect([...neighbours(edges, 'a')].sort()).toEqual(['b', 'c']);
        expect([...neighbours(edges, 'gone')]).toEqual([]);
    });

    it('keeps a saved start seed and drops a malformed one or an old tuning', () => {
        expect(parseMapState({ start: { key: 'k', seed: 3 } }).start).toEqual({
            key: 'k',
            seed: 3
        });
        expect(parseMapState({ start: { key: 'k', seed: 'x' } })).not.toHaveProperty('start');
        const old = parseMapState({ tuned: { key: 'k', params: { ...DEFAULT_PHYSICS } } });
        expect(old).not.toHaveProperty('tuned');
        expect(old).not.toHaveProperty('start');
    });

    it('answers the saved seed for the node set drawn now, and the default for another set', () => {
        const data = snapshot();
        data.entities.projects.beta.type = 'idea';
        const whole = buildGraph(data);
        const ideas = filterGraph(whole, { types: ['idea'] });
        const saved = parseMapState({ start: { key: layoutKey(whole.nodes), seed: 41 } });
        expect(startFor(saved, whole.nodes)).toBe(41);
        expect(startFor(saved, ideas.nodes)).toBe(layoutSeed(ideas.nodes));
        expect(startFor(parseMapState({}), whole.nodes)).toBe(layoutSeed(whole.nodes));
    });

    it('re-tunes to the seed one above the one in force, under this node set', () => {
        const graph = buildGraph(snapshot());
        const key = layoutKey(graph.nodes);
        expect(nextStart(parseMapState({ start: { key, seed: 41 } }), graph.nodes)).toEqual({
            key,
            seed: 42
        });
        expect(nextStart(parseMapState({}), graph.nodes)).toEqual({
            key,
            seed: layoutSeed(graph.nodes) + 1
        });
    });
});

describe('the Map chips over a graph', () => {
    const node = (id: string, kind: string, extra: Record<string, unknown> = {}) => ({
        id,
        kind,
        entityId: id,
        label: id.toUpperCase(),
        ...extra
    });
    const base = {
        nodes: [
            node('p1', 'project', { type: 'active' }),
            node('p2', 'project', { type: 'idea' }),
            node('p3', 'project', { type: 'accepted' }),
            node('L2', 'line'),
            node('L1', 'line')
        ],
        edges: [
            { source: 'p1', target: 'L1', kind: 'membership' },
            { source: 'p2', target: 'L2', kind: 'membership' }
        ]
    } as unknown as MapGraph;
    const drawn = {
        nodes: base.nodes.slice(0, 1).concat(base.nodes.slice(3)),
        edges: base.edges.slice(0, 1)
    };

    it('list the configured types first, then the rest by name, each counted over the drawn graph', () => {
        expect(typeFilters(base, drawn, ['idea', 'none', 3], [])).toEqual([
            { type: 'idea', count: 0, shown: true },
            { type: 'accepted', count: 0, shown: true },
            { type: 'active', count: 1, shown: true }
        ]);
        // The types the configuration does not order come by name, not in the order the graph
        // meets them.
        expect(typeFilters(base, drawn, undefined, ['active']).map((one) => one.type)).toEqual([
            'accepted',
            'active',
            'idea'
        ]);
        expect(typeFilters(base, drawn, undefined, ['active']).map((one) => one.shown)).toEqual([
            false,
            true,
            false
        ]);
    });

    it('list the lines in registry order, each counted over the drawn graph', () => {
        const snapshot = {
            entities: { pillars: { L1: {}, L2: {} }, projects: {} }
        } as unknown as Parameters<typeof lineFilters>[2];
        expect(lineFilters(base, drawn, snapshot, ['L2'])).toEqual([
            { id: 'L1', title: 'L1', count: 1, shown: false },
            { id: 'L2', title: 'L2', count: 0, shown: true }
        ]);
    });

    it('offer a toggle per archived or coauthor type, with the colour the config gives it', () => {
        const snapshot = {
            entities: {
                projects: {
                    a: { tier: 'archive', type: 'dropped' },
                    b: { tier: 'coauthor', type: 'coauthor' },
                    c: { tier: 'active', type: 'active' }
                }
            }
        } as unknown as Parameters<typeof archiveStatuses>[0];
        expect(archiveStatuses(snapshot, { dropped: '#ff0000', coauthor: 3 })).toEqual([
            { status: 'dropped', color: '#ff0000' },
            { status: 'coauthor' }
        ]);
        expect(archiveStatuses(null, null)).toEqual([]);
    });

    it('say the graph has an edge when any project names a line or a related project', () => {
        const of = (projects: Record<string, unknown>) =>
            ({ entities: { projects } }) as unknown as Parameters<typeof hasRelationships>[0];
        expect(hasRelationships(of({ a: { pillarIds: [], relatedIds: ['b'] } }))).toBe(true);
        expect(hasRelationships(of({ a: { pillarIds: [], relatedIds: [] } }))).toBe(false);
        expect(hasRelationships(null)).toBe(false);
    });
});

/** A node of the Map's project size, radius 8, at a place. */
function at(id: string, x: number, y: number): PointNode {
    return { ...point(id, x, y), radius: 8 };
}

/** The nodes with one of them moved along x by `dx`, which is where the pointer has taken it. */
function moveX(nodes: PointNode[], id: string, dx: number): PointNode[] {
    return nodes.map((one) => (one.id === id ? { ...one, x: one.x + dx } : one));
}

/** A drag of one node along x, settled under the hold its press took. */
function dragOf(
    nodes: PointNode[],
    edges: GraphEdge[],
    id: string,
    dx: number
): { hold: DragHold; nodes: PointNode[]; frames: number } {
    const hold = holdFor(nodes, edges, id);
    return { hold, ...settle(moveX(nodes, id, dx), edges, hold) };
}

/** The largest distance any node lies from where it lay in `before`. */
function largestMove(before: PointNode[], after: PointNode[]): number {
    return Math.max(
        0,
        ...after.map((one, i) => Math.hypot(one.x - before[i].x, one.y - before[i].y))
    );
}

function finite(nodes: PointNode[]): boolean {
    return nodes.every((one) => Number.isFinite(one.x) && Number.isFinite(one.y));
}

/** The nodes the dense graph's drags take: each pillar, and one project in two pillars. */
const DRAGGED = ['line::a', 'line::b', 'line::c', 'line::d', 'project::p0'];

describe('a drag on the dense graph neato places', () => {
    const graph = denseGraph();
    let placed: PointNode[] = [];

    beforeAll(async () => {
        const viz: Viz = await createGraphviz().ready();
        placed = placeGraph(viz, graph, 1).nodes;
    });

    it('moves nothing on a press that does not move', () => {
        for (const id of ['line::a', 'project::p0']) {
            const hold = holdFor(placed, graph.edges, id);
            expect(settle(placed, graph.edges, hold).nodes).toEqual(placed);
        }
    });

    it('moves no other node on a drag of a node joined to nothing', async () => {
        const viz = await createGraphviz().ready();
        const alone = { nodes: [...graph.nodes, node('project::alone')], edges: graph.edges };
        const nodes = placeGraph(viz, alone, 1).nodes;
        const others = nodes.filter((one) => one.id !== 'project::alone');
        const after = dragOf(nodes, alone.edges, 'project::alone', 60).nodes;
        expect(after.filter((one) => one.id !== 'project::alone')).toEqual(others);
        // Dropped onto a pillar, it still pushes nothing: only a mover takes the push.
        const pillar = nodes.find((one) => one.id === 'line::a');
        if (pillar === undefined) throw new Error('the dense graph holds line::a');
        const hold = holdFor(nodes, alone.edges, 'project::alone');
        const onto = nodes.map((one) =>
            one.id === 'project::alone' ? { ...one, x: pillar.x + 5, y: pillar.y } : one
        );
        const dropped = settle(onto, alone.edges, hold).nodes;
        expect(dropped.filter((one) => one.id !== 'project::alone')).toEqual(others);
    });

    it('keeps every circle but the dragged one off the others after a drag of 60, 200 and -200', () => {
        for (const dx of [60, 200, -200]) {
            const { hold, nodes } = dragOf(placed, graph.edges, 'line::a', dx);
            for (let left = 0; left < nodes.length; left += 1) {
                for (let right = left + 1; right < nodes.length; right += 1) {
                    const a = nodes[left];
                    const b = nodes[right];
                    const now = Math.hypot(a.x - b.x, a.y - b.y);
                    if (a.id !== 'line::a' && b.id !== 'line::a') {
                        expect(now, `${dx}: ${a.id} over ${b.id}`).toBeGreaterThanOrEqual(
                            a.radius + b.radius
                        );
                    }
                    if (!hold.movers.has(a.id) && !hold.movers.has(b.id)) continue;
                    const pressed = Math.hypot(
                        placed[left].x - placed[right].x,
                        placed[left].y - placed[right].y
                    );
                    const limit = Math.min(a.radius + b.radius + DEFAULT_PHYSICS.gap, pressed);
                    expect(now, `${dx}: ${a.id} and ${b.id}`).toBeGreaterThanOrEqual(limit - 0.01);
                }
            }
        }
    });

    it('settles every drag at rest before the frame cap, and a second settle moves nothing more', () => {
        const largest: string[] = [];
        for (const id of DRAGGED) {
            for (const dx of [60, 200, -200]) {
                const { hold, nodes, frames } = dragOf(placed, graph.edges, id, dx);
                expect(frames, `${id} ${dx}`).toBeLessThan(MAX_FRAMES);
                const again = settle(nodes, graph.edges, hold);
                expect(again.frames, `${id} ${dx} again`).toBeLessThan(MAX_FRAMES);
                const moved = largestMove(nodes, again.nodes);
                largest.push(`${id} ${dx}: ${frames} frames, then ${moved}`);
                expect(moved, `${id} ${dx}`).toBeLessThanOrEqual(REST);
            }
        }
        console.log(
            `the creep, each drag's frames and the largest move of a second settle:\n${largest.join('\n')}`
        );
    });

    it('stops a settle at rest, before the frame cap', () => {
        for (const id of DRAGGED) {
            for (const dx of [60, 200, -200]) {
                const { hold, nodes, frames } = dragOf(placed, graph.edges, id, dx);
                expect(frames, `${id} ${dx}`).toBeLessThan(MAX_FRAMES);
                expect(dragTick(nodes, graph.edges, hold).moved, `${id} ${dx}`).toBeLessThan(REST);
            }
        }
    });

    it('finishes a running settle at a press, and takes the new hold from where it ended', () => {
        const running = holdFor(placed, graph.edges, 'line::a');
        let nodes = moveX(placed, 'line::a', 200);
        for (let frame = 0; frame < 10; frame += 1) {
            nodes = dragTick(nodes, graph.edges, running).nodes;
        }
        const pressed = pressHold(nodes, graph.edges, 'project::p0', running);
        // The pressed node is one of the running drag's movers and stays where it was caught; the
        // other movers are at rest under the running hold without it.
        const others = {
            ...running,
            movers: new Set([...running.movers].filter((id) => id !== 'project::p0'))
        };
        expect(dragTick(pressed.nodes, graph.edges, others).moved).toBeLessThan(REST);
        expect(pressed.hold).toEqual(holdFor(pressed.nodes, graph.edges, 'project::p0'));
    });
});

describe('a drag at its edges', () => {
    it('keeps a close pair at its distance at the press', () => {
        const nodes = [at('held', 500, 340), at('mover', 560, 340), at('other', 570, 340)];
        const edges = [edge('hm', 'held', 'mover')];
        const hold = holdFor(nodes, edges, 'held');
        expect(settle(nodes, edges, hold).nodes).toEqual(nodes);
        // A drag toward `other` pulls `mover` into it, so only the push keeps them apart.
        const after = dragOf(nodes, edges, 'held', 5).nodes;
        expect(Math.hypot(after[1].x - after[2].x, after[1].y - after[2].y)).toBeGreaterThanOrEqual(
            10 - 0.01
        );
    });

    it('keeps a mover pushed at the edge of the box inside it on every pass of the push', () => {
        const left = at('left', DEFAULT_BOUNDS.pad, 340);
        const right = at('right', DEFAULT_BOUNDS.pad + 12, 340);
        const hold: DragHold = {
            movers: new Set(['left', 'right']),
            lengths: new Map(),
            apart: new Map()
        };
        const [a, b] = physics([left, right], [], hold);
        expect(a.x).toBe(DEFAULT_BOUNDS.pad);
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(
            left.radius + right.radius + DEFAULT_PHYSICS.gap - 0.01
        );
    });

    it("takes out a mover's speed into a contact, so neither presses on after the push", () => {
        const hold: DragHold = {
            movers: new Set(['a', 'b']),
            lengths: new Map(),
            apart: new Map()
        };
        const a = { ...at('a', 500, 340), vx: 5, vy: 1 };
        const b = { ...at('b', 510, 340), vx: -5, vy: -1 };
        const [left, right] = physics([a, b], [], hold);
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        // The speed of each along the line toward the other is zero or points away from it.
        expect(left.vx * dx + left.vy * dy).toBeLessThanOrEqual(0);
        expect(right.vx * -dx + right.vy * -dy).toBeLessThanOrEqual(0);
    });

    it('holds a pressed node where the press caught it while the last settle finishes', () => {
        const nodes = [at('held', 500, 340), at('p', 560, 340), at('r', 500, 400)];
        const edges = [edge('hp', 'held', 'p'), edge('hr', 'held', 'r')];
        const running = holdFor(nodes, edges, 'held');
        let caught = moveX(nodes, 'held', -50);
        for (let frame = 0; frame < 5; frame += 1) caught = dragTick(caught, edges, running).nodes;
        const pressed = pressHold(caught, edges, 'p', running);
        const p = pressed.nodes[1];
        expect([p.x, p.y]).toEqual([caught[1].x, caught[1].y]);
        const reduced = { ...running, movers: new Set(['r']) };
        expect(pressed.nodes[2]).toEqual(settle(caught, edges, reduced).nodes[2]);
        expect(pressed.hold).toEqual(holdFor(pressed.nodes, edges, 'p'));
    });

    it('settles an empty node set at once', () => {
        const hold: DragHold = { movers: new Set(), lengths: new Map(), apart: new Map() };
        const done = settle([], [], hold);
        expect(done.nodes).toEqual([]);
        expect(done.frames).toBeLessThanOrEqual(1);
    });

    it('ends a press and a drag of one node at once, with no position lost', () => {
        const nodes = [at('only', 500, 340)];
        const pressed = dragOf(nodes, [], 'only', 0);
        const dragged = dragOf(nodes, [], 'only', 60);
        expect(pressed.frames).toBeLessThanOrEqual(1);
        expect(dragged.frames).toBeLessThanOrEqual(1);
        expect(pressed.nodes).toEqual(nodes);
        expect(dragged.nodes[0].x).toBe(560);
        expect(finite(dragged.nodes)).toBe(true);
    });

    it('moves neither of two nodes coincident at the press, one of them a mover', () => {
        const nodes = [at('held', 500, 340), at('mover', 500, 340)];
        const edges = [edge('hm', 'held', 'mover')];
        const hold = holdFor(nodes, edges, 'held');
        const after = settle(nodes, edges, hold).nodes;
        expect(after).toEqual(nodes);
        expect(finite(after)).toBe(true);
    });

    it('parts two nodes apart at the press that a frame finds coincident, along x', () => {
        const nodes = [at('held', 500, 340), at('mover', 530, 340)];
        const edges = [edge('hm', 'held', 'mover')];
        const hold = holdFor(nodes, edges, 'held');
        const ticked = dragTick([nodes[0], { ...nodes[1], x: 500 }], edges, hold).nodes;
        expect(finite(ticked)).toBe(true);
        expect(ticked[0]).toEqual(nodes[0]);
        expect(ticked[1].y).toBe(340);
        expect(Math.abs(ticked[1].x - 500)).toBeGreaterThan(0);
    });
});
