// Layer 3, primitive test. The rule a menu draws between VS Code's groups: an item carrying `rule`
// draws a separator above it, the list's first item never does, and a builder's groups joined by
// `grouped` carry the rule on the first item of every group after the first, empty groups dropped.
//
// What this does NOT cover: the separator drawn by bits-ui and the arrow keys and type-ahead
// passing over it, which need a DOM and are seen at the look.

import { describe, expect, it } from 'vitest';
import { grouped, ruleAbove, type MenuItem } from '../../../src/lib/ui/menu/menu-items.ts';

describe('the rule between groups', () => {
    const items: MenuItem[] = [
        { id: 'a', label: 'A', rule: true },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C', rule: true }
    ];

    // Revert: make ruleAbove in menu-items.ts return false.
    it('is drawn above an item carrying it', () => {
        expect(ruleAbove(items, 2)).toBe(true);
        expect(ruleAbove(items, 1)).toBe(false);
    });

    // Revert: drop the `index > 0` test from ruleAbove.
    it('is never drawn above the first item', () => {
        expect(ruleAbove(items, 0)).toBe(false);
    });
});

describe('groups joined into one list', () => {
    // Revert: keep the empty groups in grouped, so the rule lands on the list's first item.
    it('puts the rule on the first item of each later group and drops the empty ones', () => {
        const a = { id: 'a', label: 'A' };
        const b = { id: 'b', label: 'B' };
        const c = { id: 'c', label: 'C' };
        const list = grouped([[], [a, b], [], [c]]);
        expect(list.map((item) => [item.id, item.rule === true])).toEqual([
            ['a', false],
            ['b', false],
            ['c', true]
        ]);
        expect(list.map((_, index) => ruleAbove(list, index))).toEqual([false, false, true]);
    });

    // Revert: set `rule` on the handed item itself in grouped instead of on a copy.
    it('leaves the items it was handed as they were', () => {
        const c = { id: 'c', label: 'C' };
        grouped([[{ id: 'a', label: 'A' }], [c]]);
        expect(c).toEqual({ id: 'c', label: 'C' });
    });
});
