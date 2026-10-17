// Layer 4, tool. Several drawings apart.mjs has drawn, set in one drawing in rows, so a diagram cut
// into parts reads at the width of a page rather than as one wide drawing.
//
// Each part is a drawing in the shape drawnApart() writes: every node, group and arrow at the
// position Graphviz's `nop2` layout keeps. The parts are set in their order, left to right in a
// row as long as the row stays within the widest part, then on in the row below, GAP points apart,
// each part's top on its row's top. Setting one moves every position of the part by the same
// amount, so each part stays the drawing the rule cleared, and the parts do not overlap. Each id
// of a part (a node, an arrow's ends, a group) is given the part's number before it, `3. `, so a
// module two parts draw is two nodes. The one drawing is checked again as drawnApart() checks
// each part: stacked() throws, naming them, where arrowsAlong() or labelsAcross() finds anything.
// The SVG's titles and comments then drop the numbers, so a hover names the module alone.

import { arrowsAlong, labelsAcross } from './labels.mjs';

/** The room, in points, between two parts in a row and between two rows. */
const GAP = 24;

/** A quoted DOT id, its text in the first group. */
const QUOTED = '"((?:[^"\\\\]|\\\\.)*)"';

/** A statement of a drawing's head: the graph's, the nodes' or the arrows' defaults. */
const HEAD_LINE = /^\s*(?:graph|node|edge) \[/;

/** A group's opening statement: its indent and its id after `cluster_`. */
const CLUSTER_LINE = new RegExp(`^(\\s*subgraph )"cluster_((?:[^"\\\\]|\\\\.)*)"( \\{)$`);

/** An arrow statement: its indent, its tail, its head and the rest. */
const ARROW_LINE = new RegExp(`^(\\s*)${QUOTED} -> ${QUOTED}(.*)$`);

/** A node statement: its indent, its id and the rest. */
const NODE_LINE = new RegExp(`^(\\s*)${QUOTED}(.*)$`);

/** A part's number before an id in the SVG's titles and comments, after what it follows. */
const MARK = /(<title>|<!-- |cluster_|&gt;)\d+\. /g;

/** A position attribute: an arrow's points, a node's place, a box or a group label's place. */
const PLACE = /(^|[\s[,;])(pos|bb|lp)="([^"]*)"/g;

/** The box of a drawing, from its graph statement: left, bottom, right, top. */
export function boxOf(/** @type {string} */ dot) {
    const graph = dot.split('\n').find((line) => /^\s*graph \[/.test(line)) ?? '';
    const box = /\bbb="([^"]*)"/.exec(graph);
    if (box === null) throw new Error('a part to stack has no box in its graph statement');
    return box[1].split(',').map(Number);
}

/**
 * A position attribute's value moved by `dx` and `dy`: every pair of numbers in it, an arrow's
 * `e,` or `s,` end and a node's `!` kept.
 */
function moved(/** @type {string} */ value, /** @type {number} */ dx, /** @type {number} */ dy) {
    return value
        .split(' ')
        .map((token) => {
            const end = /^([es],)?(.*?)(!?)$/.exec(token) ?? ['', '', token, ''];
            const numbers = end[2].split(',').map(Number);
            const shifted = numbers.map((one, at) => (one + (at % 2 === 0 ? dx : dy)).toFixed(2));
            return `${end[1] ?? ''}${shifted.join(',')}${end[3]}`;
        })
        .join(' ');
}

/** A part's statements under its head, each id given `mark` and each position moved. */
function partLines(
    /** @type {string} */ dot,
    /** @type {string} */ mark,
    /** @type {number} */ dx,
    /** @type {number} */ dy
) {
    const lines = dot.split('\n');
    const body = lines.slice(lines.findIndex((line) => /^digraph /.test(line)) + 1);
    return body
        .filter((line) => !HEAD_LINE.test(line) && line !== '}' && line !== '')
        .map((line) => {
            const cluster = CLUSTER_LINE.exec(line);
            const arrow = ARROW_LINE.exec(line);
            const node = NODE_LINE.exec(line);
            let renamed = line;
            if (cluster !== null)
                renamed = `${cluster[1]}"cluster_${mark}${cluster[2]}"${cluster[3]}`;
            else if (arrow !== null) {
                renamed = `${arrow[1]}"${mark}${arrow[2]}" -> "${mark}${arrow[3]}"${arrow[4]}`;
            } else if (node !== null) renamed = `${node[1]}"${mark}${node[2]}"${node[3]}`;
            return renamed.replace(PLACE, (_, before, key, value) => {
                return `${before}${key}="${moved(value, dx, dy)}"`;
            });
        });
}

/**
 * The parts, drawings drawnApart() made, set in rows as one drawing: its DOT, with the head of the
 * first part and the box of the whole, and the SVG `draw` renders from it with the parts' numbers
 * dropped from its titles. A drawing the checks of labels.mjs find anything in is an error naming
 * each find, so none is ever written.
 *
 * @param {string} name The diagram, for the error.
 * @param {string[]} dots The parts' DOT, in their order.
 * @param {import('./apart.mjs').Renderer} renderer
 * @returns {{ dot: string, svg: string }}
 */
export function stacked(name, dots, { draw }) {
    if (dots.length === 0) throw new Error(`${name}: there is no part to stack`);
    const boxes = dots.map(boxOf);
    const sizes = boxes.map(([x0, y0, x1, y1]) => ({ width: x1 - x0, height: y1 - y0 }));
    const limit = Math.max(...sizes.map((size) => size.width));
    /** @type {number[][]} */
    const rows = [];
    let used = 0;
    sizes.forEach((size, at) => {
        const row = rows[rows.length - 1];
        if (row !== undefined && used + GAP + size.width <= limit) {
            row.push(at);
            used += GAP + size.width;
        } else {
            rows.push([at]);
            used = size.width;
        }
    });
    const tall = rows.map((row) => Math.max(...row.map((at) => sizes[at].height)));
    const height = tall.reduce((sum, one) => sum + one, 0) + GAP * (rows.length - 1);
    /** @type {string[]} */
    const body = [];
    let top = height;
    rows.forEach((row, index) => {
        let left = 0;
        for (const at of row) {
            const [x0, , , y1] = boxes[at];
            body.push(...partLines(dots[at], `${at + 1}. `, left - x0, top - y1));
            left += sizes[at].width + GAP;
        }
        top -= tall[index] + GAP;
    });
    const first = dots[0].split('\n');
    const head = first
        .slice(0, first.findIndex((line) => /^digraph /.test(line)) + 1)
        .concat(first.filter((line) => HEAD_LINE.test(line)))
        .map((line) =>
            /^\s*graph \[/.test(line)
                ? line.replace(
                      /\bbb="[^"]*"/,
                      `bb="0.00,0.00,${limit.toFixed(2)},${height.toFixed(2)}"`
                  )
                : line
        );
    const dot = [...head, ...body, '}', ''].join('\n');
    const svg = draw(dot);
    const left = [...arrowsAlong(svg), ...labelsAcross(svg)];
    if (left.length > 0)
        throw new Error(`${name}: the parts set together are not clear\n${left.join('\n')}`);
    return { dot, svg: svg.replace(MARK, '$1') };
}
