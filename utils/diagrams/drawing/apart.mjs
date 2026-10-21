// Layer 4, tool. The rule the layers overview, the channel diagram and the write diagram are drawn
// by, so that no two arrows run along each other and no words sit across an arrow, and each arrow
// can be followed from its tail to its head.
//
// Graphviz's router draws the arrows of one node from one point and bends the arrows that pass
// one obstacle round the same corner, so arrows that share an end or a corner run together for as
// long as they head one way. The rule keeps where Graphviz lays the nodes out and draws every arrow
// itself, in level and upright runs:
//
// - Each arrow leaves its tail by a port of its own down the tail's east side and reaches its head
//   at a port of its own down the head's west side (a left-to-right drawing), so no two arrows
//   leave or reach a node at one height. The ports of a side are ordered as the arrows run on from
//   it, the one that runs highest at the top. A node of words (labels.mjs) has one arrow in and
//   one out, which meet it level at its middle height, on its west side and on its east side.
// - Each rank of the layout is a band of nodes, and between two bands lies no node. The ranks are
//   laid out over the whole drawing (`newrank`), so every arrow runs on from its tail's rank even
//   between two groups. An arrow that passes a rank between its ends is laid out with a point of
//   its own there, which Graphviz keeps clear of the rank's nodes, and crosses the band level at
//   that point's height.
// - In the space between two bands, each arrow that crosses it runs level from its height on the
//   left to an upright track of its own, along the track to its height on the right, and level on.
//   No two arrows share a track, the tracks lie TRACK points apart, a track that would cross a
//   group's label at its height passes right of the label, and each space is made as wide as its
//   tracks need. Two arrows meet only where a level run crosses an upright one, or where an arrow
//   leaves a band at the height another arrives at; the tracks are ordered so the one that leaves
//   lies left of the other where it can, and so the crossings of any two lines of arrowsAlong()
//   stay few (trackOrder()); where the order cannot keep two level runs apart, the one that leaves
//   steps aside to a free height before it meets the other (jogsOf()).
// - An arrow that does not run on from its tail's rank to a later one, in a cycle or from a node
//   to itself, runs up in the space after its tail's band to a lane of its own above the drawing,
//   level along the lane, and down in the space before its head's band.
//
// The positions are Graphviz's, the nodes moved only sideways to give each space its width, and
// the drawing is made from them by Graphviz's `nop2` layout, which keeps every position and line it
// is given, so the `.dot` written is the file the `.svg` is rendered from. The ports are ordered by
// the layout before, so the drawing is made again while it is not clear, and an order already
// drawn, or ROUNDS drawings, means the rule has run out: drawnApart() then throws an error naming
// every pair arrowsAlong() and every label labelsAcross() finds in the last drawing, so no drawing
// with either is ever written, and `npm run diagrams` exits with that error and writes nothing.
//
// The diagram is read one statement a line, in the shape layersDot(), channelsDot() and writesDot()
// write: quoted ids, an arrow as `"tail" -> "head" [attributes];`, a group as `subgraph
// "cluster_..." {`, and an arrow's words as a node of words (labels.mjs), never as an edge label,
// which the rule does not place. A statement that reads as an arrow in another shape is an error.

import { quote } from '../source.mjs';
import { arrowsAlong, labelsAcross } from './labels.mjs';
import { PORT, TRACK, jogsOf, trackOrder } from './tracks.mjs';

/** The room, in points, between a band and its nearest track, clear of a group's border. */
const PAD = 16;

/**
 * How far, in points, a group's box may reach past its margin and still be taken as keeping it:
 * Graphviz writes positions to a hundredth of a point, so a box that keeps its margin can read a
 * hair past it.
 */
const SLACK = 0.5;

/**
 * The margin, in inches, of a node outlined dashed round its table: one point, the width of the
 * border a solid table draws, so the two kinds of box hold their words alike.
 */
const SEAM = (1 / 72).toFixed(4);

/**
 * How many drawings the rule makes before it gives up: the port order settles within a few, and a
 * drawing takes about a second.
 */
const ROUNDS = 8;

/** A quoted DOT id, its text in the first group. */
const QUOTED = '"((?:[^"\\\\]|\\\\.)*)"';

/** A node statement of a diagram: its indent, its id and its attributes. */
const NODE_LINE = new RegExp(`^(\\s*)${QUOTED}(?: \\[([\\s\\S]*)\\])?;$`);

