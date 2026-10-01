// Layer 3, primitive test. The pure function that says how many of a toolbar's controls are drawn
// in its one line and whether the overflow opener is drawn after them, and the function that says
// whether a press inside the popover of the clipped controls closes it. The unit project has no
// DOM, so the press targets are plain nodes that answer `closest` for the selectors it asks.

import { describe, expect, it } from 'vitest';
import { closesPopover, fit, picksMenuItem } from '../../../src/lib/ui/frame/toolbar/fit.ts';

describe('how many controls a toolbar draws', () => {
    it('draws every control, and no opener, when they all fit', () => {
        expect(fit([20, 20, 20], 100, 20, 4)).toEqual({ shown: 3, opener: false });
    });

    it('keeps the controls and the opener that fit together, and clips the rest', () => {
        // Three controls, three gaps and the opener are 60 + 12 + 20 = 92; a fourth makes 116.
        expect(fit([20, 20, 20, 20, 20, 20], 100, 20, 4)).toEqual({ shown: 3, opener: true });
    });

    it('draws no opener when the last control fits exactly and none is left over', () => {
        expect(fit([20, 20, 20, 20, 20], 116, 20, 4)).toEqual({ shown: 5, opener: false });
    });

    it('draws none of a control wider than the room, and the opener', () => {
        expect(fit([200], 100, 20, 4)).toEqual({ shown: 0, opener: true });
    });

    it('draws nothing for no controls', () => {
        expect(fit([], 100, 20, 4)).toEqual({ shown: 0, opener: false });
    });

    it('draws none of the controls in no room', () => {
        expect(fit([20, 20], 0, 20, 4).shown).toBe(0);
    });

    it('counts a width that is not a finite number as zero', () => {
        expect(fit([Number.NaN, 20, Number.POSITIVE_INFINITY], 100, 20, 4)).toEqual({
            shown: 3,
            opener: false
        });
    });
});

/**
 * A node with a tag, attributes and a parent, answering `closest` for a list of tags, `[attr]` and
 * `[attr="value"]`.
 */
type Node = {
    tag: string;
    attrs: Record<string, string>;
    parent: Node | null;
    closest(selector: string): Node | null;
};

function node(tag: string, attrs: Record<string, string> = {}, parent: Node | null = null): Node {
    const here: Node = {
        tag,
        attrs,
        parent,
        closest(selector: string): Node | null {
            const wants = selector.split(',').map((one) => one.trim());
            const attribute = (one: Node, want: string): boolean => {
                const [name, ...rest] = want.slice(1, -1).split('=');
                if (!(name in one.attrs)) return false;
                return rest.length === 0 || one.attrs[name] === rest.join('=').slice(1, -1);
            };
            const matches = (one: Node): boolean =>
                wants.some((want) =>
                    want.startsWith('[') ? attribute(one, want) : want === one.tag
                );
            for (let at: Node | null = here; at !== null; at = at.parent) {
                if (matches(at)) return at;
            }
            return null;
        }
    };
    return here;
}

describe('which presses close the popover of the clipped controls', () => {
    it('closes on a button', () => {
        expect(closesPopover(node('button'))).toBe(true);
    });

    it('closes on a link', () => {
        expect(closesPopover(node('a'))).toBe(true);
    });

    it('closes on a span inside a button', () => {
        expect(closesPopover(node('span', {}, node('button')))).toBe(true);
    });

    it('stays open on a button that opens a menu', () => {
        // The menu opens on the press, so closing the popover would unmount the menu with it.
        expect(closesPopover(node('button', { 'aria-haspopup': 'menu' }))).toBe(false);
    });

    it('stays open on a span inside a button that opens a menu', () => {
        const opener = node('button', { 'aria-haspopup': 'menu' });
        expect(closesPopover(node('span', {}, opener))).toBe(false);
    });

    it('stays open on a span outside any control', () => {
        expect(closesPopover(node('span', {}, node('div')))).toBe(false);
    });
});

describe('which presses in a menu close the popover it was opened from', () => {
    it('closes on a menu item', () => {
        expect(picksMenuItem(node('div', { role: 'menuitem' }))).toBe(true);
    });

    it('closes on a span inside a checkbox or a radio item', () => {
        expect(picksMenuItem(node('span', {}, node('div', { role: 'menuitemcheckbox' })))).toBe(
            true
        );
        expect(picksMenuItem(node('span', {}, node('div', { role: 'menuitemradio' })))).toBe(true);
    });

    it('stays open on the menu itself and on a press outside any item', () => {
        expect(picksMenuItem(node('div', { role: 'menu' }))).toBe(false);
        expect(picksMenuItem(node('span', {}, node('div', { role: 'separator' })))).toBe(false);
    });
});
