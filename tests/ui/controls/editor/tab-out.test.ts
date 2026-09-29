// Tab and Escape in the editor: the rules that decide when Tab leaves the editor. What this does
// NOT cover: the editor's listeners holding the Tab back from Monaco, which the look does.

import { describe, expect, it } from 'vitest';
import {
    armAfter,
    armBefore,
    leaves,
    type KeyFacts
} from '../../../../src/lib/ui/controls/editor/tab-out.ts';

/** A press of one key with no modifier, not taken by the editor unless said. */
function press(key: string, held: Partial<KeyFacts> = {}): KeyFacts {
    return { key, ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, ...held };
}

/** The arm after a run of presses, each read before and after the editor, and whether it left. */
function run(presses: KeyFacts[]): { armed: boolean; left: boolean } {
    let armed = false;
    let left = false;
    for (const one of presses) {
        left = leaves(armed, one);
        armed = armAfter(armBefore(armed, one), one);
    }
    return { armed, left };
}

describe('Tab and Escape in the editor', () => {
    // Red when an Escape the editor left untaken does not arm the next Tab.
    it('lets Tab leave after an Escape the editor did not take, and Shift+Tab too', () => {
        expect(run([press('Escape'), press('Tab')]).left).toBe(true);
        expect(run([press('Escape'), press('Shift'), press('Tab', {})]).left).toBe(true);
    });

    // Red when Tab always leaves, or an Escape that closed a widget still arms it.
    it('keeps Tab in the editor with no Escape before it, or after one the editor took', () => {
        expect(run([press('Tab')]).left).toBe(false);
        expect(run([press('Escape', { defaultPrevented: true }), press('Tab')]).left).toBe(false);
        // an Escape the editor took after one it left untaken leaves the arm dropped
        const taken = press('Escape', { defaultPrevented: true });
        expect(run([press('Escape'), taken, press('Tab')]).left).toBe(false);
        expect(armBefore(true, press('Escape'))).toBe(false);
    });

    // Red when another key leaves the arm set, or a chord with Tab leaves the editor.
    it('is disarmed by any other key, and a Tab held with Cmd, Ctrl or Alt never leaves', () => {
        expect(run([press('Escape'), press('a'), press('Tab')]).left).toBe(false);
        expect(run([press('Escape'), press('Tab', { metaKey: true })]).left).toBe(false);
        expect(run([press('Escape'), press('Tab', { altKey: true })]).left).toBe(false);
        expect(run([press('Escape'), press('Tab')]).armed).toBe(false);
    });
});
