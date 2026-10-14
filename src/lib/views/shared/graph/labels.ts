// Layer 3, shared graph helper. Which node labels the graph draws (Graph.svelte, the Map's and the
// Notes Graph's). The labels the pointer or the keyboard is on are drawn first, whatever they
// overlap; then the pillars' labels, so a project's label never hides its pillar's; then every
// other label in the graph's own order. A label after the leading ones is left out when it
// overlaps a label already drawn or any node but its own: a project or a note is its circle, a
// pillar or a collaborator its square.
//
// The rule is over boxes in the graph's own coordinates, so it holds at every zoom: the labels and
// the nodes are scaled together. The size of each label is the page's measure of it, handed in, and
// a label not measured yet has no width and overlaps nothing.

import type { GraphKind } from '$lib/state/boards/structure/graph';

/** One label's box in the graph's coordinates. */
export type LabelBox = { id: string; left: number; top: number; right: number; bottom: number };

/**
 * How far past its node's edge a label starts, and how far below the node's centre its baseline
 * sits.
 */
export const LABEL_GAP = 4;
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

/** The box of one label, drawn to the right of its node at its measured size. */
export function labelBox(
    node: { id: string; x: number; y: number; radius: number },
    size: LabelSize
): LabelBox {
    const left = node.x + node.radius + LABEL_GAP;
    const baseline = node.y + LABEL_DROP;
    return {
        id: node.id,
        left,
        top: baseline - size.above,
        right: left + size.width,
        bottom: baseline + size.below
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

function empty(box: LabelBox): boolean {
    return box.right <= box.left;
}

function overlaps(a: LabelBox, b: LabelBox): boolean {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** Whether a box overlaps a node: a project's or a note's circle, or the square of any other. */
function coversNode(box: LabelBox, node: LabelNode): boolean {
    const { x, y, radius } = node;
    if (node.kind !== 'project' && node.kind !== 'note') {
        const square = {
            id: node.id,
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
 * The ids of the labels to draw. The ids in `first` (the hovered and the selected node) are drawn
 * whatever they overlap; then the pillars' labels, then the rest, each in the order of `boxes`, and
 * each drawn only when it overlaps no label drawn before it and no node of `nodes` but its own.
 */
export function shownLabels(boxes: LabelBox[], first: string[], nodes: LabelNode[]): Set<string> {
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
        if (!empty(box)) {
            if (kept.some((other) => !empty(other) && overlaps(box, other))) continue;
            if (nodes.some((node) => node.id !== box.id && coversNode(box, node))) continue;
        }
        kept.push(box);
        shown.add(box.id);
    }
    return shown;
}
