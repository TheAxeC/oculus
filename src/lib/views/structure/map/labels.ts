// Layer 3, Map partial helper. Which node labels the graph draws: a label that would overlap one
// already drawn is left out, walking the labels the pointer or the keyboard is on first, so those
// are always drawn, and then every other label in the graph's own order.
//
// The rule is over boxes in the graph's own coordinates, so it holds at every zoom: the labels and
// the nodes are scaled together. The size of each label is the page's measure of it, handed in.

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

function overlaps(a: LabelBox, b: LabelBox): boolean {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/**
 * The ids of the labels to draw. The ids in `first` (the hovered and the selected node) are drawn
 * whatever they overlap; every other label is drawn only when it overlaps none drawn before it.
 */
export function shownLabels(boxes: LabelBox[], first: string[]): Set<string> {
    const kept: LabelBox[] = [];
    const shown = new Set<string>();
    const leading = boxes.filter((box) => first.includes(box.id));
    for (const box of leading) {
        kept.push(box);
        shown.add(box.id);
    }
    for (const box of boxes) {
        if (shown.has(box.id)) continue;
        if (kept.some((other) => overlaps(box, other))) continue;
        kept.push(box);
        shown.add(box.id);
    }
    return shown;
}
