// Layer 3, primitive test. The editor's options as Monaco is given them: the mapping of the five
// options to Monaco's names, the model's indentation, and the Alt+Z action that toggles word wrap.
//
// What this does NOT cover: that Editor.svelte and DiffEditor.svelte call `applyOptions` when the
// options they are handed change, that Monaco draws the minimap, rulers, whitespace and sticky
// scroll it is given, and that Alt+Z (and Option+Z on macOS) reaches the action: those are seen at
// the look.

import { describe, expect, it } from 'vitest';
import {
    WRAP_ACTION,
    applyIndent,
    monacoOptions,
    wrapAction,
    type EditorOptions
} from '../../../../src/lib/ui/controls/editor/options.ts';

const ALL: EditorOptions = {
    wordWrap: 'bounded',
    rulers: [80, 100],
    minimap: false,
    renderWhitespace: 'all',
    stickyScroll: false
};

describe('the options as Monaco names them (case 11)', () => {
    // Red when an option is dropped or named as Monaco does not read it, or a diff editor is handed
    // a minimap it did not ask for.
    it.each([
        [
            'all five',
            ALL,
            {
                wordWrap: 'bounded',
                rulers: [80, 100],
                minimap: { enabled: false },
                renderWhitespace: 'all',
                stickyScroll: { enabled: false }
            }
        ],
        [
            'those of a diff editor, with no minimap',
            { wordWrap: 'off', rulers: [], renderWhitespace: 'none', stickyScroll: true },
            {
                wordWrap: 'off',
                rulers: [],
                renderWhitespace: 'none',
                stickyScroll: { enabled: true }
            }
        ]
    ] as [string, EditorOptions, object][])('maps %s', (_name, given, mapped) => {
        expect(monacoOptions(given)).toEqual(mapped);
    });
});

describe('the indentation of a model', () => {
    it('sets the tab size, the indent size and spaces or tabs together', () => {
        const calls: object[] = [];
        applyIndent(
            { updateOptions: (given: object) => void calls.push(given) },
            { tabs: true, size: 3 }
        );
        expect(calls).toEqual([{ tabSize: 3, indentSize: 3, insertSpaces: false }]);
    });
});

describe('the action that toggles word wrap on Alt+Z', () => {
    const keys = { KeyMod: { Alt: 512 }, KeyCode: { KeyZ: 56 } };

    it('is bound to the Z key with Alt and runs the callback it is given', () => {
        let ran = 0;
        const action = wrapAction(keys, 'View: Toggle Word Wrap', () => {
            ran += 1;
        });
        expect(action.id).toBe(WRAP_ACTION);
        expect(action.label).toBe('View: Toggle Word Wrap');
        expect(action.keybindings).toEqual([512 | 56]);
        void action.run({} as never);
        expect(ran).toBe(1);
    });
});