/** An arrow statement of a diagram: its indent, its tail, its head and its attributes. */
const ARROW_LINE = new RegExp(`^(\\s*)${QUOTED} -> ${QUOTED}(?: \\[([\\s\\S]*)\\])?;$`);

/** A run of the chain an arrow is laid out by, from end to end, each end with its port or none. */
const RUN_LINE = new RegExp(
    `^\\s*${QUOTED}(?::\\w+:\\w+)? -> ${QUOTED}(?::\\w+:\\w+)?(?: \\[[\\s\\S]*\\])?;$`
);

/** The statement that opens a group, its id in the first group. */
const CLUSTER_LINE = new RegExp(`^\\s*subgraph ${QUOTED} \\{$`);

/**
 * @typedef {{ draw: (dot: string) => string, layout: (dot: string) => Layout }} Renderer
 *     A drawing's SVG, and the positions Graphviz lays its DOT out at (its JSON output).
 * @typedef {{ bb: string, objects: Placed[], edges: Routed[] }} Layout
 * @typedef {{ _gvid: number, name: string, pos?: string, width?: string, bb?: string,
 *     lp?: string, lwidth?: string, lheight?: string, nodes?: number[] }} Placed A node, or a
 *     group with its box, the place and the size of its label (in inches) and its nodes.
 * @typedef {{ tail: number, head: number, pos: string, tailport?: string,
 *     headport?: string }} Routed An edge as Graphviz routed it.
 * @typedef {{ indent: string, from: string, to: string, attrs: string }} Arrow One arrow line.
 * @typedef {{ ins: number[], outs: number[] }} Sides A node's arrows by port, top to bottom.
 * @typedef {{ out: number, in: number }} Course The height an arrow runs to as it leaves its
 *     tail's band, and the height it runs from as it reaches its head's.
 * @typedef {{ lane: boolean, steps: number }} Plan How an arrow is laid out: through `steps`
 *     points, or by a lane above the drawing.
 * @typedef {import('./tracks.mjs').End} End
 * @typedef {import('./tracks.mjs').Run} Run
 */

/**
 * A diagram's DOT as its statements, one to an entry: a line break inside a quoted string, as in a
 * label of several lines, belongs to the statement it is written in.
 */
function statements(/** @type {string} */ dot) {
    const found = [''];
    let quoted = false;
    for (let at = 0; at < dot.length; at += 1) {
        const char = dot[at];
        if (char === '\n' && !quoted) {
            found.push('');
            continue;
        }
        found[found.length - 1] += char;
        if (char === '\\' && quoted) {
            at += 1;
            found[found.length - 1] += dot[at] ?? '';
        } else if (char === '"') quoted = !quoted;
    }
    return found;
}

/** A quoted DOT string read back to its text. */
function unquoted(/** @type {string} */ text) {
    return text.replace(/\\(.)/g, '$1');
}

/** Words as the text of an HTML-like label, each line of them a line of it. */
function htmlWords(/** @type {string} */ words) {
    return words
        .split('\n')
        .map((line) =>
            line
                .trim()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
        )
        .join('<BR/>');
}

/** A column of `count` ports named by `prefix`, top to bottom, as one cell of a table. */
function portColumn(/** @type {number} */ count, /** @type {string} */ prefix) {
    const cells = Array.from(
        { length: count },
        (_, at) =>
            `<TR><TD PORT="${prefix}${at}" WIDTH="1" HEIGHT="${PORT}" FIXEDSIZE="TRUE"></TD></TR>`
    );
    return `<TD><TABLE BORDER="0" CELLSPACING="0" CELLPADDING="0">${cells.join('')}</TABLE></TD>`;
}

/**
 * The attributes of a node drawn with its ports: a table of its words between a column of the
 * ports its arrows arrive at, down its west side, and a column of the ports its arrows leave by,
 * down its east side. An ellipse becomes a box with round corners, so a channel reads apart from
 * a module, a cylinder keeps its shape round the table, and a node styled dashed is outlined
 * dashed.
 *
 * @param {string} id
 * @param {string} attrs The node's attributes as the diagram wrote them.
 * @param {Sides} sides
 * @returns {string}
 */
