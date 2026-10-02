// Layer 3, primitive test. What Enter does on a row of an explorer tree (pressedByKey of
// ui/tree/tree-keys.ts, the handler ui/tree/TreeItem.svelte puts on its row): it presses the row's
// button, which is how a Bookmarks, Notes, Open Editors, Outline or Timeline row opens, unless the
// key was pressed on a control inside the row, the row is outside a tree, or the tree binds the
// key to its caller's keymap.
//
// The press is a stand-in with the three things the handler reads, and the button a recorder. What
// this does NOT cover: the keydown the browser delivers to the row, and the rows' own `onclick`
// that the button runs (tests/views/sources/files/sections/sections.test.ts draws each section's
// rows with the button).

import { describe, expect, it, vi } from 'vitest';
import { pressedByKey, type RowKey } from '../../../src/lib/ui/tree/tree-keys.ts';

const box = {};

/** A key pressed on `target`, recording whether its default was prevented. */
function key(name: string, target: unknown = box): RowKey & { prevented: boolean } {
    const press = {
        key: name,
        target: target as EventTarget,
        prevented: false,
        preventDefault: () => {
            press.prevented = true;
        }
    };
    return press;
}

describe('Enter on a row of a tree', () => {
    // Revert: take the Enter branch out of pressedByKey.
    it('audits that presses the row button, so the row opens, and keeps the browser from also acting', () => {
        const click = vi.fn();
        const press = key('Enter');

        const pressed = pressedByKey(press, {
            box,
            inTree: true,
            bound: undefined,
            button: { click }
        });

        expect(pressed).toBe(true);
        expect(click).toHaveBeenCalledOnce();
        expect(press.prevented).toBe(true);
    });

    // Revert: press the button for any key.
    it('audits that presses nothing for another key, or for a row with no button', () => {
        const click = vi.fn();

        expect(
            pressedByKey(key('a'), { box, inTree: true, bound: undefined, button: { click } })
        ).toBe(false);
        expect(
            pressedByKey(key('Enter'), { box, inTree: true, bound: undefined, button: undefined })
        ).toBe(false);
        expect(click).not.toHaveBeenCalled();
    });

    // Revert: leave out the test of the target, or of the tree.
    it('audits that leaves a key pressed inside the row, or on a row outside a tree, alone', () => {
        const click = vi.fn();
        const inside = key('Enter', {});

        expect(
            pressedByKey(inside, { box, inTree: true, bound: undefined, button: { click } })
        ).toBe(false);
        expect(
            pressedByKey(key('Enter'), { box, inTree: false, bound: undefined, button: { click } })
        ).toBe(false);
        expect(click).not.toHaveBeenCalled();
        expect(inside.prevented).toBe(false);
    });

    // Revert: press the button although the tree bound the key to its caller's keymap.
    it('audits that leaves a key the tree binds to its caller, as the Files tree binds Enter', () => {
        const click = vi.fn();
        const press = key('Enter');

        const pressed = pressedByKey(press, {
            box,
            inTree: true,
            bound: () => true,
            button: { click }
        });

        expect(pressed).toBe(false);
        expect(click).not.toHaveBeenCalled();
        expect(press.prevented).toBe(false);
    });
});
