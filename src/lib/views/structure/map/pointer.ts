// Layer 3, Map partial helper. Where a pointer lands in the graph, and what it holds there. The SVG
// draws its box under `preserveAspectRatio="xMidYMid meet"`, so in a pane of another shape the
// picture is scaled evenly and centred with empty bands on two sides; a pointer is mapped through
// that letterbox to the box, then through the pane's pan and zoom to the graph. A dragged node
// keeps the offset from the pointer it was grabbed at and is placed again only once the pointer has
// moved a screen pixel, and the link pointer takes the nearest project in reach.
//
// Every function here is pure, so the drag, the link pointer, the pan and the wheel zoom share one
// rule and it is checked without a page.

import { DEFAULT_BOUNDS, type PointNode } from '$lib/state/boards/structure/graph';

/** A point, in client pixels, box units or graph units by what it is handed to. */
export type Point = { x: number; y: number };

/** The box an element is drawn in on the page, as getBoundingClientRect() answers it. */
export type Rect = { left: number; top: number; width: number; height: number };

/**
 * A client point in the graph's box: the picture's scale is the smaller of the two ratios of the
 * pane to the box, and its corner sits half the empty band in from the pane's. A pane of no size (a
 * hidden tab) draws nothing and answers the box's corner.
 */
export function toBox(client: Point, rect: Rect): Point {
    const scale = Math.min(rect.width / DEFAULT_BOUNDS.width, rect.height / DEFAULT_BOUNDS.height);
    if (!(scale > 0)) return { x: 0, y: 0 };
    const left = rect.left + (rect.width - DEFAULT_BOUNDS.width * scale) / 2;
    const top = rect.top + (rect.height - DEFAULT_BOUNDS.height * scale) / 2;
    return { x: (client.x - left) / scale, y: (client.y - top) / scale };
}

/**
 * A point of the box in the graph, under the pan `pan` and the zoom `zoom` the graph is drawn at.
 */
export function toGraph(box: Point, pan: Point, zoom: number): Point {
    return { x: (box.x - pan.x) / zoom, y: (box.y - pan.y) / zoom };
}

/**
 * Where a dragged node goes for the pointer at `at` in the graph, grabbed `grab` from its centre,
 * so it stays under the pointer where it was taken.
 */
export function dragTarget(at: Point, grab: Point): Point {
    return { x: at.x + grab.x, y: at.y + grab.y };
}

/** The least distance in screen pixels a pointer moves before a drag places its node again. */
export const DRAG_PIXEL = 1;

/**
 * Whether a pointer at the screen point `at` has moved far enough from `last`, the screen point of
 * the last event that placed the dragged node (the press first), to place it again. A pointer that
 * rests or trembles by less than a pixel places nothing and so starts no settle.
 */
export function movedEnough(last: Point, at: Point): boolean {
    return Math.hypot(at.x - last.x, at.y - last.y) >= DRAG_PIXEL;
}

/** How far past a project's edge the link pointer still reaches it, in graph units. */
export const LINK_REACH = 12;

/** The project nearest `at` within its radius and LINK_REACH, other than `except`, or null. */
export function nearestProject(nodes: PointNode[], at: Point, except: string): PointNode | null {
    let nearest: PointNode | null = null;
    let distance = Infinity;
    for (const node of nodes) {
        if (node.kind !== 'project' || node.id === except) continue;
        const held = Math.hypot(node.x - at.x, node.y - at.y);
        if (held <= node.radius + LINK_REACH && held < distance) {
            nearest = node;
            distance = held;
        }
    }
    return nearest;
}
