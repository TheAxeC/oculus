// Layer 3, view helper tests. The measured rules of a card's layout, over numbers: where a card's
// controls sit and how many stay on their line before the rest go behind More, when a description
// is longer than its clamp and which control that draws, and which late measurement is still
// wanted.
//
// What this does NOT cover: the measuring, the hover and the menu, which need a page.

import { describe, expect, it } from 'vitest';
import {
    CLAMP_LINES,
    SLACK,
    actionPlace,
    leastStrip,
    measureGate,
    clampControl,
    fitActions,
    overflowsClamp
} from '../../../../src/lib/views/shared/card/card-layout.ts';

describe('the clamp', () => {
    it('is four lines', () => {
        expect(CLAMP_LINES).toBe(4);
    });

    it('calls a text long only when it is taller than the lines the clamp shows', () => {
        expect(overflowsClamp(80, 20)).toBe(false);
        expect(overflowsClamp(81, 20)).toBe(false);
        expect(overflowsClamp(82, 20)).toBe(true);
        expect(overflowsClamp(200, 20)).toBe(true);
        expect(overflowsClamp(59, 20, 3)).toBe(false);
        expect(overflowsClamp(62, 20, 3)).toBe(true);
    });

    it('calls no text long before a line height is known', () => {
        expect(overflowsClamp(500, 0)).toBe(false);
        expect(overflowsClamp(500, Number.NaN)).toBe(false);
    });

    it('draws Show more on a cut long text, Show less on an open one, and nothing on a short one', () => {
        expect(clampControl(false, true)).toBe('more');
        expect(clampControl(true, true)).toBe('less');
        expect(clampControl(false, false)).toBeNull();
        expect(clampControl(true, false)).toBeNull();
    });
});

describe('where the controls go', () => {
    it('stays beside the chips, less the slack, when the least strip fits there', () => {
        expect(actionPlace(300, 180, 58)).toEqual({ room: 120 - SLACK, alone: false });
        expect(actionPlace(300, 242 - SLACK, 58)).toEqual({ room: 58, alone: false });
    });

    it('takes a line of its own when the chips leave too little, fractions included', () => {
        expect(actionPlace(300, 242, 58)).toEqual({ room: 300 - SLACK, alone: true });
        expect(actionPlace(331, 173.5, 157.2)).toEqual({ room: 331 - SLACK, alone: true });
        expect(actionPlace(300, 400, 58)).toEqual({ room: 300 - SLACK, alone: true });
    });

    it('has no room on a line not measured yet', () => {
        expect(actionPlace(0, 0, 58)).toEqual({ room: 0, alone: false });
    });

    // Revert: leastStrip answering the first control and More, which puts a strip More alone
    // would fit on a line of its own under the chips.
    it('needs every control when they take less than More, else More alone', () => {
        expect(leastStrip([10], 26, 6)).toBe(10);
        expect(leastStrip([20, 20], 26, 6)).toBe(26);
        expect(leastStrip([20, 20, 20, 20], 26, 6)).toBe(26);
        expect(leastStrip([], 26, 6)).toBe(0);
    });
});

describe('a measurement that lands late', () => {
    it('is wanted while it is the latest begun and the component is open', () => {
        const gate = measureGate();
        const token = gate.begin();
        expect(gate.current(token)).toBe(true);
    });

    it('is dropped once a newer one has begun', () => {
        const gate = measureGate();
        const first = gate.begin();
        const second = gate.begin();
        expect(gate.current(first)).toBe(false);
        expect(gate.current(second)).toBe(true);
    });

    it('is dropped once the component has closed, and a new run wants its own again', () => {
        const gate = measureGate();
        const token = gate.begin();
        gate.close();
        expect(gate.current(token)).toBe(false);
        const again = gate.begin();
        expect(gate.current(token)).toBe(false);
        expect(gate.current(again)).toBe(true);
    });
});

describe('the controls on one line', () => {
    it('keeps every control when they and their gaps fit', () => {
        expect(fitActions([26, 26, 26], 90, 26, 6)).toBe(3);
        expect(fitActions([26, 26, 26], 200, 26, 6)).toBe(3);
    });

    it('moves the controls past the line into More, keeping room for More itself', () => {
        // 5 controls of 26 with gaps of 6 need 154; 100 holds More (26 + 6) and two controls (58).
        expect(fitActions([26, 26, 26, 26, 26], 100, 26, 6)).toBe(2);
        expect(fitActions([26, 26, 26, 26, 26], 153, 26, 6)).toBe(3);
        // One pixel short of three: More and one control, never three past the room.
        expect(fitActions([26, 26, 26], 89, 26, 6)).toBe(1);
    });

    it('keeps controls in order, so a wide one past the room ends the line', () => {
        expect(fitActions([26, 120, 26], 100, 26, 6)).toBe(1);
    });

    it('keeps every control on a line not measured yet, and none on a line too short for one', () => {
        expect(fitActions([26, 26], 0, 26, 6)).toBe(2);
        expect(fitActions([26, 26], 30, 26, 6)).toBe(0);
        expect(fitActions([], 100, 26, 6)).toBe(0);
    });
});