function portedAttrs(id, attrs, sides) {
    const label = /(?:^|, )label=("(?:[^"\\]|\\.)*")/.exec(attrs);
    const words = label === null ? id : unquoted(label[1].slice(1, -1));
    const shape = /(?:^|, )shape=(\w+)/.exec(attrs)?.[1] ?? 'box';
    const dashed = /(?:^|, )style=dashed(?:,|$)/.test(attrs);
    const outlined = shape !== 'cylinder' && !dashed;
    const cells = [
        sides.ins.length > 0 ? portColumn(sides.ins.length, 'i') : '',
        `<TD CELLPADDING="4">${htmlWords(words)}</TD>`,
        sides.outs.length > 0 ? portColumn(sides.outs.length, 'o') : ''
    ].join('');
    const table = [
        `<TABLE BORDER="${outlined ? 1 : 0}" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0"`,
        shape === 'ellipse' ? ' STYLE="rounded"' : '',
        `><TR>${cells}</TR></TABLE>`
    ].join('');
    // A dashed outline is the node's own, round a table drawn with none: Graphviz's JSON output
    // writes the style of a table outlined dashed as unreadable text, and the layout reads it.
    if (dashed) return `shape=box, style=dashed, margin=${SEAM}, label=<${table}>`;
    return `${outlined ? 'shape=plain' : `shape=${shape}, margin=0`}, label=<${table}>`;
}

/** The points of a Graphviz position list, the arrowhead's tip given apart. */
function splineOf(/** @type {string} */ pos) {
    /** @type {number[][]} */
    const points = [];
    /** @type {number[] | null} */
    let tip = null;
    for (const part of pos.trim().split(/\s+/)) {
        const [kind, x, y] = /^[es],/.test(part) ? part.split(',') : ['', ...part.split(',')];
        const point = [Number(x), Number(y)];
        if (kind === 'e') tip = point;
        else if (kind === '') points.push(point);
    }
    return { points, tip };
}

/** A node's position, as numbers. */
function placeOf(/** @type {{ pos?: string } | undefined} */ node) {
    return (node?.pos ?? '0,0').split(',').map(Number);
}

/**
 * The ranks of a layout, left to right, each with the west and the east edge of the band its
 * nodes fill (a left-to-right layout sets every node of one rank on one vertical line), and the
 * rank of each node.
 *
 * @param {Layout} laid
 * @returns {{ west: number[], east: number[], rankOf: Map<string, number> }}
 */
function ranksOf(laid) {
    const nodes = laid.objects.filter((one) => one.pos !== undefined);
    const middles = [...new Set(nodes.map((one) => placeOf(one)[0]))].sort((a, b) => a - b);
    /** @type {Map<string, number>} */
    const rankOf = new Map();
    const west = [...middles];
    const east = [...middles];
    for (const node of nodes) {
        const [x] = placeOf(node);
        const rank = middles.indexOf(x);
        const half = (Number(node.width ?? 0) * 72) / 2;
        rankOf.set(node.name, rank);
        west[rank] = Math.min(west[rank], x - half);
        east[rank] = Math.max(east[rank], x + half);
    }
    return { west, east, rankOf };
}

/** The id of the point an arrow is laid out at on the `step`th rank it passes. */
function stepId(/** @type {number} */ arrow, /** @type {number} */ step) {
    return `#${arrow}.${step}`;
}

/**
 * The ports of every node, each side a list of arrows by their place among the arrow lines, top to
 * bottom: the arrows a node sends by the height each runs to as it leaves the node's band, and the
 * arrows it takes by the height each runs from as it reaches it, the highest first, so the level
 * runs of one node's arrows do not cross each other. An arrow whose course is not known yet keeps
 * its place after the others.
 *
 * @param {Arrow[]} arrows
 * @param {Set<string>} ported
 * @param {Map<number, Course>} courses
 * @returns {Map<string, Sides>}
 */
function portOrder(arrows, ported, courses) {
    /** @type {Map<string, Sides>} */
    const order = new Map([...ported].sort().map((node) => [node, { ins: [], outs: [] }]));
    arrows.forEach((arrow, at) => {
        order.get(arrow.from)?.outs.push(at);
        order.get(arrow.to)?.ins.push(at);
    });
    const key = (/** @type {number} */ at, /** @type {'out' | 'in'} */ end) =>
        -(courses.get(at)?.[end] ?? -Infinity);
    for (const sides of order.values()) {
        sides.outs.sort((a, b) => key(a, 'out') - key(b, 'out') || a - b);
        sides.ins.sort((a, b) => key(a, 'in') - key(b, 'in') || a - b);
    }
    return order;
}

