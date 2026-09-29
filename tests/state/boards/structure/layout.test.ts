// Graphviz's neato placement of a Map graph through @viz-js/viz: repeatable for one seed, moved by
// another, inside the Map's box, and faithful to every node id whatever characters it holds.

import { beforeAll, describe, expect, it } from 'vitest';
import type { Viz } from '@viz-js/viz';
import {
    DEFAULT_BOUNDS,
    type Graph,
    type GraphEdge,
    type GraphNode,
    type PointNode
} from '../../../../src/lib/state/boards/structure/graph.ts';
import {
    createGraphviz,
    edgeEnds,
    mapPlacement,
    placeGraph,
    placement
} from '../../../../src/lib/state/boards/structure/layout.ts';

function node(id: string, kind: GraphNode['kind'] = 'project'): GraphNode {
    return {
        id,
        entityId: id,
        label: id,
        kind,
        degree: 1,
        radius: kind === 'project' ? 8 : 12
    };
}

function edge(source: string, target: string, kind: GraphEdge['kind']): GraphEdge {
    return {
        id: `${kind}::${source}::${target}`,
        source,
        target,
        kind,
        direction: kind === 'related' ? 'one' : 'none',
        archived: false
    };
}

/** Two lines, five projects, one collaborator: every edge kind the Map draws. */
const GRAPH: Graph = {
    nodes: [
        node('line::a', 'line'),
        node('line::b', 'line'),
        node('project::p1'),
        node('project::p2'),
        node('project::p3'),
        node('project::p4'),
        node('project::p5'),
        node('collaborator::c', 'collaborator')
    ],
    edges: [
        edge('project::p1', 'line::a', 'membership'),
        edge('project::p2', 'line::a', 'membership'),
        edge('project::p3', 'line::b', 'membership'),
        edge('project::p4', 'line::b', 'membership'),
        edge('project::p5', 'line::b', 'membership'),
        edge('project::p1', 'project::p3', 'related'),
        edge('project::p2', 'collaborator::c', 'collaborator')
    ]
};

/** Each placed node's position by id. */
function where(nodes: PointNode[]): Record<string, [number, number]> {
    return Object.fromEntries(nodes.map((one) => [one.id, [one.x, one.y]]));
}

let viz: Viz;

beforeAll(async () => {
    viz = await createGraphviz().ready();
});

