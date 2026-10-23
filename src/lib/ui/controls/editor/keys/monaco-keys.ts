// Layer 3, primitive. Monaco's own keys, as the Keyboard Shortcuts view lists them: each editor
// action Monaco registers, under its label, with each of its default keybindings, which Monaco's
// keybinding registry holds already bound to the platform the page runs on, the chords under Cmd+K
// and, on macOS, Delete All Right on Ctrl+K among them. A keybinding whose first press is a key the
// editor gives up to the workbench (chords.ts `freedKeys`) runs nothing in the editor, so it is
// left out.
//
// Monaco's public API gives the actions without their keys, so the registry of editor actions and
// the keybinding registry are read, internal modules loaded once Monaco has started its services
// (kit/load.ts).

import type * as Monaco from 'monaco-editor';
import { sameChord, type Chord } from '$lib/data/helpers/keys/oculus/bindings';
import { freedKeys } from '../chords';
import type { KeyPress } from '../types';

/** One key of Monaco's: the action's id and label and the presses one after the other. */
export type EditorShortcut = { id: string; label: string; chords: Chord[] };

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
    const freed = freedKeys().map((press) => chordOfPress(monaco, press, mac));
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
        return bound.sort((left, right) => left.label.localeCompare(right.label));
    };
}
