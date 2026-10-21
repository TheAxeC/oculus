// Layer 4, tool. How a diagram writes an arrow's words, and the check that no words sit across an
// arrow other than their own.
//
// Graphviz places an edge's own label beside the edge after it has routed every edge, so another
// edge may run straight through it, and then the count reads as that other arrow's. A node is
// different: the router takes every edge around the nodes it passes. So every count and every call
// list is drawn as a small node of words standing on its arrow, the arrow drawn in two halves
// through it (the first without a head, both in the arrow's own style), which keeps the words off
// the other arrows by the router's own rule, or in the layers overview and the channel and write
// diagrams by the rule of apart.mjs, which crosses a column of nodes only clear of them, rather
// than by a spacing chosen for one drawing.
//
// labelsAcross() is the check: it reads a rendered drawing and names every piece of text, an edge
// label or a label node's line, whose box a curve or an arrowhead of an arrow other than its own
// crosses, testing each Bezier segment against the box exactly rather than at sample points.

import { quote } from '../source.mjs';

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
 * The node of one arrow's words, unindented, so a diagram can declare it where it belongs (inside
 * the cluster of the folders the arrow joins), with its id, which names the arrow's two ends and
 * holds ` to `, the mark labelsAcross() and arrowsAlong() read a node of words by.
 *
 * @param {string} from
 * @param {string} to
 * @param {string} words The label, lines joined by `\n`.
 * @param {string} [kind] What tells two arrows between the same ends apart.
 * @returns {{ id: string, line: string }}
 */
export function wordNode(from, to, words, kind = '') {
    const id = `${from} to ${to}${kind === '' ? '' : ` (${kind})`}`;
    return { id, line: `${quote(id)} [label=${quote(words)}, ${LABEL_NODE}];` };
}

/**
 * The two halves of an arrow drawn through the node of its words: from its tail to the node
 * without a head and from the node to its head with one, both in the arrow's own attributes, so a
 * dashed arrow stays dashed end to end and no half is merged into another arrow. `first` is added
 * to the first half alone, for a diagram that places the node on a rank of its own choosing.
 *
 * @param {string} from
 * @param {string} node The id wordNode() gave.
 * @param {string} to
 * @param {string} [attrs] The arrow's own attributes, such as `style=dashed`.
 * @param {string} [first] Attributes of the first half alone, such as `minlen=2`.
 * @returns {string[]}
 */
export function halves(from, node, to, attrs = '', first = '') {
    const own = [attrs, first].filter((one) => one !== '').join(', ');
    return [
        `    ${quote(from)} -> ${quote(node)} [arrowhead=none${own === '' ? '' : `, ${own}`}];`,
        `    ${quote(node)} -> ${quote(to)} [${attrs}];`
    ];
}

/**
 * The lines of one arrow that carries words: the node of its words and the two halves through it.
 *
 * @param {string} from
 * @param {string} to
 * @param {string} words The label, lines joined by `\n`.
 * @param {string} [attrs] The arrow's own attributes, such as `style=dashed, constraint=false`.
 * @param {string} [kind] What tells two arrows between the same ends apart.
 * @returns {string[]}
 */
export function labelledEdge(from, to, words, attrs = '', kind = '') {
    const node = wordNode(from, to, words, kind);
    return [`    ${node.line}`, ...halves(from, node.id, to, attrs)];
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

/** How long, in points, two arrows may run together before the measure names them. */
const ALONG = 40;

/** How near, in points, a stretch of one arrow must lie to another to run along it. */
const NEAR = 1.5;

/** The longest piece, in points, a curve is cut into for the overlap measure. */
const PIECE = 0.5;

/** The point of a cubic Bezier at t. */
function pointAt(/** @type {number[][]} */ [a, b, c, d], /** @type {number} */ t) {
    const u = 1 - t;
    const [wa, wb, wc, wd] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [
        wa * a[0] + wb * b[0] + wc * c[0] + wd * d[0],
        wa * a[1] + wb * b[1] + wc * c[1] + wd * d[1]
    ];
}

/**
 * A curve as a polyline of pieces no longer than PIECE, cut at even steps of t: the speed of a
 * cubic Bezier is at most three times its longest control leg, so a step of t no larger than PIECE
 * over that bound gives a stretch of curve, and so a chord, no longer than PIECE.
 */
function polyline(/** @type {number[][]} */ curve) {
    let leg = 0;
    for (let at = 1; at < 4; at += 1) {
        const length = Math.hypot(curve[at][0] - curve[at - 1][0], curve[at][1] - curve[at - 1][1]);
        leg = Math.max(leg, length);
    }
    const count = Math.max(1, Math.ceil((3 * leg) / PIECE));
    const points = [];
    for (let at = 0; at <= count; at += 1) points.push(pointAt(curve, at / count));
    return points;
}

/** The distance of a point from the segment from a to b. */
function offSegment(
    /** @type {number[]} */ p,
    /** @type {number[]} */ a,
    /** @type {number[]} */ b
) {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const squared = dx * dx + dy * dy;
    const t =
        squared === 0
            ? 0
            : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / squared));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** The side, in points, of a cell of the grid a line's pieces are filed under for the search. */
