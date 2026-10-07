// Layer 3, primitive, pure. Smart selection for LaTeX: the ranges Expand Selection steps through at
// a position, from the smallest node of the parse tree that holds it to the node that holds the
// whole text. The tree is latex-utensils', handed in already parsed; a node is any object with a
// `location` holding offsets, and its children are the nodes found in its other properties, so the
// walk does not depend on which kinds of node the parser names.

/** The part of a latex-utensils node the walk reads. */
type Node = { location?: { start: { offset: number }; end: { offset: number } } };

/** One range of the text as offsets. */
export type Range = { start: number; end: number };

/** Whether a value is a node: an object that carries a location. */
function isNode(value: unknown): value is Node {
    return typeof value === 'object' && value !== null && 'location' in value;
}

/** The nodes directly inside a node: the nodes among its properties and the lists' elements. */
function childrenOf(node: object): Node[] {
    const found: Node[] = [];
    for (const [key, value] of Object.entries(node)) {
        if (key === 'location') continue;
        if (Array.isArray(value)) {
            for (const one of value) if (isNode(one)) found.push(one);
        } else if (isNode(value)) {
            found.push(value);
        }
    }
    return found;
}

/**
 * The ranges that hold `offset`, the smallest first and the whole text last, each strictly larger
 * than the one before it so a step always widens the selection.
 */
export function rangesAt(tree: object, offset: number, length: number): Range[] {
    const chain: Range[] = [];
    let level: Node[] = childrenOf(tree);
    while (level.length > 0) {
        const hit = level.find(
            (one) =>
                one.location !== undefined &&
                one.location.start.offset <= offset &&
                offset <= one.location.end.offset
        );
        if (hit?.location === undefined) break;
        chain.push({ start: hit.location.start.offset, end: hit.location.end.offset });
        level = childrenOf(hit);
    }
    chain.unshift({ start: 0, end: length });
    const widening: Range[] = [];
    for (const one of chain.reverse()) {
        const last = widening.at(-1);
        const wider =
            last === undefined ||
            (one.start <= last.start &&
                one.end >= last.end &&
                (one.start < last.start || one.end > last.end));
        if (wider) widening.push(one);
    }
    return widening;
}
