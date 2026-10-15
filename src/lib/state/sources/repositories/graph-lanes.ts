// Layer 2, client state. The lanes of the Source Control Graph: for each commit, in the order git
// lists them (`log --topo-order`), which lane it sits in and which lines cross its row, drawn from
// each commit's parents.
//
// A lane holds the hash it is waiting for. A commit takes the lane that waits for it, or the first
// free one; every other lane waiting for it joins it there, which is a branch point read from the
// child's side; its first parent then carries on in its lane, and each further parent, a merge,
// takes the lane already waiting for that parent or a free one. Lanes are never moved sideways, so
// a line is straight down its lane until a commit it waits for joins it.
//
// The commits are HEAD's and its upstream's together, so a commit only one of them holds is marked
// by the side it is on (`commitKind`), and Incoming Changes and Outgoing Changes are drawn above
// the first commit of their side (`entryPlaces`) with the lanes that pass there (`entryRow`).
//
// Coordinates of a LaneRow are in lanes across and in rows down, 0 at the top of a row and 1 at
// its foot. `lanePaths`, `laneX`, `laneWidth` and `commitCircles` turn them into the units of the
// 22-high row VS Code draws, an SVG the view scales to the text size through its viewBox.

/** What the lanes need of one commit. */
export type LaneCommit = { hash: string; parents: string[] };

/** One stroke across a row, from (x1, y1) to (x2, y2), and the lane whose colour it takes. */
export type LaneLine = { x1: number; y1: number; x2: number; y2: number; lane: number };

/** One commit's row: the lane its dot is in, how many lanes the row spans, and its strokes. */
export type LaneRow = { lane: number; width: number; lines: LaneLine[] };

/** The first free lane, or a new one at the right. */
function freeLane(lanes: (string | null)[], taken: number): number {
    const free = lanes.findIndex((held, at) => held === null && at !== taken);
    if (free >= 0) return free;
    lanes.push(null);
    return lanes.length - 1;
}

/** The rows of the graph, one per commit, in the order given. */
export function laneRows(commits: readonly LaneCommit[]): LaneRow[] {
    const lanes: (string | null)[] = [];
    const rows: LaneRow[] = [];
    for (const commit of commits) {
        let lane = lanes.indexOf(commit.hash);
        // A commit no lane waits for is a head: its lane starts at its dot, with nothing above.
        const waited = lane >= 0;
        if (!waited) {
            lane = freeLane(lanes, -1);
            lanes[lane] = commit.hash;
        }
        const before = [...lanes];
        const lines: LaneLine[] = [];
        // What enters the row from above: every lane already waiting, straight down unless it
        // waits for this commit, in which case it bends into the commit's dot.
        before.forEach((held, at) => {
            if (held === null) return;
            if (held === commit.hash) {
                if (at !== lane || waited) {
                    lines.push({ x1: at, y1: 0, x2: lane, y2: 0.5, lane: at });
                }
                if (at !== lane) lanes[at] = null;
                return;
            }
            lines.push({ x1: at, y1: 0, x2: at, y2: 1, lane: at });
        });
        const first = commit.parents.at(0);
        const others = commit.parents.slice(1);
        lanes[lane] = first ?? null;
        if (first !== undefined) lines.push({ x1: lane, y1: 0.5, x2: lane, y2: 1, lane });
        for (const parent of others) {
            let into = lanes.indexOf(parent);
            if (into < 0) {
                into = freeLane(lanes, lane);
                lanes[into] = parent;
            }
            lines.push({ x1: lane, y1: 0.5, x2: into, y2: 1, lane: into });
        }
        while (lanes.length > 0 && lanes.at(-1) === null) lanes.pop();
        const width = Math.max(lane + 1, before.length, lanes.length);
        rows.push({ lane, width, lines });
    }
    return rows;
}

// The drawing of a row, in the units of the 22-high row VS Code draws: a lane is 11 wide, a row 22
// high, its commit at y = 11. The view scales the whole SVG to the text size through its viewBox,
// so these numbers stay whatever the text size is.

/** The width of one lane, and half the height of a row. */
const LANE = 11;

/** The height of a row. */
const ROW = 22;

/** The x of lane `n`'s vertical. */
export function laneX(lane: number): number {
    return LANE * (lane + 1);
}

/** The width of a row that spans `lanes` lanes, one lane of room beyond the last. */
export function laneWidth(lanes: number): number {
    return LANE * (Math.max(lanes, 1) + 1);
}

/** One stroke of a row as an SVG path, and the lane whose colour it takes. */
export type LanePath = { d: string; lane: number };

/**
 * The strokes of a row as SVG paths, the three forms a Source Control graph draws and nothing
 * else: a lane that passes is one vertical; a lane that ends in the commit from a column to its
 * right is an arc of radius 11 and a run to the commit's column; a merge parent that leaves the
 * commit is a run and an arc of radius 11 into its own lane; and the commit's own lane is one
 * vertical, cut at the dot where the lane begins or ends. A merge parent in a column to the left
 * takes the mirror of the arc, so its stroke bends the way it goes.
 */
