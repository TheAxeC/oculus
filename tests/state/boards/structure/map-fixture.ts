// Layer 2, test fixture. The Map's graph builders the layout and the drag tests share: one node and
// one edge at the sizes the Map draws, and a graph of four pillars and forty projects dense enough
// that a drag of a pillar moves many neighbours past each other.
//
// The builders live in one module so the layout tests and the drag tests place the same graph; the
// dense graph is handed out unplaced, since neato's placement needs the engine the test loads.

import type {
    Graph,
    GraphEdge,
    GraphNode
} from '../../../../src/lib/state/boards/structure/graph.ts';

/** One node as the Map draws it: a project at radius 8, a pillar or a collaborator at 12. */
export function node(id: string, kind: GraphNode['kind'] = 'project'): GraphNode {
    return {
        id,
        entityId: id,
        label: id,
        kind,
        degree: 1,
        radius: kind === 'project' ? 8 : 12
    };
}

/** One edge of a kind, a related edge pointing one way and every other kind with no direction. */
export function edge(source: string, target: string, kind: GraphEdge['kind']): GraphEdge {
    return {
        id: `${kind}::${source}::${target}`,
        source,
        target,
        kind,
        direction: kind === 'related' ? 'one' : 'none',
        archived: false
    };
}

/**
 * Four pillars and forty projects: each project in one pillar, every third in the next pillar too,
 * and every fifth related to the project three before it. 44 nodes and 61 edges.
 */
export function denseGraph(): Graph {
    const lines = ['a', 'b', 'c', 'd'];
    const nodes: GraphNode[] = lines.map((l) => node(`line::${l}`, 'line'));
    const edges: GraphEdge[] = [];
    for (let p = 0; p < 40; p++) {
        nodes.push(node(`project::p${p}`));
        edges.push(edge(`project::p${p}`, `line::${lines[p % 4]}`, 'membership'));
        if (p % 3 === 0) {
            edges.push(edge(`project::p${p}`, `line::${lines[(p + 1) % 4]}`, 'membership'));
        }
        if (p % 5 === 0 && p > 0) {
            edges.push(edge(`project::p${p}`, `project::p${p - 3}`, 'related'));
        }
    }
    return { nodes, edges };
}
