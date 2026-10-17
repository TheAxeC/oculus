// Layer 3, state tests. The Map's settle in a box with little room: the fit of the centre pull to
// the box's room never sets a pull past MAX_PULL, so every tick stays stable and each node ends at
// a number inside the box, where an unbounded pull carried the nodes to infinity and d3's quadtree
// then grew without end.

import { describe, expect, it } from 'vitest';
import {
    createForces,
    recentre,
    settleForces
} from '../../../src/lib/state/boards/structure/forces.ts';
import {
    paneBounds,
    type GraphEdge,
    type PointNode
} from '../../../src/lib/state/boards/structure/graph.ts';

/** Forty project nodes on a grid, each linked to the next. */
function picture(): { nodes: PointNode[]; edges: GraphEdge[] } {
    const nodes: PointNode[] = Array.from({ length: 40 }, (_, at) => ({
        id: `n${at}`,
        entityId: `p${at}`,
        label: `p${at}`,
        kind: 'project',
        degree: 2,
        radius: 8,
        x: (at % 8) * 60,
        y: Math.floor(at / 8) * 60,
        vx: 0,
        vy: 0
    }));
    const edges: GraphEdge[] = nodes.slice(1).map((node, at) => ({
        id: `e${at}`,
        source: nodes[at].id,
        target: node.id,
        kind: 'related',
        direction: 'none',
        archived: false
    }));
    return { nodes, edges };
}

describe('settleForces in a box with little room', () => {
    for (const [width, height] of [
        [3, 3],
        [1000, 2],
        [2, 700],
        [90, 90]
    ]) {
        it(`ends every node at a number inside a ${width} by ${height} box`, () => {
            const { nodes, edges } = picture();
            const bounds = paneBounds(width, height);
            const placed = settleForces(createForces(nodes, edges, bounds), bounds);
            expect(placed).toHaveLength(40);
            for (const node of placed) {
                expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
            }
        });
    }
});

describe('recentre into a box with little room', () => {
    it('keeps every node at a number while the shrunk picture runs on', () => {
        const { nodes, edges } = picture();
        const wide = paneBounds(1000, 680);
        const forces = createForces(nodes, edges, wide);
        settleForces(forces, wide);
        recentre(forces, wide, paneBounds(3, 3), 1);
        forces.alpha(1);
        for (let at = 0; at < 300; at += 1) forces.tick();
        for (const node of forces.nodes()) {
            expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
        }
    });
});

describe('recentre into a narrow box and back', () => {
    it('shrinks the picture and grows it back to the size it settled at', () => {
        const { nodes, edges } = picture();
        const wide = paneBounds(1000, 680);
        const narrow = paneBounds(200, 680);
        const forces = createForces(nodes, edges, wide);
        settleForces(forces, wide);
        const before = forces.nodes().map((node) => [node.x, node.y]);
        const shrunk = recentre(forces, wide, narrow, 1);
        expect(shrunk).toBeLessThan(1);
        const back = recentre(forces, narrow, wide, shrunk);
        expect(back).toBeCloseTo(1, 9);
        forces.nodes().forEach((node, at) => {
            expect(node.x).toBeCloseTo(before[at][0], 6);
            expect(node.y).toBeCloseTo(before[at][1], 6);
        });
    });
});
