// Layer 3, shared graph helper. The graph's box and the simulation Graph.svelte goes on with, kept
// in step with the pane and the graph. The box is the SVG's own size in CSS pixels, measured as it
// changes, so the graph takes the pane's shape; a hidden tab, which draws at no size, keeps the box
// it had. The simulation is the one mapPlacement() of state/boards/structure/layout.ts settled:
// each tick is kept in the box and drawn, a node added or taken away is brought into it (renode()),
// an edge written or taken away and the drawn sizes its count sets are brought into it (relink()),
// and a box that changes moves the picture to its centre (recentre()), so none of these lays the
// graph out anew or moves a node against the others. The view reads the box, which its placement
// waits for, and the positions at the last tick or move, which take over from the settled
// placement.

import { untrack } from 'svelte';
import {
    paneBounds,
    type Bounds,
    type Graph,
    type PointNode
} from '$lib/state/boards/structure/graph';
import {
    clampToBox,
    forceNodes,
    recentre,
    relink,
    renode,
    type MapForces
} from '$lib/state/boards/structure/forces';
import type { MapPlacement } from '$lib/state/boards/structure/layout';

/** What the follower reads of the view it serves, each read when it is needed. */
export type FollowInput = {
    /** The SVG the graph is drawn in, bound once the view has mounted. */
    svg: () => SVGSVGElement | undefined;
    graph: () => Graph;
    /** The placement the view holds, with its settled simulation and the box it was made in. */
    chosen: () => MapPlacement;
};

/**
 * The box and the drawn positions of one graph view. It registers its effects, so it is made while
 * a component initialises.
 */
export function followSimulation(input: FollowInput): {
    /** The box, or null until the SVG is first measured with a size. */
    bounds: () => Bounds | null;
    /** The positions at the last tick or move, or null while the settled placement stands. */
    placed: () => PointNode[] | null;
} {
    let bounds = $state<Bounds | null>(null);
    let placed = $state<PointNode[] | null>(null);
    /**
     * The simulation the box was last fitted to, that box, which a resize moves it from, and the
     * size the picture is drawn at against the size it settled at.
     */
    let fitted: { forces: MapForces; box: Bounds; scaled: number } | null = null;

    // The box follows the SVG's size; a hidden tab's no size keeps the box it had.
    $effect(() => {
        const svg = input.svg();
        if (svg === undefined) return;
        const watcher = new ResizeObserver(() => {
            const [width, height] = [svg.clientWidth, svg.clientHeight];
            if (width === 0 || height === 0) return;
            if (bounds?.width === width && bounds.height === height) return;
            bounds = paneBounds(width, height);
        });
        watcher.observe(svg);
        return () => watcher.disconnect();
    });

    // Each tick of the settled simulation is kept in the box and drawn; a new placement stops it.
    $effect(() => {
        const forces = input.chosen().forces;
        placed = null;
        if (forces === null) return;
        forces.on('tick', () => {
            if (fitted?.forces === forces) clampToBox(forces, fitted.box);
            placed = forceNodes(forces);
        });
        return () => {
            forces.stop();
            forces.on('tick', null);
        };
    });

    // A node added or taken away, an edge written or taken away, and the drawn sizes its count
    // sets, are brought into the simulation, which moves no node it keeps; a new node is placed in
    // the box the simulation is fitted to, and drawn. The next drag acts on them all.
    $effect(() => {
        const graph = input.graph();
        void graph.edges.map((edge) => `${edge.id}\n${edge.source}\n${edge.target}`).join('\n');
        void graph.nodes.map((node) => `${node.id}\n${String(node.radius)}`).join('\n');
        const chosen = input.chosen();
        const forces = chosen.forces;
        if (forces === null) return;
        untrack(() => {
            const box = fitted?.forces === forces ? fitted.box : chosen.bounds;
            if (box !== null && renode(forces, graph, box)) {
                placed = forceNodes(forces);
                return;
            }
            relink(forces, graph);
        });
    });

    // A placement is fitted to the box it was made in; a box that changes after moves the picture
    // to the new box's centre, shrunk only when it no longer fits and grown back toward its settled
    // size as the room returns, and draws it.
    $effect(() => {
        const chosen = input.chosen();
        const [forces, box] = [chosen.forces, bounds];
        if (forces === null || box === null) return;
        untrack(() => {
            const held = fitted?.forces === forces ? fitted : null;
            const from = held?.box ?? chosen.bounds;
            const scaled = held?.scaled ?? 1;
            fitted = { forces, box, scaled };
            if (from === null || (from.width === box.width && from.height === box.height)) return;
            fitted.scaled = recentre(forces, from, box, scaled);
            placed = forceNodes(forces);
        });
    });

    return { bounds: () => bounds, placed: () => placed };
}