/**
 * The port of each arrow at its tail and at its head, by its place among the arrow lines: `o<n>`
 * and `i<n>` by its place down its node's side, '' at a node of words, which has none.
 *
 * @param {Arrow[]} arrows
 * @param {Map<string, Sides>} order
 * @returns {{ tail: string, head: string }[]}
 */
function portsOf(arrows, order) {
    const ports = arrows.map(() => ({ tail: '', head: '' }));
    for (const { ins, outs } of order.values()) {
        ins.forEach((arrow, at) => Object.assign(ports[arrow], { head: `i${at}` }));
        outs.forEach((arrow, at) => Object.assign(ports[arrow], { tail: `o${at}` }));
    }
    return ports;
}

/**
 * How each arrow is laid out, by its place among the arrow lines: through `steps` points of its
 * own, one on each rank it passes, or, where it does not run on from its tail's rank to a later
 * one (an arrow of a cycle, or one from a node to itself), by a lane above the drawing. An arrow
 * laid out by a lane once keeps it, so the ranks settle.
 *
 * @param {Arrow[]} arrows
 * @param {Layout} laid
 * @param {Plan[]} plans The plans before, or none.
 * @returns {Plan[]}
 */
function plansOf(arrows, laid, plans) {
    const { rankOf } = ranksOf(laid);
    return arrows.map((arrow, at) => {
        const runs = (rankOf.get(arrow.to) ?? 0) - (rankOf.get(arrow.from) ?? 0);
        return plans[at]?.lane === true || runs < 1
            ? { lane: true, steps: 0 }
            : { lane: false, steps: runs - 1 };
    });
}

/**
 * The ends of each run of one arrow as written in its laid-out chain: its tail at its port, its
 * points, and its head at its port.
 *
 * @param {Arrow} arrow
 * @param {number} at Its place among the arrow lines.
 * @param {{ tail: string, head: string }} ports
 * @param {Plan} plan
 * @returns {{ name: string, port: string }[]}
 */
function chainOf(arrow, at, ports, plan) {
    return [
        { name: arrow.from, port: ports.tail === '' ? '' : `${ports.tail}:e` },
        ...Array.from({ length: plan.steps }, (_, step) => ({ name: stepId(at, step), port: '' })),
        { name: arrow.to, port: ports.head === '' ? '' : `${ports.head}:w` }
    ];
}

/** One end of a run as DOT writes it. */
function endText(/** @type {{ name: string, port: string }} */ end) {
    return `${quote(end.name)}${end.port === '' ? '' : `:${end.port}`}`;
}

/**
 * The DOT the arrows are laid out by: each node an arrow ends at drawn by portedAttrs(), each
 * arrow written as a chain of runs through a point of its own on every rank it passes, from its
 * tail's port to its head's, and each arrow of a lane from port to port with no say in the ranks.
 *
 * @param {string[]} lines
 * @param {Arrow[]} arrows
 * @param {Map<string, Sides>} order
 * @param {{ tail: string, head: string }[]} ports
 * @param {Plan[]} plans
 * @returns {string[]}
 */
function chainedDot(lines, arrows, order, ports, plans) {
    const out = [];
    const points = [];
    const declared = new Set();
    let at = 0;
    for (const line of lines) {
        const node = NODE_LINE.exec(line);
        const id = node === null ? '' : unquoted(node[2]);
        if (node !== null) declared.add(id);
        if (ARROW_LINE.test(line)) {
            const arrow = arrows[at];
            const chain = chainOf(arrow, at, ports[at], plans[at]);
            for (const step of chain.slice(1, -1)) {
                points.push(`    ${quote(step.name)} [shape=point, width=0, height=0];`);
            }
            for (let run = 1; run < chain.length; run += 1) {
                const own = [
                    arrow.attrs,
                    run === chain.length - 1 ? '' : 'arrowhead=none',
                    plans[at].lane ? 'constraint=false' : ''
                ];
                const attrs = own.filter((one) => one !== '').join(', ');
                const ends = `${endText(chain[run - 1])} -> ${endText(chain[run])}`;
                out.push(`${arrow.indent}${ends} [${attrs}];`);
            }
            at += 1;
        } else if (node !== null && order.has(id)) {
            const sides = order.get(id) ?? { ins: [], outs: [] };
            out.push(`${node[1]}${quote(id)} [${portedAttrs(id, node[3] ?? '', sides)}];`);
        } else out.push(line);
    }
    // A node the diagram declares only by its arrows is declared here, so it takes its ports.
    for (const [id, sides] of order) {
        if (!declared.has(id)) points.push(`    ${quote(id)} [${portedAttrs(id, '', sides)}];`);
    }
    const first = out.findIndex((line) => RUN_LINE.test(line));
    out.splice(first < 0 ? out.length - 1 : first, 0, ...points);
    return out;
}

