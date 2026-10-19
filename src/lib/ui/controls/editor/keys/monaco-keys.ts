// Layer 3, primitive. Monaco's own keys, as the Keyboard Shortcuts view lists them: each editor
// action Monaco registers, under its label, with each of its default keybindings, which Monaco's
// keybinding registry holds already bound to the platform the page runs on. A keybinding whose
// first press is a key the editor gives up (chords.ts `freedKeys`) runs nothing in the editor, so
// it is left out, and the chords given up are listed as the palette lists them: under the
// action's label with the chord beside it, run from the palette (chords.ts `chordActions`).
//
// Monaco's public API gives the actions without their keys, so the registry of editor actions and
// the keybinding registry are read, internal modules loaded once Monaco has started its services
// (kit/load.ts).

import type * as Monaco from 'monaco-editor';
import { sameChord, type Chord } from '$lib/data/helpers/keys/oculus/bindings';
import { freedKeys, removedChords } from '../chords';
import type { KeyPress } from '../types';

/**
 * One key of Monaco's: the action's id and label and the presses one after the other. `palette`
 * marks a chord the editor gave up, which the palette runs under the action's label.
 */
export type EditorShortcut = { id: string; label: string; chords: Chord[]; palette?: true };

/** A press of the editor's own tables as a chord: Cmd on macOS is Meta, Monaco's CtrlCmd. */
function chordOfPress(monaco: typeof Monaco, press: KeyPress, mac: boolean): Chord {
    const cmd = press.cmd === true;
    const ctrl = press.ctrl === true;
    return {
        ctrl: mac ? ctrl : cmd,
        shift: press.shift === true,
        alt: press.alt === true,
        meta: mac ? cmd : ctrl,
        key: monaco.KeyCode[press.code]
    };
}

/** Load the registries Monaco's keys are read from, and answer a reader of the keys. */
export async function loadShortcuts(
    monaco: typeof Monaco,
    mac: boolean
): Promise<() => EditorShortcut[]> {
    const [extensions, keybindings] = await Promise.all([
        import('monaco-editor/editor/browser/editorExtensions'),
        import('monaco-editor/platform/keybinding/common/keybindingsRegistry')
    ]);
    const freed = freedKeys(mac).map((press) => chordOfPress(monaco, press, mac));
    return () => {
        const labels = new Map(
            extensions.EditorExtensionsRegistry.getEditorActions().map((action) => [
                action.id,
                action.label
            ])
        );
        const seen = new Set<string>();
        const bound = keybindings.KeybindingsRegistry.getDefaultKeybindings().flatMap((item) => {
            const label = item.command === null ? undefined : labels.get(item.command);
            if (item.command === null || label === undefined || item.keybinding === null) return [];
            const chords = item.keybinding.chords.flatMap((one) =>
                'keyCode' in one
                    ? [
                          {
                              ctrl: one.ctrlKey,
                              shift: one.shiftKey,
                              alt: one.altKey,
                              meta: one.metaKey,
                              key: one.keyCode
                          }
                      ]
                    : []
            );
            if (chords.length !== item.keybinding.chords.length) return [];
            if (freed.some((key) => sameChord(key, chords[0]))) return [];
            const text = `${item.command} ${JSON.stringify(chords)}`;
            if (seen.has(text)) return [];
            seen.add(text);
            return [{ id: item.command, label, chords }];
        });
        const given = removedChords(mac).flatMap((chord) => {
            const label = chord.command === true ? undefined : labels.get(chord.id);
            if (label === undefined) return [];
            const chords = chord.keys.map((press) => chordOfPress(monaco, press, mac));
            return [{ id: chord.id, label, chords, palette: true as const }];
        });
        return [...bound, ...given].sort((left, right) => left.label.localeCompare(right.label));
    };
}
