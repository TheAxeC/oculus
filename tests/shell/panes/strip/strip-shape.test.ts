// Layer 3, shell test. What a pane's top row draws for each setting of show_tabs and
// editor_actions (shell/panes/strip/strip-shape.ts): all the tabs, the active tab alone, no tabs
// and a title row for the actions, or no row at all, and whether the Split Right button and the
// `...` opener are drawn. The pane drawn from this is strip-render.test.ts.
//
// What this does NOT cover: the markup, which strip-render.test.ts reads, and the settings'
// own fallback, which tests/state/shared/words/appearance.test.ts holds.

import { describe, expect, it } from 'vitest';
import { stripShape } from '../../../../src/lib/shell/panes/strip/strip-shape.ts';
import type { Tab } from '../../../../src/lib/ui/tabs/tab-strip.ts';

const TABS: Tab[] = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' }
];

const ids = (tabs: Tab[]): string[] => tabs.map((tab) => tab.id);

describe('show_tabs', () => {
    // Revert: return only the active tab for multiple.
    it('multiple draws every tab in a tab row', () => {
        const shape = stripShape('multiple', 'strip', TABS, 'b', false);
        expect(ids(shape.tabs)).toEqual(['a', 'b', 'c']);
        expect(shape.row).toBe('tabs');
    });

    // Revert: return every tab for single.
    it('single draws the active tab alone', () => {
        const shape = stripShape('single', 'strip', TABS, 'b', false);
        expect(ids(shape.tabs)).toEqual(['b']);
        expect(shape.row).toBe('tabs');
    });

    it('single over a pane with no tab draws the row with no tab', () => {
        const shape = stripShape('single', 'strip', [], '', false);
        expect(shape.tabs).toEqual([]);
        expect(shape.row).toBe('tabs');
    });

    // Revert: keep drawing the tab row for none.
    it('none draws no tab and a title row that holds the actions', () => {
        const shape = stripShape('none', 'strip', TABS, 'b', false);
        expect(shape.tabs).toEqual([]);
        expect(shape.row).toBe('title');
        expect(shape.actions).toBe(true);
    });

    it('none over a pane with no tab still draws the title row', () => {
        expect(stripShape('none', 'strip', [], '', false).row).toBe('title');
    });
});

describe('editor_actions', () => {
    // Revert: draw the actions whatever the setting says.
    it('strip draws the Split Right button and the opener', () => {
        expect(stripShape('multiple', 'strip', TABS, 'a', false).actions).toBe(true);
    });

    it('hidden draws neither, and the tabs stay', () => {
        const shape = stripShape('multiple', 'hidden', TABS, 'a', false);
        expect(shape.actions).toBe(false);
        expect(ids(shape.tabs)).toEqual(['a', 'b', 'c']);
        expect(shape.row).toBe('tabs');
    });

    // Revert: draw an empty title row for none and hidden.
    it('hidden under none draws no row at all', () => {
        const shape = stripShape('none', 'hidden', TABS, 'a', false);
        expect(shape.row).toBe('none');
        expect(shape.actions).toBe(false);
    });

    it('hidden under none keeps the title row when the pane is locked, for the lock to be pressed', () => {
        const shape = stripShape('none', 'hidden', TABS, 'a', true);
        expect(shape.row).toBe('title');
        expect(shape.actions).toBe(false);
        expect(shape.lock).toBe(true);
    });
});

describe('the lock mark', () => {
    // Revert: draw the mark on an unlocked pane.
    it('is drawn on a locked pane and on no other', () => {
        expect(stripShape('multiple', 'strip', TABS, 'a', true).lock).toBe(true);
        expect(stripShape('multiple', 'strip', TABS, 'a', false).lock).toBe(false);
    });

    it('is drawn whatever show_tabs and editor_actions say', () => {
        for (const bar of ['multiple', 'single', 'none'] as const) {
            for (const actions of ['strip', 'hidden'] as const) {
                expect(stripShape(bar, actions, TABS, 'a', true).lock, `${bar}/${actions}`).toBe(
                    true
                );
            }
        }
    });
});