/** Straight runs through points as the control points of one Bezier spline, in DOT's form. */
function straightRuns(/** @type {number[][]} */ points) {
    const kept = points.filter(
        (point, at) => at === 0 || point[0] !== points[at - 1][0] || point[1] !== points[at - 1][1]
    );
    const controls = [kept[0]];
    for (let at = 1; at < kept.length; at += 1) {
        const [a, b] = [kept[at - 1], kept[at]];
        const third = (/** @type {number} */ part) => [
            a[0] + ((b[0] - a[0]) * part) / 3,
            a[1] + ((b[1] - a[1]) * part) / 3
        ];
        controls.push(third(1), third(2), b);
    }
    return controls.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

/**
 * Each arrow's runs, space by space, in a layout of the chained DOT: the space after the rank it
 * crosses from and the heights it runs from and to there. An arrow of points crosses each space
 * from its tail's band to its head's, from its tail's port over each point's height to its head's
 * port. An arrow of a lane runs up from its tail's port in the space after its tail's band to its
 * lane, a level line above the drawing, and down in the space before its head's band to its head's
 * port; each lane lies TRACK points above the one before.
 *
 * @param {Arrow[]} arrows
 * @param {Layout} laid
 * @param {{ tail: string, head: string }[]} ports
 * @param {Plan[]} plans
 */
function runsOf(arrows, laid, ports, plans) {
    const { rankOf } = ranksOf(laid);
    const byName = new Map(laid.objects.map((one) => [one.name, one]));
    const byId = new Map(laid.objects.map((one) => [one._gvid, one.name]));
    /** @type {Map<string, Routed>} */
    const routed = new Map();
    for (const edge of laid.edges) {
        const tail = `${byId.get(edge.tail)}:${edge.tailport ?? ''}`;
        routed.set(`${tail}->${byId.get(edge.head)}:${edge.headport ?? ''}`, edge);
    }
    const lineOf = (
        /** @type {{ name: string, port: string }} */ from,
        /** @type {typeof from} */ to
    ) => {
        const key = `${from.name}:${from.port}->${to.name}:${to.port}`;
        const edge = routed.get(key);
        if (edge === undefined) throw new Error(`the layout has no run ${key}`);
        return splineOf(edge.pos);
    };
    const top = Number(laid.bb.split(',')[3]);
    let lanes = 0;
    return arrows.map((arrow, at) => {
        const chain = chainOf(arrow, at, ports[at], plans[at]);
        const first = lineOf(chain[0], chain[1]);
        const last = lineOf(chain[chain.length - 2], chain[chain.length - 1]);
        // A node of words is met level at its middle height, on its west side by the half that
        // reaches it and on its east side by the half that leaves it, so the two halves read as
        // one arrow through the words.
        const side = (/** @type {string} */ id, /** @type {number} */ way) => {
            const [x, y] = placeOf(byName.get(id));
            return [x + (way * Number(byName.get(id)?.width ?? 0) * 72) / 2, y];
        };
        const start = arrow.from.includes(' to ') ? side(arrow.from, 1) : first.points[0];
        // The arrowhead as long as Graphviz drew it, level at its tip, so the arrow reaches its
        // head's port from the west whichever way Graphviz routed it in, and its tip on the west
        // side of the node, where Graphviz stops it at the port inside the border.
        const near = last.points[last.points.length - 1];
        const reached = last.tip ?? near;
        const head = arrow.to.includes(' to ')
            ? side(arrow.to, -1)
            : [side(arrow.to, -1)[0], reached[1]];
        const end = [head[0] - Math.hypot(reached[0] - near[0], reached[1] - near[1]), head[1]];
        const ranks = chain.map((one) => rankOf.get(one.name) ?? 0);
        /** @type {{ space: number, from: number, to: number }[]} */
        const crossed = [];
        if (plans[at].lane) {
            const lane = top + PAD + lanes * TRACK;
            lanes += 1;
            crossed.push({ space: ranks[0], from: start[1], to: lane });
            crossed.push({ space: ranks[1] - 1, from: lane, to: end[1] });
        } else {
            const heights = [
                start[1],
                ...chain.slice(1, -1).map((step) => placeOf(byName.get(step.name))[1]),
                end[1]
            ];
            for (let run = 1; run < chain.length; run += 1) {
                if (ranks[run] !== ranks[run - 1] + 1) {
                    throw new Error(`${arrow.from} -> ${arrow.to} does not run one rank on`);
                }
                crossed.push({ space: ranks[run - 1], from: heights[run - 1], to: heights[run] });
            }
        }
        const tip = last.tip === null ? null : head;
        return { start, end, tip, ranks, crossed, lane: plans[at].lane };
    });
}

/**
 * The DOT of the drawing and how each arrow runs in it: the laid-out DOT with every node and group
 * at the place Graphviz gave it, moved sideways by its rank's share of the widened spaces, the
 * points left out, and each arrow one line of level and upright runs, written where the diagram's
 * first arrow line stands, in the order of the arrow lines. The space before the first band and
 * the space after the last hold the tracks of the lanes that need them.
 *
 * @param {string[]} chained
 * @param {Arrow[]} arrows
 * @param {Layout} laid
 * @param {{ tail: string, head: string }[]} ports
 * @param {Plan[]} plans
 * @returns {{ dot: string, courses: Map<number, Course> }}
 */
function placedDot(chained, arrows, laid, ports, plans) {
    const { west, east, rankOf } = ranksOf(laid);
    const final = west.length - 1;
    const drawn = runsOf(arrows, laid, ports, plans);
    /** @type {Map<number, Run[]>} */
    const spaces = new Map();
    drawn.forEach(({ crossed, lane }, arrow) => {
        crossed.forEach(({ space, from, to }, part) => {
            const ends = /** @type {End[]} */ ([]);
            if (!lane || part === 0) ends.push({ side: 'L', y: from });
            if (!lane || part === 1) ends.push({ side: 'R', y: to });
            const { from: tail, to: head } = arrows[arrow];
            const line = [tail, head].find((id) => id.includes(' to ')) ?? `${tail}->${head}`;
            const [low, high] = [Math.min(from, to), Math.max(from, to)];
            const run = { arrow, part, line, ends, low, high };
            spaces.set(space, [...(spaces.get(space) ?? []), run]);
        });
    });
    const byName = new Map(laid.objects.map((one) => [one.name, one]));
    const byId = new Map(laid.objects.map((one) => [one._gvid, one.name]));
    /** The ranks of each group's nodes, its first and its last. */
    const spanOf = (/** @type {Placed | undefined} */ group) => {
        const ranks = (group?.nodes ?? []).map((id) => rankOf.get(byId.get(id) ?? '') ?? 0);
        return ranks.length > 0 ? [Math.min(...ranks), Math.max(...ranks)] : [0, 0];
    };
    // Each group's label as Graphviz placed it at the left of the group, which moves with the
    // group's first rank.
    const labels = laid.objects
        .filter((one) => one.lp !== undefined && one.lwidth !== undefined)
        .map((group) => {
            const [x, y] = placeOf({ ...group, pos: group.lp });
            const [half, tall] = [
                (Number(group.lwidth) * 72) / 2,
                (Number(group.lheight) * 72) / 2
            ];
            return {
                rank: spanOf(group)[0],
                x0: x - half,
                x1: x + half,
                y0: y - tall,
                y1: y + tall
            };
        });
    // How far each group's box reaches out past the margin of PAD / 2 a box keeps round its
    // nodes, on the left of its first band and on the right of its last: Graphviz widens a box to
    // its label, which the bands, made of the nodes alone, do not show.
    const reaches = laid.objects
        .filter((one) => one.bb !== undefined && one.nodes !== undefined)
        .map((group) => {
            const [x0, , x1] = (group.bb ?? '').split(',').map(Number);
            const [first, last] = spanOf(group);
            return {
                first,
                last,
                left: west[first] - PAD / 2 - x0,
                right: x1 - east[last] - PAD / 2
            };
        });
    /** The most a box reaches out on the left of band `rank`, or on its right. */
    const beyond = (/** @type {'left' | 'right'} */ side, /** @type {number} */ rank) =>
        Math.max(
            0,
            ...reaches
                .filter((one) => (side === 'left' ? one.first : one.last) === rank)
                .map((one) => one[side])
                .filter((one) => one > SLACK)
        );
    // Each space as wide as its tracks need, and each rank moved right by what the spaces before
    // it grew. An upright that would cross a group's label at its height takes its track past the
    // label, and the tracks after it follow. A space also holds what the boxes on either side of
    // it reach out, so no group's box or label runs into the band beside it.
    /** @type {Map<string, number>} */
    const tracks = new Map();
    /** @type {Map<number, number>} */
    const widths = new Map();
    const shift = west.map(() => 0);
    const before = spaces.get(-1)?.length ?? 0;
    shift[0] = before > 0 ? 2 * PAD + (before - 1) * TRACK : 0;
    for (let space = -1; space <= final; space += 1) {
        const edge = space < 0 ? west[0] : east[space] + shift[space];
        const start = space < 0 ? edge : edge + beyond('right', space);
        const placed = labels
            .filter((label) => label.rank <= space)
            .map((label) => ({
                ...label,
                x0: label.x0 + shift[label.rank] - TRACK / 2,
                x1: label.x1 + shift[label.rank] + TRACK / 2
            }));
        const order = trackOrder(spaces.get(space) ?? []);
        let x = start + PAD;
        for (const run of order) {
            for (;;) {
                const across = placed.find(
                    (label) =>
                        run.low < label.y1 && run.high > label.y0 && x > label.x0 && x < label.x1
                );
                if (across === undefined) break;
                x = across.x1;
            }
            tracks.set(`${run.arrow}.${run.part}`, x);
            x += TRACK;
        }
        const quiet = space < 0 || space === final ? 0 : start - edge + 2 * PAD;
        const after = space >= 0 && space < final ? beyond('left', space + 1) : 0;
        widths.set(space, (order.length > 0 ? x - TRACK + PAD - edge : quiet) + after);
        if (space >= 0 && space < final) {
            shift[space + 1] = edge + (widths.get(space) ?? 0) - west[space + 1];
        }
    }
    const jogs = jogsOf(spaces, tracks);
    /** @type {Map<number, Course>} */
    const courses = new Map();
    const lineOf = (/** @type {number} */ at) => {
        const { start, end, tip, ranks, crossed } = drawn[at];
        const points = [[start[0] + shift[ranks[0]], start[1]]];
        crossed.forEach(({ from, to }, part) => {
            const x = tracks.get(`${at}.${part}`) ?? 0;
            const jog = jogs.get(`${at}.${part}`);
            if (jog === undefined) points.push([x, from], [x, to]);
            else points.push([jog[0], from], jog, [x, jog[1]], [x, to]);
        });
        const head = shift[ranks[ranks.length - 1]];
        points.push([end[0] + head, end[1]]);
        courses.set(at, { out: crossed[0].to, in: crossed[crossed.length - 1].from });
        const arrowhead =
            tip === null ? '' : `e,${(tip[0] + head).toFixed(2)},${tip[1].toFixed(2)} `;
        return `${arrowhead}${straightRuns(points)}`;
    };
    const moved = (/** @type {string} */ box, /** @type {number[]} */ ranks) => {
        const [x0, y0, x1, y1] = box.split(',').map(Number);
        const [low, high] = [Math.min(...ranks), Math.max(...ranks)];
        return [x0 + shift[low], y0, x1 + shift[high], y1];
    };
    const lanes = drawn.filter((one) => one.lane).length;
    const text = (/** @type {number[]} */ box) => box.map((one) => one.toFixed(2)).join(',');
    const out = [];
    let written = false;
    for (const line of chained) {
        const cluster = CLUSTER_LINE.exec(line);
        const node = NODE_LINE.exec(line);
        if (/^\s*graph \[/.test(line)) {
            const [x0, y0, x1, y1] = moved(laid.bb, [0, final]);
            const box = [
                x0,
                y0,
                x1 + (widths.get(final) ?? 0),
                y1 + (lanes > 0 ? PAD + lanes * TRACK : 0)
            ];
            out.push(line.replace(/\];$/, `, layout=nop2, splines=true, bb="${text(box)}"];`));
        } else if (cluster !== null) {
            const group = byName.get(unquoted(cluster[1]));
            const box = moved(group?.bb ?? '0,0,0,0', spanOf(group));
            const [x, y] = placeOf({ ...group, pos: group?.lp ?? '0,0' });
            const label = `${(x + shift[spanOf(group)[0]]).toFixed(2)},${y.toFixed(2)}`;
            out.push(line, `        bb="${text(box)}"; lp="${label}";`);
        } else if (RUN_LINE.test(line)) {
            if (written) continue;
            written = true;
            arrows.forEach((arrow, at) => {
                const attrs = [arrow.attrs, `pos="${lineOf(at)}"`].filter((one) => one !== '');
                const ends = `${quote(arrow.from)} -> ${quote(arrow.to)}`;
                out.push(`${arrow.indent}${ends} [${attrs.join(', ')}];`);
            });
        } else if (node !== null && !unquoted(node[2]).startsWith('#')) {
            const id = unquoted(node[2]);
            const [x, y] = placeOf(byName.get(id));
            const pos = `${(x + shift[rankOf.get(id) ?? 0]).toFixed(2)},${y.toFixed(2)}!`;
            const attrs = [node[3] ?? '', `pos="${pos}"`].filter((one) => one !== '');
            out.push(`${node[1]}${quote(id)} [${attrs.join(', ')}];`);
        } else if (node === null) out.push(line);
    }
    return { dot: out.join('\n'), courses };
}

/**
 * How each arrow runs in a layout of the diagram's own DOT, whose edges are its arrow lines in
 * their order: the height of the far end of its line from each end.
 */
function coursesLaid(/** @type {Layout} */ laid) {
    /** @type {Map<number, Course>} */
    const courses = new Map();
    laid.edges.forEach((edge, at) => {
        const { points } = splineOf(edge.pos);
        if (points.length > 0) {
            courses.set(at, { out: points[points.length - 1][1], in: points[0][1] });
        }
    });
    return courses;
}

/**
 * A diagram drawn by the rule of this module's head comment: laid out as the diagram writes it,
 * its ports ordered by that layout, then laid out with its ports and its points, again until each
 * arrow's points stand one to a rank, and drawn, again while the drawing is not clear. A diagram
 * the rule cannot clear is an error naming every pair and every label across of its last drawing.
 *
 * @param {string} name The diagram, for the error.
 * @param {string} dot The diagram's DOT, a left-to-right layout written one statement a line.
 * @param {Renderer} renderer
 * @returns {{ dot: string, svg: string }}
 */
export function drawnApart(name, dot, { draw, layout }) {
    const lines = statements(dot).map((line) =>
        /^\s*graph \[/.test(line) ? line.replace(/\];$/, ', newrank=true, labeljust=l];') : line
    );
    /** @type {Arrow[]} */
    const arrows = [];
    for (const line of lines) {
        const edge = ARROW_LINE.exec(line);
        if (edge === null && /^\s*"/.test(line) && !NODE_LINE.test(line) && / -> /.test(line)) {
            throw new Error(`${name}: an arrow the rule cannot read: ${line.trim()}`);
        }
        if (edge === null) continue;
        const [from, to] = [unquoted(edge[2]), unquoted(edge[3])];
        arrows.push({ indent: edge[1], from, to, attrs: edge[4] ?? '' });
    }
    const ported = new Set(
        arrows.flatMap((arrow) => [arrow.from, arrow.to]).filter((id) => !id.includes(' to '))
    );
    let laid = layout(lines.join('\n'));
    let courses = coursesLaid(laid);
    let plans = plansOf(arrows, laid, []);
    const tried = new Set();
    /** @type {string[]} */
    let left = [];
    for (;;) {
        const order = portOrder(arrows, ported, courses);
        const key = JSON.stringify([[...order], plans]);
        if (tried.has(key) || tried.size === ROUNDS) {
            throw new Error(`${name}: the arrows cannot be drawn apart\n${left.join('\n')}`);
        }
        tried.add(key);
        const ports = portsOf(arrows, order);
        let chained = chainedDot(lines, arrows, order, ports, plans);
        for (let settled = 0; ; settled += 1) {
            laid = layout(chained.join('\n'));
            const found = plansOf(arrows, laid, plans);
            if (JSON.stringify(found) === JSON.stringify(plans)) break;
            if (settled === ROUNDS)
                throw new Error(`${name}: the ranks of the arrows do not settle`);
            plans = found;
            chained = chainedDot(lines, arrows, order, ports, plans);
        }
        const placed = placedDot(chained, arrows, laid, ports, plans);
        const svg = draw(placed.dot);
        left = [...arrowsAlong(svg), ...labelsAcross(svg)];
        if (left.length === 0) return { dot: placed.dot, svg };
        courses = placed.courses;
    }
}
