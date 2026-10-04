// Layer 2, client-state tests. The keys of the Files tree (acts/keys.ts): the keymap on each
// platform, the hint each key is shown as in the menu, and what a bound key does on the focused
// row.
//
// What this does NOT cover: a key pressed in a browser; the routing of a chord to the tree is
// tests/ui/tree/tree-keys.test.ts.

import { describe, expect, it } from 'vitest';
import {
    chordHint,
    filesKeymap,
    keyPlan,
    keyWords,
    type FilesAction,
    type KeyRow
} from '../../../../../src/lib/state/sources/explorer/acts/keys.ts';
import { keyRoute } from '../../../../../src/lib/ui/tree/tree-keys.ts';
import { t } from '../../../../../src/lib/state/shared/words/text.ts';
import { installRealText } from '../../../../views/shared/real-text.ts';

installRealText();

describe('the keymap', () => {
    // Revert: give a Cmd chord `meta` on every platform.
    it('binds Cmd chords to Meta on macOS and to Ctrl elsewhere', () => {
        const mac = filesKeymap(true).find((one) => one.action === 'delete');
        const other = filesKeymap(false).find((one) => one.action === 'delete');

        expect(mac).toMatchObject({ code: 'Backspace', meta: true, ctrl: false });
        expect(other).toMatchObject({ code: 'Backspace', meta: false, ctrl: true });
    });
});

describe('the hint of a key', () => {
    const hint = (action: FilesAction, mac = true): string | null =>
        chordHint(filesKeymap(mac), action, keyWords(t, mac));

    // Revert: write the modifiers in another order in chordHint.
    it('writes the hints of the row menu as VS Code does on macOS', () => {
        expect(hint('rename')).toBe('Enter');
        expect(hint('delete')).toBe('Cmd+Backspace');
        expect(hint('cut')).toBe('Cmd+X');
        expect(hint('copy-relative')).toBe('Option+Shift+Cmd+C');
    });

    // Revert: use the Cmd word on every platform in keyWords.
    it('writes Ctrl and Alt on a platform without Cmd and Option', () => {
        expect(hint('delete', false)).toBe('Ctrl+Backspace');
        expect(hint('copy-path', false)).toBe('Ctrl+Alt+C');
    });

    // Revert: return a hint for an action no chord asks for.
    it('has no hint for an action no chord asks for', () => {
        expect(chordHint([], 'rename', keyWords(t, true))).toBeNull();
    });
});

describe('what a bound key does on the focused row', () => {
    const row = (over: Partial<KeyRow> = {}): KeyRow => ({
        root: false,
        kind: 'file',
        acting: 1,
        actable: 1,
        cutting: false,
        ...over
    });

    // Revert: return `rename` for a root in keyPlan.
    it('starts the rename on a file row with Enter or F2', () => {
        expect(keyPlan('rename', row())).toBe('rename');
    });

    // Revert: drop the `row.root` test of the rename case.
    it('does nothing on Enter over a root row', () => {
        expect(keyPlan('rename', row({ root: true, kind: 'dir', actable: 0 }))).toBe('nothing');
    });

    // Revert: drop the `row.acting > 1` test of the rename case.
    it('does nothing on Enter with two rows selected', () => {
        expect(keyPlan('rename', row({ acting: 2, actable: 2 }))).toBe('nothing');
    });

    // Revert: toggle a file instead of opening it.
    it('opens a file as the preview on Cmd+Down and toggles a folder', () => {
        expect(keyPlan('open', row())).toBe('open-preview');
        expect(keyPlan('open', row({ kind: 'dir' }))).toBe('toggle');
        expect(keyPlan('open', row({ root: true, kind: 'dir' }))).toBe('toggle');
    });

    // Revert: let delete act on a root's line.
    it('asks nothing of delete, cut and copy when no row is actable', () => {
        for (const action of ['delete', 'cut', 'copy'] as const) {
            expect(keyPlan(action, row({ root: true, kind: 'dir', actable: 0 }))).toBe('nothing');
            expect(keyPlan(action, row())).toBe(action);
        }
    });

    // Revert: cancel a cut that is not there.
    it('cancels a cut on Escape only while there is one', () => {
        expect(keyPlan('cancel-cut', row({ cutting: true }))).toBe('cancel-cut');
        expect(keyPlan('cancel-cut', row())).toBe('pass');
    });

    // Revert: open a folder in the background on Space.
    it('opens a file in the background on Space and leaves a folder alone', () => {
        expect(keyPlan('open-background', row())).toBe('open-background');
        expect(keyPlan('open-background', row({ kind: 'dir' }))).toBe('pass');
    });

    // Revert: add a case for undo to keyPlan's switch that returns nothing.
    it('passes undo, redo, select-all and the range keys through as they are', () => {
        for (const action of ['undo', 'redo', 'select-all', 'extend-up', 'extend-down'] as const) {
            expect(keyPlan(action, row())).toBe(action);
        }
    });
});

describe('the keymap as the tree routes it', () => {
    // Revert: leave the keymap off the tree's keyRoute call.
    it.each([
        ['macOS', true],
        ['another platform', false]
    ])('gives every chord of the keymap on %s to the tree', (_platform, mac) => {
        const map = filesKeymap(mac);
        for (const chord of map) {
            const held = {
                meta: chord.meta,
                ctrl: chord.ctrl,
                alt: chord.alt,
                shift: chord.shift,
                code: chord.code
            };
            expect(keyRoute('x', held, false, map), chord.action).toBe('bound');
            expect(keyRoute('x', held, false, []), chord.action).not.toBe('bound');
        }
    });

    // Revert: bind Space while a type-ahead is running.
    it('leaves Space to the type-ahead while one is running', () => {
        const map = filesKeymap(true);
        const held = { meta: false, ctrl: false, code: 'Space' };

        expect(keyRoute(' ', held, false, map)).toBe('bound');
        expect(keyRoute(' ', held, true, map)).toBe('machine');
    });
});
