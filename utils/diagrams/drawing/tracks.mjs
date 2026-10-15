// Layer 4, tool, partial of apart.mjs. Where the uprights of one space between two bands of a
// drawing stand, and where a level run steps aside: trackOrder() orders the runs that cross a
// space left to right, and jogsOf() finds each level run that would run along another in that
// order and the height it steps to. apart.mjs's head comment gives the rule both serve.

/** The height, in points, of the port each arrow end takes on the side of its node. */
export const PORT = 8;

/** The distance, in points, between two upright tracks: twice the measure's 1.5 and a margin. */
export const TRACK = 6;

/**
 * What a level run that steps aside (jogsOf()) costs when the tracks are ordered, against the
 * squared crossings of two lines: a step is drawn only where it saves more than a few crossings.
 */
const STEP = 4;

/** How near, in points, two level runs lie for one to be held apart from the other. */
const LEVEL = 3;

/**
 * How near, in points, a level run that steps aside comes to another before that counts above every
 * run within LEVEL points: past labels.mjs's NEAR of 1.5, so the two are not measured as one line.
 */
const CLOSE = 2;

/** How many heights, half a point apart, a level run that steps aside tries on each side. */
const REACH = 6 * PORT;

/**
 * @typedef {{ side: 'L' | 'R', y: number }} End A level run of a run, to the band on the left of
 *     its space or on the right, at its height.
 * @typedef {{ arrow: number, part: number, line: string, ends: End[], low: number,
 *     high: number }} Run One arrow's upright in one space, the `part`th of its runs, with the line
 *     arrowsAlong() counts it in, its level runs and the heights it spans.
 */

/**
 * How many arrows cross, at the upright of one or the other, when the track of `left` lies left of
 * the track of `right`: a level run of `right` to the band on the left crosses the upright of
 * `left` where its height lies within it, and a level run of `left` to the band on the right
 * crosses the upright of `right` where its height lies within that.
 */
function crossings(/** @type {Run} */ left, /** @type {Run} */ right) {
    const within = (/** @type {End} */ end, /** @type {Run} */ run) =>
        Number(end.y > run.low && end.y < run.high);
    const count = (/** @type {Run} */ run, /** @type {'L' | 'R'} */ side, /** @type {Run} */ by) =>
        run.ends.reduce((sum, end) => sum + (end.side === side ? within(end, by) : 0), 0);
    return count(right, 'L', left) + count(left, 'R', right);
}

/**
 * The runs of one space in the order of their tracks, left to right. A run with a level run to
 * the band on its left at the height another has one to the band on its right lies left of it, so
 * the one ends at its track before the other's begins. Within that, the runs start in the order of
 * their middle heights. Then the runs of one line of arrowsAlong() (the arrows that share their
 * two ends, or the halves through one node of words) move in turn, as one block in their order,
 * to the place among the others where the squares of their crossings with each other line add up
 * to the least, as long as a move takes that sum down: the crossings of two lines add up in that
 * measure, so they are spread over many lines rather than heaped on one. A block whose pairs with
 * the others form a ring stays where it is, and jogsOf() keeps its level run apart.
 *
 * @param {Run[]} runs
 * @returns {Run[]}
 */
export function trackOrder(runs) {
    const before = (/** @type {Run} */ a, /** @type {Run} */ b) =>
        a !== b &&
        a.ends.some(
            (end) =>
                end.side === 'L' &&
                b.ends.some((other) => other.side === 'R' && Math.abs(end.y - other.y) <= LEVEL)
        );
    const middle = (/** @type {Run} */ run) => -(run.low + run.high) / 2;
    const waiting = [...runs].sort(
        (a, b) => middle(a) - middle(b) || a.arrow - b.arrow || a.part - b.part
    );
    /** @type {Run[]} */
    const order = [];
    while (waiting.length > 0) {
        const free = waiting.findIndex((run) => !waiting.some((other) => before(other, run)));
        order.push(...waiting.splice(free < 0 ? 0 : free, 1));
    }
    const lines = [...new Set(order.map((run) => run.line))];
    for (let moved = true, passes = 0; moved && passes < order.length; passes += 1) {
        moved = false;
        for (const line of lines) {
            const block = order.filter((run) => run.line === line);
            const rest = order.filter((run) => run.line !== line);
            const sides = rest.map((other) => ({
                line: other.line,
                left: block.reduce((sum, run) => sum + crossings(other, run), 0),
                right: block.reduce((sum, run) => sum + crossings(run, other), 0),
                after: block.some((run) => before(other, run)),
                ahead: block.some((run) => before(run, other))
            }));
            // The block's crossings with each other line, squared and summed, since arrowsAlong()
            // adds up the crossings of two lines: where the block stands, run by run, and at each
            // place among the rest as one block, right of the runs before it and left of the rest.
            /** @type {Map<string, number>} */
            const standing = new Map();
            for (const other of rest) {
                const place = order.indexOf(other);
                const count = block.reduce(
                    (sum, run) =>
                        sum +
                        (place < order.indexOf(run)
                            ? crossings(other, run)
                            : crossings(run, other)),
                    0
                );
                standing.set(other.line, (standing.get(other.line) ?? 0) + count);
            }
            const squared = (/** @type {Map<string, number>} */ counts) =>
                [...counts.values()].reduce((sum, count) => sum + count * count, 0);
            // A pair kept in the wrong order costs a step aside (jogsOf()), counted as STEP.
            const wrong = block.reduce(
                (sum, run) =>
                    sum +
                    STEP *
                        rest.filter((other) =>
                            order.indexOf(other) < order.indexOf(run)
                                ? before(run, other)
                                : before(other, run)
                        ).length,
                0
            );
            const now = squared(standing) + wrong;
            /** @type {Map<string, number>} */
            const counts = new Map();
            for (const side of sides)
                counts.set(side.line, (counts.get(side.line) ?? 0) + side.right);
            let cost = squared(counts) + STEP * sides.filter((side) => side.after).length;
            let best = -1;
            let lowest = now;
            for (let place = 0; place <= rest.length; place += 1) {
                if (cost < lowest) {
                    best = place;
                    lowest = cost;
                }
                if (place === rest.length) break;
                const side = sides[place];
                const held = counts.get(side.line) ?? 0;
                const next = held + side.left - side.right;
                cost += next * next - held * held;
                cost += STEP * (Number(side.ahead) - Number(side.after));
                counts.set(side.line, next);
            }
            if (best < 0) continue;
            order.splice(0, order.length, ...rest.slice(0, best), ...block, ...rest.slice(best));
            moved = true;
        }
    }
    return order;
}

