// Layer 3, shared graph helper. Which node labels the graph draws (Graph.svelte, the Map's and the
// Notes Graph's). The labels the pointer or the keyboard is on are drawn first, whatever they
// overlap; then the pillars' labels, so a project's label never hides its pillar's; then every
// other label in the graph's own order. A label after the leading ones is left out when it overlaps
// a label already drawn, any node but its own (a project or a note is its circle, a pillar or a
// collaborator its square) or any edge's line as it is drawn, so no label is drawn across an edge.
//
// A label is drawn to the right of its node, and on its left, ending at the node, when the box on
// the right would reach past the right edge of the part of the graph the SVG shows (labelBox()), so
// no label is cut by the SVG's edge. A label that leaves that part on both sides, or above or below
// it, is `cut`, and the rule leaves it out as it leaves out one that overlaps, until its node is
// hovered or holds the keyboard.
//
// The rule is over boxes and lines in the graph's own coordinates, so it holds at every zoom: the
// labels, the nodes and the edges are scaled together. The size of each label is the page's measure
// of it, handed in, and a label not measured yet has no width and overlaps nothing.

import type { GraphKind } from '$lib/state/boards/structure/graph';

/**
 * One label's box in the graph's coordinates, the side of its node it is drawn on, and whether it
 * reaches past the part of the graph the SVG shows.
 */
export type LabelBox = {
    id: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    side: 'right' | 'left';
    cut: boolean;
};

/** The part of the graph the SVG shows, in the graph's coordinates. */
export type LabelView = { left: number; top: number; right: number; bottom: number };

/** No edge: what a graph not measured yet is shown in, which cuts no label. */
export const UNBOUNDED: LabelView = {
    left: -Infinity,
    top: -Infinity,
    right: Infinity,
    bottom: Infinity
};

/**
 * How far past its node's edge a label starts, and how far below the node's centre its baseline
 * sits.
 */
const LABEL_GAP = 4;
export const LABEL_DROP = 4;

/** A label's measured size: its width, and how far its box reaches above and below its baseline. */
export type LabelSize = { width: number; above: number; below: number };

/** One drawn label's size, from its box and the baseline its `y` names. */
export function labelSize(text: SVGTextElement): LabelSize {
    const box = text.getBBox();
    const ys = text.y.baseVal;
    const baseline = ys.numberOfItems > 0 ? ys.getItem(0).value : box.y;
    return { width: box.width, above: baseline - box.y, below: box.y + box.height - baseline };
}

/** The size of a label not measured yet, which overlaps nothing. */
export const UNMEASURED: LabelSize = { width: 0, above: 0, below: 0 };

/**
 * The box of one label at its measured size: to the right of its node, or to its left when the
 * right box reaches past the right edge of `view` and the left one does not; when neither fits, on
 * the side it reaches out of less, and `cut`. A label that reaches above or below `view` is `cut`
 * too.
 */
export function labelBox(
    node: { id: string; x: number; y: number; radius: number },
    size: LabelSize,
    view: LabelView
): LabelBox {
    const start = node.x + node.radius + LABEL_GAP;
    const end = node.x - node.radius - LABEL_GAP;
    const baseline = node.y + LABEL_DROP;
    const [top, bottom] = [baseline - size.above, baseline + size.below];
    const pastRight = start + size.width - view.right;
    const pastLeft = view.left - (end - size.width);
    const side = pastRight <= 0 || pastRight <= pastLeft ? 'right' : 'left';
    const left = side === 'right' ? start : end - size.width;
    const across = side === 'right' ? pastRight : pastLeft;
    return {
        id: node.id,
        left,
        top,
        right: left + size.width,
        bottom,
        side,
        cut: across > 0 || top < view.top || bottom > view.bottom
    };
}

/** A node as the label rule reads it: where it is, its size and so its shape. */
export type LabelNode = {
    id: string;
    x: number;
    y: number;
    radius: number;
    kind: GraphKind;
};

/** One edge's line as it is drawn, from one end to the other. */
export type LabelLine = { x1: number; y1: number; x2: number; y2: number };

function empty(box: LabelBox): boolean {
    return box.right <= box.left;
}

/** A box's four edges, a label's or a square node's. */
type Edges = Pick<LabelBox, 'left' | 'top' | 'right' | 'bottom'>;

function overlaps(a: Edges, b: Edges): boolean {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** Whether a box overlaps a node: a project's or a note's circle, or the square of any other. */
function coversNode(box: LabelBox, node: LabelNode): boolean {
    const { x, y, radius } = node;
    if (node.kind !== 'project' && node.kind !== 'note') {
        const square = {
            left: x - radius,
            top: y - radius,
            right: x + radius,
            bottom: y + radius
        };
        return overlaps(box, square);
    }
    const nearestX = Math.max(box.left, Math.min(x, box.right));
    const nearestY = Math.max(box.top, Math.min(y, box.bottom));
    return Math.hypot(nearestX - x, nearestY - y) < radius;
}

/**
 * Whether a line runs through the inside of a box, by clipping the line to the box (Liang and
 * Barsky): a line that only touches the box's edge, or runs along it, does not.
 */
function crosses(box: LabelBox, line: LabelLine): boolean {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const sides: [number, number][] = [
        [-dx, line.x1 - box.left],
        [dx, box.right - line.x1],
        [-dy, line.y1 - box.top],
        [dy, box.bottom - line.y1]
    ];
    let enter = 0;
    let leave = 1;
    for (const [toward, room] of sides) {
        if (toward === 0) {
            if (room <= 0) return false;
            continue;
        }
        const at = room / toward;
        if (toward < 0) enter = Math.max(enter, at);
        else leave = Math.min(leave, at);
        if (enter >= leave) return false;
    }
    return true;
}

/**
 * The ids of the labels to draw. The ids in `first` (the hovered and the selected node) are drawn
 * whatever they overlap; then the pillars' labels, then the rest, each in the order of `boxes`, and
 * each drawn only when it is not `cut` and overlaps no label drawn before it, no node of `nodes`
 * but its own and no line of `lines`, the edges as they are drawn.
 */
export function shownLabels(
    boxes: LabelBox[],
    first: string[],
    nodes: LabelNode[],
    lines: LabelLine[]
): Set<string> {
    const kept: LabelBox[] = [];
    const shown = new Set<string>();
    for (const box of boxes) {
        if (!first.includes(box.id)) continue;
        kept.push(box);
        shown.add(box.id);
    }
    const pillars = new Set(nodes.filter((node) => node.kind === 'line').map((node) => node.id));
    const rest = [
        ...boxes.filter((box) => pillars.has(box.id)),
        ...boxes.filter((box) => !pillars.has(box.id))
    ];
    for (const box of rest) {
        if (shown.has(box.id)) continue;
        if (box.cut) continue;
        if (!empty(box)) {
            if (kept.some((other) => !empty(other) && overlaps(box, other))) continue;
            if (nodes.some((node) => node.id !== box.id && coversNode(box, node))) continue;
            if (lines.some((line) => crosses(box, line))) continue;
        }
        kept.push(box);
        shown.add(box.id);
    }
    return shown;
}
