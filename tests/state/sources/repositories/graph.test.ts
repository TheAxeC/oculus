// The lanes of the Source Control Graph: which lane each commit sits in and the strokes that cross
// its row, drawn from the parents. Pure, so each case is a history written out here.

import { describe, expect, it } from 'vitest';
import { laneRows } from '../../../../src/lib/state/sources/repositories/graph-lanes.ts';

describe('the lanes of the graph', () => {
    it('keeps a straight history in one lane, a line down from each commit to its parent', () => {
        const rows = laneRows([
            { hash: 'c', parents: ['b'] },
            { hash: 'b', parents: ['a'] },
            { hash: 'a', parents: [] }
        ]);
        expect(rows.map((row) => row.lane)).toEqual([0, 0, 0]);
        expect(rows[0].lines).toEqual([{ x1: 0, y1: 0.5, x2: 0, y2: 1, lane: 0 }]);
        expect(rows[1].lines).toEqual([
            { x1: 0, y1: 0, x2: 0, y2: 0.5, lane: 0 },
            { x1: 0, y1: 0.5, x2: 0, y2: 1, lane: 0 }
        ]);
        expect(rows[2].lines).toEqual([{ x1: 0, y1: 0, x2: 0, y2: 0.5, lane: 0 }]);
    });

    it('opens a second lane for a merge parent and joins it back where the branch began', () => {
        const rows = laneRows([
            { hash: 'm', parents: ['a2', 'b1'] },
            { hash: 'b1', parents: ['a1'] },
            { hash: 'a2', parents: ['a1'] },
            { hash: 'a1', parents: [] }
        ]);
        expect(rows.map((row) => row.lane)).toEqual([0, 1, 0, 0]);
        expect(rows[0].lines).toContainEqual({ x1: 0, y1: 0.5, x2: 1, y2: 1, lane: 1 });
        expect(rows[0].width).toBe(2);
        // a1 is waited for by both lanes, so lane 1 bends into lane 0 at its dot.
        expect(rows[3].lines).toContainEqual({ x1: 1, y1: 0, x2: 0, y2: 0.5, lane: 1 });
        expect(rows[3].width).toBe(2);
    });

    it('starts a head no lane waits for in a free lane of its own', () => {
        const rows = laneRows([
            { hash: 'x', parents: ['a'] },
            { hash: 'y', parents: ['a'] },
            { hash: 'a', parents: [] }
        ]);
        expect(rows.map((row) => row.lane)).toEqual([0, 1, 0]);
        // y starts at its dot: nothing comes into it from above in its own lane.
        expect(rows[1].lines.some((line) => line.x2 === 1 && line.y2 === 0.5)).toBe(false);
    });
});
