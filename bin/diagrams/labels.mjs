// Layer 4, tool. How a diagram writes an arrow's words, and the check that no words sit across an
// arrow other than their own.
//
// Graphviz places an edge's own label beside the edge after it has routed every edge, so another
// edge may run straight through it, and then the count reads as that other arrow's. A node is
// different: the router takes every edge around the nodes it passes. So every count and every call
// list is drawn as a small node of words standing on its arrow, the arrow drawn in two halves
// through it (the first without a head, both in the arrow's own style), which keeps the words off
// the other arrows by the router's own rule rather than by a spacing chosen for one drawing.
//
// labelsAcross() is the check: it reads a rendered drawing and names every piece of text, an edge
// label or a label node's line, whose box a curve or an arrowhead of an arrow other than its own
// crosses, testing each Bezier segment against the box exactly rather than at sample points.

import { quote } from './source.mjs';

/**
 * How wide a character of an edge's own label is taken to be, as a share of its font size, where
 * Graphviz draws no box around the label to read: Helvetica's digits are 0.556 of the size, so
 * 0.6 holds a count inside its box with a margin under half a point per digit. A label node's
 * box is the one Graphviz measured and drew for it, read off the drawing.
 */
const GLYPH = 0.6;

/**
 * A label node: a box drawn in no colour, so the drawing keeps the outline Graphviz measured for
 * the words (which labelsAcross() reads) and shows only the words, at the size edge labels had.
 */
const LABEL_NODE =
    'shape=box, color="transparent", fontsize=8, width=0, height=0, margin="0.04,0.02"';

/** How flat a curve must be, in points, before it is tested as the chord between its ends. */
const FLAT = 0.01;

/**
 * The lines of one arrow that carries words: a plaintext node holding them, and the arrow drawn
 * from its tail to the node without a head and from the node to its head with one, both halves in
 * the arrow's own attributes, so a dashed arrow stays dashed end to end and no half is merged into
 * another arrow.
 *
 * @param {string} from
 * @param {string} to
 * @param {string} words The label, lines joined by `\n`.
 * @param {string} [attrs] The arrow's own attributes, such as `style=dashed, constraint=false`.
 * @param {string} [kind] What tells two arrows between the same ends apart.
 * @returns {string[]}
 */
export function labelledEdge(from, to, words, attrs = '', kind = '') {
    const node = `${from} to ${to}${kind === '' ? '' : ` (${kind})`}`;
    const own = attrs === '' ? '' : `, ${attrs}`;
    return [
        `    ${quote(node)} [label=${quote(words)}, ${LABEL_NODE}];`,
        `    ${quote(from)} -> ${quote(node)} [arrowhead=none${own}];`,
        `    ${quote(node)} -> ${quote(to)} [${attrs}];`
    ];
}

/** The pairs of numbers of an SVG attribute, as points. */
function pairs(/** @type {string} */ text) {
    const numbers = (text.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []).map(Number);
    const found = [];
    for (let at = 0; at + 1 < numbers.length; at += 2) found.push([numbers[at], numbers[at + 1]]);
    return found;
}

/**
 * @typedef {{ x0: number, x1: number, y0: number, y1: number }} Box
 */

/** Whether the straight segment from a to b meets the box, by clipping it to the box. */
function segmentMeets(
    /** @type {number[]} */ a,
    /** @type {number[]} */ b,
    /** @type {Box} */ box
) {
    let low = 0;
    let high = 1;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    for (const [p, q] of [
        [-dx, a[0] - box.x0],
        [dx, box.x1 - a[0]],
        [-dy, a[1] - box.y0],
        [dy, box.y1 - a[1]]
    ]) {
        if (p === 0) {
            if (q < 0) return false;
            continue;
        }
        const t = q / p;
        if (p < 0) low = Math.max(low, t);
        else high = Math.min(high, t);
        if (low > high) return false;
    }
    return true;
}

/** The distance of a point from the line through a and b. */
function offLine(/** @type {number[]} */ p, /** @type {number[]} */ a, /** @type {number[]} */ b) {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    return Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / length;
}

/**
 * Whether one cubic Bezier segment meets the box: none of it can where the box of its control
 * points misses the box, and once the control points lie within FLAT of the chord the chord is
 * tested; otherwise the curve is split in two at its middle (de Casteljau) and each half tested.
 *
 * @returns {boolean}
 */
function curveMeets(/** @type {number[][]} */ curve, /** @type {Box} */ box, depth = 0) {
    const xs = curve.map((one) => one[0]);
    const ys = curve.map((one) => one[1]);
    const clear =
        Math.max(...xs) < box.x0 ||
        Math.min(...xs) > box.x1 ||
        Math.max(...ys) < box.y0 ||
        Math.min(...ys) > box.y1;
    if (clear) return false;
    const [a, b, c, d] = curve;
    if (depth > 30 || (offLine(b, a, d) <= FLAT && offLine(c, a, d) <= FLAT)) {
        return segmentMeets(a, d, box);
    }
    const mid = (/** @type {number[]} */ p, /** @type {number[]} */ q) => [
        (p[0] + q[0]) / 2,
        (p[1] + q[1]) / 2
    ];
    const ab = mid(a, b);
    const bc = mid(b, c);
    const cd = mid(c, d);
    const abc = mid(ab, bc);
    const bcd = mid(bc, cd);
    const middle = mid(abc, bcd);
    return (
        curveMeets([a, ab, abc, middle], box, depth + 1) ||
        curveMeets([middle, bcd, cd, d], box, depth + 1)
    );
}