const CELL = 4;

/**
 * @typedef {{ name: string, pieces: number[][][], box: Box, grid: Map<string, number[][][]> }}
 *     Line One arrow as the pieces of its curves, the box that holds them, and each piece filed
 *     under every cell of the grid that its box, grown by NEAR, touches.
 */

/** The key of the grid cell a point falls in. */
function cellOf(/** @type {number} */ x, /** @type {number} */ y) {
    return `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
}

/** The pieces filed by the cells they come within NEAR of. */
function filed(/** @type {number[][][]} */ pieces) {
    /** @type {Map<string, number[][][]>} */
    const grid = new Map();
    for (const piece of pieces) {
        const [a, b] = piece;
        const [x0, x1] = [Math.min(a[0], b[0]) - NEAR, Math.max(a[0], b[0]) + NEAR];
        const [y0, y1] = [Math.min(a[1], b[1]) - NEAR, Math.max(a[1], b[1]) + NEAR];
        for (let x = Math.floor(x0 / CELL); x <= Math.floor(x1 / CELL); x += 1) {
            for (let y = Math.floor(y0 / CELL); y <= Math.floor(y1 / CELL); y += 1) {
                const key = `${x},${y}`;
                grid.set(key, [...(grid.get(key) ?? []), piece]);
            }
        }
    }
    return grid;
}

/** How long a stretch of the line `one` lies within NEAR of the line `other`, in points. */
function sharedLength(/** @type {Line} */ one, /** @type {Line} */ other) {
    let length = 0;
    for (const [a, b] of one.pieces) {
        const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const near = other.grid.get(cellOf(middle[0], middle[1])) ?? [];
        if (near.some(([c, d]) => offSegment(middle, c, d) <= NEAR)) {
            length += Math.hypot(b[0] - a[0], b[1] - a[1]);
        }
    }
    return length;
}

/**
 * Every pair of arrows of a rendered drawing that run along each other, as `<arrow> along <arrow>
 * for <points>`: a pair where more than ALONG points of one arrow's line lie within NEAR of the
 * other's, measured both ways and the longer kept. An arrow drawn in two halves through a node of
 * its words is one arrow, both halves together, so the halves meeting at their words are no pair;
 * a head is left out, since two arrows into one node meet at its border for the length of a head.
 * Each curve is cut into pieces of at most PIECE points on the exact Bezier (polyline() says why
 * none is longer), and a piece counts where its middle lies within NEAR of a piece of the other
 * line.
 *
 * @param {string} svg
 * @returns {string[]}
 */
export function arrowsAlong(svg) {
    const nodes = new Set();
    /** @type {Map<string, number[][][]>} */
    const lines = new Map();
    const groups = [
        ...svg.matchAll(/<g id="(edge|node)\d+" class="(?:edge|node)">([\s\S]*?)\n<\/g>/g)
    ];
    for (const [, kind, body] of groups) {
        if (kind === 'node' && titleOf(body).includes(' to ')) nodes.add(titleOf(body));
    }
    for (const [, kind, body] of groups) {
        if (kind !== 'edge') continue;
        const title = titleOf(body).replace(/: [\s\S]*$/, '');
        const ends = title.split('->');
        const name = ends.find((end) => nodes.has(end)) ?? title;
        const pieces = lines.get(name) ?? [];
        for (const path of body.matchAll(/<path[^>]* d="([^"]+)"/g)) {
            const points = pairs(path[1]);
            for (let at = 0; at + 3 < points.length; at += 3) {
                const cut = polyline(points.slice(at, at + 4));
                for (let one = 1; one < cut.length; one += 1) pieces.push([cut[one - 1], cut[one]]);
            }
        }
        lines.set(name, pieces);
    }
    /** @type {Line[]} */
    const held = [...lines].map(([name, pieces]) => {
        const xs = pieces.flat().map((point) => point[0]);
        const ys = pieces.flat().map((point) => point[1]);
        const box = {
            x0: Math.min(...xs),
            x1: Math.max(...xs),
            y0: Math.min(...ys),
            y1: Math.max(...ys)
        };
        return { name, pieces, box, grid: filed(pieces) };
    });
    const found = [];
    for (let first = 0; first < held.length; first += 1) {
        for (let second = first + 1; second < held.length; second += 1) {
            const [one, other] = [held[first], held[second]];
            const apart =
                one.box.x1 + NEAR < other.box.x0 ||
                other.box.x1 + NEAR < one.box.x0 ||
                one.box.y1 + NEAR < other.box.y0 ||
                other.box.y1 + NEAR < one.box.y0;
            if (apart) continue;
            const length = Math.max(sharedLength(one, other), sharedLength(other, one));
            if (length > ALONG) {
                const [a, b] = [one.name, other.name].sort();
                found.push(`${a} along ${b} for ${Math.round(length)}`);
            }
        }
    }
    return found.sort();
}
