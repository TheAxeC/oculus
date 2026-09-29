// Layer 3, Map helper tests. Where a pointer lands in the graph: the client point mapped through
// the letterbox the SVG draws its 1000 by 680 box in, then through the pane's pan and zoom.
//
// What this does NOT cover: the pointer events themselves, which need a page; these are pure maps.

import { describe, expect, it } from 'vitest';
import type { PointNode } from '../../../src/lib/state/boards/structure/graph.ts';
import {
    LINK_REACH,
    dragTarget,
    movedEnough,
    nearestProject,
    toBox,
    toGraph
} from '../../../src/lib/views/structure/map/pointer.ts';

describe('a pointer mapped to the graph box', () => {
    it('audits that a wide pane maps through the band left and right of the picture', () => {
        const rect = { left: 65, top: 190, width: 1410, height: 595 };
        expect(toBox({ x: 770, y: 487.5 }, rect)).toEqual({ x: 500, y: 340 });
        const from = toBox({ x: 700, y: 400 }, rect);
        const to = toBox({ x: 902, y: 400 }, rect);
        expect(to.x - from.x).toBeCloseTo(230.86, 2);
        expect(to.y).toBe(from.y);
    });

    it('audits that a pane of the picture size maps one to one', () => {
        const rect = { left: 0, top: 0, width: 1000, height: 680 };
        expect(toBox({ x: 123, y: 456 }, rect)).toEqual({ x: 123, y: 456 });
    });

    it('audits that a tall pane maps through the band above and below the picture', () => {
        const rect = { left: 0, top: 0, width: 600, height: 1000 };
        const top = toBox({ x: 0, y: 296 }, rect);
        expect(top.x).toBeCloseTo(0, 9);
        expect(top.y).toBeCloseTo(0, 9);
    });

    it('audits that a pane of no size maps every point to the corner, with no NaN', () => {
        for (const rect of [
            { left: 10, top: 20, width: 0, height: 0 },
            { left: 10, top: 20, width: 800, height: 0 }
        ]) {
            expect(toBox({ x: 400, y: 300 }, rect)).toEqual({ x: 0, y: 0 });
        }
    });
});

describe('a box point mapped to the graph under pan and zoom', () => {
    it('audits that the pan comes off first and the zoom divides what is left', () => {
        expect(toGraph({ x: 500, y: 340 }, { x: 100, y: 50 }, 2)).toEqual({ x: 200, y: 145 });
        expect(toGraph({ x: 500, y: 340 }, { x: 0, y: 0 }, 1)).toEqual({ x: 500, y: 340 });
    });
});

describe('a dragged node under the pointer', () => {
    it('audits that the node keeps the offset it was grabbed at, with no jump at the first move', () => {
        // Grabbed 3 right of and 2 below its centre, the centre sits 3 left of and 2 above it.
        const grab = { x: -3, y: -2 };
        expect(dragTarget({ x: 503, y: 342 }, grab)).toEqual({ x: 500, y: 340 });
        expect(dragTarget({ x: 510, y: 342 }, grab)).toEqual({ x: 507, y: 340 });
    });

    it('audits that 300 pointer events within a quarter pixel of the press place nothing', () => {
        const press = { x: 700, y: 400 };
        let last = press;
        let placed = 0;
        for (let event = 0; event < 300; event += 1) {
            const angle = event * 0.7;
            const at = { x: press.x + 0.25 * Math.cos(angle), y: press.y + 0.25 * Math.sin(angle) };
            if (!movedEnough(last, at)) continue;
            last = at;
            placed += 1;
        }
        expect(placed).toBe(0);
    });

    it('audits that an event one pixel away places the node, and one 0.99 pixel away does not', () => {
        const press = { x: 700, y: 400 };
        expect(movedEnough(press, { x: 701, y: 400 })).toBe(true);
        expect(movedEnough(press, { x: 700, y: 401 })).toBe(true);
        expect(movedEnough(press, { x: 700.99, y: 400 })).toBe(false);
        expect(movedEnough(press, { x: 700 + 0.7, y: 400 + 0.7 })).toBe(false);
    });
});

/** A node of a kind at a place, at the Map's radius for it. */
function placedAt(
    id: string,
    x: number,
    y: number,
    kind: PointNode['kind'] = 'project'
): PointNode {
    const radius = kind === 'project' ? 8 : 12;
    return { id, entityId: id, label: id, kind, degree: 1, radius, x, y, vx: 0, vy: 0 };
}

describe('the project the link pointer reaches', () => {
    it('audits that the nearest project within its radius and the reach is taken', () => {
        const nodes = [
            placedAt('near', 100, 100),
            placedAt('nearer', 110, 100),
            placedAt('pillar', 104, 100, 'line'),
            placedAt('source', 105, 100)
        ];
        expect(nearestProject(nodes, { x: 106, y: 100 }, 'source')?.id).toBe('nearer');
        expect(nearestProject(nodes, { x: 110 + 8 + LINK_REACH, y: 100 }, 'source')?.id).toBe(
            'nearer'
        );
        expect(nearestProject(nodes, { x: 110 + 8 + LINK_REACH + 1, y: 100 }, 'source')).toBeNull();
    });
});
