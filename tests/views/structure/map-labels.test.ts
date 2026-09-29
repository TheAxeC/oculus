// Layer 3, Map helper tests. Which labels the graph draws, as a rule over label boxes and node
// shapes: a label that overlaps one already drawn or any node but its own is left out, the pillars'
// labels are placed before the rest, and the hovered and the selected node's labels are drawn
// whatever they overlap.
//
// What this does NOT cover: the measuring of a label's width and the pointer, which need a page.

import { describe, expect, it } from 'vitest';
import {
    UNMEASURED,
    labelBox,
    shownLabels,
    type LabelBox,
    type LabelNode
} from '../../../src/lib/views/structure/map/labels.ts';

function box(id: string, left: number, top: number, width = 40, height = 10): LabelBox {
    return { id, left, top, right: left + width, bottom: top + height };
}

describe('a label box', () => {
    it('starts past the node and reaches above and below the baseline under its centre', () => {
        expect(
            labelBox({ id: 'a', x: 100, y: 50, radius: 8 }, { width: 60, above: 9, below: 3 })
        ).toEqual({
            id: 'a',
            left: 112,
            top: 45,
            right: 172,
            bottom: 57
        });
    });

    it('is an empty box before the label is measured', () => {
        const empty = labelBox({ id: 'a', x: 100, y: 50, radius: 8 }, UNMEASURED);
        expect(empty.right - empty.left).toBe(0);
        expect(empty.bottom - empty.top).toBe(0);
    });
});

describe('the labels drawn', () => {
    it('draws every label when none overlap', () => {
        const boxes = [box('a', 0, 0), box('b', 50, 0), box('c', 0, 20)];
        expect([...shownLabels(boxes, [], [])].sort()).toEqual(['a', 'b', 'c']);
    });

    it('leaves out a label that overlaps one drawn before it, in the order given', () => {
        const boxes = [box('a', 0, 0), box('b', 20, 5), box('c', 100, 0)];
        expect([...shownLabels(boxes, [], [])].sort()).toEqual(['a', 'c']);
    });

    it('draws a hovered or selected label whatever it overlaps, and leaves out what it covers', () => {
        const boxes = [box('a', 0, 0), box('b', 20, 5), box('c', 100, 0)];
        expect([...shownLabels(boxes, ['b'], [])].sort()).toEqual(['b', 'c']);
        expect([...shownLabels(boxes, ['a', 'b'], [])].sort()).toEqual(['a', 'b', 'c']);
    });

    it('counts boxes that only touch as apart', () => {
        const boxes = [box('a', 0, 0), box('b', 40, 0), box('c', 0, 10)];
        expect([...shownLabels(boxes, [], [])].sort()).toEqual(['a', 'b', 'c']);
    });

    it('draws labels of no width, which have not been measured, whatever sits beside them', () => {
        const boxes = [box('a', 0, 0), box('b', 0, 0, 0, 10)];
        expect([...shownLabels(boxes, [], [])].sort()).toEqual(['a', 'b']);
    });

    it('ignores a leading id that names no label', () => {
        const boxes = [box('a', 0, 0)];
        expect([...shownLabels(boxes, ['gone'], [])]).toEqual(['a']);
    });
});

/** A node as the label rule reads it: a project at radius 8, a pillar or a collaborator at 12. */
function at(id: string, x: number, y: number, kind: LabelNode['kind'] = 'project'): LabelNode {
    return { id, x, y, radius: kind === 'project' ? 8 : 12, kind };
}

/** The labels drawn, sorted. */
function drawn(boxes: LabelBox[], first: string[], nodes: LabelNode[]): string[] {
    return [...shownLabels(boxes, first, nodes)].sort();
}

describe('the labels drawn over the nodes', () => {
    it('audits that a label over another project circle is left out, and a project is a circle', () => {
        const nodes = [at('p1', 0, 0), at('p2', 100, 100)];
        // Across the centre of p2's circle.
        expect(drawn([box('p1', 60, 95, 60), box('p2', 300, 300)], [], nodes)).toEqual(['p2']);
        // Over the corner of the square around p2's circle, off the circle.
        expect(drawn([box('p1', 60, 60, 33.5, 33.5), box('p2', 300, 300)], [], nodes)).toEqual([
            'p1',
            'p2'
        ]);
    });

    it("audits that a label over a pillar's square or a collaborator's square is left out", () => {
        for (const kind of ['line', 'collaborator'] as const) {
            // The corner of the square at (88, 88), off the circle of radius 12 inside it.
            const nodes = [at('p1', 0, 0), at('s', 100, 100, kind)];
            expect(drawn([box('p1', 60, 60, 30, 30), box('s', 300, 300)], [], nodes)).toEqual([
                's'
            ]);
        }
    });

    it("audits that a collaborator's label over a project's circle is left out", () => {
        const nodes = [at('c', 0, 0, 'collaborator'), at('p', 100, 100)];
        expect(drawn([box('c', 60, 95, 45), box('p', 300, 300)], [], nodes)).toEqual(['p']);
    });

    it("audits that a pillar's label over another pillar's square is left out", () => {
        const nodes = [at('a', 0, 0, 'line'), at('b', 100, 100, 'line')];
        expect(drawn([box('a', 60, 95, 45), box('b', 300, 300)], [], nodes)).toEqual(['b']);
    });

    it('audits that a label over its own node alone is drawn', () => {
        const nodes = [at('p', 100, 100), at('q', 400, 400)];
        expect(drawn([box('p', 95, 95, 40), box('q', 600, 600)], [], nodes)).toEqual(['p', 'q']);
    });
});

describe('the order the labels are placed in', () => {
    it("audits that a pillar's label is placed before a project label it overlaps", () => {
        const nodes = [at('p', 0, 0), at('l', 0, 300, 'line')];
        // The graph lists the project first; the pillar's label is kept and the project's goes.
        expect(drawn([box('p', 100, 100), box('l', 110, 105)], [], nodes)).toEqual(['l']);
    });

    it('audits that of two pillar labels that overlap, the first in the graph order is drawn', () => {
        const nodes = [at('a', 0, 0, 'line'), at('b', 0, 300, 'line')];
        expect(drawn([box('a', 100, 100), box('b', 110, 105)], [], nodes)).toEqual(['a']);
        expect(drawn([box('b', 110, 105), box('a', 100, 100)], [], nodes)).toEqual(['b']);
    });

    it('audits that a leading label is drawn over a node, and a pillar label over it is left out', () => {
        const nodes = [at('p', 0, 0), at('q', 130, 95), at('l', 0, 300, 'line')];
        const boxes = [box('p', 100, 100), box('q', 400, 400), box('l', 110, 105)];
        expect(drawn(boxes, ['p'], nodes)).toEqual(['p', 'q']);
    });
});

describe('a label not measured yet', () => {
    it('audits that a label of no width is drawn on an edge, inside a label and inside a circle, and covers nothing', () => {
        const nodes = [
            at('a', 0, 0),
            at('b', 0, 300),
            at('c', 200, 200),
            at('d', 0, 500),
            at('e', 0, 700),
            at('f', 0, 900)
        ];
        const boxes = [
            box('a', 100, 100),
            // On the left edge of a's label.
            box('b', 100, 100, 0, 10),
            // Strictly inside a's label.
            box('c', 120, 102, 0, 5),
            // Strictly inside c's circle.
            box('d', 198, 198, 0, 4),
            // Drawn before a measured label that strictly holds it, which is drawn too.
            box('e', 310, 302, 0, 5),
            box('f', 300, 300)
        ];
        expect(drawn(boxes, [], nodes)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });
});
