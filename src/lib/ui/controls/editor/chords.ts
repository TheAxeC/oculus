// Layer 3, primitive. The keys the editor gives up so Cmd+K and Ctrl+K reach the shell and open the
// palette from inside the editor: every chord Monaco binds under Cmd+K (Ctrl+K off macOS), and on
// macOS Ctrl+K, which Monaco binds to Delete All Right.
//
// Monaco resolves a chord through its first key, so one rule binding that key to no command frees
// every chord under it (`freedKeys`, turned into Monaco's key codes when Monaco has loaded). The
// list of what was freed is kept with each chord's action id, so the palette offers each action
// under Monaco's own label with its old chord beside it. Two of the chords run commands rather
// than editor actions (`workbench.action.showHover` and `togglePeekWidgetFocus`); they are freed
// with the rest, and the palette leaves them out since the editor has no action to run for them.
//
// A key is named by Monaco's `KeyCode` member and the modifiers it is pressed with, so this module
// holds no value of Monaco's and loads nowhere near it.

import type { KeyCode, editor } from 'monaco-editor';
import type { EditorAction } from './types';

/** One key press: Monaco's name for the key, and the modifiers held with it. */
export type KeyPress = {
    code: keyof typeof KeyCode;
    /** Cmd on macOS and Ctrl elsewhere, Monaco's CtrlCmd. */
    cmd?: true;
    /** The Ctrl key on macOS, Monaco's WinCtrl. */
    ctrl?: true;
    shift?: true;
    /** The Alt key, Option on macOS, Monaco's Alt. */
    alt?: true;
};

/** A chord the editor gave up: the action or command it ran and its keys in order. */
export type RemovedChord = { id: string; keys: KeyPress[] };

const CMD_K: KeyPress = { code: 'KeyK', cmd: true };
const CTRL_K: KeyPress = { code: 'KeyK', ctrl: true };

/** A Cmd+K chord whose second key is held with Cmd too, as most of them are. */
function underCmdK(id: string, code: KeyPress['code'], shift = false): RemovedChord {
    return { id, keys: [CMD_K, shift ? { code, cmd: true, shift: true } : { code, cmd: true }] };
}

/** Every chord monaco-editor 0.57 binds under Cmd+K, by the action or command it runs. */
const CMD_K_CHORDS: RemovedChord[] = [
    underCmdK('editor.action.addCommentLine', 'KeyC'),
    underCmdK('editor.action.removeCommentLine', 'KeyU'),
    underCmdK('editor.action.formatSelection', 'KeyF'),
    underCmdK('editor.action.trimTrailingWhitespace', 'KeyX'),
    underCmdK('editor.action.moveSelectionToNextFindMatch', 'KeyD'),
    underCmdK('editor.action.setSelectionAnchor', 'KeyB'),
    underCmdK('editor.action.selectFromAnchorToCursor', 'KeyK'),
    underCmdK('editor.action.showHover', 'KeyI'),
    { id: 'editor.action.revealDefinitionAside', keys: [CMD_K, { code: 'F12' }] },
    underCmdK('editor.toggleFold', 'KeyL'),
    underCmdK('editor.toggleFoldRecursively', 'KeyL', true),
    underCmdK('editor.foldRecursively', 'BracketLeft'),
    underCmdK('editor.unfoldRecursively', 'BracketRight'),
    underCmdK('editor.foldAll', 'Digit0'),
    underCmdK('editor.unfoldAll', 'KeyJ'),
    underCmdK('editor.foldAllBlockComments', 'Slash'),
    underCmdK('editor.foldAllMarkerRegions', 'Digit8'),
    underCmdK('editor.unfoldAllMarkerRegions', 'Digit9'),
    underCmdK('editor.foldAllExcept', 'Minus'),
    underCmdK('editor.unfoldAllExcept', 'Equal'),
    underCmdK('editor.createFoldingRangeFromSelection', 'Comma'),
    underCmdK('editor.removeManualFoldingRanges', 'Period'),
    underCmdK('editor.foldLevel1', 'Digit1'),
    underCmdK('editor.foldLevel2', 'Digit2'),
    underCmdK('editor.foldLevel3', 'Digit3'),
    underCmdK('editor.foldLevel4', 'Digit4'),
    underCmdK('editor.foldLevel5', 'Digit5'),
    underCmdK('editor.foldLevel6', 'Digit6'),
    underCmdK('editor.foldLevel7', 'Digit7'),
    underCmdK('workbench.action.showHover', 'KeyI'),
    { id: 'togglePeekWidgetFocus', keys: [CMD_K, { code: 'F2' }] }
];

/** Every chord the editor gives up on this platform: the Cmd+K chords, and Ctrl+K on macOS. */
export function removedChords(mac: boolean): RemovedChord[] {
    return mac ? [...CMD_K_CHORDS, { id: 'deleteAllRight', keys: [CTRL_K] }] : [...CMD_K_CHORDS];
}

/** The first keys bound to no command, which frees every chord that starts with them. */
export function freedKeys(mac: boolean): KeyPress[] {
    return mac ? [CMD_K, CTRL_K] : [CMD_K];
}

/** Monaco's name for a key as its keycap reads: `KeyC` is C and `Digit0` is 0. */
const CAPS: Partial<Record<KeyPress['code'], string>> = {
    BracketLeft: '[',
    BracketRight: ']',
    Slash: '/',
    Minus: '-',
    Equal: '=',
    Comma: ',',
    Period: '.'
};

/**
 * One press as a hint reads it, the modifiers in VS Code's order: Ctrl, Shift, Alt, Cmd on macOS,
 * and Ctrl, Shift, Alt elsewhere, where CtrlCmd is the Ctrl key. Alt keeps its name on macOS, as
 * HELP.md's key table writes it.
 */
function pressHint(press: KeyPress, mac: boolean): string {
    const parts: string[] = [];
    if (press.ctrl === true || (!mac && press.cmd === true)) parts.push('Ctrl');
    if (press.shift === true) parts.push('Shift');
    if (press.alt === true) parts.push('Alt');
    if (mac && press.cmd === true) parts.push('Cmd');
    const cap = CAPS[press.code] ?? press.code.replace(/^(Key|Digit)/, '');
    return [...parts, cap].join('+');
}

/** A chord as the palette writes it beside its action: `Cmd+K Cmd+C` on macOS. */
export function chordHint(keys: readonly KeyPress[], mac: boolean): string {
    return keys.map((press) => pressHint(press, mac)).join(' ');
}

/**
 * The removed chords whose action an editor has, each under Monaco's label with its chord as the
 * hint; the two that run commands have no action and are left out.
 */
export function chordActions(
    made: Pick<editor.IStandaloneCodeEditor, 'getAction'>,
    mac: boolean
): EditorAction[] {
    return removedChords(mac).flatMap((chord) => {
        const action = made.getAction(chord.id);
        if (action === null) return [];
        return [{ id: chord.id, label: action.label, hint: chordHint(chord.keys, mac) }];
    });
}