export function lanePaths(row: LaneRow): LanePath[] {
    const cx = laneX(row.lane);
    const paths: LanePath[] = [];
    const add = (d: string, lane: number): number => paths.push({ d, lane });
    const arc = String(LANE);
    const isOwn = (line: LaneLine): boolean => line.x1 === row.lane && line.x2 === line.x1;
    const top = row.lines.some((one) => one.y1 === 0 && one.y2 === 0.5 && one.x1 === row.lane);
    const bottom = row.lines.some((one) => one.y1 === 0.5 && isOwn(one));
    for (const line of row.lines) {
        const x = laneX(line.x2);
        if (line.y1 === 0 && line.y2 === 1) {
            add(`M ${String(laneX(line.x1))} 0 V ${String(ROW)}`, line.lane);
        } else if (line.y1 === 0 && line.y2 === 0.5 && line.x1 === row.lane) {
            add(`M ${String(cx)} 0 V ${String(bottom ? ROW : LANE)}`, line.lane);
        } else if (line.y1 === 0 && line.y2 === 0.5) {
            const from = laneX(line.x1);
            const run = from - LANE === cx ? '' : ` H ${String(cx)}`;
            add(
                `M ${String(from)} 0 A ${arc} ${arc} 0 0 1 ${String(from - LANE)} ${arc}${run}`,
                line.lane
            );
        } else if (isOwn(line)) {
            if (!top) add(`M ${String(cx)} ${arc} V ${String(ROW)}`, line.lane);
        } else {
            // a merge parent, into the lane at `line.x2`
            const right = line.x2 > row.lane;
            const start = right ? x - LANE : x + LANE;
            if (start !== cx) add(`M ${String(cx)} ${arc} H ${String(start)}`, line.lane);
            add(
                `M ${String(start)} ${arc} A ${arc} ${arc} 0 0 ${right ? '1' : '0'} ${String(x)} ${String(ROW)}`,
                line.lane
            );
        }
    }
    return paths;
}

/** The lanes that carry on below a row, in order: the ones its strokes end in at the row's foot. */
export function lanesBelow(row: LaneRow): number[] {
    const below = new Set<number>();
    for (const line of row.lines) if (line.y2 === 1) below.add(line.x2);
    return [...below].sort((a, b) => a - b);
}

/** What a commit's circle stands for: the checked-out commit is first, a merge second. */
export type CommitKind = 'commit' | 'merge' | 'head' | 'incoming' | 'outgoing';

/** The side of the upstream a commit only one of HEAD and the upstream holds is on. */
export type GraphSide = 'incoming' | 'outgoing';

/**
 * Which circle a commit is drawn with: HEAD's first, then the dashed circle of the side of the
 * upstream it is on, then a merge's.
 */
export function commitKind(
    commit: { parents: readonly string[] },
    head: boolean,
    side?: GraphSide
): CommitKind {
    if (head) return 'head';
    if (side !== undefined) return side;
    return commit.parents.length > 1 ? 'merge' : 'commit';
}

/**
 * Where Incoming Changes and Outgoing Changes are drawn: above the first commit of their side in
 * the order given, or above the first commit when none of their side is among them yet. A side
 * with no commits has no entry. The answer maps a commit's index to the entries drawn above it,
 * Incoming Changes first.
 */
export function entryPlaces(
    commits: readonly { hash: string }[],
    sides: Record<GraphSide, ReadonlySet<string>>
): Map<number, GraphSide[]> {
    const places = new Map<number, GraphSide[]>();
    for (const side of ['incoming', 'outgoing'] as const) {
        if (sides[side].size === 0) continue;
        const at = Math.max(
            0,
            commits.findIndex((one) => sides[side].has(one.hash))
        );
        places.set(at, [...(places.get(at) ?? []), side]);
    }
    return places;
}

/**
 * The lanes of an entry drawn above a commit: every line that enters the commit's row from above
 * passes straight through the entry's row in the lane it comes down, and the entry's circle sits
 * in the commit's lane. Above no commit, its circle sits in lane 0 alone.
 */
export function entryRow(below: LaneRow | undefined): LaneRow {
    if (below === undefined) return { lane: 0, width: 1, lines: [] };
    const lines = below.lines
        .filter((line) => line.y1 === 0)
        .map((line) => ({ x1: line.x1, y1: 0, x2: line.x1, y2: 1, lane: line.lane }));
    return { lane: below.lane, width: below.width, lines };
}

/**
 * One circle of a commit's mark: its radius, the width of its stroke, whether the lane's colour
 * fills it, whether the stroke is the row's background (the ring that parts the mark from the
 * lines behind it) or the lane's colour, and a dash pattern for a dashed ring.
 */
export type Circle = {
    r: number;
    ring: number;
    fill: 'lane' | 'none';
    stroke: 'row' | 'lane';
    dash?: string;
};

/** The circles of a commit's mark, drawn in order at (laneX, 11), the last on top. */
export function commitCircles(kind: CommitKind): Circle[] {
    const disc = (r: number): Circle => ({ r, ring: 2, fill: 'lane', stroke: 'row' });
    const hole = (r: number, ring: number): Circle => ({ r, ring, fill: 'none', stroke: 'row' });
    switch (kind) {
        case 'commit':
            return [disc(5)];
        case 'merge':
            return [disc(6), disc(3)];
        case 'head':
            return [disc(7), hole(2, 4)];
        case 'incoming':
        case 'outgoing':
            return [
                disc(7),
                hole(5, 3),
                { r: 5, ring: 1, fill: 'none', stroke: 'lane', dash: '4,2' }
            ];
    }
}
