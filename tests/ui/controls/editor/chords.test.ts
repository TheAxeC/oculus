// The Cmd+K chords the editor gives up so Cmd+K and Ctrl+K reach the shell's palette: every chord
// Monaco binds under Cmd+K, each with the action it ran, and Ctrl+K on macOS alone. Each action id
// is looked up in the installed monaco-editor, so a release that renames one turns this red.

import { describe, expect, it } from 'vitest';
import {
    chordHint,
    freedKeys,
    removedChords,
    type KeyPress
} from '../../../../src/lib/ui/controls/editor/chords.ts';
import { monacoSources } from './monaco-sources.ts';

/**
 * The Cmd+K chords of monaco-editor 0.57, by the action or command each runs: the editor actions,
 * then the two commands bound under Cmd+K too.
 */
const CMD_K = [
    'editor.action.addCommentLine',
    'editor.action.removeCommentLine',
    'editor.action.formatSelection',
    'editor.action.trimTrailingWhitespace',
    'editor.action.moveSelectionToNextFindMatch',
    'editor.action.setSelectionAnchor',
    'editor.action.selectFromAnchorToCursor',
    'editor.action.showHover',
    'editor.action.revealDefinitionAside',
    'editor.toggleFold',
    'editor.toggleFoldRecursively',
    'editor.foldRecursively',
    'editor.unfoldRecursively',
    'editor.foldAll',
    'editor.unfoldAll',
    'editor.foldAllBlockComments',
    'editor.foldAllMarkerRegions',
    'editor.unfoldAllMarkerRegions',
    'editor.foldAllExcept',
    'editor.unfoldAllExcept',
    'editor.createFoldingRangeFromSelection',
    'editor.removeManualFoldingRanges',
    'editor.foldLevel1',
    'editor.foldLevel2',
    'editor.foldLevel3',
    'editor.foldLevel4',
    'editor.foldLevel5',
    'editor.foldLevel6',
    'editor.foldLevel7',
    'workbench.action.showHover',
    'togglePeekWidgetFocus'
];

/**
 * Where a chord's action is defined, as the source writes it: the id itself, or for the two that
 * name it through a constant, that constant.
 */
function anchorOf(id: string): string {
    if (id === 'editor.action.showHover') return 'id: SHOW_OR_FOCUS_HOVER_ACTION_ID';
    if (id.startsWith('editor.foldLevel')) return 'id: FoldLevelAction.ID(i)';
    return `'${id}'`;
}

/**
 * The modifier and key names of the first key binding after an anchor, in the order the source
 * writes them, from the first definition of that anchor followed by one within 3000 characters.
 */
function boundKeys(sources: string[], anchor: string): string[] {
    for (const source of sources) {
        let at = source.indexOf(anchor);
        while (at >= 0) {
            const binding = /KeyChord\(|mac: \{ primary: /g;
            binding.lastIndex = at;
            const found = binding.exec(source);
            if (found !== null && found.index - at < 3000) {
                // The primary binding alone: a secondary one on the same line is another key.
                const line = source
                    .slice(found.index, source.indexOf('\n', found.index))
                    .split(', secondary')[0];
                return [...line.matchAll(/\/\* (?:KeyMod|KeyCode)\.(\w+) \*\//g)].map(
                    (name) => name[1]
                );
            }
            at = source.indexOf(anchor, at + 1);
        }
    }
    return [];
}

/** A chord's keys as the source names them: CtrlCmd, WinCtrl, Shift, then the key. */
function sourceNames(keys: readonly KeyPress[]): string[] {
    return keys.flatMap((press) => [
        ...(press.ctrl === true ? ['WinCtrl'] : []),
        ...(press.cmd === true ? ['CtrlCmd'] : []),
        ...(press.shift === true ? ['Shift'] : []),
        press.code
    ]);
}

describe('the removed chords', () => {
    // An audit of the list against a reading of the package: it compares the primitive's chord
    // list with CMD_K, the 31 ids bound under Cmd+K read from monaco-editor 0.57.0, and a later
    // Monaco is read again into CMD_K when it is installed. Red when the primitive's list leaves
    // out one of those ids or holds another, or when a chord opens on a key other than Cmd+K.
    it('lists every Cmd+K chord with its action id, each opening on Cmd+K', () => {
        const chords = removedChords(false);
        expect(chords.map((chord) => chord.id).sort()).toEqual([...CMD_K].sort());
        for (const chord of chords) {
            expect(chord.keys).toHaveLength(2);
            expect(chord.keys[0]).toEqual({ code: 'KeyK', cmd: true });
        }
    });

    // Red when Ctrl+K is freed off macOS, where it is Cmd+K itself, or kept on macOS.
    it('adds Ctrl+K on macOS, and not elsewhere', () => {
        const mac = removedChords(true);
        const deleteAllRight = mac.filter((chord) => chord.id === 'deleteAllRight');
        expect(deleteAllRight).toEqual([
            { id: 'deleteAllRight', keys: [{ code: 'KeyK', ctrl: true }] }
        ]);
        expect(mac).toHaveLength(CMD_K.length + 1);
        expect(removedChords(false).some((chord) => chord.id === 'deleteAllRight')).toBe(false);
        expect(freedKeys(true)).toEqual([
            { code: 'KeyK', cmd: true },
            { code: 'KeyK', ctrl: true }
        ]);
        expect(freedKeys(false)).toEqual([{ code: 'KeyK', cmd: true }]);
    });

    // Red when a chord in the list names an id the package does not define, or keys other than
    // the ones the package binds that id to.
    it('names each action an id the installed monaco-editor binds to those very keys', () => {
        const sources = monacoSources();
        for (const chord of removedChords(true)) {
            const level = /^editor\.foldLevel(\d)$/.exec(chord.id);
            const expected = sourceNames(chord.keys);
            // The seven fold levels are bound in one loop, Digit0 plus the level.
            if (level !== null) expected[expected.length - 1] = 'Digit0';
            const bound = boundKeys(sources, anchorOf(chord.id));
            expect({ id: chord.id, bound }).toEqual({ id: chord.id, bound: expected });
            if (level !== null) expect(chord.keys[1].code).toBe(`Digit${level[1]}`);
        }
        // Reading every script of the package from a cold disk takes longer than the default.
    }, 60_000);

    // Red when a hint names the wrong modifier for the platform, or out of VS Code's order.
    it('writes each chord as the palette hint, Cmd on macOS and Ctrl elsewhere', () => {
        const comment = removedChords(true).find(
            (chord) => chord.id === 'editor.action.addCommentLine'
        );
        expect(comment === undefined ? '' : chordHint(comment.keys, true)).toBe('Cmd+K Cmd+C');
        expect(comment === undefined ? '' : chordHint(comment.keys, false)).toBe('Ctrl+K Ctrl+C');
        expect(chordHint([{ code: 'KeyK', ctrl: true }], true)).toBe('Ctrl+K');
        const fold = removedChords(false).find(
            (chord) => chord.id === 'editor.toggleFoldRecursively'
        );
        expect(fold === undefined ? '' : chordHint(fold.keys, true)).toBe('Cmd+K Shift+Cmd+L');
        expect(fold === undefined ? '' : chordHint(fold.keys, false)).toBe('Ctrl+K Ctrl+Shift+L');
    });
});
