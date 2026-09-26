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
// Coordinates are in lanes across and in rows down, 0 at the top of a row and 1 at its foot, so
// the view scales them to whatever row height and lane width it draws.

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