/** Whether a closed polygon (an arrowhead) meets the box: an edge of it crosses, or it holds it. */
function polygonMeets(/** @type {number[][]} */ points, /** @type {Box} */ box) {
    for (let at = 0; at < points.length; at += 1) {
        if (segmentMeets(points[at], points[(at + 1) % points.length], box)) return true;
    }
    return holds(points, [box.x0, box.y0]);
}

/** Whether a point lies inside a closed polygon, by the crossings of a ray to its right. */
function holds(/** @type {number[][]} */ points, /** @type {number[]} */ [x, y]) {
    let inside = false;
    for (let at = 0, back = points.length - 1; at < points.length; back = at, at += 1) {
        const [xa, ya] = points[at];
        const [xb, yb] = points[back];
        if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
    }
    return inside;
}

/** The title of a group, its entities read back to the characters they stand for. */
function titleOf(/** @type {string} */ body) {
    return (/<title>([^<]*)/.exec(body)?.[1] ?? '')
        .replace(/&#45;/g, '-')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
}

/** Every text of a group as the box it takes, with its words. */
function textsOf(/** @type {string} */ body) {
    const pattern =
        /<text[^>]* x="([-\d.]+)" y="([-\d.]+)"[^>]* font-size="([\d.]+)"[^>]*>([^<]*)</g;
    return [...body.matchAll(pattern)].map((text) => {
        const [x, y, size] = [Number(text[1]), Number(text[2]), Number(text[3])];
        const half = (text[4].length * size * GLYPH) / 2;
        /** @type {Box} */
        const box = { x0: x - half, x1: x + half, y0: y - size * 0.8, y1: y + size * 0.2 };
        return { words: text[4], box };
    });
}

/**
 * Every piece of words a rendered drawing sets across an arrow other than its own, as `<owner>
 * label <words> across <arrow>`: an edge's own label, owned by that edge, and each line of a label
 * node, owned by the two halves that run through the node. A label's box is centred on its
 * text's anchor, GLYPH of the font size wide per character and the font size tall from just under
 * the baseline; an arrow is its curve, each cubic segment tested exactly, and its head.
 *
 * @param {string} svg
 * @returns {string[]}
 */
export function labelsAcross(svg) {
    const arrows = [];
    const labels = [];
    for (const group of svg.matchAll(
        /<g id="(edge|node)\d+" class="(?:edge|node)">([\s\S]*?)\n<\/g>/g
    )) {
        const [, kind, body] = group;
        const title = titleOf(body);
        if (kind === 'node') {
            if (!title.includes(' to ')) continue;
            const outline = /<polygon[^>]* points="([^"]+)"/.exec(body);
            const words = textsOf(body)
                .map((text) => text.words)
                .join(' ');
            if (outline === null) {
                for (const text of textsOf(body))
                    labels.push({ owner: title, ...text, node: title });
                continue;
            }
            const corners = pairs(outline[1]);
            const xs = corners.map((one) => one[0]);
            const ys = corners.map((one) => one[1]);
            /** @type {Box} */
            const box = {
                x0: Math.min(...xs),
                x1: Math.max(...xs),
                y0: Math.min(...ys),
                y1: Math.max(...ys)
            };
            labels.push({ owner: title, words, box, node: title });
            continue;
        }
        const ends = title;
        /** @type {number[][][]} */
        const curves = [];
        for (const path of body.matchAll(/<path[^>]* d="([^"]+)"/g)) {
            const points = pairs(path[1]);
            for (let at = 0; at + 3 < points.length; at += 3) curves.push(points.slice(at, at + 4));
        }
        const heads = [...body.matchAll(/<polygon[^>]* points="([^"]+)"/g)].map((one) =>
            pairs(one[1])
        );
        arrows.push({ ends, curves, heads });
        for (const text of textsOf(body)) labels.push({ owner: ends, ...text, node: null });
    }
    const found = [];
    for (const label of labels) {
        for (const arrow of arrows) {
            const own =
                label.node === null
                    ? arrow.ends === label.owner
                    : arrow.ends.split('->').includes(label.node);
            if (own) continue;
            const crosses =
                arrow.curves.some((curve) => curveMeets(curve, label.box)) ||
                arrow.heads.some((head) => polygonMeets(head, label.box));
            if (crosses) found.push(`${label.owner} label ${label.words} across ${arrow.ends}`);
        }
    }
    return found.sort();
}
