// Layer 3, Map helper tests. Which labels the graph draws, as a rule over label boxes: a label that
// overlaps one already drawn is left out, and the hovered and the selected node's labels are drawn
// whatever they overlap.
//
// What this does NOT cover: the measuring of a label's width and the pointer, which need a page and
// are tests/browser/cards.spec.ts.

import { describe, expect, it } from 'vitest';
import {
    UNMEASURED,
    labelBox,
    shownLabels,
    type LabelBox
} from '../../src/lib/views/map/labels.ts';

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
        expect([...shownLabels(boxes, [])].sort()).toEqual(['a', 'b', 'c']);
    });

    it('leaves out a label that overlaps one drawn before it, in the order given', () => {
        const boxes = [box('a', 0, 0), box('b', 20, 5), box('c', 100, 0)];
        expect([...shownLabels(boxes, [])].sort()).toEqual(['a', 'c']);
    });

    it('draws a hovered or selected label whatever it overlaps, and leaves out what it covers', () => {
        const boxes = [box('a', 0, 0), box('b', 20, 5), box('c', 100, 0)];
        expect([...shownLabels(boxes, ['b'])].sort()).toEqual(['b', 'c']);
        expect([...shownLabels(boxes, ['a', 'b'])].sort()).toEqual(['a', 'b', 'c']);
    });

    it('counts boxes that only touch as apart', () => {
        const boxes = [box('a', 0, 0), box('b', 40, 0), box('c', 0, 10)];
        expect([...shownLabels(boxes, [])].sort()).toEqual(['a', 'b', 'c']);
    });

    it('draws labels of no width, which have not been measured, whatever sits beside them', () => {
        const boxes = [box('a', 0, 0), box('b', 0, 0, 0, 10)];
        expect([...shownLabels(boxes, [])].sort()).toEqual(['a', 'b']);
    });

    it('ignores a leading id that names no label', () => {
        const boxes = [box('a', 0, 0)];
        expect([...shownLabels(boxes, ['gone'])]).toEqual(['a']);
    });
});
