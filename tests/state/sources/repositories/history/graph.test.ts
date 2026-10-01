// The lanes of the Source Control Graph: which lane each commit sits in and the strokes that cross
// its row, drawn from the parents. Pure, so each case is a history written out here.

import { describe, expect, it } from 'vitest';
import {
    commitCircles,
    commitKind,
    laneRows,
    lanesBelow,
    lanePaths,
    laneWidth,
    laneX
} from '../../../../../src/lib/state/sources/repositories/graph-lanes.ts';

/** The path strings of the strokes of row `at` of a history. */
function pathsOf(history: { hash: string; parents: string[] }[], at: number): string[] {
    return lanePaths(laneRows(history)[at]).map((one) => one.d);
}

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

describe('the lane geometry of a 22 pixel row', () => {
    it('puts lane n at 11 * (n + 1) and makes the row 11 * (max(lanes, 1) + 1) wide', () => {
        expect(laneX(0)).toBe(11);
        expect(laneX(2)).toBe(33);
        expect(laneWidth(3)).toBe(44);
        expect(laneWidth(0)).toBe(22);
        expect(laneWidth(30)).toBe(341);
    });

    it('draws a lane that passes as one vertical from the top of the row to its foot', () => {
        const paths = pathsOf(
            [
                { hash: 'm', parents: ['a', 'b'] },
                { hash: 'a', parents: ['r'] },
                { hash: 'b', parents: ['r'] },
                { hash: 'r', parents: [] }
            ],
            1
        );
        expect(paths).toContain('M 22 0 V 22');
    });

    it('draws the commit own lane whole, and cut at the dot where it begins or ends', () => {
        const history = [
            { hash: 'c', parents: ['b'] },
            { hash: 'b', parents: ['a'] },
            { hash: 'a', parents: [] }
        ];
        expect(pathsOf(history, 0)).toEqual(['M 11 11 V 22']);
        expect(pathsOf(history, 1)).toEqual(['M 11 0 V 22']);
        expect(pathsOf(history, 2)).toEqual(['M 11 0 V 11']);
    });

    it('draws a lane that ends in the commit from a column to its right as one arc and a run', () => {
        const paths = pathsOf(
            [
                { hash: 'c1', parents: ['p'] },
                { hash: 'c2', parents: ['p'] },
                { hash: 'c3', parents: ['p'] },
                { hash: 'p', parents: [] }
            ],
            3
        );
        expect(paths).toContain('M 33 0 A 11 11 0 0 1 22 11 H 11');
        expect(paths).toContain('M 22 0 A 11 11 0 0 1 11 11');
    });

    it('draws a merge parent leaving the commit to the next column as one arc', () => {
        const paths = pathsOf([{ hash: 'm', parents: ['a', 'b'] }], 0);
        expect(paths).toContain('M 11 11 A 11 11 0 0 1 22 22');
    });

    it('draws a merge parent leaving to a column further right as a run and an arc', () => {
        const paths = pathsOf([{ hash: 'm', parents: ['a', 'b', 'c'] }], 0);
        expect(paths).toContain('M 11 11 H 22');
        expect(paths).toContain('M 22 11 A 11 11 0 0 1 33 22');
    });

    it('draws a merge parent leaving to a column on its left as the mirror of one on its right', () => {
        const paths = pathsOf(
            [
                { hash: 'h', parents: ['x'] },
                { hash: 'm', parents: ['y', 'x'] }
            ],
            1
        );
        expect(paths).toContain('M 22 11 A 11 11 0 0 0 11 22');
    });

    it('holds no Bezier curve in any stroke of any row', () => {
        const history = [
            { hash: 'm', parents: ['a', 'b', 'c'] },
            { hash: 'x', parents: ['a'] },
            { hash: 'a', parents: ['r'] },
            { hash: 'b', parents: ['r'] },
            { hash: 'c', parents: ['r'] },
            { hash: 'r', parents: [] }
        ];
        const all = laneRows(history).flatMap((row) => lanePaths(row).map((one) => one.d));
        expect(all.length).toBeGreaterThan(0);
        for (const path of all) expect(path).not.toContain('C');
    });

    it('gives each stroke the lane whose colour it takes', () => {
        const row = laneRows([{ hash: 'm', parents: ['a', 'b'] }])[0];
        expect(lanePaths(row).map((one) => [one.d, one.lane])).toEqual([
            ['M 11 11 V 22', 0],
            ['M 11 11 A 11 11 0 0 1 22 22', 1]
        ]);
    });

    it('lists the lanes that continue below a row, for the files of an open commit', () => {
        const rows = laneRows([
            { hash: 'm', parents: ['a', 'b'] },
            { hash: 'a', parents: [] }
        ]);
        expect(lanesBelow(rows[0])).toEqual([0, 1]);
        expect(lanesBelow(rows[1])).toEqual([1]);
    });
});

describe('the circle of a commit', () => {
    const radii = (kind: Parameters<typeof commitCircles>[0]): number[] =>
        commitCircles(kind).map((circle) => circle.r);

    it('is one circle of radius 5 for a commit', () => {
        expect(radii('commit')).toEqual([5]);
    });

    it('is radius 6 with an inner circle of radius 3 for a merge', () => {
        expect(radii('merge')).toEqual([6, 3]);
    });

    it('is radius 7 with an inner circle of radius 2 for HEAD', () => {
        expect(radii('head')).toEqual([7, 2]);
    });

    it('is radius 7, radius 5 and a dashed ring of radius 5 for Incoming and Outgoing', () => {
        expect(radii('incoming')).toEqual([7, 5, 5]);
        expect(radii('outgoing')).toEqual([7, 5, 5]);
        expect(commitCircles('incoming')[2].dash).toBe('4,2');
        expect(commitCircles('commit')[0].dash).toBeUndefined();
    });

    it('takes HEAD before a merge when a commit is both', () => {
        expect(commitKind({ parents: ['a', 'b'] }, true)).toBe('head');
        expect(commitKind({ parents: ['a', 'b'] }, false)).toBe('merge');
        expect(commitKind({ parents: ['a'] }, false)).toBe('commit');
        expect(commitKind({ parents: [] }, true)).toBe('head');
    });
});