describe('the Map placed by neato', () => {
    it('places the same graph from the same seed at the same positions, node for node', () => {
        const first = placeGraph(viz, GRAPH, 7).nodes;
        const second = placeGraph(viz, GRAPH, 7).nodes;
        expect(first.map((one) => one.id)).toEqual(GRAPH.nodes.map((one) => one.id));
        expect(where(second)).toEqual(where(first));
    });

    it('moves at least one node when the seed changes', () => {
        const one = where(placeGraph(viz, GRAPH, 7).nodes);
        const other = where(placeGraph(viz, GRAPH, 8).nodes);
        expect(Object.keys(other).some((id) => other[id].join() !== one[id].join())).toBe(true);
        const three: Graph = {
            nodes: [node('line::a', 'line'), node('project::p1'), node('project::p2')],
            edges: [
                edge('project::p1', 'line::a', 'membership'),
                edge('project::p2', 'line::a', 'membership')
            ]
        };
        const small = where(placeGraph(viz, three, 7).nodes);
        const moved = where(placeGraph(viz, three, 8).nodes);
        expect(Object.keys(moved).some((id) => moved[id].join() !== small[id].join())).toBe(true);
    });

    it('puts every node inside the box less its padding', () => {
        const { width, height, pad } = DEFAULT_BOUNDS;
        for (const seed of [0, 1, 2, 3]) {
            for (const one of placeGraph(viz, GRAPH, seed).nodes) {
                expect(one.x).toBeGreaterThanOrEqual(pad);
                expect(one.x).toBeLessThanOrEqual(width - pad);
                expect(one.y).toBeGreaterThanOrEqual(pad);
                expect(one.y).toBeLessThanOrEqual(height - pad);
            }
        }
    });

    it('places a graph of one node, and an empty graph, without an error', () => {
        const alone = placeGraph(viz, { nodes: [node('project::only')], edges: [] }, 3).nodes;
        expect(alone).toHaveLength(1);
        // A lone node has no span to fit, and sits at the centre of the box.
        expect([alone[0].x, alone[0].y]).toEqual([
            DEFAULT_BOUNDS.width / 2,
            DEFAULT_BOUNDS.height / 2
        ]);
        expect(placeGraph(viz, { nodes: [], edges: [] }, 3)).toEqual({ nodes: [] });
    });

    it('hands back a node whose id holds a quote, a space or a backslash under that id', () => {
        const odd = ['project::say "hi"', 'project::two words', 'project::back\\slash', 'x\\'];
        const graph: Graph = {
            nodes: [...odd.map((id) => node(id)), node('line::l', 'line')],
            edges: odd.map((id) => edge(id, 'line::l', 'membership'))
        };
        const placed = placeGraph(viz, graph, 5).nodes;
        expect(placed.map((one) => one.id)).toEqual(graph.nodes.map((one) => one.id));
        for (const one of placed) {
            expect(Number.isFinite(one.x) && Number.isFinite(one.y)).toBe(true);
        }
        // Graphviz read one node per id, so no two of them were merged onto one position.
        expect(new Set(placed.map((one) => `${one.x},${one.y}`)).size).toBe(placed.length);
    });

    it("turns Graphviz's upward y into the page's downward one, centred in the box", () => {
        const answering = {
            renderJSON: () => ({
                objects: [
                    { name: 'n0', pos: '0,0' },
                    { name: 'n1', pos: '100,50' }
                ]
            })
        } as unknown as Viz;
        const fitted = placeGraph(
            answering,
            {
                nodes: [node('project::low'), node('project::high')],
                edges: []
            },
            1
        );
        const [low, high] = fitted.nodes;
        // The span fits the box at more than 1.5, so the picture is enlarged by 1.5 alone.
        expect(high.x - low.x).toBe(150);
        // The node Graphviz put higher is drawn higher on the page, which is a smaller y.
        expect(high.y).toBeLessThan(low.y);
        expect(high.x).toBeGreaterThan(low.x);
        expect((low.x + high.x) / 2).toBe(DEFAULT_BOUNDS.width / 2);
        expect((low.y + high.y) / 2).toBe(DEFAULT_BOUNDS.height / 2);
    });

    it('loads Graphviz once per loader and shares it with every caller of that loader', async () => {
        const loader = createGraphviz();
        expect(loader.loaded()).toBeNull();
        expect(loader.ready()).toBe(loader.ready());
        const one = await loader.ready();
        expect(loader.loaded()).toBe(one);
        const answers: unknown[] = [];
        loader.load((answer) => answers.push(answer));
        await loader.ready();
        expect(answers).toEqual([one]);
        // Two clients share nothing: another loader makes its own instance.
        expect(await createGraphviz().ready()).not.toBe(one);
    });

    it('hands a load cancelled before it finished nothing, as a closed pane asks', async () => {
        const loader = createGraphviz();
        const answers: unknown[] = [];
        const cancel = loader.load((answer) => answers.push(answer));
        cancel();
        await loader.ready();
        expect(answers).toEqual([]);
        // A later load, the pane opened again, is answered.
        loader.load((answer) => answers.push(answer));
        await loader.ready();
        expect(answers).toEqual([loader.loaded()]);
    });

    it('answers the error of a placement the engine refuses, rather than throwing it', () => {
        const refusing = {
            renderJSON: () => {
                throw new Error('syntax error in line 1');
            }
        } as unknown as Viz;
        expect(placement(refusing, GRAPH, 1)).toEqual({ error: 'syntax error in line 1' });
        expect(placement(viz, GRAPH, 1)).toEqual(placeGraph(viz, GRAPH, 1));
    });

    it('draws nothing before Graphviz loads, and the reason when the load or the engine failed', () => {
        expect(mapPlacement(null, GRAPH, 1)).toEqual({ nodes: [], failure: null });
        expect(mapPlacement('the library did not load', GRAPH, 1)).toEqual({
            nodes: [],
            failure: 'the library did not load'
        });
        expect(mapPlacement(viz, GRAPH, 1)).toEqual({
            ...placeGraph(viz, GRAPH, 1),
            failure: null
        });
    });

    it('draws a related edge short of the node it points at, and a membership edge end to end', () => {
        const at = (id: string, x: number): PointNode => ({ ...node(id), x, y: 100, vx: 0, vy: 0 });
        const placed = [at('a', 100), at('b', 300)];
        expect(edgeEnds(edge('a', 'b', 'membership'), placed)).toEqual({
            x1: 100,
            y1: 100,
            x2: 300,
            y2: 100
        });
        // A one-way edge stops the node's radius and a gap short of its target alone.
        expect(edgeEnds(edge('a', 'b', 'related'), placed)).toEqual({
            x1: 100,
            y1: 100,
            x2: 286,
            y2: 100
        });
        const mutual = { ...edge('a', 'b', 'related'), direction: 'mutual' as const };
        expect(edgeEnds(mutual, placed)).toEqual({ x1: 114, y1: 100, x2: 286, y2: 100 });
        expect(edgeEnds(edge('a', 'gone', 'membership'), placed)).toBeNull();
    });
});
