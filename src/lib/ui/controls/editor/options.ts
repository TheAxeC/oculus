// Layer 3, primitive. The options a parent hands the editors (word wrap, rulers, the minimap,
// whitespace and sticky scroll) as Monaco names them, the call that applies a change to a live
// editor, the indentation of a model, and the editor action that toggles word wrap on Alt+Z.
// Monaco is only a type here: the editor passes in the editor, the model and the key codes it
// holds.

import type * as Monaco from 'monaco-editor';
import type { EditorAction, EditorIndent } from './types';

/** The options a parent hands an editor; a diff editor is handed no minimap. */
export type EditorOptions = {
    wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
    rulers: number[];
    minimap?: boolean;
    renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
    stickyScroll: boolean;
};

/** An editor that takes options: the code editor and the diff editor both do. */
type Updatable = { updateOptions(options: Monaco.editor.IEditorOptions): void };

/** The options as Monaco's option names, leaving out the minimap when none is handed. */
export function monacoOptions(options: EditorOptions): Monaco.editor.IEditorOptions {
    return {
        wordWrap: options.wordWrap,
        rulers: options.rulers,
        ...(options.minimap === undefined ? {} : { minimap: { enabled: options.minimap } }),
        renderWhitespace: options.renderWhitespace,
        stickyScroll: { enabled: options.stickyScroll }
    };
}

/** Put the options on a live editor in one update. */
export function applyOptions(editor: Updatable, options: EditorOptions): void {
    editor.updateOptions(monacoOptions(options));
}

/** Give a model its indentation: the width of a step, and a tab or spaces. */
export function applyIndent(
    model: Pick<Monaco.editor.ITextModel, 'updateOptions'>,
    indent: EditorIndent
): void {
    model.updateOptions({
        tabSize: indent.size,
        indentSize: indent.size,
        insertSpaces: !indent.tabs
    });
}

/** The id of the action that toggles word wrap. */
export const WRAP_ACTION = 'oculus.toggleWordWrap';

/** The key codes Alt+Z is made of, which Monaco's `KeyMod` and `KeyCode` hold. */
type WrapKeys = { KeyMod: { Alt: number }; KeyCode: { KeyZ: number } };

/**
 * The action that toggles word wrap on Alt+Z, bound to the key's code so that macOS's Option+Z
 * character does not stop it, and running `toggle`.
 */
export function wrapAction(
    keys: WrapKeys,
    label: string,
    toggle: () => void
): Monaco.editor.IActionDescriptor {
    return {
        id: WRAP_ACTION,
        label,
        keybindings: [keys.KeyMod.Alt | keys.KeyCode.KeyZ],
        run: () => {
            toggle();
        }
    };
}

/** The action as the palette lists it, with its key as the hint. */
export function wrapListing(label: string): EditorAction {
    return { id: WRAP_ACTION, label, hint: 'Alt+Z' };
}