/**
 * Where a level run steps aside on its way to its track, by the run it belongs to. A level run from
 * the band on the left at the height of a level run to the band on the right whose track lies left
 * of its own would run along that one from that track to its own; trackOrder() keeps such a pair
 * in the other order where it can, and where the pairs between the runs of a space form a ring it
 * cannot. The run then steps aside halfway before the first such track, to the nearest height
 * more than LEVEL points off its own, tried half a point at a time and toward the far end of its
 * upright first, at which the fewest other level runs lie within CLOSE points between that step
 * and its track, and of those heights the first with the fewest within LEVEL points (none, where
 * one is free), and runs on to its own track there.
 *
 * @param {Map<number, Run[]>} spaces
 * @param {Map<string, number>} tracks
 * @returns {Map<string, number[]>}
 */
export function jogsOf(spaces, tracks) {
    /** @type {Map<string, number[]>} */
    const jogs = new Map();
    const trackOf = (/** @type {Run} */ run) => tracks.get(`${run.arrow}.${run.part}`) ?? 0;
    for (const runs of spaces.values()) {
        /** @type {{ y: number, from: number, to: number }[]} */
        const stepped = [];
        for (const run of runs) {
            const own = trackOf(run);
            /**
             * The level runs that lie within LEVEL points of `y` along the stretch from `from` to
             * `own`, and of them those within CLOSE points, each counted once.
             */
            const across = (/** @type {number} */ y, /** @type {number} */ from) => {
                const heights = [
                    ...runs.flatMap((other) =>
                        other === run
                            ? []
                            : [
                                  Math.min(
                                      ...other.ends
                                          .filter((end) =>
                                              end.side === 'R'
                                                  ? trackOf(other) < own
                                                  : trackOf(other) > from
                                          )
                                          .map((end) => Math.abs(end.y - y))
                                  )
                              ]
                    ),
                    ...stepped
                        .filter((one) => one.from < own && one.to > from)
                        .map((one) => Math.abs(one.y - y))
                ];
                const close = heights.filter((off) => off <= CLOSE).length;
                return { close, level: heights.filter((off) => off <= LEVEL).length };
            };
            const end = run.ends.find((one) => one.side === 'L');
            if (end === undefined) continue;
            const along = runs.filter(
                (other) =>
                    trackOf(other) < own &&
                    other.ends.some((one) => one.side === 'R' && Math.abs(one.y - end.y) <= LEVEL)
            );
            if (along.length === 0) continue;
            const step = Math.min(...along.map(trackOf)) - TRACK / 2;
            const toward = end.y === run.high ? -1 : 1;
            const heights = Array.from({ length: REACH }, (_, at) => LEVEL + 1 + at / 2).flatMap(
                (off) => [end.y + toward * off, end.y - toward * off]
            );
            const fewer = (/** @type {number} */ one, /** @type {number} */ other) => {
                const [a, b] = [across(one, step), across(other, step)];
                return a.close - b.close || a.level - b.level;
            };
            const fewest = heights.reduce((one, other) => (fewer(other, one) < 0 ? other : one));
            jogs.set(`${run.arrow}.${run.part}`, [step, fewest]);
            stepped.push({ y: fewest, from: step, to: own });
        }
    }
    return jogs;
}
