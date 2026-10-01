// Graphviz's neato placement of a Map graph through @viz-js/viz: repeatable for one seed, moved by
// another, inside the Map's box, and faithful to every node id whatever characters it holds.

import { beforeAll, describe, expect, it } from 'vitest';
import type { Viz } from '@viz-js/viz';
import {
    DEFAULT_BOUNDS,
    type Graph,
    type PointNode
} from '../../../../src/lib/state/boards/structure/graph.ts';
import {
    createGraphviz,
    edgeEnds,
    mapPlacement,
    placeGraph,
    placement,
    type Placement,
    placementKey,
    drawnAt
} from '../../../../src/lib/state/boards/structure/layout.ts';
import { createForces, settleForces } from '../../../../src/lib/state/boards/structure/forces.ts';
import { edge, node } from './map-fixture.ts';

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

    it("draws nothing before Graphviz loads, the reason when the load or the engine failed, and neato's placement settled under the forces once loaded", () => {
        expect(mapPlacement(null, GRAPH, 1)).toEqual({ nodes: [], failure: null, forces: null });
        expect(mapPlacement('the library did not load', GRAPH, 1)).toEqual({
            nodes: [],
            failure: 'the library did not load',
            forces: null
        });
        const loaded = mapPlacement(viz, GRAPH, 1);
        expect(loaded.failure).toBeNull();
        expect(loaded.nodes).toEqual(
            settleForces(createForces(placeGraph(viz, GRAPH, 1).nodes, GRAPH.edges))
        );
        expect(typeof loaded.forces?.tick).toBe('function');
    });

    it("answers no node, the engine's reason and no simulation for a placement the engine refuses", () => {
        // Revert: forces built over the refused placement's empty node set in place of null.
        const refusing = {
            renderJSON: () => {
                throw new Error('syntax error in line 1');
            }
        } as unknown as Viz;
        expect(mapPlacement(refusing, GRAPH, 1)).toEqual({
            nodes: [],
            failure: 'syntax error in line 1',
            forces: null
        });
    });

    it('draws each node with the words the graph gives it now, at the place held for its id', () => {
        // Revert: the placed copies drawn as they are keep a label the graph has since changed.
        const held = [{ ...node('a'), x: 10, y: 20, vx: 3, vy: 0 }];
        const now = [{ ...node('a'), label: 'renamed' }, node('b')];
        expect(drawnAt(now, held)).toEqual([{ ...now[0], x: 10, y: 20, vx: 0, vy: 0 }]);
        expect(drawnAt([], held)).toEqual([]);
    });

    it('keys a placement on its seed, its nodes and their sizes, and its edges, and on nothing else', () => {
        // Revert: a key of the node ids alone lets an edge added or moved keep the old placement.
        const key = placementKey(GRAPH, 1);
        const worded = {
            nodes: GRAPH.nodes.map((one) => ({ ...one, label: `${one.label}!`, archived: 'x' })),
            edges: GRAPH.edges.map((one) => ({ ...one, archived: true }))
        };
        expect(placementKey(worded, 1)).toBe(key);
        expect(placementKey(GRAPH, 2)).not.toBe(key);
        const grown = GRAPH.nodes.map((one, at) => (at === 0 ? { ...one, radius: 15 } : one));
        expect(placementKey({ ...GRAPH, nodes: grown }, 1)).not.toBe(key);
        const joined = [...GRAPH.edges, edge('project::p1', 'project::p5', 'related')];
        expect(placementKey({ ...GRAPH, edges: joined }, 1)).not.toBe(key);
        const moved = GRAPH.edges.map((one, at) =>
            at === 0 ? { ...one, target: 'line::b' } : one
        );
        expect(placementKey({ ...GRAPH, edges: moved }, 1)).not.toBe(key);
        // No node and one node, and ids that a plain join would run together, key apart.
        const none = { nodes: [], edges: [] };
        expect(placementKey(none, 1)).not.toBe(placementKey({ nodes: [node('a')], edges: [] }, 1));
        const pair = { nodes: [node('a'), node('b')], edges: [] };
        expect(placementKey({ nodes: [node('a","b')], edges: [] }, 1)).not.toBe(
            placementKey(pair, 1)
        );
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

describe("the positions of Graphviz's answer", () => {
    const stub = (json: unknown) => ({ renderJSON: () => json }) as unknown as Viz;
    const one: Graph = { nodes: [node('project::a')], edges: [] };
    const two: Graph = { nodes: [node('project::a'), node('project::b')], edges: [] };
    const NONE = { error: 'Graphviz placed no position for node 0' };
    const n1 = { name: 'n1', pos: '5,6' };

    /** The error of a placement, or the page position of each node it placed. */
    function placed(answer: Placement): unknown {
        return 'error' in answer ? answer : answer.nodes.map((one) => [one.x, one.y]);
    }

    it('keeps a node when an item beside its position is not a map', () => {
        const held = { name: 'n0', pos: '1,2' };
        for (const extra of [3, 'x', []]) {
            expect(placed(placement(stub({ objects: [held, extra] }), one, 1))).toStrictEqual([
                [500, 340]
            ]);
        }
    });

    it('places no node for names that are not n and an index, or positions that are no pair', () => {
        const rows = [
            [{ name: 'a', pos: '1,2' }, { name: 3 }],
            [{ name: 'N0', pos: '1,2' }],
            [{ name: 'n0x', pos: '1,2' }],
            [{ name: 'n-1', pos: '1,2' }],
            [{ name: 'n1', pos: '3,4' }],
            [{ name: 'n0', pos: '1' }],
            [{ name: 'n0', pos: '1,x' }],
            [{ name: 'n0', pos: 'a,2' }],
            [{ name: 'n0', pos: '' }],
            [{ name: 'n0', pos: 'Infinity,2' }],
            [{ name: 'n0', pos: 12 }],
            [{ name: 'n0', pos: null }]
        ];
        for (const objects of rows) {
            expect(placement(stub({ objects }), one, 1)).toStrictEqual(NONE);
        }
    });

    it('places no node for objects that are no list, or an answer that holds none', () => {
        const held = { name: 'n0', pos: '1,2' };
        for (const objects of [undefined, null, 'x', {}, 3, { 0: held }]) {
            expect(placement(stub({ objects }), one, 1)).toStrictEqual(NONE);
        }
        for (const json of ['x', [], {}]) {
            expect(placement(stub(json), one, 1)).toStrictEqual(NONE);
        }
    });

    it('reads a position written with spaces, an exponent or a third number, and an index with zeros', () => {
        const at = (name: string, pos: string) =>
            placed(placement(stub({ objects: [{ name, pos }, n1] }), two, 1));
        expect(at('n00', '1,2')).toStrictEqual([
            [497, 343],
            [503, 337]
        ]);
        expect(at('n0', ' 1 , 2 ')).toStrictEqual([
            [497, 343],
            [503, 337]
        ]);
        expect(at('n0', '1,2,3')).toStrictEqual([
            [497, 343],
            [503, 337]
        ]);
        expect(at('n0', '1e3,2')).toStrictEqual([
            [952, 341.8170854271357],
            [48, 338.1829145728643]
        ]);
    });

    it('takes the last of two positions for one node and ignores a node and a key it has no use for', () => {
        const objects = [{ name: 'n0', pos: '1,2' }, { name: 'n0', pos: '3,4' }, n1];
        expect(placed(placement(stub({ objects }), two, 1))).toStrictEqual([
            [498.5, 341.5],
            [501.5, 338.5]
        ]);
        const wider = [{ name: 'n0', pos: '1,2', extra: 1 }, n1, { name: 'n9', pos: '7,8' }];
        expect(placed(placement(stub({ objects: wider }), two, 1))).toStrictEqual([
            [497, 343],
            [503, 337]
        ]);
    });

    it('leaves out an item that is null, as it does one that is a number', () => {
        const objects = [{ name: 'a', pos: '1,2' }, { name: 3 }, null];
        expect(placement(stub({ objects }), one, 1)).toStrictEqual(NONE);
    });

    it('places the node a position beside an item that is null names', () => {
        const objects = [null, { name: 'n0', pos: '1,2' }];
        expect(placed(placement(stub({ objects }), one, 1))).toStrictEqual([[500, 340]]);
    });
});
