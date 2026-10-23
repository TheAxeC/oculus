// Layer 3, primitive. The editor's keys the shell has a say in. Three keys the editor gives up so
// the shell receives them from inside the editor (`freedKeys`): F1, which Monaco binds to its own
// command palette and the workbench's palette takes in its command mode, and F8 and Shift+F8,
// which walk the Problems view's rows across files where Monaco's own walk stays in one file.
// Monaco's Command Palette item of the editor's menu runs the same palette: its command is replaced
// by one that raises `COMMAND_PALETTE_EVENT` on the window (kit/load.ts), which the workbench
// answers by opening the palette in its command mode.
//
// Cmd+K (Ctrl+K off macOS) stays the first key of Monaco's chords inside the editor, as in VS
// Code, and on macOS Ctrl+K stays Delete All Right; the workbench opens the palette on them only
// outside the editor (shell/keys/workbench-keys.svelte.ts). The palette lists the actions of these
// chords while a source tab is on screen (`editorChords`), each under Monaco's own label with the
// chord that runs it in the editor beside it. Two of the chords run commands rather than editor
// actions (`workbench.action.showHover` and `togglePeekWidgetFocus`), and the palette leaves them
// out since the editor has no action to run for them. Cmd+K Shift+Enter in the editor pins or
// unpins the tab, as in VS Code: the editor raises `PIN_EDITOR_EVENT` on the window (kit/load.ts),
// which the workbench answers on the tab on screen.
//
// A key is named by Monaco's `KeyCode` member and the modifiers it is pressed with, so this module
// holds no value of Monaco's and loads nowhere near it. It also names the save key, which the
// shell resolves (data/helpers/keys/oculus/resolve.ts) and a Save control's tooltip
// shows, so both read one value.

import type { editor } from 'monaco-editor';
import { SAVE_PRESS } from '$lib/data/helpers/keys/oculus/page-keys';
import type { EditorAction, EditorOwnAction, KeyPress } from './types';

/**
 * A chord of Monaco's that the palette lists: the action or command it runs and its keys in order.
 * A `command` chord runs a command rather than an editor action, so the palette has nothing to run
 * for it.
 */
type EditorChord = { id: string; keys: KeyPress[]; command?: true };

/** The save key: Cmd+S, Ctrl+S off macOS. */
export const SAVE_KEY: KeyPress = SAVE_PRESS;

const CMD_K: KeyPress = { code: 'KeyK', cmd: true };
const CTRL_K: KeyPress = { code: 'KeyK', ctrl: true };
const F1: KeyPress = { code: 'F1' };
const F8: KeyPress = { code: 'F8' };
const SHIFT_F8: KeyPress = { code: 'F8', shift: true };

/** The event on the window that asks the workbench to open the palette in its command mode. */
export const COMMAND_PALETTE_EVENT = 'oculus-command-palette';

/** The event on the window that asks the workbench to pin or unpin the tab on screen. */
export const PIN_EDITOR_EVENT = 'oculus-pin-editor';

/** The chord VS Code binds Pin Editor and Unpin Editor to, which the editor binds the same way. */
export const PIN_KEYS: [KeyPress, KeyPress] = [CMD_K, { code: 'Enter', shift: true }];

/** A Cmd+K chord whose second key is held with Cmd too, as most of them are. */
function underCmdK(id: string, code: KeyPress['code'], shift = false): EditorChord {
    return { id, keys: [CMD_K, shift ? { code, cmd: true, shift: true } : { code, cmd: true }] };
}

/** Every chord monaco-editor 0.57 binds under Cmd+K, by the action or command it runs. */
const CMD_K_CHORDS: EditorChord[] = [
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
    { ...underCmdK('workbench.action.showHover', 'KeyI'), command: true },
    { id: 'togglePeekWidgetFocus', keys: [CMD_K, { code: 'F2' }], command: true }
];

/** The chords the palette lists on a platform: the Cmd+K chords, and Ctrl+K on macOS. */
export function editorChords(mac: boolean): EditorChord[] {
    return mac ? [...CMD_K_CHORDS, { id: 'deleteAllRight', keys: [CTRL_K] }] : [...CMD_K_CHORDS];
}

/**
 * The keys bound to no command in the editor, so the workbench receives them: F1, and the two keys
 * of the workbench's walk through the problems.
 */
export function freedKeys(): KeyPress[] {
    return [F1, F8, SHIFT_F8];
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
 * docs/HELP.md's key table writes it.
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

/** The actions a parent owns as the palette lists them, each with its key as the hint. */
export function ownListing(actions: readonly EditorOwnAction[], mac: boolean): EditorAction[] {
    return actions
        .filter((one) => one.disabled !== true)
        .map(({ id, label, key }) => ({
            id,
            label,
            hint: key === undefined ? '' : chordHint('code' in key ? [key] : key, mac)
        }));
}

/**
 * The palette's rows for the chords of `editorChords` whose action an editor has, each under
 * Monaco's label with the chord that runs it in the editor as the hint; the two that run commands
 * have no action and are left out.
 */
export function chordActions(
    made: Pick<editor.IStandaloneCodeEditor, 'getAction'>,
    mac: boolean
): EditorAction[] {
    return editorChords(mac).flatMap((chord) => {
        const action = made.getAction(chord.id);
        if (action === null) return [];
        return [{ id: chord.id, label: action.label, hint: chordHint(chord.keys, mac) }];
    });
}
