// Layer 3, shell test. What the pane strip draws a tab's glyph with and in which colour token
// (shell/panes/pane-view.ts, `stripMark`): the mark the terminals store gives a tab (the icon and
// colour of the terminal a Terminal tab shows), else the view's own glyph and the default colour.
// What that mark is for a given terminal or view is tests/state/sessions/terminal/terminal-marks
// .test.ts and tests/state/client/terminal/terminal-tabs.test.ts.
//
// What this does NOT cover: the glyph drawn on screen in that colour, which is tests/ui/primitives
// .test.ts for the strip and the look for the theme.

import { describe, expect, it } from 'vitest';
import { stripMark } from '../../../src/lib/shell/panes/pane-view.ts';

describe('the strip tab of a tab that has a mark', () => {
    // Revert: draw the view's glyph and no colour whatever mark the store gives.
    it('draws the icon and the colour token of the mark', () => {
        expect(stripMark('terminal_glyph', { glyph: 'refresh', token: '--c-red' })).toEqual({
            glyph: 'refresh',
            tint: '--c-red'
        });
    });

    // Revert: leave the view's glyph out when the mark names a colour only.
    it('keeps the view glyph when the mark names a colour only', () => {
        expect(stripMark('terminal_glyph', { token: '--c-red' })).toEqual({
            glyph: 'terminal_glyph',
            tint: '--c-red'
        });
    });

    // Revert: replace the view glyph with a fixed glyph for a tab whose mark is empty.
    it('keeps the view glyph and the default colour for a tab with no mark', () => {
        expect(stripMark('file_glyph', {})).toEqual({ glyph: 'file_glyph' });
    });
});
