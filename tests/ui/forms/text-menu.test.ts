// Layer 3, primitive test. The right-click menu of a text box, built by
// ui/controls/text/text-menu.ts: the editing commands a box offers with and without a selection.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the menu opened on a box, and each edit (the undo, the cut, the paste
// as one edit, the focus and the caret kept), which need a DOM and are seen at the look.

import { describe, expect, it } from 'vitest';
import { textMenu } from '../../../src/lib/ui/controls/text/text-menu.ts';

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

describe('the text box menu', () => {
    // Revert: offer Cut in textMenu whatever `selection` says.
    it('offers Cut and Copy only while the box holds a selection', () => {
        expect(textMenu({ selection: true, readonly: false }, words).map((i) => i.label)).toEqual([
            '@ui.text_undo',
            '@ui.text_redo',
            '@ui.text_cut',
            '@ui.text_copy',
            '@ui.text_paste',
            '@ui.text_select_all'
        ]);
        expect(textMenu({ selection: false, readonly: false }, words).map((i) => i.label)).toEqual([
            '@ui.text_undo',
            '@ui.text_redo',
            '@ui.text_paste',
            '@ui.text_select_all'
        ]);
    });

    // Revert: drop the `facts.readonly` branch from textMenu.
    it('offers a read-only box Copy with a selection and Select All only', () => {
        expect(textMenu({ selection: true, readonly: true }, words).map((i) => i.label)).toEqual([
            '@ui.text_copy',
            '@ui.text_select_all'
        ]);
        expect(textMenu({ selection: false, readonly: true }, words).map((i) => i.label)).toEqual([
            '@ui.text_select_all'
        ]);
    });
});
