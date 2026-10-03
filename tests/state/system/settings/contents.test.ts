// Layer 2, client-state tests. Where the Settings view's table of contents is: beside the list at
// 700 px and over, and below that behind a toggle in the header that shows it over the list, which
// a press on an entry or Escape hides again.
//
// What this does NOT cover: the scrolling to the entry, the press on the toggle and the toggle
// drawn, which are seen at the look in a pane narrower than 700 px.

import { describe, expect, it } from 'vitest';
import {
    NARROW,
    contentsAfter,
    contentsPlace
} from '../../../../src/lib/state/system/config/view/contents.ts';

describe('the table of contents by width', () => {
    it('is beside the list at 700 px and over, with no toggle offered', () => {
        for (const width of [700, 701, 1200]) {
            expect(contentsPlace(width, false), String(width)).toEqual({
                beside: true,
                toggle: false,
                over: false
            });
            // a table left shown from a narrower pane is not drawn over a pane that fits it
            expect(contentsPlace(width, true).over, String(width)).toBe(false);
        }
    });

    it('is not beside the list under 700 px, and the toggle is offered', () => {
        for (const width of [699, 400, 1]) {
            expect(contentsPlace(width, false), String(width)).toEqual({
                beside: false,
                toggle: true,
                over: false
            });
        }
        expect(NARROW).toBe(700);
    });

    it('is shown over the list under 700 px once the toggle was pressed', () => {
        expect(contentsPlace(500, true)).toEqual({ beside: false, toggle: true, over: true });
    });

    it('is beside the list while the pane is not measured yet', () => {
        expect(contentsPlace(0, false)).toEqual({ beside: true, toggle: false, over: false });
    });
});

describe('what a press does to the table', () => {
    it('shows it on the toggle and hides it on the toggle again', () => {
        expect(contentsAfter(false, 'toggle', 500)).toBe(true);
        expect(contentsAfter(true, 'toggle', 500)).toBe(false);
    });

    it('hides it on the choice of an entry and on Escape', () => {
        expect(contentsAfter(true, 'choose', 500)).toBe(false);
        expect(contentsAfter(true, 'escape', 500)).toBe(false);
        expect(contentsAfter(false, 'escape', 500)).toBe(false);
    });

    it('leaves a table beside the list as it is, whatever is pressed', () => {
        for (const press of ['toggle', 'choose', 'escape'] as const) {
            expect(contentsAfter(false, press, 700), press).toBe(false);
            expect(contentsAfter(true, press, 900), press).toBe(false);
        }
    });
});
